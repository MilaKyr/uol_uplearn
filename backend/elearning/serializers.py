import base64
from django.contrib.auth.models import Group
from django.db import transaction, IntegrityError
from rest_framework import serializers
from allauth.account.adapter import get_adapter
from dj_rest_auth.registration.serializers import RegisterSerializer
from dj_rest_auth.serializers import LoginSerializer
from rest_framework.exceptions import ValidationError
from rest_framework import exceptions, serializers
from django.conf import settings

from backend.elearning import Course, User, Feedback, Lesson, Topic, CourseProgress, CourseEnrollment, \
    Tag, Files, Notification
from backend.elearning import validate_course_duration, feedback_between_1_5, validate_start_date, \
    validate_topic_duration


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = "__all__"


class PhotoSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField()

    class Meta:
        model = User
        fields = ['photo']

class StatusSerializer(serializers.ModelSerializer):
    status = serializers.CharField()

    class Meta:
        model = User
        fields = ['status']


class TeacherSerializer(serializers.ModelSerializer):
    photo = serializers.SerializerMethodField(required=False, allow_null=True)

    def get_photo(self, instance):
        if instance.photo is not None and instance.photo != "":
            with open(instance.photo.path, "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read())
                return encoded_string
        return ""

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'photo', "role", "email", "bio", 'is_online']

class CourseTeacherSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    photo = serializers.SerializerMethodField(required=False, allow_null=True)

    def get_name(self, instance):
        return f'{instance.first_name} {instance.last_name}'

    def get_photo(self, instance):
        with open(instance.photo.path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read())
            return encoded_string

    class Meta:
        model = User
        fields = ['id', 'name', 'photo']

class NameSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField()
    last_name = serializers.CharField()

    class Meta:
        model = User
        fields = ['first_name', 'last_name']


class EmailSerializer(serializers.ModelSerializer):
    email = serializers.EmailField()

    class Meta:
        model = User
        fields = ['email']


class BioSerializer(serializers.ModelSerializer):
    bio = serializers.CharField()

    class Meta:
        model = User
        fields = ['bio']

class StudentSerializer(serializers.ModelSerializer):
    photo = serializers.SerializerMethodField()


    def get_photo(self, instance):
        with open(instance.photo.path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read())
            return encoded_string

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'photo', 'status', "role", "email", 'is_online']


class RegisteredStudentSerializer(serializers.ModelSerializer):
    photo = serializers.SerializerMethodField()
    first_name = serializers.SerializerMethodField()
    last_name = serializers.SerializerMethodField()

    def get_first_name(self, instance):
        return instance.user.first_name

    def get_last_name(self, instance):
        return instance.user.last_name

    def get_photo(self, instance):
        with open(instance.user.photo.path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read())
            return encoded_string

    class Meta:
        model = CourseEnrollment
        fields = ['id', 'first_name', 'last_name', 'photo', 'status']

class StudentShortSerializer(serializers.ModelSerializer):
    photo = serializers.SerializerMethodField()
    first_name = serializers.SerializerMethodField()
    last_name = serializers.SerializerMethodField()
    id = serializers.SerializerMethodField()

    def get_id(self, instance):
        return instance.user.id

    def get_first_name(self, instance):
        return instance.user.first_name

    def get_last_name(self, instance):
        return instance.user.last_name

    def get_photo(self, instance):
        with open(instance.user.photo.path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read())
            return encoded_string

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'photo']

class RegisteredStudentShortSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    first_name = serializers.SerializerMethodField()
    last_name = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField(required=False)


    def get_id(self, instance):
        return instance.user.id

    def get_first_name(self, instance):
        return instance.user.first_name

    def get_last_name(self, instance):
        return instance.user.last_name

    def get_photo_url(self, instance):
        return instance.user.photo.url


    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'photo_url']

class FeedbackSerializer(serializers.ModelSerializer):
    user = StudentShortSerializer(read_only=True)
    created = serializers.ReadOnlyField()
    rating = serializers.IntegerField(validators=[feedback_between_1_5])

    class Meta:
        model = Feedback
        fields = ['id', 'text', 'rating', 'user', 'created']

