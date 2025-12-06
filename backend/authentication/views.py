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
from .serializers import UserRegistrationSerializer, UserSerializer, UserLoginSerializer, PasswordChangeSerializer, AdminUserUpdateSerializer, AdminUserRegistrationSerializer
from .utils import LoginAttemptTracker, AuditLogger
from django.contrib.auth import update_session_auth_hash
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.conf import settings
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.contrib.auth.decorators import login_required
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from .permissions import IsAdminUserCustom
from django.db.models import Q




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

        # Extract username and password from validated_data
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

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
        changed_fields = list(request.data.keys())
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            AuditLogger.log_profile_update(
                request= request,
                user= user,
                changed_fields_list= changed_fields
            )
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
            AuditLogger.log_password_change(request, user)
            return Response({"message": "Password changed successfully"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class PasswordResetRequestAPIview(APIView):
    """
    API endpoint to request password reset

    POST /auth/password-reset/
    Required fields: email
    """
    print("you accessed PasswordResetRequestAPIview")
    permission_classes = [AllowAny]

    def post(self, request):
        User = get_user_model()
        print("you accessed PasswordResetRequestAPIview")
        email = request.data.get("email")
        print(f"you accessed PasswordResetRequestAPIview with email {email}")
        if not email:
            return Response(
                {"error": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            # important security measure to prevent email enumeration
            print(f"Email does not exist {email}")
            return Response(
                {"message": "If an account with that email exists, a password reset link has been sent."},
                status=status.HTTP_200_OK
            )
        #step 2: generate UID and token and send email
        # use urlsafe_base64_encode to encode the UID
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)    
        # construct the reset link
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        reset_link = f"{frontend_url}/auth/password-reset-confirm/{uid}/{token}/"
        #step 4: send email
        subject = "Password Reset Request"
        message = (f"We have sent you a link to reset your password. Please check your email {user.email}.\n"
                   f"If you did not make this request, please ignore this email.\n"
                   f"If you have any questions, please contact us at {getattr(settings, 'SUPPORT_EMAIL', '')}.\n"
                   f"Thank you for using our service.\n"
                   f"The {getattr(settings, 'APP_NAME', 'Hotel Management')} Team\n"
                   f"Reset Link: {reset_link}"
                   )
        recipient_list = [user.email]
        try:
            send_mail(
                subject,
                message,
                getattr(settings, 'DEFAULT_FROM_EMAIL', getattr(settings, 'EMAIL_HOST_USER', '')),
                recipient_list,
                fail_silently=False,
            )
            return Response(
                {"message": "Password reset email sent successfully"},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            print(f"Error sending password reset email: {user.email}: {e}")
            return Response(
                {"error": "Error sending password reset email"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class PasswordResetConfirmAPIview(APIView):
    """
    View for confirming a password reset request.
    """

    permission_classes = [AllowAny]
    def post(self, request):
        """
        POST request to confirm a password reset request.
        """
        User = get_user_model()
        print("you accessed PasswordResetConfirmAPIview")
        uidb64  = request.data.get('uid')
        print(f"you accessed PasswordResetConfirmAPIview with uid {uidb64}")
        token = request.data.get('token')
        print(f"you accessed PasswordResetConfirmAPIview with token {token}")
        new_password = request.data.get('new_password')


        if not all([uidb64, token, new_password]):
            return Response({'error': 'Please provide all required fields.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None
            return Response({'error': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if user is not None and default_token_generator.check_token(user, token):
            try:           
                validate_password(new_password, user)
                user.set_password(new_password)
                user.save()

                if not user.is_active:
                    user.is_active = True
                    user.save()


                return Response(
                    {'detail': 'Password reset successful. You can now log in with your new password.'},
                    status=status.HTTP_200_OK
                )

            except ValidationError as e:
                # Handle password validation errors (e.g., password too common)
                return Response(
                    {'error': list(e.messages)}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            except Exception as e:
                # General error during saving
                print(f"Error resetting password for user {uid}: {e}")
                return Response(
                    {'error': 'An unexpected error occurred during password change.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            # 4. Handle Invalid Token/UID
            return Response(
                {'error': 'Invalid or expired password reset link/token. Please request a new reset.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
class AdminUserListAPIView(APIView):
    """
    GET: List all users (with optional role filtering)
    POST: Create a new staff/manager account
    """
    permission_classes = [IsAuthenticated, IsAdminUserCustom]

    def get(self, request):
        User = get_user_model()
        role_filter = request.query_params.get('role')
        users = User.objects.all().order_by('-created_at')
        print(f"you accessed AdminUserListAPIView with role {role_filter}")
        print(f"you accessed AdminUserListAPIView with users {users}")

        if role_filter:
            users = users.filter(role=role_filter)

        serializer = UserSerializer(users, many=True)
        print(f"you accessed AdminUserListAPIView with serializer {serializer}")
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        # US-18: Admin can create staff/manager accounts
        
        serializer = AdminUserRegistrationSerializer(data=request.data)
        print(f"you accessed AdminUserListAPIView post with serializer {serializer}")  
        if serializer.is_valid():
            user = serializer.save()
            print(f"you accessed AdminUserListAPIView with user {user}")
            AuditLogger.log_profile_update(
                request, 
                request.user, 
                [f"Created user: {user.username} with role: {user.role}"]
            )
            
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminUserDetailAPIView(APIView):
    """
    PATCH: Update user role, status (activate/deactivate), or reset password
    """
    permission_classes = [IsAuthenticated, IsAdminUserCustom]

    def get_object(self, user_id):
        User = get_user_model()
        print(f"you accessed AdminUserDetailAPIView with user_id {user_id}")
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    def patch(self, request, user_id):
        target_user = self.get_object(user_id)
        if not target_user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if target_user.id == request.user.id and 'is_active' in request.data:
             return Response({"error": "You cannot deactivate your own account."}, status=status.HTTP_400_BAD_REQUEST)
        if 'password' in request.data:
            target_user.set_password(request.data['password'])
            target_user.save()
            AuditLogger.log_profile_update(request, request.user, [f"Reset password for user: {target_user.username}"])
            return Response({"message": "Password reset successfully"}, status=status.HTTP_200_OK)

        # US-18: Admin can change roles and activate/deactivate
        serializer = AdminUserUpdateSerializer(target_user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            print(f"you accessed AdminUserDetailAPIView with serializer.data {serializer.data}")
            
            # Log what changed
            changed_fields = list(request.data.keys())
            print(f"you accessed AdminUserDetailAPIView with changed_fields {changed_fields}")
            AuditLogger.log_profile_update(
                request, 
                request.user, 
                [f"Updated user {target_user.username}: {', '.join(changed_fields)}"]
            )
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
