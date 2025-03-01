import base64

from django.db.models import prefetch_related_objects
from django.db.models.query_utils import select_related_descend
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.models import Group
from django.db import transaction, IntegrityError
from allauth.account.adapter import get_adapter
from dj_rest_auth.registration.serializers import RegisterSerializer
from dj_rest_auth.serializers import LoginSerializer
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied
from rest_framework import exceptions, serializers
from django.conf import settings

from .models import Course, User, Feedback, Lesson, Topic, CourseProgress, CourseEnrollment, \
    Tag, Files, KeyHolder
from .validators import feedback_between_1_5, validate_start_date


class TagSerializer(serializers.ModelSerializer):
    """ Serializes Tag model """
    class Meta:
        model = Tag
        fields = "__all__"


class UserPhotoSerializer(serializers.ModelSerializer):
    """ Serializes photo as image from User model. Used for update and create methods """
    photo = serializers.ImageField()

    class Meta:
        model = User
        fields = ['photo']


class PhotoBase64Serializer(serializers.Serializer):
    """ Serializes photo as Base64 string """
    photo = serializers.SerializerMethodField()

    def get_photo(self, instance):
        try:
            with open(instance.photo.path, "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read())
                return encoded_string
        except ValueError:
            return ""

class FullNameSerializer(serializers.ModelSerializer):
    """ Serializes user's full name """
    name = serializers.SerializerMethodField()

    def get_name(self, instance):
        """Retrieves full name from model's property"""
        return instance.full_name

    class Meta:
        model = User
        fields = ["name"]

class UserShortSerializer(serializers.ModelSerializer):
    """ Serializes teacher's data for course serializer """
    name = serializers.SerializerMethodField()
    photo = serializers.SerializerMethodField()

    def get_name(self, instance):
        return instance.full_name

    def get_photo(self, instance):
        return PhotoBase64Serializer(instance).data.get("photo")

    class Meta:
        model = User
        fields = ['id', 'name', 'photo']

class UserAuthSerializer(UserShortSerializer):
    """ Basic user serializer """
    role = serializers.SerializerMethodField()
    photo = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()

    def get_role(self, instance):
        return "student" if instance.is_student() else "teacher"

    def get_photo(self, instance):
        return PhotoBase64Serializer(instance).data.get("photo")

    def get_name(self, instance):
        return instance.full_name

    class Meta(UserShortSerializer.Meta):
        model = User
        fields = UserShortSerializer.Meta.fields + ['role', 'is_online']

class TeacherSerializer(UserAuthSerializer):
    """ Serializes teacher. Extends UserAuthSerializer with `bio` field """

    class Meta(UserAuthSerializer.Meta):
        model = User
        fields = UserAuthSerializer.Meta.fields + ['bio', ]


class StudentSerializer(UserAuthSerializer):
    """ Serializes student. Extends UserAuthSerializer with `status` field """

    class Meta(UserAuthSerializer.Meta):
        model = User
        fields = UserAuthSerializer.Meta.fields + ['status', ]

class SettingsSerializer(serializers.ModelSerializer):
    """ Serializes settings options. """

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email' ]

class StudentSettingsSerializer(SettingsSerializer):
    """ Serializes student settings. Extends SettingsSerializer with `status` field """

    class Meta(SettingsSerializer.Meta):
        model = User
        fields = SettingsSerializer.Meta.fields + ['status', ]


class TeacherSettingsSerializer(SettingsSerializer):
    """ Serializes teacher settings. Extends SettingsSerializer with `bio` field """

    class Meta(SettingsSerializer.Meta):
        model = User
        fields = SettingsSerializer.Meta.fields + ['bio', ]


class RegisteredStudentSerializer(serializers.ModelSerializer):
    """ Serializes student from CourseEnrollment model """
    photo = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()

    def get_photo(self, instance):
        return  PhotoBase64Serializer(instance.user).data.get("photo")

    def get_name(self, instance):
        return FullNameSerializer(instance.user).data["name"]

    class Meta:
        model = CourseEnrollment
        fields = ['id', 'name', 'photo', 'status']

class StudentFeedbackSerializer(serializers.ModelSerializer):
    """ Serializes feedback and author of feedback from Feedback model. Used for update method """
    user = serializers.SerializerMethodField()
    created = serializers.DateTimeField(format="%d %B, %Y")
    rating = serializers.IntegerField(validators=[feedback_between_1_5])

    def get_user(self, instance):
        return UserShortSerializer(instance.enrollment.user).data

    class Meta:
        model = Feedback
        fields = ['id', 'text', 'rating', 'user', 'created']

class LessonBasicSerializer(serializers.ModelSerializer):
    """ Serializes lesson. Returns additional field `done` that checks if user did this lesson """
    deadline = serializers.DateTimeField(format="%d %B, %Y")
    done = serializers.SerializerMethodField()

    def get_done(self, instance):
        req = self.context.get("request")
        return instance.lesson_status.filter(enrollment__user=req.user).exists() if req else False

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'deadline', 'done']