class CourseFeedbackSerializer(serializers.ModelSerializer):
    photo = serializers.SerializerMethodField()

    def get_photo(self, instance):
        with open(instance.photo.path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read())
            return encoded_string

    class Meta:
        model = Course
        fields = ['id', 'photo', 'title']

class CourseCreateFeedback(serializers.Serializer):
    course_id = serializers.IntegerField()
    text = serializers.CharField()
    created = serializers.ReadOnlyField()
    rating = serializers.IntegerField(validators=[feedback_between_1_5])

    class Meta:
        model = Feedback

    def create(self, validated_data):
        course_id = validated_data.pop('course_id')
        student_id = self.context.pop('student_id')
        student = User.objects.get(id=student_id)
        course = Course.objects.get(id=course_id)
        course_enrollment = CourseEnrollment.objects.get(user=student, course=course)
        feedback = Feedback.objects.create(user=course_enrollment, course=course, **validated_data)
        return feedback



class StudentFeedbackSerializer(FeedbackSerializer):
    course = CourseFeedbackSerializer(read_only=True)

    class Meta:
        model = Feedback
        fields = ['id','text', 'rating', 'course', 'created']


class CourseLessonSerializer(serializers.ModelSerializer):
    deadline = serializers.DateTimeField()
    has_files = serializers.SerializerMethodField()
    done = serializers.SerializerMethodField()

    def get_done(self, _):
        return self.context.get("done")

    def get_has_files(self, instance):
        return len(instance.files.all()) > 0

    class Meta:
        model = Lesson
        fields = ['id', 'title', "created", "deadline", "html", "has_files", 'done']

class LessonEditContentSerializer(serializers.ModelSerializer):
    html = serializers.CharField()

    class Meta:
        model = Lesson
        fields = [ "html"]


class LessonFilesSerializer(serializers.ModelSerializer):
    file = serializers.FileField()

    class Meta:
        model = Lesson
        fields = ["file"]


    def update(self, instance, validated_data):
        file = validated_data.pop("file")
        with transaction.atomic():
            model_file = Files.objects.create(file=file)
            instance.files.add(model_file)
        return instance


class CourseTopicSerializer(serializers.ModelSerializer):
    lessons = CourseLessonSerializer(many=True)

    class Meta:
        model = Topic
        fields = ['id','title', 'description', 'n_hours', 'lessons']


class CourseShortSerializer(serializers.ModelSerializer):
    teacher = CourseTeacherSerializer()
    average_rating = serializers.SerializerMethodField()
    photo = serializers.SerializerMethodField()
    n_students = serializers.SerializerMethodField()
    # registered_students = StudentSerializer(many=True)
    tags = TagSerializer(many=True)

    def get_photo(self, instance):
        with open(instance.photo.path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read())
            return encoded_string

    def get_average_rating(self, instance):
        return instance.average_rating

    def get_n_students(self, instance):
        return instance.n_students

    class Meta:
        model = Course
        fields = ['id', 'title', 'start_date', 'photo', 'teacher', 'duration',
                  'average_rating', 'n_students', 'created', 'tags']

class CourseShortTeacherSerializer(serializers.ModelSerializer):
    average_rating = serializers.SerializerMethodField()
    photo = serializers.SerializerMethodField()
    n_students = serializers.SerializerMethodField()
    registered_students = serializers.SerializerMethodField()
    tags = TagSerializer(many=True)

    def get_registered_students(self, instance):
        students = instance.registered_students.filter(status__in=["started", "removed", "blocked"])
        serialized = RegisteredStudentSerializer(students, many=True)
        return serialized.data

    def get_photo(self, instance):
        with open(instance.photo.path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read())
            return encoded_string

    def get_average_rating(self, instance):
        return instance.average_rating

    def get_n_students(self, instance):
        return instance.n_students

    class Meta:
        model = Course
        fields = ['id', 'title', 'start_date', 'photo', 'registered_students', 'duration',
                  'average_rating', 'n_students', 'created', 'tags']

class CourseOwnerShortSerializer(serializers.ModelSerializer):
    average_rating = serializers.SerializerMethodField()
    registered_students = RegisteredStudentShortSerializer(many=True, read_only=True)

    def get_average_rating(self, instance):
        return instance.average_rating

    class Meta:
        model = Course
        fields = ['id', 'title', 'start_date', 'photo', 'is_active',
                  'average_rating', 'registered_students', 'created']






