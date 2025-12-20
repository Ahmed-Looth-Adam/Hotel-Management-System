from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate, update_session_auth_hash
from django.utils import timezone

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
            'date_of_birth', 'address', 'city', 'country', 'postal_code'
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
            'postal_code': {'required': False}
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
        user = User.objects.create_user(**validated_data)
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
    assigned_hotel_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone_number', 'date_of_birth', 'address',
            'city', 'country', 'postal_code', 'is_active',
            'profile_picture', 'date_joined', 'created_at', 'updated_at',
            'assigned_hotel', 'assigned_hotel_name'
        ]
        read_only_fields = ['id', 'date_joined', 'created_at', 'updated_at', 'role', 'assigned_hotel_name']

    def get_assigned_hotel_name(self, obj):
        """Get the name of the assigned hotel (for staff) or managed hotel (for managers)"""
        # For staff: return assigned hotel
        if obj.assigned_hotel:
            return obj.assigned_hotel.name
        # For managers: return hotel they manage
        if obj.role == 'manager':
            from hotels.models import Hotel
            managed_hotel = Hotel.objects.filter(manager=obj).first()
            if managed_hotel:
                return managed_hotel.name
        return None

    def validate_email(self, value):
        """Check if email is already registered by another user"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
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
        instance.last_password_change = timezone.now()
        instance.save(update_fields=['password', 'last_password_change'])
        return instance
    



class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """
    Specific serializer for Admin actions.
    Explicitly allows updating 'role' and 'is_active'.
    """
    class Meta:
        model = User
        fields = [
            'role', 'is_active', 'first_name', 'last_name', 'email', 'username',
            'phone_number', 'profile_picture', 'assigned_hotel'
        ]
        extra_kwargs = {
            'role': {'required': False},
            'is_active': {'required': False},
            'username': {'required': False},
            'email': {'required': False},
            'phone_number': {'required': False},
            'profile_picture': {'required': False},
            'assigned_hotel': {'required': False}
        }

class AdminUserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for admin/manager to create staff/manager users"""
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
            'date_of_birth', 'address', 'city', 'country', 'postal_code', 'role',
            'profile_picture', 'assigned_hotel'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'phone_number': {'required': False},
            'date_of_birth': {'required': False},
            'address': {'required': False},
            'city': {'required': False},
            'country': {'required': False},
            'postal_code': {'required': False},
            'role': {'required': False},
            'profile_picture': {'required': False},
            'assigned_hotel': {'required': False},
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
        assigned_hotel = validated_data.pop('assigned_hotel', None)
        user = User.objects.create_user(role=role, assigned_hotel=assigned_hotel, **validated_data)
        return user


# Two-Factor Authentication Serializers

class TwoFactorSetupSerializer(serializers.Serializer):
    """Serializer for initiating 2FA setup - returns QR code and secret"""
    pass


class TwoFactorConfirmSerializer(serializers.Serializer):
    """Serializer for confirming 2FA setup with a TOTP code"""
    code = serializers.CharField(
        max_length=6,
        min_length=6,
        required=True,
        help_text="6-digit code from authenticator app"
    )

    def validate_code(self, value):
        """Ensure code is numeric"""
        if not value.isdigit():
            raise serializers.ValidationError("Code must contain only digits.")
        return value


class TwoFactorVerifySerializer(serializers.Serializer):
    """Serializer for verifying 2FA during login"""
    temp_token = serializers.CharField(required=True, help_text="Temporary token from login response")
    code = serializers.CharField(
        max_length=10,
        required=True,
        help_text="6-digit TOTP code, email OTP, or backup code"
    )
    method = serializers.ChoiceField(
        choices=['totp', 'email', 'backup'],
        default='totp',
        help_text="Verification method: totp, email, or backup"
    )


class TwoFactorDisableSerializer(serializers.Serializer):
    """Serializer for disabling 2FA - requires password confirmation"""
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text="Current password for confirmation"
    )


class TwoFactorStatusSerializer(serializers.Serializer):
    """Serializer for 2FA status response"""
    enabled = serializers.BooleanField()
    confirmed = serializers.BooleanField()
    backup_codes_remaining = serializers.IntegerField()


class BackupCodesSerializer(serializers.Serializer):
    """Serializer for regenerating backup codes - requires password"""
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text="Current password for confirmation"
    )