class LessonWithFilesCheckSerializer(LessonBasicSerializer):
    """ Extends LessonBasicSerializer. Returns additional field `has_files`, `html` and `created` """
    has_files = serializers.SerializerMethodField()
    created = serializers.DateTimeField(format="%d %B, %Y")
    topic_id = serializers.SerializerMethodField()

    def get_topic_id(self, instance):
        return instance.topic.id

    def get_has_files(self, instance):
        return instance.files.count() > 0

    class Meta(LessonBasicSerializer.Meta):
        model = Lesson
        fields = LessonBasicSerializer.Meta.fields + ['html', "created", "has_files", "topic_id"]

class LessonCreateSerializer(serializers.ModelSerializer):
    """ Creates new lesson """
    title = serializers.CharField()
    deadline = serializers.DateTimeField(format="%d %B, %Y")

    class Meta:
        model = Lesson
        fields = ["title", "deadline"]

class LessonEditFilesSerializer(serializers.Serializer):
    """ Updates lesson's files """
    files = serializers.FileField()

    def update(self, instance, validated_data):
        file = validated_data.pop("files")
        with transaction.atomic():
            model_file = Files.objects.create(file=file)
            instance.files.add(model_file)
        return instance

class TopicSerializer(serializers.ModelSerializer):
    """ Serializes topic """
    class Meta:
        model = Topic
        fields = ['id', 'title', 'description', 'n_hours',]

class TopicWithLessonsSerializer(serializers.ModelSerializer):
    """ Extends TopicSerializer. Adds lessons """
    lessons = LessonBasicSerializer(many=True)

    class Meta:
        model = Topic
        fields = ['id','title', 'description', 'n_hours', 'lessons']

class TopicCreateSerializer(serializers.Serializer):
    """ Creates new topic """
    title = serializers.CharField()
    description = serializers.CharField()
    n_hours = serializers.IntegerField()
    lessons = LessonCreateSerializer(many=True)

class CourseTitleSerializer(serializers.ModelSerializer):
    """ Serializes only course title """
    class Meta:
        model = Course
        fields = ['id', 'title']

class CourseBasicSerializer(CourseTitleSerializer):
    """ Serializes only essential info about the course: id, title and image """
    photo = serializers.SerializerMethodField()

    def get_photo(self, instance):
        return PhotoBase64Serializer(instance).data.get("photo")

    class Meta(CourseTitleSerializer.Meta):
        model = Course
        fields = CourseTitleSerializer.Meta.fields + ['photo',]

class CourseOwnerSerializer(CourseBasicSerializer):
    """ Serializes course for the course owner """
    average_rating = serializers.SerializerMethodField()
    n_students = serializers.SerializerMethodField()
    registered_students = serializers.SerializerMethodField()
    created = serializers.DateTimeField(format="%d/%m/%Y")
    start_date = serializers.DateTimeField(format="%d %B, %Y")

    def get_registered_students(self, instance):
        students = instance.registered_students.filter(status__in=["started", "removed", "blocked"])
        serialized = RegisteredStudentSerializer(students, many=True)
        return serialized.data

    def get_average_rating(self, instance):
        return instance.average_rating

    def get_n_students(self, instance):
        return instance.n_students

    class Meta(CourseBasicSerializer.Meta):
        model = Course
        fields = CourseBasicSerializer.Meta.fields + [
            'is_active', 'start_date', 'registered_students', 'average_rating', 'n_students', 'created']