class CourseSerializer(serializers.ModelSerializer):
    teacher = TeacherSerializer(read_only=True)
    topics = CourseTopicSerializer(many=True, read_only=True)
    feedback = FeedbackSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    photo = serializers.SerializerMethodField()
    start_date = serializers.DateTimeField(validators=[validate_start_date])
    duration = serializers.DurationField(validators=[validate_course_duration])

    def get_average_rating(self, instance):
        return instance.average_rating

    def get_photo(self, instance):
        with open(instance.photo.path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read())
            return encoded_string

    class Meta:
        model = Course
        fields = ['id','title', 'is_active', 'description', 'start_date', 'duration', 'photo', 'teacher', 'topics',
                  'feedback', 'average_rating', 'created']
        ordering = ['-created']

    def create(self, validated_data):
        teacher = self.context.pop("teacher")
        course = Course.objects.create(teacher=teacher, **validated_data)
        return course





class TopicCreateSerializer(serializers.Serializer):
    course_id = serializers.IntegerField()
    title = serializers.CharField()
    description = serializers.CharField()
    n_hours = serializers.DurationField(validators=[validate_topic_duration])

    def create(self, validated_data):
        course_id = validated_data.pop('course_id')
        course = Course.objects.get(id=course_id)
        topic = Topic.objects.create(course=course, **validated_data)
        return topic

class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = ['id', 'title', 'description', 'n_hours',]

class LessonSerializer(serializers.ModelSerializer):
    done = serializers.SerializerMethodField()

    def get_done(self, instance):
        user_id = self.context.get("user_id")
        return instance.lesson_status.filter(enrolled_student__user__id=user_id).exists()

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'html', 'deadline', 'done']



class LessonContentCreateSerializer(serializers.ModelSerializer):
    lesson_id = serializers.IntegerField()
    img = serializers.ImageField(required=False)
    video = serializers.FileField(required=False)
    text = serializers.CharField(required=False)
    file = serializers.FileField(required=False)

    class Meta:
        model = Lesson
        fields = "__all__"

    def validate(self, data):
        """
        Validation of start and end date.
        """
        has_image = "img" in data
        has_text = "text" in data
        has_file = "file" in data
        has_video = "video" in data
        image_exists = has_image and data["img"] != ""
        if data["kind"] == "image" and not image_exists and (has_text or has_file or has_video):
            raise serializers.ValidationError("Image not found and cannot be empty")
        text_exists = has_text and data["text"] != ""
        if data["kind"] == "text" and not text_exists and (has_image or has_file or has_video):
            raise serializers.ValidationError("Text not found and cannot be empty")
        video_exists = has_video and data["video"] != ""
        if data["kind"] == "video" and not video_exists and (has_image or has_file or has_text):
            raise serializers.ValidationError("Video not found and cannot be empty")
        file_exists = has_file and data["file"] != ""
        if data["kind"] == "file" and not file_exists and (has_image or has_video or has_text):
            raise serializers.ValidationError("File not found and cannot be empty")

        return data

    def create(self, validated_data):
        lesson_id = validated_data.pop('lesson_id')
        lesson = Lesson.objects.get(id=lesson_id)
        return lesson


class LessonCreateSerializer(serializers.Serializer):
    topic_id = serializers.IntegerField()
    course_id = serializers.IntegerField()
    title = serializers.CharField()
    created = serializers.ReadOnlyField()
    modified = serializers.ReadOnlyField()

    class Meta:
        model = Lesson

    def create(self, validated_data):
        topic_id = validated_data.pop('topic_id')
        topic = Topic.objects.get(id=topic_id)
        course_id = validated_data.pop('course_id')
        course = Course.objects.get(id=course_id)
        latest = Lesson.get_next_order_number(course.id)
        print("latest", latest)
        lesson = Lesson.objects.create(topic=topic, course=course,
                                          order=latest+1,**validated_data)
        return lesson


