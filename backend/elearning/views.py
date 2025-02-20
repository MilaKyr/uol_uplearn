import base64
import copy

from dj_rest_auth.views import LogoutView
from django.db import transaction, connection
from django.db.models import Avg, FloatField, Count, IntegerField, Q, Prefetch
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework import permissions, viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from dj_rest_auth.registration.views import RegisterView
import datetime
from dateutil import relativedelta
from django.utils import timezone
import tempfile, zipfile
from wsgiref.util import FileWrapper

from chat.models import Message
from .permissions import UserCoursePermission, UserPermission, TopicPermission, \
    LessonPermission, FeedbackPermission
from .models import Course, User, Topic, Lesson, Feedback, CourseProgress, CourseEnrollment, \
    Tag, Notification
from .serializers import CourseSerializer, TopicSerializer, CourseShortSerializer, \
    LessonSerializer, StudentSerializer, TeacherSerializer, FeedbackSerializer, StudentFeedbackSerializer, \
    CourseCreateFeedback, LessonCreateSerializer, TopicCreateSerializer, LessonContentCreateSerializer, \
    CustomRegisterSerializer, CourseOwnerShortSerializer, \
    TodoListSerializer, CourseWithProgressShortSerializer, CreateProgressSerializer, PhotoSerializer, StatusSerializer, \
    NameSerializer, EmailSerializer, BioSerializer, TagSerializer, CourseCreateSerializer, CoursePhotoSerializer, \
    CourseEditSerializer, LessonEditContentSerializer, LessonFilesSerializer, CourseLessonSerializer, \
    NotificationSerializer, CourseShortTeacherSerializer, NotificationSeenSerializer, CourseTitleSerializer, \
    BasicUserSerializer, EnrolledUserSerializer, CourseBasicSerializer, EnrollmentBlockSerializer, \
    EnrollmentRemoveSerializer


class InstanceNotFoundError(BaseException):
    pass




