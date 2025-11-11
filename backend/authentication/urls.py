# Edited By
# -> Ahmed Looth Adam, UWE ID: 24050761
# -> Ismail Wasiu Abdul Samad, UWE ID: 24050765

from django.urls import path
from . import views

urlpatterns = [
    # API Endpoints
    path('register/', views.RegisterAPIView.as_view(), name='register-api'),

    # Template-based views (optional)
    path('register-form/', views.register_template, name='register-template'),
]