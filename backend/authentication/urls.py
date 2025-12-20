# Edited By
# -> Ahmed Looth Adam, UWE ID: 24050761
# -> Ismail Wasiu Abdul Samad, UWE ID: 24050765
# -> Ibrahim Waseem, UWE ID: 24050771

from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from . import views

urlpatterns = [
    # API Endpoints - JWT Authentication (CSRF exempt)
    path('register/', csrf_exempt(views.RegisterAPIView.as_view()), name='register-api'),
    path('login/', csrf_exempt(views.LoginAPIView.as_view()), name='login-api'),
    path('logout/', csrf_exempt(views.LogoutAPIView.as_view()), name='logout-api'),
    path('token/refresh/', csrf_exempt(views.TokenRefreshAPIView.as_view()), name='token-refresh'),
    path('profile/', csrf_exempt(views.UserProfileAPIView.as_view()), name='user-profile'),
    path('change-password/', csrf_exempt(views.PasswordChangeAPIView.as_view()), name='change-password'),
    path('register-form/', views.register_template, name='register'),
    path('password-reset/', csrf_exempt(views.PasswordResetRequestAPIview.as_view()), name='password-reset'),
    path('password-reset-confirm/', csrf_exempt(views.PasswordResetConfirmAPIview.as_view()), name='password-reset-confirm'),
    path('password-status/', csrf_exempt(views.PasswordStatusAPIView.as_view()), name='password-status'),
    path('admin/users/', views.AdminUserListAPIView.as_view(), name='admin-user-list'),
    path('admin/users/<int:user_id>/', views.AdminUserDetailAPIView.as_view(), name='admin-user-detail'),

    # Two-Factor Authentication endpoints
    path('2fa/setup/', csrf_exempt(views.TwoFactorSetupAPIView.as_view()), name='2fa-setup'),
    path('2fa/confirm/', csrf_exempt(views.TwoFactorConfirmAPIView.as_view()), name='2fa-confirm'),
    path('2fa/verify/', csrf_exempt(views.TwoFactorVerifyAPIView.as_view()), name='2fa-verify'),
    path('2fa/disable/', csrf_exempt(views.TwoFactorDisableAPIView.as_view()), name='2fa-disable'),
    path('2fa/status/', csrf_exempt(views.TwoFactorStatusAPIView.as_view()), name='2fa-status'),
    path('2fa/email-otp/', csrf_exempt(views.TwoFactorEmailOTPAPIView.as_view()), name='2fa-email-otp'),
    path('2fa/backup-codes/', csrf_exempt(views.BackupCodesAPIView.as_view()), name='2fa-backup-codes'),
]