class CourseView(viewsets.ModelViewSet):
    """
    API endpoint that allows courses to be viewed or edited.
    """
    queryset = Course.objects.prefetch_related('registered_students').all()
    serializer_class = CourseSerializer
    permission_classes = [UserCoursePermission]


    @action(detail=True, methods=["get"])
    def enrolled(self, request, pk, format=None):
        course = self.get_object()
        enrollments = (CourseEnrollment.objects
                       .filter(course=course, status__in=["started", "blocked", "removed"])
                       .all())
        serializer = EnrolledUserSerializer(enrollments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def search(self, request, format=None):
        query = request.GET.get("query")
        tag = request.GET.get("tag")
        query_exists = query is not None and query != ""
        tag_exists = tag is not None and tag != ""
        if query_exists and tag_exists:
            tag = tag.lower().strip()
            query_list = query.lower().strip().split(" ")
            query_regex = r'({})'.format('|'.join(query_list))
            courses = (self.queryset
            .filter(is_active=True, title__iregex=query_regex)
            .prefetch_related("tags")
            .filter(tags__name__iexact=tag)
            .prefetch_related("feedback")
            .prefetch_related("registered_students")
            .exclude(registered_students__user=request.user)
            .annotate(
                average_rating=Avg('feedback__rating',
                                   default=0,
                                   output_field=FloatField(),
                                   )
            )
            .annotate(
                n_students=Count('registered_students__id',
                                 output_field=IntegerField(),
                                 )
            )
            )
            serializer = CourseShortSerializer(courses, many=True)
            return Response(serializer.data)
        if query_exists:
            query_list = query.lower().strip().split(" ")
            query_regex = r'({})'.format('|'.join(query_list))
            courses = (self.queryset
            .filter(is_active=True, title__iregex=query_regex)
            .prefetch_related("feedback")
            .prefetch_related("registered_students")
            .exclude(registered_students__user=request.user)
            .annotate(
                average_rating=Avg('feedback__rating',
                                   default=0,
                                   output_field=FloatField(),
                                   )
            )
            .annotate(
                n_students=Count('registered_students__id',
                                 output_field=IntegerField(),
                                 )
            )
            )
            serializer = CourseShortSerializer(courses, many=True)
            return Response(serializer.data)
        if tag_exists:
            tag = tag.lower().strip()
            courses = (self.queryset
            .filter(is_active=True)
            .prefetch_related("tags")
            .filter(tags__name__iexact=tag)
            .prefetch_related("feedback")
            .prefetch_related("registered_students")
            .exclude(registered_students__user=request.user)
            .annotate(
                average_rating=Avg('feedback__rating',
                                   default=0,
                                   output_field=FloatField(),
                                   )
            )
            .annotate(
                n_students=Count('registered_students__id',
                                 output_field=IntegerField(),
                                 )
            )
            )
            serializer = CourseShortSerializer(courses, many=True)
            return Response(serializer.data)
        return Response(self._get_all_courses(request))


    @action(detail=True, methods=["put"])
    def update_photo(self, request, pk, format=None):
        try:
            course = self.get_object()
            serializer = CoursePhotoSerializer(instance=course,
                                         data=request.data,
                                         partial=True)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        except (ValidationError, InstanceNotFoundError) as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get"])
    def get_photo(self, request, pk, format=None):
        course = self.get_object()
        if course.photo:
            with open(course.photo.path, "rb") as f:
                return HttpResponse(f.read(), content_type="image/jpeg")
        return Response(status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=["get"])
    def new_course_id(self, request, format=None):
        with connection.cursor() as cursor:
            cursor.execute(" SELECT seq FROM SQLITE_SEQUENCE WHERE name='elearning_course'")
            result = cursor.fetchone()
            next_id = 1 if len(result) == 0 else result[0] + 1
            cursor.close()
        return Response(next_id)

    def retrieve(self, request, pk, format=None):
        # check if it's the course owner
        course = (self.queryset
                  .prefetch_related("feedback")
                  .prefetch_related("feedback__user")
                  .filter(id=pk)
                  .annotate(
            average_rating=Avg('feedback__rating',
                               default=0,
                               output_field=FloatField(),
                               )
        ).get())
        course_serializer = CourseSerializer(course)
        if request.user.role == "student":
            done = CourseProgress.objects.filter(enrolled_student__user__id=request.user.id,
                                                 ).values_list('item__id')
            done = [idn[0] for idn in done]
            response = copy.deepcopy(course_serializer.data)
            response["enrolled"] = CourseEnrollment.objects.filter(user=request.user, course__id=pk).exists()
            for topic in response["topics"]:
                for lesson in topic["lessons"]:
                    lesson["done"] = lesson["id"] in done
            return Response(response, status=status.HTTP_200_OK)
        return Response(course_serializer.data, status=status.HTTP_200_OK)

    def _get_all_courses(self, request):
        courses = (self.queryset
        .filter(is_active=True)
        .prefetch_related("feedback")
        .prefetch_related("registered_students")
        .exclude(registered_students__user=request.user)
        .annotate(
            average_rating=Avg('feedback__rating',
                               default=0,
                               output_field=FloatField(),
                               )
        )
        .annotate(
            n_students=Count('feedback__id',
                             output_field=IntegerField(),
                             )
        )
        )
        serializer = CourseShortSerializer(courses, many=True)
        return serializer.data

    def list(self, request, format=None):
        return Response(self._get_all_courses(request))

    def create(self, request):
        try:
            serializer = CourseCreateSerializer(data=request.data,
                                          context={"teacher": request.user})
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None):
        try:
            course = self.get_object()
            serializer = self.serializer_class(instance=course,
                                               data=request.data,
                                               context={"teacher": request.user},
                                               partial=True)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                with transaction.atomic():
                    students = (Course.objects.prefetch_selected("registered_students")
                    .filter(course = course).all())
                    for student in students:
                        Notification.objects.create(recipient=student, person=course.teacher, course=course,
                                                    text="updated material in course")
                return Response(status=status.HTTP_200_OK)
        except (ValidationError, InstanceNotFoundError) as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def enroll(self, request, pk, format=None):
        course = self.get_object()
        CourseEnrollment.objects.create(user=request.user, course=course, status="started")
        Notification.objects.create(recipient=course.teacher, person=request.user, course=course, text="enrolled in a course")
        return Response(status=status.HTTP_200_OK)


