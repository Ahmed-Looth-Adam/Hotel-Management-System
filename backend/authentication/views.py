# Edited By
# -> Ahmed Looth Adam, UWE ID: 24050761
# -> Ismail Wasiu Abdul Samad, UWE ID: 24050765
# -> Ibrahim Waseem, UWE ID: 24050771

from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.contrib import messages
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from datetime import timedelta
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from django.contrib.auth import authenticate
from .forms import CustomUserCreationForm
from .serializers import UserRegistrationSerializer, UserSerializer, UserLoginSerializer, PasswordChangeSerializer
from .utils import LoginAttemptTracker, AuditLogger
from django.contrib.auth import update_session_auth_hash
from rest_framework.permissions import AllowAny, IsAuthenticated




@login_required
def dashboard(request):
    return render(request, 'dashboard.html', {'user': request.user})


# Template-based view (kept for backward compatibility)
def register_template(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Account created successfully!")
            return redirect('login')
    else:
        form = CustomUserCreationForm()
    return render(request, 'registration/register.html', {'form': form})


# API Views
@method_decorator(csrf_exempt, name='dispatch')
class RegisterAPIView(generics.CreateAPIView):
    """
    API endpoint for user registration

    POST /auth/register/
    Required fields: username, email, password, password2
    Optional fields: first_name, last_name, phone_number, date_of_birth,
                     address, city, country, postal_code
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {
                "user": UserSerializer(user).data,
                "message": "User registered successfully!"
            },
            status=status.HTTP_201_CREATED
        )


@method_decorator(csrf_exempt, name='dispatch')
class LoginAPIView(APIView):
    """
    API endpoint for user login with JWT token generation

    POST /auth/login/
    Required fields: username, password

    Returns:
    - access: JWT access token (15 mins lifetime)
    - refresh: JWT refresh token (7 days lifetime)
    - user: User details

    Security Features:
    - Account lockout after 5 failed attempts (15 mins)
    - Failed login attempt tracking
    """
    permission_classes = [AllowAny]
    serializer_class = UserLoginSerializer

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data
        
        username = user.username
        password = request.data['password']

        # Check Redis cache for lockout status first (faster than DB)
        lockout_status = LoginAttemptTracker.is_locked(username)
        if lockout_status['locked']:
            locked_until = lockout_status['locked_until'].strftime('%Y-%m-%d %H:%M:%S UTC')
            return Response(
                {
                    "error": "Account is temporarily locked due to multiple failed login attempts",
                    "locked_until": locked_until,
                    "message": f"Please try again after {LoginAttemptTracker.LOCKOUT_DURATION} minutes"
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # Get user from database
        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            # Record failed attempt even for non-existent users (prevent username enumeration attacks)
            LoginAttemptTracker.record_failed_attempt(username)

            # Audit log: failed login for non-existent user
            AuditLogger.log_login_failed(request, username, reason='User does not exist')

            return Response(
                {"error": "Incorrect username or password"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Check if account is active
        if not user.is_active:
            # Audit log: login attempt on disabled account
            AuditLogger.log_login_failed(request, username, reason='Account is disabled')

            return Response(
                {"error": "Account is disabled"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Authenticate user
        authenticated_user = authenticate(username=username, password=password)

        if authenticated_user is not None:
            # Successful login - reset Redis tracking
            LoginAttemptTracker.reset_attempts(username)

            # Also clear database tracking for consistency
            user.failed_login_attempts = 0
            user.account_locked_until = None
            user.last_login = timezone.now()
            user.save(update_fields=['failed_login_attempts', 'account_locked_until', 'last_login'])

            # Audit log: successful login
            AuditLogger.log_login_success(request, user)

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "message": "Login successful",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": UserSerializer(user).data,
                    "token_type": "Bearer"
                },
                status=status.HTTP_200_OK
            )
        else:
            # Failed login - record in Redis
            attempt_result = LoginAttemptTracker.record_failed_attempt(username)

            # Also update database for backup/audit trail
            user.failed_login_attempts = attempt_result['attempts']
            if attempt_result['locked']:
                user.account_locked_until = attempt_result['locked_until']
                user.save(update_fields=['failed_login_attempts', 'account_locked_until'])

                # Audit log: account locked
                AuditLogger.log_account_locked(request, username, failed_attempts=attempt_result['attempts'])

                return Response(
                    {
                        "error": "Account locked due to multiple failed login attempts",
                        "locked_until": attempt_result['locked_until'].strftime('%Y-%m-%d %H:%M:%S UTC'),
                        "message": f"Please try again after {LoginAttemptTracker.LOCKOUT_DURATION} minutes"
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            user.save(update_fields=['failed_login_attempts'])

            # Audit log: failed login attempt
            AuditLogger.log_login_failed(
                request,
                username,
                reason='Incorrect password',
                failed_attempts=attempt_result['attempts']
            )

            return Response(
                {
                    "error": "Incorrect username or password",
                    "remaining_attempts": attempt_result['remaining_attempts'],
                    "message": f"{attempt_result['remaining_attempts']} attempt(s) remaining before account lockout"
                },
                status=status.HTTP_401_UNAUTHORIZED
            )
        

@method_decorator(csrf_exempt, name='dispatch')
class LogoutAPIView(APIView):
    """
    API endpoint for user logout

    POST /auth/logout/
    Required: refresh token in request body

    Blacklists the refresh token to prevent further use
    """
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            
            if not refresh_token:
                return Response(
                    {"error": "Refresh token is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token = RefreshToken(refresh_token)
            token.blacklist()

            # Audit log: successful logout
            if request.user.is_authenticated:
                AuditLogger.log_logout(request, request.user)

            return Response(
                {"message": "Logout successful"},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": "Invalid token or token already blacklisted"},
                status=status.HTTP_400_BAD_REQUEST
            )


class TokenRefreshAPIView(TokenRefreshView):
    """
    API endpoint to refresh access token
    
    POST /auth/token/refresh/
    Required: refresh token in request body
    
    Returns new access token
    """
    pass


class UserProfileAPIView(APIView):
    """
    API endpoint to get current user profile
    
    GET /auth/profile/
    Requires: Valid JWT access token in Authorization header
    """
    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    def put(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class PasswordChangeAPIView(APIView):
    """
    API endpoint to change user password

    Post /auth/change-password/
    Required fields: current_password, new_password, confirm_new_password
    """
    permission_classes = [IsAuthenticated]
    def post(self, request):
        user = request.user
        serializer = PasswordChangeSerializer(instance=user, data=request.data)
        if serializer.is_valid():
            serializer.save()
            update_session_auth_hash(request, request.user) 
            return Response({"message": "Password changed successfully"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
