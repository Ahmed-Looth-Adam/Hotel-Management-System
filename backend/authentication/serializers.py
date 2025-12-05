from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate, update_session_auth_hash

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        label='Confirm Password'
    )

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'password2',
            'first_name', 'last_name', 'phone_number',
            'date_of_birth', 'address', 'city', 'country', 'postal_code', 'role'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': False},
            'last_name': {'required': False},
            'phone_number': {'required': False},
            'date_of_birth': {'required': False},
            'address': {'required': False},
            'city': {'required': False},
            'country': {'required': False},
            'postal_code': {'required': False},
            'role':  {'required': False},
        }

    def validate(self, attrs):
        """Validate that passwords match"""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    def validate_email(self, value):
        """Check if email is already registered"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def create(self, validated_data):
        """Create and return a new user"""
        # Remove password2 as it's not needed for user creation
        validated_data.pop('password2')
        # Create user with the validated data
        role = validated_data.pop('role', 'guest') 
        if not role:
            role = 'guest'
        user = User.objects.create_user(role = role, **validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    username = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user details"""

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone_number', 'date_of_birth', 'address',
            'city', 'country', 'postal_code', 'is_active',
            'date_joined', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'date_joined', 'created_at', 'updated_at', 'role']

    def validate_email(self, value):
        """Check if email is already registered by another user"""
        user = self.context['request'].user
        if User.objects.exclude(pk=user.pk).filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered by another user.")
        return value


#  Password change serializer
# Edited By:
# -> Ibrahim Waseem, UWE ID: 24050771
class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def validate(self, data):
        if data['new_password'] != data['confirm_new_password']:
            raise serializers.ValidationError({"password": "New passwords must match."})
        return data

    def update(self, instance, validated_data):
        if not instance.check_password(validated_data['current_password']):
            raise serializers.ValidationError({"current_password": "Current password is incorrect."})
        
        instance.set_password(validated_data['new_password'])
        instance.save()
        return instance
    



class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """
    Specific serializer for Admin actions.
    Explicitly allows updating 'role' and 'is_active'.
    """
    class Meta:
        model = User
        print(model)
        fields = ['role', 'is_active', 'first_name', 'last_name', 'email', 'username']
        extra_kwargs = {
            'role': {'required': False},
            'is_active': {'required': False},
            'username': {'required': False},
            'email': {'required': False}
        }
