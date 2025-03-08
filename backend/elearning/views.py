import uuid

from rest_framework.authentication import SessionAuthentication
from rest_framework.generics import GenericAPIView
from rest_framework.status import  HTTP_201_CREATED
from dj_rest_auth.views import LogoutView
from django.db.models import Avg, FloatField, Count, IntegerField, Q, Prefetch, Case, When, F, UUIDField
from django.http import HttpResponse
from rest_framework import permissions, status, generics
from rest_framework.response import Response
import datetime
from dateutil import relativedelta
from django.utils import timezone
import tempfile, zipfile
from wsgiref.util import FileWrapper

from notifications.models import Notification
from rest_framework.views import APIView

from .permissions import IsStudent, IsTeacher, IsEnrolled, \
    TeacherWriter, OwnerOrEnrolled, UpdateDeleteIfOwner, IsOwner, HasAccess
from .models import Course, User, Topic, Lesson, Feedback, CourseEnrollment, \
    Tag
from .serializers import CourseSerializer, TopicSerializer, CourseShortSerializer, \
    StudentSerializer, TeacherSerializer, StudentFeedbackSerializer, CourseFeedbackSerializer, \
    CourseCreateFeedback, \
    TodoListSerializer, CourseWithProgressSerializer, CreateProgressSerializer, UserPhotoSerializer, TagSerializer, \
    CourseCreateSerializer, \
    CourseRetireveUpdateSerializer, LessonEditFilesSerializer, LessonWithFilesCheckSerializer, \
    CourseOwnerSerializer, CourseTitleSerializer, \
    UserAuthSerializer, PrefetchEnrollmentSerializer, CourseBasicSerializer, \
    LessonBasicSerializer, TeacherSettingsSerializer, StudentSettingsSerializer, \
    EnrollmentCreateSerializer, EnrollmentUpdateSerializer, CoursePhotoSerializer


class CourseListCreateView(generics.ListCreateAPIView):
    """
        List all courses and creates new one
    """
    queryset = (Course.objects
                .filter(is_active=True)
                .prefetch_related("registered_students")
                .prefetch_related("registered_students__feedback")
                .annotate(average_rating=Avg('registered_students__feedback__rating', default=0, output_field=FloatField()))
                .annotate(n_students=Count('registered_students__feedback__id', output_field=IntegerField(), distinct=True))
                )
    serializer_class = CourseShortSerializer
    permission_classes = [permissions.IsAuthenticated, TeacherWriter]

    def get_queryset(self):
        return self.queryset.exclude(registered_students__user=self.request.user)

    def get_serializer_class(self):
        if self.request and self.request.method == "POST":
            self.serializer_class = CourseCreateSerializer
        return self.serializer_class


class CourseSearch(generics.ListAPIView):
    queryset = (Course.objects
                .filter(is_active=True)
                .prefetch_related("registered_students")
                .prefetch_related("registered_students__feedback")
                .annotate(
        average_rating=Avg('registered_students__feedback__rating', default=0, output_field=FloatField()))
                .annotate(
        n_students=Count('registered_students__feedback__id', output_field=IntegerField(), distinct=True))
                )
    serializer_class = CourseShortSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudent]
    """
        Search courses by title and/or tag
    """
    def get_queryset(self):
        queryset = super().get_queryset()
        query = self.request.GET.get('query')
        tag = self.request.GET.get('tag')
        query_exists = query is not None and query != ""
        tag_exists = tag is not None and tag != ""
        if tag_exists:
            tag = tag.lower().strip()
        if query_exists:
            query = query.lower().strip().split(" ")
            query = r'({})'.format('|'.join(query))
        if query_exists and tag_exists:
            return (queryset
                    .prefetch_related("tags")
                    .filter(Q(title__iregex=query) & Q(tags__name__iexact=tag)))
        if query_exists:
            return queryset.filter(title__iregex=query)

        if tag_exists:
            return queryset.prefetch_related("tags").filter(tags__name__iexact=tag)
        return queryset

class CourseDetail(generics.RetrieveDestroyAPIView):
    """
        Returns course details with statistics: average rating and number of students rated the course
    """
    queryset = (Course.objects
                .prefetch_related("registered_students", 'registered_students__feedback')
                .annotate(
        average_rating=Avg('registered_students__feedback__rating', default=0, output_field=FloatField()))
                .annotate(
        n_students=Count('registered_students__feedback__id', output_field=IntegerField(), distinct=True))
    )
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated, UpdateDeleteIfOwner]

    def get_serializer_context(self):
        context = super().get_serializer_context()

        if self.request and self.request.user.is_student():
            enrolled = CourseEnrollment.objects.filter(user=self.request.user, course__id=self.kwargs['pk'])
            context["enrolled"] = enrolled.exists()
        return context

