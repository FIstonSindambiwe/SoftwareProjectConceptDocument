# apps/users/serializers.py
from django.utils import timezone  # ✅ Correct import for Django timezone
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
import logging
import secrets
import string

logger = logging.getLogger(__name__)
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
        
        if (request and 
            hasattr(request, 'user') and 
            request.user.is_authenticated and
            hasattr(request.user, 'role')):
            
            if request.user.role != 'admin' and request.user.id != instance.id:
                data.pop('email', None)
                data.pop('phone_number', None)
                data.pop('last_login', None)
                data.pop('last_login_ip', None)
        
        return data


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new users (Admin only)
    Automatically generates a secure random password
    """
    password = serializers.CharField(
        write_only=True, 
        required=False,
        style={'input_type': 'password'},
        help_text="Optional - if not provided, a secure random password will be generated"
    )
    password_confirm = serializers.CharField(
        write_only=True, 
        required=False,
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
        """Validate password if provided, otherwise skip"""
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')
        
        # If password is provided, validate it
        if password:
            if password != password_confirm:
                raise serializers.ValidationError({
                    "password_confirm": "Password fields didn't match."
                })
        
        # Ensure email is provided
        if not attrs.get('email'):
            raise serializers.ValidationError({
                "email": "Email is required for user creation."
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
    
    def generate_secure_password(self, length=12):
        """Generate a secure random password that meets complexity requirements"""
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        
        # Generate password until it meets complexity requirements
        while True:
            password = ''.join(secrets.choice(alphabet) for _ in range(length))
            # Check complexity requirements
            if (any(c.isupper() for c in password) and
                any(c.islower() for c in password) and
                any(c.isdigit() for c in password) and
                any(c in "!@#$%^&*" for c in password)):
                return password
    
    def create(self, validated_data):
        """Create user with auto-generated password"""
        # Remove password_confirm if present
        validated_data.pop('password_confirm', None)
        
        # Get provided password or generate one
        provided_password = validated_data.pop('password', None)
        
        if provided_password:
            # Use provided password
            password = provided_password
            logger.info(f"Using provided password for user {validated_data.get('username')}")
        else:
            # Generate secure random password
            password = self.generate_secure_password()
            logger.info(f"Generated secure password for user {validated_data.get('username')}")
        
        # Create user
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.must_change_password = True  # Always require password change on first login
        user.save()
        
        # Send welcome email with password
        email_sent = self._send_welcome_email(user, password)
        
        # Store additional info for response
        user.email_sent = email_sent
        if settings.DEBUG and not email_sent:
            user.temp_password = password
        
        return user
    
    def _send_welcome_email(self, user, password):
        """Send welcome email with login credentials - Beautiful HTML template"""
        try:
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            login_url = f"{frontend_url}/login"
            
            # Get current year using Django's timezone
            current_year = timezone.now().year
            
            subject = f"🎉 Welcome to Youth Impact Visualizer - Your Account Details"
            
            # Modern HTML email template
            html_message = f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to Youth Impact Visualizer</title>
                <style>
                    body, html {{
                        margin: 0;
                        padding: 0;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.6;
                        color: #1f2937;
                        background-color: #f3f4f6;
                    }}
                    .email-container {{
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 16px;
                        overflow: hidden;
                        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    }}
                    .header {{
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        padding: 48px 32px;
                        text-align: center;
                        color: white;
                    }}
                    .header h1 {{
                        margin: 0;
                        font-size: 28px;
                        font-weight: 700;
                    }}
                    .header p {{
                        margin: 12px 0 0;
                        opacity: 0.9;
                        font-size: 16px;
                    }}
                    .content {{
                        padding: 40px 32px;
                        background-color: #ffffff;
                    }}
                    .welcome {{
                        margin-bottom: 32px;
                    }}
                    .welcome h2 {{
                        font-size: 24px;
                        font-weight: 600;
                        color: #1f2937;
                        margin: 0 0 12px 0;
                    }}
                    .credentials-card {{
                        background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
                        border-radius: 12px;
                        padding: 24px;
                        margin: 24px 0;
                        border-left: 4px solid #667eea;
                    }}
                    .credentials-card h3 {{
                        font-size: 18px;
                        font-weight: 600;
                        color: #5b21b6;
                        margin: 0 0 16px 0;
                    }}
                    .credential-item {{
                        display: flex;
                        align-items: center;
                        margin-bottom: 12px;
                        padding: 8px 12px;
                        background-color: white;
                        border-radius: 8px;
                    }}
                    .credential-label {{
                        font-weight: 600;
                        color: #4b5563;
                        width: 100px;
                        font-size: 14px;
                    }}
                    .credential-value {{
                        color: #1f2937;
                        font-family: 'Courier New', monospace;
                        font-size: 14px;
                        font-weight: 500;
                    }}
                    .password-value {{
                        background-color: #fef3c7;
                        color: #92400e;
                        font-family: 'Courier New', monospace;
                        font-size: 14px;
                        font-weight: 600;
                        padding: 4px 8px;
                        border-radius: 6px;
                    }}
                    .security-notice {{
                        background-color: #fffbeb;
                        border-left: 4px solid #f59e0b;
                        padding: 16px;
                        margin: 24px 0;
                        border-radius: 8px;
                    }}
                    .button-container {{
                        text-align: center;
                        margin: 32px 0;
                    }}
                    .button {{
                        display: inline-block;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        text-decoration: none;
                        padding: 14px 32px;
                        border-radius: 40px;
                        font-weight: 600;
                        font-size: 16px;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    }}
                    .tips {{
                        background-color: #f9fafb;
                        border-radius: 12px;
                        padding: 24px;
                        margin: 24px 0;
                    }}
                    .tips h4 {{
                        font-size: 16px;
                        font-weight: 600;
                        color: #374151;
                        margin: 0 0 12px 0;
                    }}
                    .footer {{
                        background-color: #f9fafb;
                        padding: 24px 32px;
                        text-align: center;
                        border-top: 1px solid #e5e7eb;
                    }}
                    .footer p {{
                        margin: 0 0 8px;
                        color: #9ca3af;
                        font-size: 12px;
                    }}
                </style>
            </head>
            <body>
                <div style="padding: 20px 0;">
                    <div class="email-container">
                        <div class="header">
                            <h1>🎉 Welcome Aboard!</h1>
                            <p>Your journey with Youth Impact Visualizer begins here</p>
                        </div>
                        <div class="content">
                            <div class="welcome">
                                <h2>Hello {user.get_full_name() or user.username}! 👋</h2>
                                <p>Your account has been successfully created. You're now ready to start tracking and managing program impact.</p>
                            </div>
                            <div class="credentials-card">
                                <h3>🔐 Your Login Credentials</h3>
                                <div class="credential-item">
                                    <div class="credential-label">Username:</div>
                                    <div class="credential-value">{user.username}</div>
                                </div>
                                <div class="credential-item">
                                    <div class="credential-label">Password:</div>
                                    <div class="password-value">{password}</div>
                                </div>
                            </div>
                            <div class="security-notice">
                                <p><strong>⚠️ Important Security Notice:</strong> You will be required to change your password upon first login for security purposes.</p>
                            </div>
                            <div class="button-container">
                                <a href="{login_url}" class="button">🚀 Log In to Your Account</a>
                            </div>
                            <div class="tips">
                                <h4>💡 Quick Tips:</h4>
                                <ul>
                                    <li>✅ Change your password immediately after first login</li>
                                    <li>✅ Use a strong, unique password</li>
                                    <li>✅ Never share your password with anyone</li>
                                    <li>✅ Bookmark the login page for quick access</li>
                                </ul>
                            </div>
                        </div>
                        <div class="footer">
                            <p>© {current_year} Youth Impact Visualizer. All rights reserved.</p>
                            <p>This is an automated message. Please do not reply to this email.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Plain text version
            text_message = f"""