class CourseShortSerializer(CourseBasicSerializer):
    """ Serializes course information"""
    teacher = UserShortSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField(read_only=True)
    n_students = serializers.SerializerMethodField(read_only=True)
    created = serializers.DateTimeField(format="%d/%m/%Y",read_only=True)
    start_date = serializers.DateTimeField(format="%d %B, %Y")

    def get_average_rating(self, instance):
        return instance.average_rating

    def get_n_students(self, instance):
        return instance.n_students

    class Meta(CourseBasicSerializer.Meta):
        model = Course
        fields = CourseBasicSerializer.Meta.fields + [
            'teacher', 'start_date', 'duration', 'average_rating', 'n_students', 'created', 'tags']



class CourseSerializer(CourseShortSerializer):
    """ Serializes course with topics and feedback. """
    topics = TopicWithLessonsSerializer(many=True, read_only=True)
    feedback = serializers.SerializerMethodField()
    enrolled = serializers.SerializerMethodField()

    def get_feedback(self, instance):
        registered_students = instance.registered_students.all()
        prefetched = Feedback.objects.filter(enrollment__in=registered_students).all()
        serializer = StudentFeedbackSerializer(prefetched, many=True, read_only=True)
        return serializer.data

    def get_enrolled(self, _):
        return self.context.get("enrolled", False)

    class Meta(CourseShortSerializer.Meta):
        model = Course
        fields = CourseShortSerializer.Meta.fields + [
            'is_active', 'description', 'topics', 'feedback', 'enrolled' ]
        ordering = ['-created']

class CourseRetireveUpdateSerializer(CourseBasicSerializer):
    """ Serializes course for edit page """
    topics = TopicWithLessonsSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True)
    duration = serializers.SerializerMethodField()
    start_date = serializers.DateTimeField(format="%d %B, %Y")

    def get_duration(self, instance):
        return instance.duration.days

    class Meta(CourseBasicSerializer.Meta):
        model = Course
        fields = CourseBasicSerializer.Meta.fields + ['start_date', 'duration', 'topics', 'is_active', 'description',
                'created', 'tags']


class CourseCreateSerializer(serializers.Serializer):

    """ Creates new course """
    id = serializers.UUIDField()
    title = serializers.CharField()
    description = serializers.CharField()
    start_date = serializers.DateTimeField(validators=[validate_start_date])
    end_date = serializers.DateTimeField(write_only=True)
    tags = serializers.ListSerializer(child=serializers.CharField())
    topics = TopicCreateSerializer(many=True)

    def _save_tags(self, validated_data):
        course_tags = validated_data.pop('tags')
        model_tags = []
        for tag in course_tags:
            model_tag, _ = Tag.objects.get_or_create(name=tag)
            model_tags.append(model_tag)
        return model_tags

    def _save_course(self, validated_data):
        teacher = self.context["request"].user
        start_date = validated_data.pop('start_date')
        duration = validated_data.pop('end_date') - start_date

        return  Course(
            id=validated_data.pop("id"),
            teacher=teacher,
            title=validated_data.pop('title'),
            description=validated_data.pop('description'),
            start_date=start_date,
            duration=duration,
        )

    def _save_topics(self, course_instance, validated_data):
        topics = validated_data.pop('topics')
        for topic in topics:
            topic_instance = self._save_topic(course_instance, topic)
            for lesson in topic["lessons"]:
                self._save_lesson(topic_instance, course_instance, lesson)

    def _save_topic(self, course_instance, topic):
        return Topic.objects.create(course=course_instance,
                                           title=topic["title"],
                                           description=topic["description"],
                                           n_hours=topic["n_hours"]
                                           )

    def _save_lesson(self, topic, course, lesson):
        Lesson.objects.create(
            topic=topic,
            course=course,
            title=lesson["title"],
            deadline=lesson["deadline"]
        )
    def create(self, validated_data):
        try:
            with transaction.atomic():
                model_tags = self._save_tags(validated_data)
                new_course = self._save_course(validated_data)
                new_course.tags.add(*model_tags)
                new_course.save()
                self._save_topics(new_course, validated_data)
                return new_course
        except (IntegrityError) as error:
            raise ValidationError(error)

