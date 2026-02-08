# apps/attendance/face_recognition_service.py
"""
Face Recognition Service for Attendance
Uses face_recognition library for detecting and matching faces
"""
import face_recognition
import numpy as np
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.utils import timezone
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class FaceRecognitionService:
    """
    Service class for face recognition operations
    """
    
    # Recognition threshold (lower = stricter matching)
    RECOGNITION_THRESHOLD = getattr(settings, 'FACE_RECOGNITION_THRESHOLD', 0.6)
    
    # Maximum face size for processing (to prevent memory issues)
    MAX_IMAGE_SIZE = (1024, 1024)
    
    @staticmethod
    def extract_face_encoding(image_file):
        """
        Extract face encoding from an image file
        
        Args:
            image_file: Django UploadedFile or file path
            
        Returns:
            dict: {
                'encoding': list of floats (128-dimensional),
                'face_locations': list of face locations found,
                'success': bool,
                'error': str or None
            }
        """
        try:
            # Load image
            if isinstance(image_file, (InMemoryUploadedFile, str)):
                if isinstance(image_file, str):
                    image = face_recognition.load_image_file(image_file)
                else:
                    # Read uploaded file
                    image_data = image_file.read()
                    image = face_recognition.load_image_file(BytesIO(image_data))
                    image_file.seek(0)  # Reset file pointer
            else:
                return {
                    'encoding': None,
                    'face_locations': [],
                    'success': False,
                    'error': 'Invalid image file format'
                }
            
            # Resize if too large
            pil_image = Image.fromarray(image)
            if pil_image.size[0] > FaceRecognitionService.MAX_IMAGE_SIZE[0] or \
               pil_image.size[1] > FaceRecognitionService.MAX_IMAGE_SIZE[1]:
                pil_image.thumbnail(FaceRecognitionService.MAX_IMAGE_SIZE, Image.Resampling.LANCZOS)
                image = np.array(pil_image)
            
            # Detect faces
            face_locations = face_recognition.face_locations(image)
            
            if len(face_locations) == 0:
                return {
                    'encoding': None,
                    'face_locations': [],
                    'success': False,
                    'error': 'No face detected in image'
                }
            
            if len(face_locations) > 1:
                logger.warning(f"Multiple faces detected ({len(face_locations)}), using the first one")
            
            # Extract encoding for the first face
            face_encodings = face_recognition.face_encodings(image, face_locations)
            
            if len(face_encodings) == 0:
                return {
                    'encoding': None,
                    'face_locations': face_locations,
                    'success': False,
                    'error': 'Failed to encode face'
                }
            
            # Convert numpy array to list for JSON storage
            encoding = face_encodings[0].tolist()
            
            return {
                'encoding': encoding,
                'face_locations': face_locations,
                'success': True,
                'error': None
            }
            
        except Exception as e:
            logger.error(f"Error extracting face encoding: {str(e)}")
            return {
                'encoding': None,
                'face_locations': [],
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def compare_faces(known_encoding, unknown_image, tolerance=None):
        """
        Compare a known face encoding with a new image
        
        Args:
            known_encoding: List of floats (stored encoding)
            unknown_image: Image file to check
            tolerance: Recognition threshold (default: RECOGNITION_THRESHOLD)
            
        Returns:
            dict: {
                'match': bool,
                'confidence': float (0-1, higher = more confident),
                'distance': float (0-1, lower = better match),
                'face_found': bool,
                'error': str or None
            }
        """
        if tolerance is None:
            tolerance = FaceRecognitionService.RECOGNITION_THRESHOLD
        
        try:
            # Extract encoding from unknown image
            result = FaceRecognitionService.extract_face_encoding(unknown_image)
            
            if not result['success']:
                return {
                    'match': False,
                    'confidence': 0.0,
                    'distance': 1.0,
                    'face_found': False,
                    'error': result['error']
                }
            
            unknown_encoding = result['encoding']
            
            # Convert known encoding to numpy array
            known_encoding_np = np.array(known_encoding)
            unknown_encoding_np = np.array(unknown_encoding)
            
            # Calculate face distance
            face_distance = face_recognition.face_distance([known_encoding_np], unknown_encoding_np)[0]
            
            # Check if faces match
            matches = face_recognition.compare_faces(
                [known_encoding_np], 
                unknown_encoding_np, 
                tolerance=tolerance
            )
            
            is_match = matches[0]
            
            # Calculate confidence (inverse of distance, normalized)
            confidence = max(0.0, 1.0 - face_distance)
            
            return {
                'match': is_match,
                'confidence': round(float(confidence), 4),
                'distance': round(float(face_distance), 4),
                'face_found': True,
                'error': None
            }
            
        except Exception as e:
            logger.error(f"Error comparing faces: {str(e)}")
            return {
                'match': False,
                'confidence': 0.0,
                'distance': 1.0,
                'face_found': False,
                'error': str(e)
            }
    
    @staticmethod
    def verify_attendance(participant, attendance_image):
        """
        Verify participant identity for attendance using face recognition
        
        Args:
            participant: Participant model instance
            attendance_image: Uploaded image file
            
        Returns:
            dict: {
                'verified': bool,
                'confidence': float,
                'participant_id': str,
                'participant_name': str (if available),
                'error': str or None,
                'timestamp': datetime
            }
        """
        # Check if participant has face encoding
        if not participant.face_encoding:
            return {
                'verified': False,
                'confidence': 0.0,
                'participant_id': participant.participant_id,
                'error': 'No face encoding on file for this participant',
                'timestamp': timezone.now()
            }
        
        # Check if consent was given
        if not participant.photo_consent_given:
            return {
                'verified': False,
                'confidence': 0.0,
                'participant_id': participant.participant_id,
                'error': 'Photo consent not given for this participant',
                'timestamp': timezone.now()
            }
        
        # Compare faces
        result = FaceRecognitionService.compare_faces(
            participant.face_encoding,
            attendance_image
        )
        
        return {
            'verified': result['match'],
            'confidence': result['confidence'],
            'participant_id': participant.participant_id,
            'distance': result.get('distance', 1.0),
            'error': result.get('error'),
            'timestamp': timezone.now()
        }
    
    @staticmethod
    def identify_participant_from_image(image_file, program=None):
        """
        Identify which participant matches the uploaded image
        Searches through all participants (or program participants)
        
        Args:
            image_file: Uploaded image file
            program: Optional Program instance to limit search
            
        Returns:
            dict: {
                'identified': bool,
                'participant': Participant instance or None,
                'confidence': float,
                'matches': list of potential matches with confidence scores,
                'error': str or None
            }
        """
        from participants.models import Participant
        
        # Extract encoding from uploaded image
        encoding_result = FaceRecognitionService.extract_face_encoding(image_file)
        
        if not encoding_result['success']:
            return {
                'identified': False,
                'participant': None,
                'confidence': 0.0,
                'matches': [],
                'error': encoding_result['error']
            }
        
        unknown_encoding = np.array(encoding_result['encoding'])
        
        # Get participants to search
        if program:
            # Search only enrolled participants in this program
            participant_ids = program.enrollments.filter(
                status__in=['enrolled', 'active']
            ).values_list('participant_id', flat=True)
            participants = Participant.objects.filter(
                id__in=participant_ids,
                face_encoding__isnull=False,
                photo_consent_given=True
            )
        else:
            # Search all active participants with face encodings
            participants = Participant.objects.filter(
                is_active=True,
                face_encoding__isnull=False,
                photo_consent_given=True
            )
        
        if participants.count() == 0:
            return {
                'identified': False,
                'participant': None,
                'confidence': 0.0,
                'matches': [],
                'error': 'No participants with face encodings found'
            }
        
        # Compare with all participants
        matches = []
        
        for participant in participants:
            known_encoding = np.array(participant.face_encoding)
            
            # Calculate distance
            distance = face_recognition.face_distance([known_encoding], unknown_encoding)[0]
            confidence = max(0.0, 1.0 - distance)
            
            matches.append({
                'participant': participant,
                'participant_id': participant.participant_id,
                'confidence': round(float(confidence), 4),
                'distance': round(float(distance), 4)
            })
        
        # Sort by confidence (highest first)
        matches.sort(key=lambda x: x['confidence'], reverse=True)
        
        # Get best match
        best_match = matches[0] if matches else None
        
        # Check if best match exceeds threshold
        if best_match and best_match['distance'] < FaceRecognitionService.RECOGNITION_THRESHOLD:
            return {
                'identified': True,
                'participant': best_match['participant'],
                'confidence': best_match['confidence'],
                'matches': matches[:5],  # Top 5 matches
                'error': None
            }
        else:
            return {
                'identified': False,
                'participant': None,
                'confidence': best_match['confidence'] if best_match else 0.0,
                'matches': matches[:5],  # Show top matches even if below threshold
                'error': 'No confident match found'
            }
    
    @staticmethod
    def update_participant_encoding(participant, new_photo):
        """
        Update participant's face encoding from a new photo
        
        Args:
            participant: Participant instance
            new_photo: New photo file
            
        Returns:
            dict: {
                'success': bool,
                'encoding_updated': bool,
                'error': str or None
            }
        """
        # Check consent
        if not participant.photo_consent_given:
            return {
                'success': False,
                'encoding_updated': False,
                'error': 'Photo consent required before updating face encoding'
            }
        
        # Extract encoding
        result = FaceRecognitionService.extract_face_encoding(new_photo)
        
        if result['success']:
            participant.face_encoding = result['encoding']
            participant.face_encoding_date = timezone.now()
            participant.save(update_fields=['face_encoding', 'face_encoding_date'])
            
            logger.info(f"Updated face encoding for participant {participant.participant_id}")
            
            return {
                'success': True,
                'encoding_updated': True,
                'error': None
            }
        else:
            return {
                'success': False,
                'encoding_updated': False,
                'error': result['error']
            }
    
    @staticmethod
    def get_face_quality_score(image_file):
        """
        Assess the quality of a face photo for recognition
        
        Args:
            image_file: Image file to assess
            
        Returns:
            dict: {
                'quality_score': float (0-1),
                'face_found': bool,
                'face_size': tuple (width, height) or None,
                'recommendations': list of str,
                'suitable': bool
            }
        """
        try:
            # Load image
            if isinstance(image_file, str):
                image = face_recognition.load_image_file(image_file)
            else:
                image_data = image_file.read()
                image = face_recognition.load_image_file(BytesIO(image_data))
                image_file.seek(0)
            
            # Detect faces
            face_locations = face_recognition.face_locations(image)
            
            if len(face_locations) == 0:
                return {
                    'quality_score': 0.0,
                    'face_found': False,
                    'face_size': None,
                    'recommendations': ['No face detected. Ensure face is clearly visible.'],
                    'suitable': False
                }
            
            recommendations = []
            quality_score = 1.0
            
            # Check number of faces
            if len(face_locations) > 1:
                recommendations.append(f'Multiple faces detected ({len(face_locations)}). Use a photo with only one person.')
                quality_score -= 0.3
            
            # Check face size
            face_loc = face_locations[0]
            top, right, bottom, left = face_loc
            face_width = right - left
            face_height = bottom - top
            image_height, image_width = image.shape[:2]
            
            face_area = face_width * face_height
            image_area = image_width * image_height
            face_ratio = face_area / image_area
            
            if face_ratio < 0.1:
                recommendations.append('Face is too small in the image. Move closer to camera.')
                quality_score -= 0.4
            elif face_ratio < 0.2:
                recommendations.append('Face could be larger in the image.')
                quality_score -= 0.2
            
            # Check if face is too close
            if face_ratio > 0.8:
                recommendations.append('Face is too close. Move slightly away from camera.')
                quality_score -= 0.3
            
            # Image quality
            if image_width < 640 or image_height < 480:
                recommendations.append('Image resolution is low. Use a better camera if possible.')
                quality_score -= 0.2
            
            # Overall assessment
            suitable = quality_score >= 0.5 and len(face_locations) == 1
            
            if suitable and not recommendations:
                recommendations.append('Photo quality is good for face recognition.')
            
            return {
                'quality_score': round(max(0.0, quality_score), 2),
                'face_found': True,
                'face_size': (face_width, face_height),
                'face_coverage': round(face_ratio, 2),
                'recommendations': recommendations,
                'suitable': suitable
            }
            
        except Exception as e:
            return {
                'quality_score': 0.0,
                'face_found': False,
                'face_size': None,
                'recommendations': [f'Error processing image: {str(e)}'],
                'suitable': False
            }