class CourseEditView(viewsets.ModelViewSet):
    queryset = Course.objects.prefetch_related("tags").all()
    serializer_class = CourseEditSerializer

    @action(detail=True, methods=["post"])
    def active(self, request, pk, format=None):
        try:
            course = self.get_object()
            course.is_active = not course.is_active
            course.save()
            return Response(status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)


class LessonEditView(viewsets.ModelViewSet):
    queryset = Lesson.objects.prefetch_related("files").all()
    serializer_class = LessonEditContentSerializer

    @action(detail=True, methods=["post"])
    def fill(self, request, pk, format=None):
        try:
            lesson = self.get_object()
            serializer = self.serializer_class(instance=lesson,
                                               data=request.data,
                                               partial=True)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        except (ValidationError, InstanceNotFoundError) as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def attach(self, request, pk, format=None):
        try:
            lesson = self.get_object()
            serializer = LessonFilesSerializer(instance=lesson,
                                               data=request.data,
                                               partial=True)
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
    permission_classes = [UserPermission]

    def _get_todo_for(self, user, month, year, tzinfo, week=None):
        if week is not None:
            first_date = datetime.date.fromisocalendar(year, week, 1)
            last_date = datetime.date.fromisocalendar(year, week, 7)
        else:
            first_date = datetime.datetime(year, month, 1, tzinfo=tzinfo)
            last_date = first_date + relativedelta.relativedelta(months=1)
        done = (CourseProgress.objects
                .select_related("enrolled_student")
                .filter(enrolled_student__user=user)
                .values_list("item")
                .all())

        todo = (Lesson.objects
                 .select_related("topic")
                 .select_related("topic__course")
                 .prefetch_related("topic__course__registered_students")
                 .filter(deadline__range=(first_date, last_date),
                         topic__course__registered_students__user=user)
                 .exclude(id__in=done)
                 .values("id", "course_id", "topic__course__title",
                         "topic__id", "topic__title",
                         "title", "deadline"))
        serializer = TodoListSerializer(todo, many=True)
        return serializer.data

    def _get_courses_info(self, request, student):
        # owner of the page
        if request.user == student:
            courses = (Course.objects
                       .prefetch_related("registered_students")
                       .prefetch_related("topics")
                       .prefetch_related("topics__study_lessons")
                       .filter(registered_students__user=student, is_active=True)
                       .annotate(
                overall=Count(
                    'topics__study_lessons',
                    output_field=IntegerField(),
                    )
            )
                       .all()
                       )
            # add progress information
            done = (CourseEnrollment.objects
                    .prefetch_related("progress")
                    .filter(user=student, status="started")
                    .annotate(done=Count('progress__item__id',
                                            distinct=True,
                                            output_field=IntegerField(),
                                            )
                                 )
                    .values_list("course__id", "created", "done")
                    .all()
                       )
            courses_serializer = CourseWithProgressShortSerializer(courses,
                                                                   many=True,
                                                                   context={"done": done})
            return courses_serializer.data
        courses = (Course.objects
                   .prefetch_related("registered_students")
                   .prefetch_related("feedback")
                   .filter(registered_students__user = student)
                   .annotate(
            average_rating=Avg('feedback__rating',
                               default=0,
                               output_field=FloatField(),
                               )
        )
                   .annotate(
            n_students=Count('registered_students__id',
                             output_field=IntegerField(),
                             )
        )
                   .all()
        )
        courses_serializer = CourseShortSerializer(courses, many=True)
        return courses_serializer.data

    @action(detail=True, methods=["get"])
    def todo_for(self, request, pk,  format=True):
        _ = self.get_object()
        week = request.GET.get("week")
        week = int(week) if week is not None else None
        month = int(request.GET.get("month"))
        year = int(request.GET.get("year"))
        now = timezone.now()
        todo = self._get_todo_for(request.user, month, year, now.tzinfo, week=week)
        return Response(todo, status=status.HTTP_200_OK)

    def retrieve(self, request, pk, format=None):
        student = self.get_object()
        serializer = StudentSerializer(student)
        response = serializer.data
        response["courses"] = self._get_courses_info(request, student)
        if request.user == student:
            now = timezone.now()
            response["todo"] = self._get_todo_for(student, now.month, now.year, now.tzinfo)
        return Response(response)