class CustomRegisterSerializer(RegisterSerializer):
    ROLE_CHOICES = (
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    )
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    photo = serializers.ImageField(required=False)
    role = serializers.ChoiceField(ROLE_CHOICES)


    class Meta:
        model = User
        fields = ['email', 'username', 'first_name',
                  'last_name', 'password1', 'password2', 'photo', 'role']

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

        }

    def save(self, request):
        adapter = get_adapter()
        user = adapter.new_user(request)
        self.cleaned_data = self.get_cleaned_data()
        user.username = self.cleaned_data.get('username')
        user.first_name = self.cleaned_data.get('first_name')
        user.last_name = self.cleaned_data.get('last_name')
        user.role = self.cleaned_data.get('role')
        user.photo = self.cleaned_data.get('photo')
        role_name = "teacher" if user.role == "teacher" else "student"
        user.is_online = True
        user.save()
        adapter.save_user(request, user, self)
        user_group = Group.objects.get(name=role_name)
        user_group.user_set.add(user)
        return user


class CourseWithProgressShortSerializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField()
    enrolled = serializers.SerializerMethodField()
    photo = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    def get_status(self, instance):
        done = self.context.get("done")
        user_id = [user_id for (course_id, user_id, _, _,) in done
                    if course_id == instance.id]
        if len(user_id) > 0:
            return instance.registered_students.get(user__id=user_id[0]).status
        raise BaseException


    def get_photo(self, instance):
        if instance.photo is not None:
            with open(instance.photo.path, "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read())
                return encoded_string
        return ""

    def get_enrolled(self, instance):
        done = self.context.get("done")
        enrolled = [enrolled for (course_id, _, enrolled, _,) in done
                          if course_id == instance.id]
        return enrolled.pop() if len(enrolled) > 0 else ""

    def get_progress(self, instance):
        if instance.overall == 0:
            return 0.0

        done = self.context.get("done")
        done_in_course = [done for (course_id, _, _, done) in done
                          if course_id == instance.id]
        return done_in_course[0] / instance.overall if len(done_in_course) == 1 else 0.0

    class Meta(CourseShortSerializer.Meta):
        model = Course
        fields = ['id',  'title', 'photo', 'enrolled', 'progress', 'status']

class TodoListSerializer(serializers.Serializer):
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
        return instance["deadline"]


    class Meta:
        fields = ["course_id", "course_title",
                  "topic_id", "topic_title",
                  "id", "title",
                  "deadline"]


class CreateProgressSerializer(serializers.ModelSerializer):

    class Meta:
        model = CourseProgress
        fields = []

    def update(self, instance, validated_data):
        try:
            student_id = self.context.get("student_id")
            course = Course.objects.get(id = instance.course.id)
            enrollment = CourseEnrollment.objects.get(user__id=student_id, course=course)
            course_progress = CourseProgress.objects.create(enrolled_student=enrollment, item=instance)
            return course_progress
        except (Course.DoesNotExist, CourseEnrollment.DoesNotExist,
                CourseProgress.DoesNotExist) as e:
            raise ValidationError("instance doesn't exist")




class LessonCreateSerializer2(serializers.ModelSerializer):
    title = serializers.CharField()
    deadline = serializers.CharField()

    class Meta:
        model = Lesson
        fields = ["title", "deadline"]


class TopicCreateSerializer2(serializers.Serializer):
    title = serializers.CharField()
    description = serializers.CharField()
    n_hours = serializers.IntegerField()
    lessons = LessonCreateSerializer2(many=True)


class CourseCreateSerializer(serializers.Serializer):
    teacher = TeacherSerializer(read_only=True)
    title = serializers.CharField()
    description = serializers.CharField()
    start_date = serializers.DateTimeField()
    end_date = serializers.DateTimeField()
    tags = serializers.ListSerializer(child=serializers.CharField())
    topics = TopicCreateSerializer2(many=True)


    def create(self, validated_data):
        print(validated_data)
        teacher = self.context.pop("teacher")
        course_tags = validated_data.pop('tags')
        model_tags = []
        try:
            with transaction.atomic():
                for tag in course_tags:
                    model_tag, _ = Tag.objects.get_or_create(name=tag)
                    model_tags.append(model_tag)
                duration = validated_data.pop('end_date') - validated_data.get('start_date')
                new_course = Course(teacher=teacher,
                                    title=validated_data.pop('title'),
                                    description=validated_data.pop('description'),
                                    start_date=validated_data.pop('start_date'),
                                    duration = duration,
                )
                new_course.save()
                new_course.tags.add(*model_tags)
                with transaction.atomic():
                    topics = validated_data.pop('topics')
                    for topic in topics:
                        model_topic = Topic.objects.create(course=new_course,
                                                     title=topic["title"],
                                                     description=topic["description"],
                                                     n_hours=topic["n_hours"]
                                                     )
                        for lesson in topic["lessons"]:
                            _ = Lesson.objects.create(
                                topic=model_topic,
                                course=new_course,
                                title=lesson["title"],
                                deadline=lesson["deadline"]
                            )
                return new_course
        except IntegrityError:
            raise BaseException

class CoursePhotoSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField()

    class Meta:
        model = Course
        fields = ['photo']


class CourseEditSerializer(serializers.ModelSerializer):
    topics = CourseTopicSerializer(many=True, read_only=True)
    start_date = serializers.DateTimeField()
    duration = serializers.DurationField()
    tags = TagSerializer(many=True)
    photo = serializers.SerializerMethodField()

    def get_photo(self, instance):
        with open(instance.photo.path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read())
            return encoded_string

    class Meta:
        model = Course
        fields = ['id','title', 'is_active', 'description', 'start_date', 'duration', 'topics',
                  'photo', 'created', 'tags']
        ordering = ['-created']


class AuthUserSerializer(serializers.ModelSerializer):
    photo = serializers.SerializerMethodField()

    def get_photo(self, instance):
        if instance.photo is not None and instance.photo != "":
            with open(instance.photo.path, "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read())
                return encoded_string
        return ""

    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'photo', 'role', 'is_online')


class CourseBasicSerializer(serializers.ModelSerializer):
    photo = serializers.SerializerMethodField()

    def get_photo(self, instance):
        if instance.photo is not None:
            with open(instance.photo.path, "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read())
                return encoded_string
        return ""

    class Meta:
        model = Course
        fields = ('id', 'title', 'photo')

class CourseTitleSerializer(serializers.ModelSerializer):

    class Meta:
        model = Course
        fields = ('id', 'title')

class NotificationSerializer(serializers.ModelSerializer):
    person = AuthUserSerializer()
    course = CourseBasicSerializer()

    class Meta:
        model = Notification
        fields = ('id', 'person', 'course', 'text', 'created', 'seen')

class NotificationSeenSerializer(serializers.Serializer):
    ids = serializers.ListSerializer(child=serializers.IntegerField(), min_length=1)

    def create(self, validated_data):
        sampled_notification = None
        ids = validated_data.pop("ids")
        with transaction.atomic():
            for ind in ids:
                notification = Notification.objects.get(id=ind)
                notification.seen = True
                notification.save()
                if sampled_notification is None:
                    sampled_notification = notification
        return sampled_notification

class BasicUserSerializer(serializers.ModelSerializer):
    photo = serializers.SerializerMethodField()

    def get_photo(self, instance):
        if instance.photo is not None:
            with open(instance.photo.path, "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read())
                return encoded_string
        return ""

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'role', 'photo', 'is_online']

class EnrolledUserSerializer(serializers.ModelSerializer):
    first_name = serializers.SerializerMethodField()
    last_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    photo = serializers.SerializerMethodField()

    def get_first_name(self, instance):
        return instance.user.first_name

    def get_last_name(self, instance):
        return instance.user.last_name

    def get_role(self, instance):
        return instance.user.role

    def get_photo(self, instance):
        if instance.user.photo is not None and instance.user.photo != "":
            with open(instance.user.photo.path, "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read())
                return encoded_string
        return ""

    class Meta:
        model = CourseEnrollment
        fields = ['id', 'first_name', 'last_name', 'role', 'photo', 'status']

class EnrollmentBlockSerializer(serializers.Serializer):
    block = serializers.BooleanField()

    def update(self, instance, validated_data):
        block = validated_data.pop('block')
        if instance.status != "finished":
            if block:
                instance.status = "blocked"
                instance.save()
            else:
                instance.status = "started"
                instance.save()
        return instance


class EnrollmentRemoveSerializer(serializers.Serializer):

    def update(self, instance, validated_data):
        instance.status = "removed"
        return instance


class CustomLoginSerializer(LoginSerializer):
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
        user.is_online = True
        user.save()
        attrs['user'] = user
        return attrs
