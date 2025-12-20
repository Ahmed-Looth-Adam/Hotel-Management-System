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
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from django.contrib.auth import authenticate
from .forms import CustomUserCreationForm
from .serializers import (
    UserRegistrationSerializer, UserSerializer, UserLoginSerializer,
    PasswordChangeSerializer, AdminUserUpdateSerializer, AdminUserRegistrationSerializer,
    TwoFactorConfirmSerializer, TwoFactorVerifySerializer, TwoFactorDisableSerializer,
    BackupCodesSerializer
)
from . import two_factor
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
from .permissions import IsAdminUserCustom, IsAdminOrManager
from django.db.models import Q
from core.signals import admin_action_performed, profile_updated



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

    After registration, user must verify their email before logging in.
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Send verification email for guest users
        if user.role == 'guest':
            email_sent = two_factor.send_verification_email(user)
            return Response(
                {
                    "user": UserSerializer(user).data,
                    "message": "Registration successful! Please check your email for verification code.",
                    "email_verification_required": True,
                    "email": user.email,
                    "email_sent": email_sent
                },
                status=status.HTTP_201_CREATED
            )

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

        # Check if guest email is verified
        if user.role == 'guest' and not user.email_verified:
            return Response(
                {
                    "error": "Please verify your email before logging in.",
                    "email_verification_required": True,
                    "email": user.email
                },
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

            # Check if 2FA is enabled for this user
            if user.two_factor_enabled and user.two_factor_confirmed:
                # Generate temporary token for 2FA verification
                temp_token = two_factor.generate_temp_token(user)

                return Response(
                    {
                        "message": "Two-factor authentication required",
                        "two_factor_required": True,
                        "temp_token": temp_token,
                        "user_email": user.email[:3] + "***" + user.email[user.email.find("@"):] if user.email else None
                    },
                    status=status.HTTP_200_OK
                )

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
            profile_updated.send(
                sender=self.__class__,
                user = user,
                description=f"user changed fields:{changed_fields}"
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
            profile_updated.send(
                sender=self.__class__,
                user = user,
                description=f"user {user} changed password field"
            )
            return Response({"message": "Password changed successfully"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class PasswordResetRequestAPIview(APIView):
    """
    API endpoint to request password reset

    POST /auth/password-reset/
    Required fields: email
    """
    permission_classes = [AllowAny]

    def post(self, request):
        User = get_user_model()
        email = request.data.get("email")
        if not email:
            return Response(
                {"error": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            return Response(
                {"message": "If an account with that email exists, a password reset link has been sent."},
                status=status.HTTP_200_OK
            )
        #step 2: generate UID and token and send email
        # use urlsafe_base64_encode to encode the UID
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        reset_link = f"{frontend_url}/auth/password-reset-confirm/{uid}/{token}/"
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
        uidb64  = request.data.get('uid')
        token = request.data.get('token')
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
                user.last_password_change = timezone.now()
                user.save(update_fields=['password', 'last_password_change'])

                if not user.is_active:
                    user.is_active = True
                    user.save()
                
                profile_updated.send(
                    sender=self.__class__,
                    user = user,
                    description=f"user {user} changed password field"
                )


                return Response(
                    {'detail': 'Password reset successful. You can now log in with your new password.'},
                    status=status.HTTP_200_OK
                )

            except ValidationError as e:
                return Response(
                    {'error': list(e.messages)}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            except Exception as e:
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
            
class PasswordStatusAPIView(APIView):
    """
    API endpoint to check password expiration status

    GET /auth/password-status/
    Returns password status information for the authenticated user

    Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
    """
    permission_classes = [IsAuthenticated]

    PASSWORD_EXPIRATION_DAYS = 180  # 6 months

    def get(self, request):
        user = request.user

        # Check if user is staff/manager/admin
        if user.role not in ['staff', 'manager', 'admin']:
            return Response({
                'password_expiration_enforced': False,
                'message': 'Password expiration is not enforced for guest users'
            }, status=status.HTTP_200_OK)

        last_change = user.last_password_change
        if not last_change:
            return Response({
                'password_expiration_enforced': True,
                'password_expired': True,
                'last_password_change': None,
                'expiration_date': None,
                'days_until_expiration': 0,
                'message': 'Password has never been set. Please change your password.'
            }, status=status.HTTP_200_OK)

        expiration_date = last_change + timedelta(days=self.PASSWORD_EXPIRATION_DAYS)
        days_until_expiration = (expiration_date - timezone.now()).days
        is_expired = days_until_expiration < 0

        return Response({
            'password_expiration_enforced': True,
            'password_expired': is_expired,
            'last_password_change': last_change.isoformat(),
            'expiration_date': expiration_date.isoformat(),
            'days_until_expiration': max(0, days_until_expiration),
            'expiration_period_days': self.PASSWORD_EXPIRATION_DAYS,
            'message': 'Password has expired. Please change your password.' if is_expired else f'Password expires in {days_until_expiration} days.'
        }, status=status.HTTP_200_OK)


# Email Verification Endpoints for Guest Registration

@method_decorator(csrf_exempt, name='dispatch')
class VerifyEmailAPIView(APIView):
    """
    Verify guest email with OTP code

    POST /auth/verify-email/
    Required: email, code
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')

        if not email or not code:
            return Response(
                {"error": "Email and verification code are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify the OTP
        success, user_id, error = two_factor.verify_registration_otp(email, code)

        if not success:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        # Mark email as verified
        User = get_user_model()
        try:
            user = User.objects.get(id=user_id)
            user.email_verified = True
            user.save(update_fields=['email_verified'])

            return Response({
                "message": "Email verified successfully! You can now log in.",
                "verified": True
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found."},
                status=status.HTTP_400_BAD_REQUEST
            )


@method_decorator(csrf_exempt, name='dispatch')
class ResendVerificationEmailAPIView(APIView):
    """
    Resend verification email to user

    POST /auth/resend-verification/
    Required: email
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')

        if not email:
            return Response(
                {"error": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        success, error = two_factor.resend_verification_email(email)

        if success:
            return Response({
                "message": "Verification code sent to your email.",
                "sent": True
            }, status=status.HTTP_200_OK)

        return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)


class AdminUserListAPIView(APIView):
    """
    GET: List all users (with optional role filtering)
    POST: Create a new staff/manager account

    For managers:
    - GET: Only returns staff assigned to hotels they manage
    - POST: Can only create staff and must assign to their managed hotels
    """
    permission_classes = [IsAuthenticated, IsAdminOrManager]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_managed_hotels(self, user):
        """Get hotels managed by this user"""
        from hotels.models import Hotel
        return Hotel.objects.filter(manager=user)

    def get(self, request):
        User = get_user_model()
        role_filter = request.query_params.get('role')
        users = User.objects.all().order_by('-created_at')

        # If manager, only show staff from their hotels
        if request.user.role == 'manager':
            managed_hotels = self.get_managed_hotels(request.user)
            # Only show staff assigned to manager's hotels
            users = users.filter(role='staff', assigned_hotel__in=managed_hotels)
        elif role_filter:
            users = users.filter(role=role_filter)

        serializer = UserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        # If manager, enforce staff role and hotel assignment
        if request.user.role == 'manager':
            # Managers can only create staff
            if request.data.get('role') and request.data.get('role') != 'staff':
                return Response(
                    {"error": "Managers can only create staff accounts."},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Force role to staff
            if hasattr(request.data, '_mutable'):
                request.data._mutable = True
            request.data['role'] = 'staff'

            # Validate hotel assignment
            assigned_hotel_id = request.data.get('assigned_hotel')
            if assigned_hotel_id:
                managed_hotels = self.get_managed_hotels(request.user)
                if not managed_hotels.filter(id=assigned_hotel_id).exists():
                    return Response(
                        {"error": "You can only assign staff to hotels you manage."},
                        status=status.HTTP_403_FORBIDDEN
                    )

        serializer = AdminUserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            admin_action_performed.send(
                sender=self.__class__,
                actor=request.user,
                target_user=user,
                description=f"Created user {user}"
            )

            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminUserDetailAPIView(APIView):
    """
    PATCH: Update user role, status (activate/deactivate), or reset password
    DELETE: Delete a user

    For managers:
    - Can only update/delete staff assigned to their hotels
    - Cannot change user roles
    """
    permission_classes = [IsAuthenticated, IsAdminOrManager]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_managed_hotels(self, user):
        """Get hotels managed by this user"""
        from hotels.models import Hotel
        return Hotel.objects.filter(manager=user)

    def get_object(self, user_id):
        User = get_user_model()
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    def can_manager_access_user(self, manager, target_user):
        """Check if manager can access this user (must be staff in their hotel)"""
        if target_user.role != 'staff':
            return False
        managed_hotels = self.get_managed_hotels(manager)
        return target_user.assigned_hotel in managed_hotels

    def patch(self, request, user_id):
        target_user = self.get_object(user_id)
        if not target_user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # Manager restrictions
        if request.user.role == 'manager':
            if not self.can_manager_access_user(request.user, target_user):
                return Response(
                    {"error": "You can only manage staff assigned to your hotels."},
                    status=status.HTTP_403_FORBIDDEN
                )
            # Managers cannot change roles
            if 'role' in request.data and request.data.get('role') != 'staff':
                return Response(
                    {"error": "Managers cannot change user roles."},
                    status=status.HTTP_403_FORBIDDEN
                )
            # Validate hotel assignment change
            if 'assigned_hotel' in request.data:
                new_hotel_id = request.data.get('assigned_hotel')
                if new_hotel_id:
                    managed_hotels = self.get_managed_hotels(request.user)
                    if not managed_hotels.filter(id=new_hotel_id).exists():
                        return Response(
                            {"error": "You can only assign staff to hotels you manage."},
                            status=status.HTTP_403_FORBIDDEN
                        )

        if target_user.id == request.user.id and 'is_active' in request.data:
            return Response({"error": "You cannot deactivate your own account."}, status=status.HTTP_400_BAD_REQUEST)

        if 'role' in request.data:
            new_role = request.data.get('role')
            if new_role == "admin" and not request.user.is_superuser:
                return Response({"error": "You do not have permission to change the role of an admin."}, status=status.HTTP_403_FORBIDDEN)
            if new_role == "admin":
                target_user.is_staff = True
            else:
                target_user.is_staff = False

        if 'password' in request.data:
            target_user.set_password(request.data['password'])
            target_user.save()
            admin_action_performed.send(
                sender=self.__class__,
                actor=request.user,
                target_user=target_user,
                description=f"Changed password for user {target_user.username}."
            )
            return Response({"message": "Password reset successfully"}, status=status.HTTP_200_OK)

        # US-18: Admin can change roles and activate/deactivate
        serializer = AdminUserUpdateSerializer(target_user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()

            # Log what changed
            changed_fields = list(request.data.keys())
            admin_action_performed.send(
                sender=self.__class__,
                actor=request.user,
                target_user=target_user,
                description=f'Updated user profile for {target_user.username}. Changed fields: {changed_fields}'
            )

            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, user_id):
        target_user = self.get_object(user_id)
        if not target_user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # Manager restrictions
        if request.user.role == 'manager':
            if not self.can_manager_access_user(request.user, target_user):
                return Response(
                    {"error": "You can only delete staff assigned to your hotels."},
                    status=status.HTTP_403_FORBIDDEN
                )

        if target_user.id == request.user.id:
            return Response({"error": "You cannot delete your own account."}, status=status.HTTP_400_BAD_REQUEST)

        username = target_user.username

        admin_action_performed.send(
            sender=self.__class__,
            actor=request.user,
            target_user=target_user,
            description=f"Permanently deleted user {username}."
        )

        target_user.delete()

        return Response({"message": f"User {username} has been permanently deleted."}, status=status.HTTP_204_NO_CONTENT)


# Two-Factor Authentication Views

@method_decorator(csrf_exempt, name='dispatch')
class TwoFactorSetupAPIView(APIView):
    """
    Start 2FA setup - generates QR code and secret for authenticator app

    POST /auth/2fa/setup/
    Returns: QR code image (base64), secret key, and backup codes
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        # Only allow for staff, manager, admin
        if user.role not in ['staff', 'manager', 'admin']:
            return Response(
                {"error": "Two-factor authentication is only available for staff users."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if already enabled and confirmed
        if user.two_factor_enabled and user.two_factor_confirmed:
            return Response(
                {"error": "Two-factor authentication is already enabled. Disable it first to reconfigure."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate new secret
        secret = two_factor.generate_totp_secret()

        # Save secret (not confirmed yet)
        user.two_factor_secret = secret
        user.two_factor_enabled = False
        user.two_factor_confirmed = False
        user.save(update_fields=['two_factor_secret', 'two_factor_enabled', 'two_factor_confirmed'])

        # Generate QR code
        uri = two_factor.get_totp_uri(user, secret)
        qr_code = two_factor.generate_qr_code(uri)

        return Response({
            "message": "Scan the QR code with your authenticator app, then verify with a code.",
            "qr_code": qr_code,
            "secret": secret,  # For manual entry
            "uri": uri
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class TwoFactorConfirmAPIView(APIView):
    """
    Confirm 2FA setup by verifying a TOTP code

    POST /auth/2fa/confirm/
    Required: code (6-digit TOTP code)
    Returns: backup codes on success
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        serializer = TwoFactorConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data['code']

        if not user.two_factor_secret:
            return Response(
                {"error": "Please start 2FA setup first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify the code
        if not two_factor.verify_totp(user.two_factor_secret, code):
            return Response(
                {"error": "Invalid code. Please try again."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate backup codes
        plaintext_codes, hashed_codes = two_factor.generate_backup_codes()

        # Enable and confirm 2FA
        user.two_factor_enabled = True
        user.two_factor_confirmed = True
        user.two_factor_backup_codes = hashed_codes
        user.save(update_fields=['two_factor_enabled', 'two_factor_confirmed', 'two_factor_backup_codes'])

        return Response({
            "message": "Two-factor authentication enabled successfully.",
            "backup_codes": plaintext_codes,
            "warning": "Save these backup codes securely. They can only be viewed once."
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class TwoFactorVerifyAPIView(APIView):
    """
    Verify 2FA during login - completes authentication

    POST /auth/2fa/verify/
    Required: temp_token, code, method (totp/email/backup)
    Returns: JWT tokens on success
    """
    authentication_classes = []  # No authentication required - uses temp_token
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = TwoFactorVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        temp_token = serializer.validated_data['temp_token']
        code = serializer.validated_data['code']
        method = serializer.validated_data['method']

        # Verify temp token and get user
        user_id, error = two_factor.verify_temp_token(temp_token)
        if error:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_400_BAD_REQUEST)

        # Verify the code based on method
        verified = False

        if method == 'totp':
            verified = two_factor.verify_totp(user.two_factor_secret, code)
        elif method == 'email':
            verified, _, error = two_factor.verify_email_otp(temp_token, code)
            if error and not verified:
                return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)
        elif method == 'backup':
            verified = two_factor.verify_backup_code(user, code)

        if not verified:
            # Increment attempt counter
            remaining, error = two_factor.increment_temp_token_attempts(temp_token)
            if error:
                return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

            return Response({
                "error": "Invalid code.",
                "remaining_attempts": remaining
            }, status=status.HTTP_400_BAD_REQUEST)

        # Success - invalidate temp token
        two_factor.invalidate_temp_token(temp_token)

        # Audit log: successful login
        AuditLogger.log_login_success(request, user)

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            "message": "Login successful",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
            "token_type": "Bearer"
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class TwoFactorDisableAPIView(APIView):
    """
    Disable 2FA - requires password confirmation

    POST /auth/2fa/disable/
    Required: password
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        serializer = TwoFactorDisableSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        password = serializer.validated_data['password']

        # Verify password
        if not user.check_password(password):
            return Response(
                {"error": "Incorrect password."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Disable 2FA
        user.two_factor_enabled = False
        user.two_factor_confirmed = False
        user.two_factor_secret = None
        user.two_factor_backup_codes = []
        user.save(update_fields=['two_factor_enabled', 'two_factor_confirmed', 'two_factor_secret', 'two_factor_backup_codes'])

        return Response({
            "message": "Two-factor authentication has been disabled."
        }, status=status.HTTP_200_OK)


class TwoFactorStatusAPIView(APIView):
    """
    Check 2FA status for current user

    GET /auth/2fa/status/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        return Response({
            "enabled": user.two_factor_enabled,
            "confirmed": user.two_factor_confirmed,
            "backup_codes_remaining": len(user.two_factor_backup_codes) if user.two_factor_backup_codes else 0,
            "can_enable": user.role in ['staff', 'manager', 'admin']
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class TwoFactorEmailOTPAPIView(APIView):
    """
    Send email OTP as fallback during login

    POST /auth/2fa/email-otp/
    Required: temp_token
    """
    authentication_classes = []  # No authentication required - uses temp_token
    permission_classes = [AllowAny]

    def post(self, request):
        temp_token = request.data.get('temp_token')

        if not temp_token:
            return Response(
                {"error": "Temporary token is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify temp token and get user
        user_id, error = two_factor.verify_temp_token(temp_token)
        if error:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_400_BAD_REQUEST)

        if not user.email:
            return Response(
                {"error": "No email address associated with this account."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Send email OTP
        success = two_factor.send_email_otp(user, temp_token)

        if not success:
            return Response(
                {"error": "Failed to send email. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Mask email for response
        masked_email = user.email[:3] + "***" + user.email[user.email.find("@"):]

        return Response({
            "message": f"Verification code sent to {masked_email}",
            "email": masked_email
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class BackupCodesAPIView(APIView):
    """
    Regenerate backup codes - requires password

    POST /auth/2fa/backup-codes/
    Required: password
    Returns: new backup codes
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        serializer = BackupCodesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        password = serializer.validated_data['password']

        # Verify password
        if not user.check_password(password):
            return Response(
                {"error": "Incorrect password."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if 2FA is enabled
        if not user.two_factor_enabled:
            return Response(
                {"error": "Two-factor authentication is not enabled."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate new backup codes
        plaintext_codes, hashed_codes = two_factor.generate_backup_codes()

        user.two_factor_backup_codes = hashed_codes
        user.save(update_fields=['two_factor_backup_codes'])

        return Response({
            "message": "New backup codes generated. Previous codes are now invalid.",
            "backup_codes": plaintext_codes,
            "warning": "Save these backup codes securely. They can only be viewed once."
        }, status=status.HTTP_200_OK)
