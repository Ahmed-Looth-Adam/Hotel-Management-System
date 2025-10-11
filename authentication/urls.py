# Edited By
# -> Ahmed Looth Adam, UWE ID: 24050761 

from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
]