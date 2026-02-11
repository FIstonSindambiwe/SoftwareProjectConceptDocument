# apps/attendance/face_recognition_service.py
"""
Face Recognition Service for Attendance System

This service handles:
- Face encoding generation from photos
- Face verification (1:1 matching)
- Face identification (1:N matching)
- Photo quality assessment

Uses the face_recognition library built on dlib
"""

import logging
from typing import Dict, List, Optional, Tuple, Any, Union
from django.core.files.uploadedfile import UploadedFile
from django.utils import timezone

logger = logging.getLogger(__name__)

# Check if face_recognition is available
try:
    import face_recognition
    import numpy as np
    from PIL import Image
    import io
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    logger.warning("face_recognition library not installed. Face recognition features will be disabled.")


class FaceRecognitionService:
    """
    Service for handling face recognition operations
    """
    
    # Configuration
    RECOGNITION_THRESHOLD = 0.6  # Lower = more strict (0.6 is recommended)
    QUALITY_THRESHOLD = 0.5  # Minimum quality score for usable photos
    MAX_FACE_DISTANCE = 0.6  # Maximum distance for positive match
    
    @staticmethod
    def is_available() -> bool:
        """Check if face recognition is available"""
        return FACE_RECOGNITION_AVAILABLE
    
    @staticmethod
    def _load_image_file(image_source: Union[str, UploadedFile]) -> Optional[np.ndarray]:
        """
        Load image from file path or uploaded file
        
        Args:
            image_source: File path (str) or UploadedFile object
            
        Returns:
            numpy array of image or None if error
        """
        if not FACE_RECOGNITION_AVAILABLE:
            return None
            
        try:
            if isinstance(image_source, str):
                # File path
                return face_recognition.load_image_file(image_source)
            else:
                # UploadedFile object
                image = Image.open(image_source)
                # Convert to RGB if needed
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                return np.array(image)
        except Exception as e:
            logger.error(f"Error loading image: {str(e)}")
            return None
    
    @staticmethod
    def generate_face_encoding(image_source: Union[str, UploadedFile]) -> Dict[str, Any]:
        """
        Generate face encoding from an image
        
        Args:
            image_source: File path (str) or UploadedFile object
            
        Returns:
            dict with 'success', 'encoding', 'error' keys
        """
        if not FACE_RECOGNITION_AVAILABLE:
            return {
                'success': False,
                'encoding': None,
                'error': 'Face recognition not yet implemented. Please install face_recognition package: pip install face-recognition'
            }
        
        try:
            # Load image
            image = FaceRecognitionService._load_image_file(image_source)
            if image is None:
                return {
                    'success': False,
                    'encoding': None,
                    'error': 'Could not load image file'
                }
            
            # Find faces in image
            face_locations = face_recognition.face_locations(image)
            
            if len(face_locations) == 0:
                return {
                    'success': False,
                    'encoding': None,
                    'error': 'No face detected in image. Please ensure face is clearly visible.'
                }
            
            if len(face_locations) > 1:
                return {
                    'success': False,
                    'encoding': None,
                    'error': f'Multiple faces detected ({len(face_locations)}). Please provide image with single face.'
                }
            
            # Generate encoding
            face_encodings = face_recognition.face_encodings(image, face_locations)
            
            if len(face_encodings) == 0:
                return {
                    'success': False,
                    'encoding': None,
                    'error': 'Could not generate face encoding. Face may be too blurry or poorly lit.'
                }
            
            # Convert numpy array to list for JSON storage
            encoding_list = face_encodings[0].tolist()
            
            return {
                'success': True,
                'encoding': encoding_list,
                'error': None
            }
            
        except Exception as e:
            logger.error(f"Error generating face encoding: {str(e)}")
            return {
                'success': False,
                'encoding': None,
                'error': f'Error processing image: {str(e)}'
            }
    
    @staticmethod
    def verify_participant_face(participant: Any, image_source: Union[str, UploadedFile]) -> Dict[str, Any]:
        """
        Verify if image matches participant's stored face encoding (1:1 verification)
        
        Args:
            participant: Participant model instance
            image_source: File path or UploadedFile
            
        Returns:
            dict with 'verified', 'confidence', 'error' keys
        """
        if not FACE_RECOGNITION_AVAILABLE:
            return {
                'verified': False,
                'confidence': 0.0,
                'error': 'Face recognition not yet implemented. Please install face_recognition package.'
            }
        
        # Check if participant has face encoding
        if not participant.face_encoding:
            return {
                'verified': False,
                'confidence': 0.0,
                'error': f'Participant {participant.participant_id} has no face encoding on file'
            }
        
        if not participant.photo_consent_given:
            return {
                'verified': False,
                'confidence': 0.0,
                'error': 'Photo consent not given for this participant'
            }
        
        try:
            # Generate encoding from provided image
            encoding_result = FaceRecognitionService.generate_face_encoding(image_source)
            
            if not encoding_result['success']:
                return {
                    'verified': False,
                    'confidence': 0.0,
                    'error': encoding_result['error']
                }
            
            # Compare encodings
            stored_encoding = np.array(participant.face_encoding)
            new_encoding = np.array(encoding_result['encoding'])
            
            # Calculate face distance (lower = more similar)
            face_distance = face_recognition.face_distance([stored_encoding], new_encoding)[0]
            
            # Convert distance to confidence score (0-100)
            confidence = max(0, min(100, (1 - face_distance) * 100))
            
            # Verify if match
            verified = face_distance <= FaceRecognitionService.RECOGNITION_THRESHOLD
            
            return {
                'verified': verified,
                'confidence': round(confidence, 2),
                'error': None
            }
            
        except Exception as e:
            logger.error(f"Error verifying face: {str(e)}")
            return {
                'verified': False,
                'confidence': 0.0,
                'error': f'Error during verification: {str(e)}'
            }
    
    @staticmethod
    def identify_participant_from_image(image_source: Union[str, UploadedFile], program: Optional[Any] = None) -> Dict[str, Any]:
        """
        Identify participant from image by comparing against all stored encodings (1:N identification)
        
        Args:
            image_source: File path or UploadedFile
            program: Optional Program instance to limit search to enrolled participants
            
        Returns:
            dict with 'identified', 'participant', 'confidence', 'error', 'matches' keys
        """
        if not FACE_RECOGNITION_AVAILABLE:
            return {
                'identified': False,
                'participant': None,
                'confidence': 0.0,
                'error': 'Face recognition not yet implemented. Please install face_recognition package: pip install face-recognition',
                'matches': []
            }
        
        try:
            from participants.models import Participant
            
            # Generate encoding from provided image
            encoding_result = FaceRecognitionService.generate_face_encoding(image_source)
            
            if not encoding_result['success']:
                return {
                    'identified': False,
                    'participant': None,
                    'confidence': 0.0,
                    'error': encoding_result['error'],
                    'matches': []
                }
            
            new_encoding = np.array(encoding_result['encoding'])
            
            # Get participants with face encodings and consent
            participants_query = Participant.objects.filter(
                face_encoding__isnull=False,
                photo_consent_given=True,
                is_active=True
            )
            
            # Filter by program if specified
            if program:
                participants_query = participants_query.filter(
                    enrollments__program=program,
                    enrollments__status__in=['enrolled', 'active']
                ).distinct()
            
            participants = list(participants_query)
            
            if not participants:
                return {
                    'identified': False,
                    'participant': None,
                    'confidence': 0.0,
                    'error': 'No participants with face encodings found' + (f' for program {program.name}' if program else ''),
                    'matches': []
                }
            
            # Compare against all participants
            matches: List[Dict[str, Any]] = []
            
            for participant in participants:
                try:
                    stored_encoding = np.array(participant.face_encoding)
                    face_distance = face_recognition.face_distance([stored_encoding], new_encoding)[0]
                    confidence = max(0, min(100, (1 - face_distance) * 100))
                    
                    matches.append({
                        'participant': participant,
                        'participant_id': participant.participant_id,
                        'distance': float(face_distance),
                        'confidence': round(confidence, 2)
                    })
                except Exception as e:
                    logger.warning(f"Error comparing with participant {participant.participant_id}: {str(e)}")
                    continue
            
            # Sort by confidence (highest first)
            matches.sort(key=lambda x: x['confidence'], reverse=True)
            
            # Check if best match is above threshold
            if matches and matches[0]['distance'] <= FaceRecognitionService.RECOGNITION_THRESHOLD:
                best_match = matches[0]
                return {
                    'identified': True,
                    'participant': best_match['participant'],
                    'confidence': best_match['confidence'],
                    'error': None,
                    'matches': matches[:5]  # Return top 5 matches
                }
            else:
                return {
                    'identified': False,
                    'participant': None,
                    'confidence': matches[0]['confidence'] if matches else 0.0,
                    'error': None,
                    'matches': matches[:5]  # Return top 5 matches for review
                }
            
        except Exception as e:
            logger.error(f"Error identifying participant: {str(e)}")
            return {
                'identified': False,
                'participant': None,
                'confidence': 0.0,
                'error': f'Error during identification: {str(e)}',
                'matches': []
            }
    
    @staticmethod
    def get_face_quality_score(image_source: Union[str, UploadedFile]) -> Dict[str, Any]:
        """
        Assess photo quality for face recognition
        
        Args:
            image_source: File path or UploadedFile
            
        Returns:
            dict with 'quality_score', 'suitable', 'face_found', 'recommendations' keys
        """
        if not FACE_RECOGNITION_AVAILABLE:
            return {
                'quality_score': 0.0,
                'suitable': False,
                'face_found': False,
                'recommendations': ['Install face_recognition package to enable quality assessment']
            }
        
        try:
            # Load image
            image = FaceRecognitionService._load_image_file(image_source)
            if image is None:
                return {
                    'quality_score': 0.0,
                    'suitable': False,
                    'face_found': False,
                    'recommendations': ['Could not load image file']
                }
            
            recommendations: List[str] = []
            quality_score = 100.0
            
            # Check image size
            height, width = image.shape[:2]
            if width < 200 or height < 200:
                quality_score -= 30
                recommendations.append('Image resolution too low (minimum 200x200 pixels)')
            
            # Find faces
            face_locations = face_recognition.face_locations(image)
            
            if len(face_locations) == 0:
                return {
                    'quality_score': 0.0,
                    'suitable': False,
                    'face_found': False,
                    'recommendations': ['No face detected - ensure face is clearly visible and well-lit']
                }
            
            if len(face_locations) > 1:
                quality_score -= 40
                recommendations.append(f'Multiple faces detected ({len(face_locations)}) - only one face should be visible')
            
            # Analyze face location and size
            face_location = face_locations[0]
            top, right, bottom, left = face_location
            face_width = right - left
            face_height = bottom - top
            
            # Face should be at least 20% of image
            face_area_ratio = (face_width * face_height) / (width * height)
            if face_area_ratio < 0.2:
                quality_score -= 20
                recommendations.append('Face too small - move closer to camera')
            elif face_area_ratio > 0.8:
                quality_score -= 15
                recommendations.append('Face too close - move back from camera')
            
            # Check if face is centered
            face_center_x = (left + right) / 2
            face_center_y = (top + bottom) / 2
            image_center_x = width / 2
            image_center_y = height / 2
            
            x_offset = abs(face_center_x - image_center_x) / width
            y_offset = abs(face_center_y - image_center_y) / height
            
            if x_offset > 0.3 or y_offset > 0.3:
                quality_score -= 10
                recommendations.append('Face not centered - position face in center of frame')
            
            # Try to generate encoding (checks if face is clear enough)
            face_encodings = face_recognition.face_encodings(image, face_locations)
            if len(face_encodings) == 0:
                quality_score -= 30
                recommendations.append('Face too blurry or poorly lit - improve lighting and focus')
            
            # Overall assessment
            suitable = quality_score >= (FaceRecognitionService.QUALITY_THRESHOLD * 100)
            
            if not recommendations:
                recommendations.append('Photo quality is good')
            
            return {
                'quality_score': round(quality_score, 2),
                'suitable': suitable,
                'face_found': True,
                'recommendations': recommendations
            }
            
        except Exception as e:
            logger.error(f"Error assessing photo quality: {str(e)}")
            return {
                'quality_score': 0.0,
                'suitable': False,
                'face_found': False,
                'recommendations': [f'Error analyzing photo: {str(e)}']
            }
    
    @staticmethod
    def update_participant_encoding(participant: Any, image_source: Union[str, UploadedFile]) -> Dict[str, Any]:
        """
        Update participant's face encoding from a new photo
        
        Args:
            participant: Participant model instance
            image_source: File path or UploadedFile
            
        Returns:
            dict with 'success', 'error' keys
        """
        if not FACE_RECOGNITION_AVAILABLE:
            return {
                'success': False,
                'error': 'Face recognition not yet implemented. Please install face_recognition package.'
            }
        
        # Generate encoding
        encoding_result = FaceRecognitionService.generate_face_encoding(image_source)
        
        if not encoding_result['success']:
            return {
                'success': False,
                'error': encoding_result['error']
            }
        
        # Update participant
        try:
            participant.face_encoding = encoding_result['encoding']
            participant.face_encoding_date = timezone.now()
            participant.save(update_fields=['face_encoding', 'face_encoding_date'])
            
            logger.info(f"Updated face encoding for participant {participant.participant_id}")
            
            return {
                'success': True,
                'error': None
            }
            
        except Exception as e:
            logger.error(f"Error updating participant encoding: {str(e)}")
            return {
                'success': False,
                'error': f'Error saving encoding: {str(e)}'
            }

    @staticmethod
    def validate_encoding_format(encoding: Any) -> bool:
        """
        Validate that an encoding is in the correct format
        
        Args:
            encoding: Encoding to validate (list or numpy array)
            
        Returns:
            bool: True if encoding format is valid
        """
        if encoding is None:
            return False
        
        try:
            # Convert to numpy array if it's a list
            if isinstance(encoding, list):
                encoding_array = np.array(encoding)
            elif isinstance(encoding, np.ndarray):
                encoding_array = encoding
            else:
                return False
            
            # Check shape - should be 1D with 128 values (standard face_recognition encoding)
            if encoding_array.ndim != 1:
                return False
            
            # Standard face_recognition encoding has 128 values
            if encoding_array.shape[0] != 128:
                logger.warning(f"Encoding has unexpected shape: {encoding_array.shape}")
                # Still return True if it's non-empty, as encoding methods may vary
                return encoding_array.shape[0] > 0
            
            return True
        except Exception as e:
            logger.error(f"Error validating encoding format: {str(e)}")
            return False

    @staticmethod
    def batch_verify_participants(participants: List[Any], image_source: Union[str, UploadedFile]) -> Dict[str, Any]:
        """
        Verify image against multiple participants (bulk operation)
        
        Args:
            participants: List of Participant instances
            image_source: File path or UploadedFile
            
        Returns:
            dict with 'results', 'best_match', 'error' keys
        """
        if not FACE_RECOGNITION_AVAILABLE:
            return {
                'results': [],
                'best_match': None,
                'error': 'Face recognition not available'
            }
        
        try:
            # Generate encoding from image
            encoding_result = FaceRecognitionService.generate_face_encoding(image_source)
            if not encoding_result['success']:
                return {
                    'results': [],
                    'best_match': None,
                    'error': encoding_result['error']
                }
            
            new_encoding = np.array(encoding_result['encoding'])
            results = []
            
            for participant in participants:
                if not participant.face_encoding or not participant.photo_consent_given:
                    continue
                
                try:
                    stored_encoding = np.array(participant.face_encoding)
                    face_distance = face_recognition.face_distance([stored_encoding], new_encoding)[0]
                    confidence = max(0, min(100, (1 - face_distance) * 100))
                    verified = face_distance <= FaceRecognitionService.RECOGNITION_THRESHOLD
                    
                    results.append({
                        'participant': participant,
                        'participant_id': participant.participant_id,
                        'verified': verified,
                        'distance': float(face_distance),
                        'confidence': round(confidence, 2)
                    })
                except Exception as e:
                    logger.warning(f"Error verifying participant {participant.participant_id}: {str(e)}")
                    continue
            
            # Sort by confidence
            results.sort(key=lambda x: x['confidence'], reverse=True)
            
            return {
                'results': results,
                'best_match': results[0] if results else None,
                'error': None
            }
            
        except Exception as e:
            logger.error(f"Error in batch verification: {str(e)}")
            return {
                'results': [],
                'best_match': None,
                'error': f'Batch verification failed: {str(e)}'
            }