class CourseEditView(generics.RetrieveUpdateAPIView):
    """
        Retrieve and update course details to edit
    """
    queryset = Course.objects.prefetch_related("tags").all()
    serializer_class = CourseRetireveUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]


class CourseStudyDetail(generics.RetrieveAPIView):
    """
        Retrieve course details. If student requests page, also returns indicator
        if the lesson is done
    """
    queryset = (Course.objects
                .prefetch_related("registered_students__feedback")
                .annotate(
        average_rating=Avg('registered_students__feedback__rating', default=0, output_field=FloatField()))
                .annotate(
        n_students=Count('registered_students__feedback__id', output_field=IntegerField(), distinct=True))
                )
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated,  HasAccess, OwnerOrEnrolled]


class CoursePhotoView(generics.RetrieveUpdateAPIView):
    """
        Retrieve course photo
    """
    queryset = Course.objects.all()
    serializer_class = CoursePhotoSerializer
    permission_classes = [permissions.IsAuthenticated]


class NewCourseIdView(GenericAPIView):
    """
        Returns new UUID for course. It's called before course creation
    """
    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def get(self, request, format=None):
        return Response(uuid.uuid4(), status=HTTP_201_CREATED)


class EnrolledStudentsView(generics.ListAPIView):
    """
        Lists all enrolled students in a course
    """
    queryset = CourseEnrollment.objects.filter(status__in=["started", "blocked", "removed"])
    serializer_class = PrefetchEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacher, IsOwner]

    def get_queryset(self):
        course_id = self.request.GET.get("course_id")
        if course_id is not None:
            return self.queryset.filter(course__id=course_id)
        return self.queryset.all()

class EnrollmentCreateView(generics.ListCreateAPIView):
    """
        Creates new enrollment
    """
    serializer_class = EnrollmentCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudent]


class TodoListView(generics.ListAPIView):
    """
        List all todo tasks for the given week
    """
    queryset = (Lesson.objects
                 .select_related("topic")
                 .select_related("course")
                 .prefetch_related("students"))
    serializer_class = TodoListSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def _get_query_param(self, query_name):
        query = self.request.GET.get(query_name)
        return int(query) if query is not None else None


    def _get_dates(self):
        week = self._get_query_param('week')
        month = self._get_query_param("month")
        year = self._get_query_param("year")
        now = timezone.now()
        if week is not None:
            first_date = datetime.date.fromisocalendar(year, week, 1)
            last_date = datetime.date.fromisocalendar(year, week, 7)
            return first_date, last_date
        first_date = datetime.datetime(year, month, 1, tzinfo=now.tzinfo)
        last_date = first_date + relativedelta.relativedelta(months=1)
        return first_date, last_date

    def get_queryset(self):
        first_date, last_date = self._get_dates()
        done = (CourseEnrollment.objects
                .prefetch_related("done_lessons")
                .filter(user=self.request.user, done_lessons__id__isnull=False)
                .values_list("done_lessons__id")
                .distinct())
        queryset = (self.queryset
                    .filter(course__registered_students__user=self.request.user)
                    .filter(course__title="Introduction to Python")
                    .filter(deadline__range=(first_date, last_date))
                    .filter(course__registered_students__status__exact="started")
                    .exclude(id__in=done)
                    .distinct()
                )
        return queryset.values(
            "id", "course_id", "topic__course__title",
                        "topic__id", "topic__title",
                        "title", "deadline")


class TopicView(generics.RetrieveUpdateDestroyAPIView):
    """
        Retieves or destroyes topic
    """
    queryset = Topic.objects.prefetch_related("course").all()
    serializer_class = TopicSerializer
    permission_classes = [permissions.IsAuthenticated, OwnerOrEnrolled]

    def _get_lessons(self, topic):
        lessons = (Lesson.objects
                   .prefetch_related("students")
                   .filter(topic=topic)
                   .all())
        lesson_serializer = LessonBasicSerializer(lessons, many=True)
        return lesson_serializer.data

    def retrieve(self, request, *args, **kwargs):
        topic = self.get_object()
        topic_serializer = self.serializer_class(topic)
        response = topic_serializer.data
        response["lessons"] = self._get_lessons(topic)
        return Response(response, status=status.HTTP_200_OK)

