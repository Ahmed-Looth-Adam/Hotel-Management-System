# Edited By
# -> Ahmed Looth Adam, UWE ID: 24050761
# -> Ismail Wasiu Abdul Samad, UWE ID: 24050765

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

    # Template-based views (optional)
    path('register-form/', views.register_template, name='register'),
]