from django.db.models import Avg, FloatField
from django.http import Http404
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
from django.contrib.sessions.models import Session
from rest_framework import permissions, views, viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from elearning.models import Course, User, Topic, StudyItem
from elearning.serializers import CourseSerializer, TopicSerializer, CourseShortSerializer, UserSerializer, \
    LessonSerializer


class InstanceNotFoundError(BaseException):
    pass


class CourseView(viewsets.ModelViewSet):
    """
    API endpoint that allows courses to be viewed or edited.
    """
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.AllowAny]

    def get_object(self, id):
        try:
            return Course.objects.get(id=id)
        except Course.DoesNotExist:
            raise Http404

    def retrieve(self, request, pk, format=None):
        course = self.get_object(pk)
        serializer = self.serializer_class(course)
        return Response(serializer.data)

    def list(self, request, format=None):
        courses = (self.queryset
        .filter(is_active=True)
        .prefetch_related("feedback")
        .annotate(
            average_rating=Avg('feedback__rating',
                output_field=FloatField(),
            )
        )
        )
        serializer = CourseShortSerializer(courses, many=True)
        return Response(serializer.data)

    @csrf_exempt
    def create(self, request):
        try:
            serializer = CourseSerializer(data=request.data)
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


    def destroy(self, request, pk=None):
        course = self.get_object(pk)
        course.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudentView(viewsets.ModelViewSet):
    """
    API endpoint that allows students to be viewed.
    """
    queryset = User.objects.filter(role="student").all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]


class TeacherView(viewsets.ModelViewSet):
    """
    API endpoint that allows teacher to be viewed.
    """
    queryset = User.objects.filter(role="teacher").all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]


class TopicView(viewsets.ModelViewSet):
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer
    permission_classes = [permissions.AllowAny]

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




