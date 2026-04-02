# apps/schools/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import School, Student
from .serializers import (
    SchoolSerializer, SchoolListSerializer,
    StudentSerializer, StudentListSerializer
)


class SchoolViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = School.objects.all()

    def get_serializer_class(self):
        if self.action == 'list':
            return SchoolListSerializer
        return SchoolSerializer

    def get_queryset(self):
        queryset = School.objects.all()
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset

    @action(detail=True, methods=['get', 'post'], url_path='students')
    def students(self, request, pk=None):
        school = self.get_object()

        if request.method == 'GET':
            students = school.students.all()
            serializer = StudentListSerializer(students, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            data = request.data.copy()
            data['school'] = school.id
            serializer = StudentSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='stats')
    def stats(self, request, pk=None):
        school = self.get_object()
        students = school.students.all()
        return Response({
            'total_students': students.count(),
            'active_students': students.filter(status='active').count(),
            'graduated_students': students.filter(status='graduated').count(),
            'dropped_out_students': students.filter(status='dropped_out').count(),
        })


class StudentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Student.objects.all()
    serializer_class = StudentSerializer

    def get_queryset(self):
        queryset = Student.objects.select_related('school').all()
        school = self.request.query_params.get('school')
        status_filter = self.request.query_params.get('status')
        if school:
            queryset = queryset.filter(school=school)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    @action(detail=True, methods=['post'], url_path='graduate')
    def graduate(self, request, pk=None):
        student = self.get_object()
        if student.status == 'graduated':
            return Response(
                {'error': 'Student is already graduated'},
                status=status.HTTP_400_BAD_REQUEST
            )
        student.status = 'graduated'
        student.graduated_at = timezone.now()
        student.save()
        return Response(StudentSerializer(student).data)

    @action(detail=True, methods=['post'], url_path='dropout')
    def dropout(self, request, pk=None):
        student = self.get_object()
        if student.status == 'dropped_out':
            return Response(
                {'error': 'Student has already dropped out'},
                status=status.HTTP_400_BAD_REQUEST
            )
        reason = request.data.get('reason', '')
        student.status = 'dropped_out'
        student.dropped_out_at = timezone.now()
        student.dropout_reason = reason
        student.save()
        return Response(StudentSerializer(student).data)

    @action(detail=True, methods=['patch'], url_path='marks')
    def update_marks(self, request, pk=None):
        student = self.get_object()
        midterm = request.data.get('midterm_marks')
        final = request.data.get('final_marks')
        if midterm is not None:
            student.midterm_marks = midterm
        if final is not None:
            student.final_marks = final
        student.save()
        return Response(StudentSerializer(student).data)