class TeacherView(viewsets.ModelViewSet):
    """
    API endpoint that allows teacher to be viewed.
    """
    queryset = (User.objects
                .prefetch_related("courses")
                .filter(role="teacher")
                .prefetch_related("courses__feedback")
                .prefetch_related("courses__registered_students")
                .annotate(
        average_rating=Avg('courses__feedback__rating',
                           default=0,
                           output_field=FloatField(),
                           )
    )
                .annotate(
        n_students=Count('courses__registered_students__id',
                         output_field=IntegerField(),
                         )
    )
                .all())
    serializer_class = TeacherSerializer
    permission_classes = [UserPermission]

    def _get_courses_info(self, request, course_owner):
        courses = (Course.objects
            .filter(teacher__id=course_owner.id)
            .prefetch_related("feedback")
            .prefetch_related("registered_students")
            .annotate(
                average_rating=Avg('feedback__rating',
                                   default=0,
                                   output_field=FloatField(),
                                   )
            ))
        if request.user == course_owner:
            courses_serializer = CourseOwnerShortSerializer(courses, many=True)
            return courses_serializer.data
        courses = (courses
        .filter(is_active=True)
        .annotate(
                n_students=Count('registered_students__id',
                                   output_field=IntegerField(),
                                   )
            ))
        courses_serializer = CourseShortSerializer(courses, many=True)
        return courses_serializer.data

    def retrieve(self, request, pk, format=None):
        teacher = self.get_object()
        serializer = TeacherSerializer(teacher)
        response = serializer.data
        response["courses"] = self._get_courses_info(request, teacher)
        return Response(response)




class TopicView(viewsets.ModelViewSet):
    queryset = Topic.objects.prefetch_related("course").all()
    serializer_class = TopicSerializer
    permission_classes = [TopicPermission]

    @action(detail=False, methods=["get"])
    def for_course(self, request, format=None):
        course_id = request.GET.get("course_id")
        topics = (self.queryset
                  .select_related("course")
                  .filter(course__id=course_id)
                  .all())
        serializer = self.serializer_class(topics, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @csrf_exempt
    def create(self, request, format=None):
        try:
            serializer = TopicCreateSerializer(data=request.data)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, *args, **kwargs):
        topic = self.get_object()
        lessons = (Lesson.objects
                 .prefetch_related("lesson_status")
                   .prefetch_related("lesson_status__enrolled_student")
                 .filter(topic=topic)
                 .all())
        serializer = TopicSerializer(topic)
        response = serializer.data
        lesson_serializer = LessonSerializer(lessons, many=True, context={"user_id": request.user.id})
        response["lessons"] = lesson_serializer.data
        return Response(response, status=status.HTTP_200_OK)