class LessonRetrieveDestroyUpdateView(generics.RetrieveUpdateDestroyAPIView):
    """
        Retrieves, destroys lesson. Updates lesson's content (html field)
    """
    queryset = (Lesson.objects.prefetch_related("topic")
                .prefetch_related("topic__course")
                .prefetch_related("students").all())
    serializer_class = LessonWithFilesCheckSerializer
    permission_classes = [permissions.IsAuthenticated, OwnerOrEnrolled]


class LessonFilesRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    """
        Retrieves or updates lesson's files
    """
    queryset = Lesson.objects.prefetch_related("files").all()
    serializer_class = LessonEditFilesSerializer
    permission_classes = [permissions.IsAuthenticated, OwnerOrEnrolled]

    def retrieve(self, request, *args, **kwargs):
        lesson = self.get_object()
        temp = tempfile.TemporaryFile()
        archive = zipfile.ZipFile(temp, 'w', zipfile.ZIP_DEFLATED)
        for file in lesson.files.all():
            filename = file.file.path
            archive.write(filename, file.filename())
        archive.close()
        temp.seek(0)
        wrapper = FileWrapper(temp)
        response = HttpResponse(wrapper, content_type='application/zip')
        response['Content-Disposition'] = 'attachment; filename=test.zip'
        return response


class CourseProgressUpdateView(generics.UpdateAPIView):
    """
       Updates course progress
    """
    queryset = Lesson.objects.all()
    serializer_class = CreateProgressSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudent, IsEnrolled]

class FeedbackListCreateView(generics.ListCreateAPIView):
    """
        Lists all feedbacks and creates a new one
    """
    queryset = (CourseEnrollment
                .objects
                .prefetch_related("feedback")
                .filter(status="finished")
                .order_by('-feedback__created'))
    serializer_class = CourseFeedbackSerializer
    permission_classes = [permissions.IsAuthenticated] # checks if user finished the course in serializer

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request and self.request.method == "POST":
            return CourseCreateFeedback
        return self.serializer_class


class FeedbackUpdateView(generics.UpdateAPIView):
    """
        Updates feedback
    """
    queryset = Feedback.objects.all()
    serializer_class = StudentFeedbackSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudent, IsOwner]

class CourseTitlesView(generics.ListAPIView):
    """
       Lists all teacher's course titles
    """
    queryset = Course.objects.all()
    serializer_class = CourseTitleSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def get_queryset(self):
        return self.queryset.filter(teacher=self.request.user)

