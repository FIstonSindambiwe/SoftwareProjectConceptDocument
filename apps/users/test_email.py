# apps/users/views.py - Add this view for testing

from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

@csrf_exempt
def test_email_view(request):
    """View to test email sending from browser"""
    if request.method == 'POST':
        try:
            recipient = request.POST.get('email', 'shemaroger60@gmail.com')
            
            send_mail(
                subject="Test Email from Youth Impact Visualizer",
                message="This is a test email. Your email configuration is working!",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                fail_silently=False,
            )
            
            return JsonResponse({
                'success': True,
                'message': f'Test email sent successfully to {recipient}'
            })
            
        except Exception as e:
            logger.error(f"Test email failed: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    return JsonResponse({'error': 'POST method required'}, status=405)