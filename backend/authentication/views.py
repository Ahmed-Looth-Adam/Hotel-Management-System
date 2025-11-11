# Edited By
# -> Ahmed Looth Adam, UWE ID: 24050761
# -> Ismail Wasiu Abdul Samad, UWE ID: 24050765

from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.contrib import messages
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .forms import CustomUserCreationForm
from .serializers import UserRegistrationSerializer, UserSerializer


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