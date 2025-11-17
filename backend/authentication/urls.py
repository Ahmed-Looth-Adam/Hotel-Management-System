# Edited By
# -> Ahmed Looth Adam, UWE ID: 24050761
# -> Ismail Wasiu Abdul Samad, UWE ID: 24050765

from django.urls import path
from . import views

urlpatterns = [
    # API Endpoints - JWT Authentication
    path('register/', views.RegisterAPIView.as_view(), name='register-api'),
    path('login/', views.LoginAPIView.as_view(), name='login-api'),
    path('logout/', views.LogoutAPIView.as_view(), name='logout-api'),
    path('token/refresh/', views.TokenRefreshAPIView.as_view(), name='token-refresh'),
    path('profile/', views.UserProfileAPIView.as_view(), name='user-profile'),

    # Template-based views (optional)
    path('register-form/', views.register_template, name='register'),
]