# apps/users/serializers.py - UPDATED with RBAC
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from .models import User, AuditLog


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model with role-based field visibility
    """
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name', 
            'role', 'role_display', 'organization', 'phone_number', 'bio', 
            'avatar', 'is_active', 'last_login', 'last_login_ip', 
            'date_joined', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'last_login', 'last_login_ip', 'date_joined', 
            'created_at', 'updated_at'
        ]
    
    def get_full_name(self, obj):
        """Get user's full name or username as fallback"""
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username
    
    def to_representation(self, instance):
        """
        Customize output based on requesting user's role
        Hide sensitive fields from non-admin users
        """
        data = super().to_representation(instance)
        request = self.context.get('request')
        
        # FIXED: Check if user is authenticated AND has the role attribute
        if (request and 
            hasattr(request, 'user') and 
            request.user.is_authenticated and
            hasattr(request.user, 'role')):
            
            # Non-admin users viewing other profiles get limited data
            if request.user.role != 'admin' and request.user.id != instance.id:
                # Remove sensitive fields
                data.pop('email', None)
                data.pop('phone_number', None)
                data.pop('last_login', None)
                data.pop('last_login_ip', None)
        
        return data


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new users (Admin only)
    """
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True, 
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'role', 'organization',
            'phone_number', 'bio', 'is_active'
        ]
    
    def validate(self, attrs):
        """Validate password confirmation"""
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({
                "password_confirm": "Password fields didn't match."
            })
        return attrs
    
    def validate_role(self, value):
        """Validate role is one of the allowed choices"""
        allowed_roles = ['admin', 'teacher', 'program_manager', 'donor']
        if value not in allowed_roles:
            raise serializers.ValidationError(
                f"Role must be one of: {', '.join(allowed_roles)}"
            )
        return value
    
    def create(self, validated_data):
        """Create user with hashed password"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating existing users
    """
    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'role', 'organization',
            'phone_number', 'bio', 'avatar', 'is_active'
        ]
    
    def validate_is_active(self, value):
        """Only admins can change is_active status"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            # Check if user is admin
            if request.user.role != 'admin':
                # Check if trying to change the status
                if self.instance and self.instance.is_active != value:
                    # Allow non-admins if they're deactivating their own account
                    if self.instance.id == request.user.id and value is False:
                        return value
                    raise serializers.ValidationError(
                        "You don't have permission to change user active status."
                    )
        return value
    
    def update(self, instance, validated_data):
        """Update user fields with proper logging"""
        print(f"=== UPDATE USER ===")
        print(f"User ID: {instance.id}")
        print(f"Username: {instance.username}")
        print(f"Current is_active: {instance.is_active}")
        print(f"New is_active: validated_data.get('is_active')")
        print(f"Request user: {self.context['request'].user.username}")
        print(f"Request user role: {self.context['request'].user.role}")
        
        # Log each field being updated
        for field, new_value in validated_data.items():
            old_value = getattr(instance, field, None)
            print(f"Field '{field}': {old_value} -> {new_value}")
            setattr(instance, field, new_value)
        
        instance.save()
        print(f"=== USER SAVED ===")
        print(f"Final is_active: {instance.is_active}")
        
        return instance


class UserListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing users
    """
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name', 'role', 
            'role_display', 'organization', 'is_active', 'date_joined'
        ]
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile updates (current user only)
    Does not allow role or is_active changes
    """
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'full_name', 'role', 'role_display', 'organization', 
            'phone_number', 'bio', 'avatar'
        ]
        read_only_fields = ['id', 'username', 'role']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for password change endpoint
    """
    old_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """Validate password confirmation"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                "new_password_confirm": "Password fields didn't match."
            })
        return attrs
    
    def validate_old_password(self, value):
        """Validate old password is correct"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value
    
    def validate_new_password(self, value):
        """Validate new password is different from old"""
        user = self.context['request'].user
        if user.check_password(value):
            raise serializers.ValidationError(
                "New password must be different from current password."
            )
        return value
    
    def save(self):
        """Update user password"""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login
    """
    username = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True, 
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """Validate credentials and return user"""
        username = attrs.get('username')
        password = attrs.get('password')
        
        if not username or not password:
            raise serializers.ValidationError(
                "Must include 'username' and 'password'."
            )
        
        user = authenticate(username=username, password=password)
        
        if not user:
            raise serializers.ValidationError(
                "Invalid username or password."
            )
        
        if not user.is_active:
            raise serializers.ValidationError(
                "User account is disabled."
            )
        
        attrs['user'] = user
        return attrs


class UserStatsSerializer(serializers.Serializer):
    """
    Serializer for user statistics (Admin only)
    """
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    inactive_users = serializers.IntegerField()
    by_role = serializers.ListField()


class AuditLogSerializer(serializers.ModelSerializer):
    """
    Serializer for audit log entries
    """
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_name', 'user_email', 'action', 
            'action_display', 'model_name', 'object_id', 'description', 
            'ip_address', 'user_agent', 'timestamp', 'changes'
        ]
        read_only_fields = fields


class AuditLogCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating audit log entries
    """
    class Meta:
        model = AuditLog
        fields = [
            'user', 'action', 'model_name', 'object_id', 
            'description', 'ip_address', 'user_agent', 'changes'
        ]
    
    def create(self, validated_data):
        """Create audit log entry"""
        return AuditLog.objects.create(**validated_data)


# Convenience serializer for token response
class TokenResponseSerializer(serializers.Serializer):
    """
    Serializer for login response with tokens
    """
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()


# Mini serializer for nested relationships
class UserMiniSerializer(serializers.ModelSerializer):
    """
    Minimal user serializer for nested relationships
    """
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'role']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username