class CourseWithProgressSerializer(CourseBasicSerializer):
    """ Serializes course by adding information about progress, enrollment status and enrollment date
    used on Student's Dashboard
    """
    progress = serializers.SerializerMethodField()
    enrolled = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    def get_status(self, instance):
        # get done data from context
        done = self.context.get("done")
        # select user ids for the course
        user_ids = [user_id for (course_id, user_id, _, _,) in done
                    if course_id == instance.id]
        # if user ids is not empty
        if len(user_ids) == 1:
            # return the status of the first user enrollment.
            # This context is already pre-filtered with user's id from request
            return instance.registered_students.get(user__id=user_ids[0]).status

    def get_enrolled(self, instance):
        # get done data from context
        done = self.context.get("done")
        # select enrollment date for the course
        # This context is already pre-filtered with user's id from request
        enrolled = [enrolled for (course_id, _, enrolled, _,) in done
                          if course_id == instance.id]
        # return date if list is not empty
        if len(enrolled) > 0:
            return enrolled.pop()

    def get_progress(self, instance):
        if instance.overall == 0:
            return 0.0

        done = self.context.get("done")
        done_in_course = [done for (course_id, _, _, done) in done
                          if course_id == instance.id]
        return done_in_course[0] / instance.overall if len(done_in_course) == 1 else 0.0

    class Meta(CourseBasicSerializer.Meta):
        model = Course
        fields = CourseBasicSerializer.Meta.fields + ['enrolled', 'progress', 'status']

class FeedbackSerializer(serializers.ModelSerializer):
    """ Serializes Feedback model """

    class Meta:
        model = Feedback
        fields = ['id', 'text', 'rating', 'created']

class CourseFeedbackSerializer(serializers.Serializer):
    """ Serializes feedback and course from CourseEnrollment model """
    course = CourseBasicSerializer(read_only=True)
    feedback = serializers.SerializerMethodField()

    def get_feedback(self, instance):
        if instance.feedback is not None:
            return FeedbackSerializer(instance.feedback).data

    class Meta:
        model = CourseEnrollment
        fields = ['course', 'feedback' ]

class CourseCreateFeedback(serializers.Serializer):
    """ Creates new feedback for the course """
    course_id = serializers.UUIDField(write_only=True)
    text = serializers.CharField()
    created = serializers.ReadOnlyField()
    rating = serializers.IntegerField(validators=[feedback_between_1_5])

    def create(self, validated_data):
        """ Creates new feedback """
        try:
            course_id = validated_data.pop('course_id')
            student = self.context["request"].user
            # get course
            course = Course.objects.get(id=course_id)
            # get enrollment
            course_enrollment = CourseEnrollment.objects.get(user=student, course=course)
            if course_enrollment.status != "finished":
                raise PermissionDenied()
            feedback = Feedback.objects.create(enrollment=course_enrollment, **validated_data)
            return feedback
        except Course.DoesNotExist as error:
            raise NotFound(error)
        except CourseEnrollment.DoesNotExist:
            # return no information other that it's denied for security concerns
            raise PermissionDenied()

class TodoListSerializer(serializers.Serializer):
    """ Serializes a to-do task for student """
    course_id = serializers.SerializerMethodField()
    course_title = serializers.SerializerMethodField()
    topic_title = serializers.SerializerMethodField()
    topic_id = serializers.SerializerMethodField()
    id = serializers.SerializerMethodField()
    title = serializers.SerializerMethodField()
    deadline = serializers.SerializerMethodField()

    def get_course_id(self, instance):
        return instance["course_id"]

    def get_topic_id(self, instance):
        return instance["topic__id"]

    def get_id(self, instance):
        return instance["id"]

    def get_course_title(self, instance):
        return instance["topic__course__title"]

    def get_topic_title(self, instance):
        return instance["topic__title"]

    def get_title(self, instance):
        return instance["title"]

    def get_deadline(self, instance):
        return instance["deadline"].strftime("%d/%m/%Y")


    class Meta:
        fields = ["course_id", "course_title",
                  "topic_id", "topic_title",
                  "id", "title",
                  "deadline"]