class LessonView(viewsets.ModelViewSet):
    queryset = Lesson.objects.prefetch_related("topic").prefetch_related("topic__course").all()
    # serializer_class = LessonSerializer
    permission_classes = [LessonPermission]

    @action(detail=True, methods=["get"])
    def files(self, request, pk, format=None):
        lesson = self.get_object()
        temp = tempfile.TemporaryFile()
        archive = zipfile.ZipFile(temp, 'w', zipfile.ZIP_DEFLATED)
        for file in lesson.files.all():
            filename = file.file.path  # Replace by your files here.

            archive.write(filename, file.filename())  # 'file%d.png' will be the
            # name of the file in the
            # zip
        archive.close()

        temp.seek(0)
        wrapper = FileWrapper(temp)

        response = HttpResponse(wrapper, content_type='application/zip')
        response['Content-Disposition'] = 'attachment; filename=test.zip'

        return response
    #
    # @action(detail=False, methods=["get"])
    # def by_topic(self, request, format=None):
    #     topic_id = request.GET.get('topic_id')
    #     if topic_id is not None:
    #         lessons = (Lesson.objects
    #                    .filter(topic__id = topic_id)
    #                    .order_by('order'))
    #         serializer = self.serializer_class(lessons, many=True)
    #         return Response(serializer.data)
    #     return Response(status=status.HTTP_404_NOT_FOUND)

    def create(self, request, format=None):
        try:
            serializer = LessonCreateSerializer(data=request.data)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["post"])
    def add_content(self, request, format=None):
        try:
            serializer = LessonContentCreateSerializer(data=request.data)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)

    # @action(detail=True, methods=["put"])
    # def change_content_order(self, request, pk, format=None):
    #     try:
    #         lesson = self.get_object()
    #         serializer = LessonContentOrderSerializer(instance=lesson,
    #                                                   context={"lesson_id": lesson.id},
    #                                                   data=request.data)
    #         if serializer.is_valid(raise_exception=True):
    #             serializer.save()
    #             return Response(status=status.HTTP_200_OK)
    #     except (ValidationError, InstanceNotFoundError) as e:
    #         return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def done(self, request, pk, format=None):
        try:
            lesson = self.get_object()
            serializer = CreateProgressSerializer(instance=lesson,
                                                  data=request.data,
                                                  context={"student_id": request.user.id})
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                last_lesson = Lesson.objects.filter(course=lesson.course).last()
                if last_lesson == lesson:
                    enrollment = CourseEnrollment.objects.get(user=request.user, course = lesson.course)
                    enrollment.status = "finished"
                    enrollment.save()
                return Response(status=status.HTTP_200_OK)
        except (ValidationError, InstanceNotFoundError) as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, *args, **kwargs):
        lesson = self.get_object()
        if request.user.role == "student":
            done = CourseProgress.objects.filter(enrolled_student__user__id=request.user.id,
                                                 item__id=lesson.id)
            serialazier = CourseLessonSerializer(lesson, context={
                "done": done.exists()
            })
            return Response(data=serialazier.data, status=status.HTTP_200_OK)
        serialazier = CourseLessonSerializer(lesson)
        return Response(data=serialazier.data, status=status.HTTP_200_OK)



class FeedbackView(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [FeedbackPermission]

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

    def list(self, request, *args, **kwargs):
        courses = (
            Feedback.objects
            .select_related('user')
            .filter(user__user=request.user)
            .order_by('-created')
        )
        serializer = StudentFeedbackSerializer(courses, many=True)
        return Response(serializer.data)

    def create(self, request, format=None):
        try:
            serializer = CourseCreateFeedback(data=request.data,
                                               context={"student_id": request.user.id})

            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)

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




