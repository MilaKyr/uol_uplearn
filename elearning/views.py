from django.db.models import Avg, FloatField, Count, IntegerField, Case, When
from django.views.decorators.csrf import csrf_exempt
from rest_framework import permissions, viewsets, status, views
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from dj_rest_auth.registration.views import RegisterView
import datetime
from dateutil import relativedelta
from django.utils import timezone


from elearning.permissions import UserCoursePermission, UserPermission, TopicPermission, \
    LessonPermission, FeedbackPermission
from elearning.models import Course, User, Topic, StudyItem, Feedback, CourseProgress, CourseEnrollment, ItemContent
from elearning.serializers import CourseSerializer, TopicSerializer, CourseShortSerializer, \
    LessonSerializer, StudentSerializer, TeacherSerializer, FeedbackSerializer, StudentFeedbackSerializer, \
    CourseCreateFeedback, LessonCreateSerializer, TopicCreateSerializer, LessonContentCreateSerializer, \
    LessonContentOrderSerializer, LessonOrderSerializer, CustomRegisterSerializer, CourseOwnerShortSerializer, \
    TodoListSerializer, CourseWithProgressShortSerializer, CreateProgressSerializer


class InstanceNotFoundError(BaseException):
    pass


class CourseView(viewsets.ModelViewSet):
    """
    API endpoint that allows courses to be viewed or edited.
    """
    queryset = Course.objects.prefetch_related('registered_students').all()
    serializer_class = CourseSerializer
    permission_classes = [UserCoursePermission]

    def retrieve(self, request, pk, format=None):
        # check if it's the course owner
        course = (self.queryset
            .prefetch_related("feedback")
            .filter(id=pk)
            .annotate(
                average_rating=Avg('feedback__rating',
                                   default=0,
                                   output_field=FloatField(),
                                   )
            ).get())
        courses_serializer = CourseSerializer(course)
        return Response(courses_serializer.data, status=status.HTTP_200_OK)


    def list(self, request, format=None):
        courses = (self.queryset
        .filter(is_active=True)
        .prefetch_related("feedback")
        .prefetch_related("registered_students")
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

    @csrf_exempt
    def create(self, request):
        try:
            serializer = CourseSerializer(data=request.data,
                                          context={"teacher": request.user})
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        except (ValidationError, InstanceNotFoundError) as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)

    @csrf_exempt
    def update(self, request, pk=None):
        try:
            course = self.get_object()
            serializer = self.serializer_class(instance=course,
                                               data=request.data,
                                               context={"teacher": request.user}, partial=True)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        except (ValidationError, InstanceNotFoundError) as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def enroll(self, request, pk, format=None):
        try:
            course = self.get_object()
            CourseEnrollment.objects.create(user=request.user, course=course, status="started")
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

    def _get_todo_for(self, user, month, year, tzinfo):
        first_date = datetime.datetime(year, month, 1, tzinfo=tzinfo)
        last_date = first_date + relativedelta.relativedelta(months=1)
        done = (CourseProgress.objects
                .select_related("enrolled_student")
                .filter(enrolled_student__user=user)
                .values_list("item")
                .all())

        todo = (StudyItem.objects
                 .select_related("topic")
                 .select_related("topic__course")
                 .prefetch_related("topic__course__registered_students")
                 .filter(deadline__range=(first_date, last_date),
                         topic__course__registered_students__user=user)
                 .exclude(id__in=done)
                 .values("id", "course_id", "topic__course__title",
                         "topic__id", "topic__title",
                         "title", "deadline", "order"))
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

    @action(detail=False, methods=["get"])
    def todo_for(self, request, format=True):
        month = request.GET.get("month")
        year = request.GET.get("year")
        now = timezone.now()
        todo = self._get_todo_for(request.user, month, year, now.tzinfo)
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
    queryset = StudyItem.objects.prefetch_related("topic").prefetch_related("topic__course").all()
    serializer_class = LessonSerializer
    permission_classes = [LessonPermission]

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

    @action(detail=False, methods=["post"])
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

    @action(detail=True, methods=["post"])
    def done(self, request, pk, format=None):
        try:
            lesson = self.get_object()
            serializer = CreateProgressSerializer(instance=lesson,
                                                  data=request.data,
                                                  context={"student_id": request.user.id})
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        except (ValidationError, InstanceNotFoundError) as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)


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


class CustomRegistrationView(RegisterView):
    serializer_class = CustomRegisterSerializer
    permission_classes = [permissions.AllowAny]