class UserRetrieveView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request and self.request.user.is_student():
            return StudentSerializer
        return TeacherSerializer

    def _get_notifications(self):
        return Notification.objects.filter(recipient=self.request.user).count()

    def _get_course_queryset(self):
        return Course.objects.prefetch_related("registered_students")

    def _get_student_courses(self, user, is_owner):
        queryset = (self._get_course_queryset()
                .prefetch_related("topics")
                .prefetch_related("topics__lessons")
                .distinct()
                .annotate(overall=Count('topics__lessons',output_field=IntegerField(),distinct=True)))
        if is_owner:
            return (queryset
                    .filter(registered_students__user=user, is_active=True)
                    .all())
        return (queryset
                    .filter(registered_students__status="started", registered_students__user=user, is_active=True)
                    .all())


    def _get_teacher_courses(self, user):
        return (self._get_course_queryset()
                .prefetch_related("registered_students__feedback")
                .filter(teacher=user)
                .annotate(average_rating=Avg('registered_students__feedback__rating',default=0,output_field=FloatField()))
                .annotate(n_students=Count('registered_students__feedback__id',output_field=IntegerField(), distinct=True))
                .all()
                )

    def _get_courses_info(self, user, is_owner):
        if user.is_student():
            courses = self._get_student_courses(user, is_owner=is_owner)
            if not is_owner:
                return CourseBasicSerializer(courses, many=True).data
            done = (CourseEnrollment.objects
                    .select_related("done_lessons")
                    .filter(user=self.request.user)
                    .annotate(done=Count('done_lessons__id',
                                         distinct=True,
                                         output_field=IntegerField(),
                                         ))
                        .values_list("course__id", 'user__id', "created", "done")
                        .all()
                        )
            courses_serializer = CourseWithProgressSerializer(courses,
                                                              many=True,
                                                              context={"done": done})
            data = sorted(courses_serializer.data, key=lambda x: x["status"], reverse=True)
            return data
        courses = self._get_teacher_courses(user)
        courses_serializer = CourseOwnerSerializer(courses, many=True)
        return courses_serializer.data

    def _get_todo_for(self, month, year, tzinfo):
        first_date = datetime.datetime(year, month, 1, tzinfo=tzinfo)
        last_date = first_date + relativedelta.relativedelta(months=1)
        todo = (Lesson.objects
                .select_related("topic")
                .select_related("topic__course")
                .prefetch_related("students")
                .filter(students__user=self.request.user)
                .annotate(n_done=Count("students__id", distinct=True))
                .filter(deadline__range=(first_date, last_date),
                        n_done=0,
                        topic__course__registered_students__user=self.request.user,
                        topic__course__registered_students__status__exact="started")
                .values("id", "course_id", "topic__course__title",
                        "topic__id", "topic__title",
                        "title", "deadline"))
        serializer = TodoListSerializer(todo, many=True)
        return serializer.data

    def retrieve(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer_class()
        serializer = serializer(user)
        response = serializer.data
        is_owner = user == request.user
        if is_owner:
            response["n_notifications"] = self._get_notifications()
            if user.is_student():
                now = timezone.now()
                response["todo"] = self._get_todo_for(now.month, now.year, now.tzinfo)
        response["courses"] = self._get_courses_info(user=user, is_owner=is_owner)
        return Response(response)


class SettingsRetrieveUpdateSerializer(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = TeacherSettingsSerializer
    permission_classes = [permissions.IsAuthenticated, UpdateDeleteIfOwner]

    def get_serializer_class(self):
        if self.request and self.request.user.is_student():
            return StudentSettingsSerializer
        return self.serializer_class

class UserPhotoRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    """
        Retrieve and update user's photo
    """
    queryset = User.objects.all()
    serializer_class = UserPhotoSerializer
    permission_classes = [permissions.IsAuthenticated, UpdateDeleteIfOwner]

class TagsView(generics.ListAPIView):
    """
        Lists all tags
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]

class TeacherRetrieveView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = TeacherSerializer
    permission_classes = [permissions.IsAuthenticated]

class UserSearchListView(generics.ListAPIView):
    queryset = (User.objects
                .prefetch_related("groups")
                .filter(groups__name__in=['student', 'teacher'])
                .all())
    serializer_class = UserAuthSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def get_queryset(self):
        query = self.request.GET.get('query')
        status = self.request.GET.get('status')
        role = self.request.GET.get('role')
        course_id = self.request.GET.get("course_id")
        query_exists = query is not None and query != ""
        role_exists = role is not None and role != "" and role != "null"
        status_exists = status is not None and status != "" and status != "null"
        course_exists = course_id is not None and course_id != "" and course_id != "null"
        queryset = self.queryset.exclude(id=self.request.user.id)
        if query_exists:
            query_list = query.lower().strip().split(" ")
            query_regex = r'({})'.format('|'.join(query_list))
            queryset = queryset.filter(Q(first_name__iregex=query_regex) | Q(last_name__iregex=query_regex))
        if role_exists:
            role = role.lower().strip()
            queryset = queryset.prefetch_related("groups").filter(groups__name__iregex=role)
        if status_exists:
            status_list = [stat.lower() for stat in status.strip().split(",")]
            status_regex = r'({})'.format('|'.join(status_list))
            queryset = (queryset
                        .prefetch_related('enrollment')
                        .filter(enrollment__status__iregex=status_regex, enrollment__course__teacher=self.request.user))
        if course_exists:
            queryset = (queryset.prefetch_related('enrollment')
                        .filter(enrollment__course__id=course_id, enrollment__course__teacher=self.request.user))
        return queryset.distinct()

class UserAvatarRetrieveView(generics.RetrieveAPIView):

    queryset = User.objects.all()
    serializer_class = UserPhotoSerializer
    permission_classes = [permissions.IsAuthenticated]


class EnrollmentStatusUpdateView(generics.UpdateAPIView):

    queryset = CourseEnrollment.objects.all()
    serializer_class = EnrollmentUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

class CustomLogoutView(LogoutView):
    """
        Custom logout view. Sets user offline
    """

    def logout(self, request):
        user = request.user
        response = super().logout(request)
        if response.status_code == 200:
            user.is_online = False
            user.save()
        return response