class CreateProgressSerializer(serializers.Serializer):
    """ Updates course progress """

    def update(self, instance, validated_data):
        try:
            student = self.context["request"].user
            enrollment = CourseEnrollment.objects.get(user=student, course=instance.course)
            course_progress = CourseProgress.objects.create(enrollment=enrollment, item=instance)
            last_lesson = Lesson.objects.filter(course=instance.course).latest('created')
            if last_lesson.id == instance.id:
                enrollment = CourseEnrollment.objects.get(user=student, course=instance.course)
                enrollment.status = "finished"
                enrollment.save()
            return course_progress
        except CourseEnrollment.DoesNotExist as error:
            raise NotFound(error)

class PrefetchEnrollmentSerializer(serializers.ModelSerializer):
    """ Get enrollment information on the prefetched instance """
    name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    photo = serializers.SerializerMethodField()

    def get_name(self, instance):
        return instance.user.full_name

    def get_role(self, instance):
        return "student" if instance.user.is_student() else "teacher"

    def get_photo(self, instance):
        return PhotoBase64Serializer(instance.user).data.get("photo")


    class Meta:
        model = CourseEnrollment
        fields = ['id', 'name', 'role', 'photo', 'status']

class EnrollmentUpdateSerializer(serializers.ModelSerializer):
    """ Updates enrollment status to `removed` """

    class Meta:
        model = CourseEnrollment
        fields = ['status',]

class EnrollmentCreateSerializer(serializers.Serializer):
    course_id = serializers.UUIDField()

    def create(self, validated_data):
        try:
            user = self.context["request"].user
            course_id = self.validated_data.get("course_id")
            course = Course.objects.get(id=course_id)
            enrollment = CourseEnrollment.objects.create(user=user, course=course, status="started")
            return enrollment
        except Course.DoesNotExist as error:
            raise NotFound(error)

class CustomRegisterSerializer(RegisterSerializer):
    """ Custom registration. Adds role and group to the user """
    ROLE_CHOICES = (
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    )
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    photo = serializers.ImageField(required=False)
    role = serializers.ChoiceField(ROLE_CHOICES)
    key_holder = serializers.UUIDField(required=False)

    class Meta:
        model = User
        fields = ['email', 'username', 'first_name', 'key_holder',
                  'last_name', 'password1', 'password2', 'photo']

    def get_cleaned_data(self):
        return {
            'username': self.validated_data.get('username', ''),
            'password1': self.validated_data.get('password1', ''),
            'password2': self.validated_data.get('password2', ''),
            'email': self.validated_data.get('email', ''),
            'first_name': self.validated_data.get('first_name'),
            'last_name': self.validated_data.get('last_name'),
            'photo': self.validated_data.get('photo'),
            'role': self.validated_data.get('role'),
            'key_holder': self.validated_data.get('key_holder'),
        }

    def _save(self, request, token_holder=None):
        adapter = get_adapter()
        user = adapter.new_user(request)
        role = self.cleaned_data.get('role')
        user.username = self.cleaned_data.get('username')
        user.first_name = self.cleaned_data.get('first_name')
        user.last_name = self.cleaned_data.get('last_name')
        user.photo = self.cleaned_data.get('photo')
        user.token_holder = token_holder
        user.is_online = True
        user.save()
        adapter.save_user(request, user, self)
        user_group = Group.objects.get(name=role)
        user_group.user_set.add(user)
        return user

    def save(self, request):
        self.cleaned_data = self.get_cleaned_data()
        role = self.cleaned_data.get('role')
        token = self.validated_data.get('key_holder')
        if role == "teacher":
            if not token:
                raise PermissionDenied
            token_holder = KeyHolder.objects.filter(token=token)
            if not token_holder.exists():
                raise PermissionDenied
            return self._save(request, token_holder)
        return self._save(request)

class CustomLoginSerializer(LoginSerializer):
    """ Custom Login. Sets user as online once they logged in """
    def validate(self, attrs):
        username = attrs.get('username')
        email = attrs.get('email')
        password = attrs.get('password')
        user = self.get_auth_user(username, email, password)

        if not user:
            msg = _('Unable to log in with provided credentials.')
            raise exceptions.ValidationError(msg)

        # Did we get back an active user?
        self.validate_auth_user_status(user)

        # If required, is the email verified?
        if 'dj_rest_auth.registration' in settings.INSTALLED_APPS:
            self.validate_email_verification_status(user, email=email)
        ######################
        # This is a custom change. On login set user's field `is_online` to True
        user.is_online = True
        user.save()
        ######################
        attrs['user'] = user
        return attrs