class HomePageView(viewsets.ViewSet):
    queryset = User.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [UserPermission]

    def _get_todo_for(self, user, month, year, tzinfo):
        first_date = datetime.datetime(year, month, 1, tzinfo=tzinfo)
        last_date = first_date + relativedelta.relativedelta(months=1)
        done = (CourseProgress.objects
                .select_related("enrolled_student")
                .filter(enrolled_student__user=user)
                .values_list("item")
                .all())
        todo = (Lesson.objects
                .select_related("topic")
                .select_related("topic__course")
                .prefetch_related("topic__course__registered_students")
                .filter(deadline__range=(first_date, last_date),
                        topic__course__registered_students__user=user,
                        topic__course__registered_students__status__exact="started")
                .exclude(id__in=done)
                .values("id", "course_id", "topic__course__title",
                        "topic__id", "topic__title",
                        "title", "deadline"))
        serializer = TodoListSerializer(todo, many=True)
        return serializer.data

    def _get_student_courses(self, request):
        return (Course.objects
                   .prefetch_related("registered_students")
                   .prefetch_related("topics")
                   .prefetch_related("topics__lessons")
                   .filter(registered_students__user=request.user, is_active=True)
                   .annotate(
            overall=Count(
                'topics__lessons',
                output_field=IntegerField(),
            )
        )
                   .all()
                   )

    def _get_teacher_courses(self, user):
        return (Course.objects
                   .prefetch_related(Prefetch("registered_students"))
                   .prefetch_related("feedback")
                   .filter(teacher=user)
                   .annotate(
            average_rating=Avg('feedback__rating',
                               default=0,
                               output_field=FloatField(),
                               )
        )
                   .annotate(
            n_students=Count('feedback__id',
                             output_field=IntegerField(),
                             )
        )
                   .all()
                   )

    def _get_courses_info(self, request, user):
        # owner of the page
        if user.role == "student":
            courses = self._get_student_courses(request)
            # add progress information
            done = (CourseEnrollment.objects
                    .prefetch_related("progress")
                    .filter(user=user)
                    .annotate(done=Count('progress__item__id',
                                         distinct=True,
                                         output_field=IntegerField(),
                                         )
                              )
                    .values_list("course__id", 'user__id', "created", "done")
                    .all()
                    )
            courses_serializer = CourseWithProgressShortSerializer(courses,
                                                                   many=True,
                                                                   context={"done": done})
            return courses_serializer.data
        courses = self._get_teacher_courses(user)
        courses_serializer = CourseShortTeacherSerializer(courses, many=True)
        return courses_serializer.data

    @action(detail=False, methods=["get"])
    def my_course_titles(self, request, format=None):
        if request.user.role == "student":
            courses = self._get_student_courses(request)
        else:
            courses = self._get_teacher_courses(request.user)
        serializer = CourseTitleSerializer(courses, many=True)
        return Response(serializer.data)

    # def _get_courses_info(self, request, course_owner):
    #     courses = (Course.objects
    #     .filter(teacher__id=course_owner.id)
    #     .prefetch_related("feedback")
    #     .prefetch_related("registered_students")
    #     .annotate(
    #         average_rating=Avg('feedback__rating',
    #                            default=0,
    #                            output_field=FloatField(),
    #                            )
    #     ))
    #     if request.user == course_owner:
    #         courses_serializer = CourseOwnerShortSerializer(courses, many=True)
    #         return courses_serializer.data
    #     courses = (courses
    #     .filter(is_active=True)
    #     .annotate(
    #         n_students=Count('registered_students__id',
    #                          output_field=IntegerField(),
    #                          )
    #     ))
    #     courses_serializer = CourseShortSerializer(courses, many=True)
    #     return courses_serializer.data

    def retrieve(self, request, *args, **kwargs):
        user = request.user
        n_notifications = Notification.objects.filter(recipient=user).count()
        if user.role == "student":
            serializer = StudentSerializer(user)
            response = serializer.data
            courses = self._get_courses_info(request, user)
            response["courses"] = sorted(courses, key=lambda x: x["status"], reverse=True)
            now = timezone.now()
            response["todo"] = self._get_todo_for(user, now.month, now.year, now.tzinfo)
            response["n_notifications"] = n_notifications
            return Response(response)
        serializer = TeacherSerializer(user)
        response = serializer.data
        response["n_notifications"] = n_notifications
        response["courses"] = self._get_courses_info(request, user)
        return Response(response)


