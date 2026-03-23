# apps/users/management/commands/test_email.py
from django.core.management.base import BaseCommand
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Test email configuration by sending a test email'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Email address to send test email to',
            default='shemaroger60@gmail.com'
        )
        parser.add_argument(
            '--subject',
            type=str,
            help='Email subject',
            default='Test Email from Youth Impact Visualizer'
        )

    def handle(self, *args, **options):
        email = options['email']
        subject = options['subject']
        
        self.stdout.write(self.style.SUCCESS(f'\n📧 Testing Email Configuration'))
        self.stdout.write(f'Recipient: {email}')
        self.stdout.write(f'Subject: {subject}')
        self.stdout.write(f'Email Backend: {settings.EMAIL_BACKEND}\n')
        
        # Test 1: Simple text email
        self.stdout.write('Test 1: Sending simple text email...')
        try:
            text_message = f"""
            🧪 TEST EMAIL
            
            This is a test email from Youth Impact Visualizer.
            
            If you're reading this, your email configuration is working correctly!
            
            Details:
            - Time: {self.get_timestamp()}
            - Email Backend: {settings.EMAIL_BACKEND}
            - From: {settings.DEFAULT_FROM_EMAIL}
            
            ✅ Email sending is configured successfully!
            """
            
            send_mail(
                subject=f"{subject} - Text Test",
                message=text_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            self.stdout.write(self.style.SUCCESS('   ✅ Simple text email sent successfully!'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'   ❌ Failed to send text email: {str(e)}'))
            return
        
        # Test 2: HTML email
        self.stdout.write('\nTest 2: Sending HTML formatted email...')
        try:
            html_message = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Test Email</title>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                    }}
                    .container {{
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f9fafb;
                        border-radius: 10px;
                    }}
                    .header {{
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 30px;
                        text-align: center;
                        border-radius: 10px 10px 0 0;
                    }}
                    .content {{
                        background: white;
                        padding: 30px;
                        border-radius: 0 0 10px 10px;
                    }}
                    .success {{
                        background-color: #d4edda;
                        color: #155724;
                        padding: 15px;
                        border-radius: 5px;
                        margin: 20px 0;
                        border-left: 4px solid #28a745;
                    }}
                    .footer {{
                        text-align: center;
                        margin-top: 20px;
                        padding-top: 20px;
                        border-top: 1px solid #eee;
                        color: #666;
                        font-size: 12px;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🧪 Email Test</h1>
                        <p>Youth Impact Visualizer</p>
                    </div>
                    <div class="content">
                        <h2>Test Successful! 🎉</h2>
                        <p>Your email configuration is working correctly!</p>
                        
                        <div class="success">
                            <strong>✅ Email System Status:</strong><br>
                            • Backend: {settings.EMAIL_BACKEND}<br>
                            • Host: {settings.EMAIL_HOST}<br>
                            • Port: {settings.EMAIL_PORT}<br>
                            • TLS: {settings.EMAIL_USE_TLS}<br>
                            • From: {settings.DEFAULT_FROM_EMAIL}<br>
                            • Time: {self.get_timestamp()}
                        </div>
                        
                        <p>If you're reading this HTML email, both plain text and HTML email are working properly.</p>
                        
                        <h3>Next Steps:</h3>
                        <ul>
                            <li>✅ Your email configuration is working</li>
                            <li>✅ You can now send welcome emails to new users</li>
                            <li>✅ Password reset emails will be delivered</li>
                            <li>✅ Notifications will reach users</li>
                        </ul>
                    </div>
                    <div class="footer">
                        <p>This is an automated test email from Youth Impact Visualizer.</p>
                        <p>© {self.get_current_year()} Youth Impact Visualizer. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            text_message = strip_tags(html_message)
            
            email_message = EmailMultiAlternatives(
                subject=f"{subject} - HTML Test",
                body=text_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email],
            )
            email_message.attach_alternative(html_message, "text/html")
            email_message.send()
            
            self.stdout.write(self.style.SUCCESS('   ✅ HTML email sent successfully!'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'   ❌ Failed to send HTML email: {str(e)}'))
        
        # Test 3: Email with attachments (optional)
        self.stdout.write('\nTest 3: Sending email with attachment...')
        try:
            from django.core.mail import EmailMessage
            
            email_with_attachment = EmailMessage(
                subject=f"{subject} - Attachment Test",
                body="This email includes a test attachment.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email],
            )
            
            # Create a simple text file as attachment
            attachment_content = f"""
            Test Attachment
            ----------------
            This is a test attachment from Youth Impact Visualizer.
            
            Test Date: {self.get_timestamp()}
            Email Configuration: Working ✓
            """
            
            email_with_attachment.attach(
                'test_attachment.txt',
                attachment_content,
                'text/plain'
            )
            email_with_attachment.send()
            
            self.stdout.write(self.style.SUCCESS('   ✅ Email with attachment sent successfully!'))
            
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'   ⚠️ Attachment test failed (optional): {str(e)}'))
        
        # Summary
        self.stdout.write(self.style.SUCCESS('\n' + '='*50))
        self.stdout.write(self.style.SUCCESS('✅ EMAIL TEST COMPLETED'))
        self.stdout.write(self.style.SUCCESS('='*50))
        self.stdout.write(f'\nCheck your inbox at {email} for the test emails.')
        self.stdout.write(f'If you don\'t see them, check your spam folder.\n')
    
    def get_timestamp(self):
        from django.utils import timezone
        return timezone.now().strftime('%Y-%m-%d %H:%M:%S')
    
    def get_current_year(self):
        from django.utils import timezone
        return timezone.now().year