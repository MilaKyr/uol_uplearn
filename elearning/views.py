from django.db.models import Avg, FloatField
from django.http import Http404
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
from django.contrib.sessions.models import Session
from rest_framework import permissions, views, viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from elearning.models import Course, User, Topic, StudyItem, Feedback
from elearning.serializers import CourseSerializer, TopicSerializer, CourseShortSerializer, \
    LessonSerializer, StudentSerializer, TeacherSerializer, FeedbackSerializer, StudentFeedbackSerializer, \
    CourseCreateFeedback, LessonCreateSerializer, TopicCreateSerializer, LessonContentCreateSerializer, \
    LessonContentOrderSerializer, LessonOrderSerializer


class InstanceNotFoundError(BaseException):
    pass


class CourseView(viewsets.ModelViewSet):
    """
    API endpoint that allows courses to be viewed or edited.
    """
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.AllowAny]


    def list(self, request, format=None):
        courses = (self.queryset
        .filter(is_active=True)
        .prefetch_related("feedback")
        .annotate(
            average_rating=Avg('feedback__rating',
                               default=0,
                               output_field=FloatField(),
            )
        )
        )
        serializer = CourseShortSerializer(courses, many=True)
        return Response(serializer.data)

    @csrf_exempt
    def create(self, request):
        try:
            teacher_id = 1  # request.session.get('_auth_user_id')
            serializer = CourseSerializer(data=request.data,
                                                context={"teacher_id": teacher_id})
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        except (ValidationError, InstanceNotFoundError) as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)

    @csrf_exempt
    def update(self, request, pk=None):
        try:
            teacher_id = 1 #request.session.get('_auth_user_id')
            course = self.get_object(pk)
            serializer = self.serializer_class(instance=course,
                                               data=request.data,
                                          context={"teacher_id": teacher_id}, partial=True)

            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        except (ValidationError, InstanceNotFoundError) as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)



class StudentView(viewsets.ModelViewSet):
    """
    API endpoint that allows students to be viewed.
    """
    queryset = User.objects.filter(role="student").all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.AllowAny]


class TeacherView(viewsets.ModelViewSet):
    """
    API endpoint that allows teacher to be viewed.
    """
    queryset = User.objects.filter(role="teacher").all()
    serializer_class = TeacherSerializer
    permission_classes = [permissions.AllowAny]


class TopicView(viewsets.ModelViewSet):
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer
    permission_classes = [permissions.AllowAny]

    @csrf_exempt
    def create(self, request, format=None):
        try:
            serializer = TopicCreateSerializer(data=request.data)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        except (ValidationError, InstanceNotFoundError) as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)

    @csrf_exempt
    @action(detail=True, methods=["put"])
    def change_lesson_order(self, request, pk, format=None):
        try:
            topic = self.get_object()
            serializer = LessonOrderSerializer(instance=topic,
                                               context={"topic_id": topic.id},
                                               data=request.data)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        except (ValidationError, InstanceNotFoundError) as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)

class LessonView(viewsets.ModelViewSet):
    queryset = StudyItem.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=["get"])
    def by_topic(self, request, format=None):
        topic_id = request.GET.get('topic_id')
        if topic_id is not None:
            lessons = (StudyItem.objects
                       .filter(topic__id = topic_id)
                       .order_by('order'))
            serializer = self.serializer_class(lessons, many=True)
            return Response(serializer.data)
        return Response(status=status.HTTP_404_NOT_FOUND)

    @csrf_exempt
    def create(self, request, format=None):
        try:
            serializer = LessonCreateSerializer(data=request.data)

            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        except (ValidationError, InstanceNotFoundError) as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)

    @csrf_exempt
    @action(detail=True, methods=["post"])
    def add_content(self, request, format=None):
        try:
            serializer = LessonContentCreateSerializer(data=request.data)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        except (ValidationError, InstanceNotFoundError) as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)

    @csrf_exempt
    @action(detail=True, methods=["put"])
    def change_content_order(self, request, pk, format=None):
        try:
            lesson = self.get_object()
            serializer = LessonContentOrderSerializer(instance=lesson,
                                                      context={"lesson_id": lesson.id},
                                                      data=request.data)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        except (ValidationError, InstanceNotFoundError) as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)


class FeedbackView(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=["get"], serializer_class=FeedbackSerializer)
    def by_course(self, request, *args, **kwargs):
        course_id = request.GET.get('course_id')
        if course_id is not None:
            feedbacks = (self.queryset
                         .select_related('course')
                         .select_related('user')
                         .filter(course__id = course_id)
                         .order_by('-created'))
            serializer = self.serializer_class(feedbacks, many=True)
            return Response(serializer.data)
        return Response(status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=["get"], serializer_class=StudentFeedbackSerializer)
    def by_student(self, request, *args, **kwargs):
        student_id = request.GET.get('student_id')
        if student_id is not None:
            feedbacks = (self.queryset
                         .select_related('user')
                         .select_related('course')
                         .filter(user__id=student_id, user__role="student")
                         .order_by('-created'))
            serializer = StudentFeedbackSerializer(feedbacks, many=True)
            return Response(serializer.data)
        return Response(status=status.HTTP_404_NOT_FOUND)


    @csrf_exempt
    def create(self, request, format=None):
        try:
            student_id = 4 #request.session.get('_auth_user_id')
            serializer = CourseCreateFeedback(data=request.data,
                                               context={"student_id": student_id})

            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        except (ValidationError, InstanceNotFoundError) as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)

    @csrf_exempt
    def update(self, request, pk, format=None):
        try:
            feedback = self.get_object()
            serializer = self.serializer_class(instance=feedback,
                                               data=request.data,
                                               partial=True)

            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        except (ValidationError, InstanceNotFoundError) as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)