class HomeView(viewsets.ModelViewSet):

    @action(detail=False, methods=["get"])
    def inbox(self, request, format=None):
        n_notifications = Notification.objects.filter(recipient=request.user, seen=False).count()
        n_messages = Message.objects.filter(recipient=request.user, seen=False).count()
        return Response({
            'new_notifications': n_notifications,
            'new_messages': n_messages,
        })

    @action(detail=False, methods=["put"])
    def set_bio(self, request, format=None):
        try:
            user = User.objects.get(id=request.user.id)
            serializer = BioSerializer(instance=user,
                                        data=request.data,
                                        partial=True)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        except (ValidationError, InstanceNotFoundError) as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["put"])
    def set_email(self, request, format=None):
        try:
            user = User.objects.get(id=request.user.id)
            serializer = EmailSerializer(instance=user,
                                        data=request.data,
                                        partial=True)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        except (ValidationError, InstanceNotFoundError) as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["put"])
    def set_name(self, request, format=None):
        try:
            user = User.objects.get(id = request.user.id)
            serializer = NameSerializer(instance=user,
                                          data=request.data,
                                          partial=True)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        except (ValidationError, InstanceNotFoundError) as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["put"])
    def set_status(self, request, format=None):
        try:
            user = User.objects.get(id = request.user.id)
            serializer = StatusSerializer(instance=user,
                                          data=request.data,
                                          partial=True)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        except (ValidationError, InstanceNotFoundError) as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["put"])
    def update_photo(self, request, format=None):
        try:
            user = User.objects.get(id = request.user.id)
            serializer = PhotoSerializer(instance=user,
                                               data=request.data,
                                               partial=True)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        except (ValidationError, InstanceNotFoundError) as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get"])
    def get_photo(self, request, format=None ):
        if request.user.photo:
            with open(request.user.photo.path, "rb") as f:
                return HttpResponse(f.read(), content_type="image/jpeg")
        return Response(status=status.HTTP_404_NOT_FOUND)




class TagsView(viewsets.ModelViewSet):
    queryset = Tag.objects.all().values()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]