🎉 Welcome to Youth Impact Visualizer! 🎉

Hello {user.get_full_name() or user.username},

Your account has been successfully created.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 YOUR LOGIN CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Username: {user.username}
Password: {password}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ IMPORTANT SECURITY NOTICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You will be required to change your password upon first login for security purposes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 LOGIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Log in here: {login_url}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 QUICK TIPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Change your password immediately after first login
✅ Use a strong, unique password
✅ Never share your password with anyone

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

© {current_year} Youth Impact Visualizer. All rights reserved.
This is an automated message. Please do not reply to this email.
            """
            
            # Send the email
            send_mail(
                subject=subject,
                message=text_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Welcome email sent successfully to {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")
            logger.info(f"Generated password for {user.username}: {password}")
            return False
    
    def to_representation(self, instance):
        """Add email status to response"""
        data = super().to_representation(instance)
        
        # Add email status
        if hasattr(instance, 'email_sent'):
            data['email_sent'] = instance.email_sent
        
        # In development, include temp password if email failed
        if settings.DEBUG and hasattr(instance, 'temp_password') and instance.temp_password:
            data['temp_password'] = instance.temp_password
        
        return data


# Keep all your other serializers (UserUpdateSerializer, UserListSerializer, etc.)
# as they are, but make sure to update the ChangePasswordSerializer if needed

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
        """Update user password and clear must_change_password flag"""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.must_change_password = False
        user.password_changed_at = timezone.now()
        user.save()
        
        logger.info(f"Password changed for user {user.username}")
        return user


# Keep the rest of your serializers (LoginSerializer, UserStatsSerializer, etc.)
# as they are, but make sure to import timezone correctly in any other serializers
# that use it

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
            if request.user.role != 'admin':
                if self.instance and self.instance.is_active != value:
                    if self.instance.id == request.user.id and value is False:
                        return value
                    raise serializers.ValidationError(
                        "You don't have permission to change user active status."
                    )
        return value
    
    def update(self, instance, validated_data):
        """Update user fields with proper logging"""
        for field, new_value in validated_data.items():
            old_value = getattr(instance, field, None)
            logger.info(f"Updating {field}: {old_value} -> {new_value}")
            setattr(instance, field, new_value)
        
        instance.save()
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


class TokenResponseSerializer(serializers.Serializer):
    """
    Serializer for login response with tokens
    """
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()


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