class UserView(viewsets.ModelViewSet):
    queryset = (User.objects
                 .filter(role__in=["teacher", "student"])
                 .all())

    def _get_student_courses(self, request, user):
        return (Course.objects
                   .prefetch_related("registered_students")
                   .prefetch_related("topics")
                   .prefetch_related("topics__lessons")
                   .filter(registered_students__user=user, is_active=True)
                   .all()
                   )

    def _get_teacher_courses(self, user):
        return (Course.objects
                   .prefetch_related("registered_students")
                   .prefetch_related("feedback")
                   .filter(teacher=user, is_active=True)
                   .annotate(
            average_rating=Avg('feedback__rating',
                               default=0,
                               output_field=FloatField(),
                               )
        )
                   .annotate(
            n_students=Count('registered_students__id',
                             output_field=IntegerField(),
                             )
        )
                   .all()
                   )

    def _get_courses_info(self, request, user):
        # owner of the page
        if user.role == "student":
            courses = self._get_student_courses(request, user)
            courses_serializer = CourseBasicSerializer(courses,many=True)
            return courses_serializer.data
        courses = self._get_teacher_courses(user)
        courses_serializer = CourseBasicSerializer(courses, many=True)
        return courses_serializer.data

    def retrieve(self, request, *args, **kwargs):
        user = self.get_object()
        if user.role == "student":
            serializer = StudentSerializer(user)
            response = serializer.data
            response["courses"] = self._get_courses_info(request, user)
            return Response(response)
        serializer = TeacherSerializer(user)
        response = serializer.data
        response["courses"] = self._get_courses_info(request, user)
        return Response(response)

    def list(self, request, format=None):
        users = (self.queryset.exclude(id=request.user.id).all())
        serializer = BasicUserSerializer(users, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def search(self, request, format=None):
        query = request.GET.get("query")
        role = request.GET.get("role")
        status = request.GET.get("status")
        course_id = request.GET.get("course_id")
        query_exists = query is not None and query != ""
        role_exists = role is not None and role != "" and  role != "null"
        status_exists = status is not None and status != "" and status != "null"
        course_exists = course_id is not None and course_id != "" and  course_id != "null"
        queryset = self.queryset.exclude(id=request.user.id)
        if query_exists:
            query_list = query.lower().strip().split(" ")
            query_regex = r'({})'.format('|'.join(query_list))
            queryset = queryset.filter(Q(first_name__iregex=query_regex) | Q(last_name__iregex=query_regex))
        if role_exists:
            role = role.lower().strip()
            queryset = queryset.filter(role__iregex=role)
        if status_exists:
            status_list = [stat.lower() for stat in status.strip().split(",")]
            status_regex = r'({})'.format('|'.join(status_list))
            enrolled = (CourseEnrollment.objects
                        .select_related("course")
                        .prefetch_related("user")
                        .filter(user__in=queryset, status__iregex=status_regex)
                        .all())
            if course_exists:
                enrolled = enrolled.filter(course__id = course_id)
            serializer = EnrolledUserSerializer(enrolled, many=True)
            return Response(serializer.data)

        if course_exists:
            enrolled = (CourseEnrollment.objects
                        .select_related("course")
                        .prefetch_related("user")
                        .filter(user__in=queryset, course__id=course_id)
                        .all())
            serializer = EnrolledUserSerializer(enrolled, many=True)
            return Response(serializer.data)
        users = queryset.all()
        print(users)
        serializer = BasicUserSerializer(users, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def get_avatar(self, request, pk):
        user = self.get_object()
        if user.photo:
            with open(user.photo.path, "rb") as f:
                encoded_string = base64.b64encode(f.read())
                return Response(encoded_string)
        return Response(status=status.HTTP_404_NOT_FOUND)

class NotificationsView(viewsets.ModelViewSet):
    queryset = Notification.objects.all()

    def list(self, request, *args, **kwargs):
        notifications = self.queryset.filter(recipient=request.user).all()
        serializer = NotificationSerializer(notifications, many=True)
        response = serializer.data
        return Response(response)

    @action(detail=False, methods=["post"])
    def seen(self, request, format=None):
        try:
            serializer = NotificationSeenSerializer(data=request.data)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        except (ValidationError, InstanceNotFoundError) as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)


class EnrollmentView(viewsets.ModelViewSet):
    queryset = CourseEnrollment.objects.all()

    @action(detail=True, methods=["put"])
    def block(self, request, pk, format=None):
        enrollment = self.get_object()
        serializer = EnrollmentBlockSerializer(instance=enrollment, data=request.data)
        try:
            if serializer.is_valid(raise_exception=True):
                with transaction.atomic():
                    serializer.save()
                    action_name = "blocked " if serializer.validated_data["block"] else "unblocked"
                    Notification.objects.create(recipient=enrollment.user, person=enrollment.course.teacher, course=enrollment.course,
                                                text=f"{action_name} you in course")
                return Response(status=status.HTTP_200_OK)
        except (ValidationError, InstanceNotFoundError) as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["put"])
    def remove(self, request, pk, format=None):
        enrollment = self.get_object()
        serializer = EnrollmentRemoveSerializer(instance=enrollment, data=request.data)
        try:
            if serializer.is_valid(raise_exception=True):
                with transaction.atomic():
                    serializer.save()
                    Notification.objects.create(recipient=enrollment.user, person=enrollment.course.teacher, course=enrollment.course,
                                                text="removed you from the course")
                return Response(status=status.HTTP_200_OK)
        except (ValidationError, InstanceNotFoundError) as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)




class CustomLogoutView(LogoutView):
    def logout(self, request):
        user = request.user
        response = super().logout(request)
        if response.status_code == 200:
            user.is_online = False
            user.save()
        return response

class CustomRegistrationView(RegisterView):
    serializer_class = CustomRegisterSerializer
    permission_classes = [permissions.AllowAny]

