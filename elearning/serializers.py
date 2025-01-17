from django.contrib.auth.models import Group
from django.db.models import Avg
from rest_framework import serializers, fields
from allauth.account.adapter import get_adapter
from dj_rest_auth.registration.serializers import RegisterSerializer

from elearning.models import Course, User, Feedback, StudyItem, Topic, ItemContent, CourseProgress, CourseEnrollment


class StudentSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField()
    photo = serializers.ImageField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'photo', 'status']

class StudentShortSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField()

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'photo']

class RegisteredStudentShortSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    first_name = serializers.SerializerMethodField()
    last_name = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()


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

    class Meta:
        model = Feedback
        fields = ['id', 'text', 'rating', 'user', 'created']

class CourseFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['photo', 'title']

class CourseCreateFeedback(serializers.Serializer):
    course_id = serializers.IntegerField()
    text = serializers.CharField()
    created = serializers.ReadOnlyField()
    rating = serializers.IntegerField()

    class Meta:
        model = Feedback

    def validate(self, data):
        """
        Check that student didn't write the feedback for given course
        """
        student_id = self.context["student_id"]
        course_id = data["course_id"]
        query = Feedback.objects.filter(user__id=student_id, course__id=course_id)
        if query.exists():
            raise serializers.ValidationError("User already created a feedback")
        return data


    def create(self, validated_data):
        course_id = validated_data.pop('course_id')
        student_id = self.context.pop('student_id')
        student = User.objects.get(id=student_id)
        course = Course.objects.get(id=course_id)
        feedback = Feedback.objects.create(user=student, course=course, **validated_data)
        return feedback



class StudentFeedbackSerializer(FeedbackSerializer):
    course = CourseFeedbackSerializer(read_only=True)
    created = serializers.ReadOnlyField()

    class Meta:
        model = Feedback
        fields = ['text', 'rating', 'course', 'created']

class CourseLessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyItem
        fields = ['title']

class CourseTopicSerializer(serializers.ModelSerializer):
    study_lessons = CourseLessonSerializer(many=True)

    class Meta:
        model = Topic
        fields = ['title', 'n_hours', 'study_lessons']


class CourseShortSerializer(serializers.ModelSerializer):
    average_rating = serializers.SerializerMethodField()
    n_students = serializers.SerializerMethodField()

    def get_average_rating(self, instance):
        return instance.average_rating

    def get_n_students(self, instance):
        return instance.n_students

    class Meta:
        model = Course
        fields = ['id', 'title', 'start_date', 'photo',
                  'average_rating', 'n_students', 'created']

class CourseOwnerShortSerializer(serializers.ModelSerializer):
    average_rating = serializers.SerializerMethodField()
    registered_students = RegisteredStudentShortSerializer(many=True, read_only=True)

    def get_average_rating(self, instance):
        return instance.average_rating


    class Meta:
        model = Course
        fields = ['id', 'title', 'start_date', 'photo', 'is_active',
                  'average_rating', 'registered_students', 'created']

class TeacherSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField()
    photo = serializers.SerializerMethodField()

    def get_photo(self, instance):
        return instance.photo.url

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'photo']

class CourseSerializer(serializers.ModelSerializer):
    teacher = TeacherSerializer(read_only=True)
    topics = CourseTopicSerializer(many=True, read_only=True)
    feedback = FeedbackSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    photo = serializers.SerializerMethodField()

    def get_average_rating(self, instance):
        return instance.average_rating

    def get_photo(self, instance):
        return instance.photo.url

    class Meta:
        model = Course
        fields = ['id','title', 'is_active', 'desc', 'start_date', 'duration', 'photo', 'teacher', 'topics',
                  'feedback', 'average_rating', 'created']
        ordering = ['-created']

    def create(self, validated_data):
        teacher = self.context.pop("teacher")
        course = Course.objects.create(teacher=teacher, **validated_data)
        return course


class CourseCreateSerializer(serializers.ModelSerializer):
    teacher_id = serializers.IntegerField()

    class Meta:
        model = Course
        fields = ["teacher_id", "is_active", "photo", "title", "desc",
                  "start_date", "duration"]

    def create(self, validated_data):
        teacher_id = validated_data.pop("teacher_id")
        teacher = User.objects.get(id=teacher_id)
        course = Course.objects.create(teacher=teacher, **validated_data)
        return course




class LessonContentSerializer(serializers.ModelSerializer):
    img = serializers.ImageField()
    file = serializers.FileField()
    video = serializers.FilePathField(path="media/video")

    class Meta:
        model = ItemContent
        fields = ['id', 'order', 'kind', 'img',
                  'text', 'file', 'video']
        ordering = ["order"]


class TopicLessonSerializer(serializers.ModelSerializer):
    content = LessonContentSerializer(many=True)
    order = serializers.IntegerField()

    class Meta:
        model = StudyItem
        fields = ['id', 'title', 'content',
                  'created', 'modified', 'order']
        ordering = ["order"]



class TopicSerializer(serializers.ModelSerializer):
    study_lessons = TopicLessonSerializer(many=True, read_only=True)

    class Meta:
        model = Topic
        fields = ['id', 'title', 'desc', 'n_hours',
                  'study_lessons']


class TopicCreateSerializer(serializers.Serializer):
    course_id = serializers.IntegerField()
    title = serializers.CharField()
    desc = serializers.CharField()
    n_hours = serializers.DurationField()

    def create(self, validated_data):
        course_id = validated_data.pop('course_id')
        course = Course.objects.get(id=course_id)
        topic = Topic.objects.create(course=course, **validated_data)
        return topic


class LessonSerializer(serializers.ModelSerializer):
    topic = serializers.SlugRelatedField(
        read_only=True,
        slug_field="id"
    )
    content = LessonContentSerializer(many=True, read_only=True)

    class Meta:
        model = StudyItem
        fields = ['topic', 'id', 'title', 'content', 'deadline',
                  'created', 'modified', 'order']
        ordering = ["order"]

class LessonContentCreateSerializer(serializers.ModelSerializer):
    lesson_id = serializers.IntegerField()

    class Meta:
        model = ItemContent
        fields = ["lesson_id", "kind", "img", "text", "file", "video", "order"]

    def create(self, validated_data):
        lesson_id = validated_data.pop('lesson_id')
        lesson = StudyItem.objects.get(id=lesson_id)
        content = ItemContent.objects.create(item=lesson, **validated_data)
        return content


class LessonCreateSerializer(serializers.Serializer):
    topic_id = serializers.IntegerField()
    title = serializers.CharField()
    created = serializers.ReadOnlyField()
    modified = serializers.ReadOnlyField()
    order = serializers.IntegerField()

    class Meta:
        model = StudyItem

    def create(self, validated_data):
        topic_id = validated_data.pop('topic_id')
        topic = Topic.objects.get(id=topic_id)
        lesson = StudyItem.objects.create(topic=topic, **validated_data)
        return lesson

class LessonContentOrderSerializer(serializers.Serializer):
    order_changes = serializers.DictField(child=fields.IntegerField(),
                                          allow_empty=False)

    def validate(self, data):
        """
        Check that student didn't write the feedback for given course
        """
        lesson_id = self.context["lesson_id"]
        contents = (StudyItem.objects
                    .prefetch_related("content")
                    .filter(id=lesson_id)
                    .values_list("content__id")
                    .distinct())
        contents = [str(idx) for data in contents for idx in data]
        changes = data["order_changes"]
        if sorted(contents) == sorted(changes.keys()):
            if list(range(len(contents))) == sorted(changes.values()):
                return data
            raise serializers.ValidationError("Ordering must be sequential")
        raise serializers.ValidationError("Ordering must contain all lesson's content IDs")


    def update(self, instance, validated_data):
        changes = validated_data.pop("order_changes")
        lesson_id = self.context["lesson_id"]
        lesson = (StudyItem.objects
                    .get(id=lesson_id))
        for (content_id, order_n) in changes.items():
            content = ItemContent.objects.get(id=int(content_id))
            content.order = order_n + 1
            content.save()
        return lesson

class LessonOrderSerializer(serializers.Serializer):
    order_changes = serializers.DictField(child=fields.IntegerField(),
                                          allow_empty=False)

    def validate(self, data):
        """
        Check that student didn't write the feedback for given course
        """
        topic_id = self.context["topic_id"]
        lessons = (StudyItem.objects
                    .select_related("topic")
                    .filter(topic__id=topic_id)
                    .values_list("id")
                    .distinct())
        lessons = [str(idx) for data in lessons for idx in data]
        changes = data["order_changes"]
        if sorted(lessons) == sorted(changes.keys()):
            if list(range(len(lessons))) == sorted(changes.values()):
                return data
            raise serializers.ValidationError("Ordering must be sequential")
        raise serializers.ValidationError("Ordering must contain all lesson's content IDs")


    def update(self, instance, validated_data):
        changes = validated_data.pop("order_changes")
        topic_id = self.context["topic_id"]
        for (content_id, order_n) in changes.items():
            lesson = (StudyItem.objects
                       .select_related("topic")
                       .get(id=int(content_id), topic__id=topic_id))
            lesson.order = order_n + 1
            lesson.save()
        return instance


class CustomRegisterSerializer(RegisterSerializer):
    ROLE_CHOICES = (
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    )
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    photo = serializers.ImageField(required=True)
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
        role_name = "Teacher" if user.role == "teacher" else "Student"
        user.save()
        adapter.save_user(request, user, self)
        user_group = Group.objects.get(name=role_name)
        user_group.user_set.add(user)
        return user



class CourseWithProgressShortSerializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField()
    enrolled = serializers.SerializerMethodField()

    def get_enrolled(self, instance):
        done = self.context.get("done")
        enrolled = [enrolled for (course_id, enrolled, _) in done
                          if course_id == instance.id]
        return enrolled.pop()

    def get_progress(self, instance):
        if instance.overall == 0:
            return 0.0

        done = self.context.get("done")
        done_in_course = [done for (course_id, _, done) in done
                          if course_id == instance.id]
        return done_in_course[0] / instance.overall if len(done_in_course) == 1 else 0


    class Meta(CourseShortSerializer.Meta):
        fields = ['id', 'title', 'photo', 'enrolled', 'progress',]

class TodoSerializer(serializers.ModelSerializer):
    topic_title = serializers.SerializerMethodField()

    def get_topic_name(self, instance):
        return instance.topic.title

    class Meta:
        model = StudyItem
        fields = ["topic_title", "title", "deadline", "order"]

class TodoListSerializer(serializers.Serializer):
    course_id = serializers.SerializerMethodField()
    course_title = serializers.SerializerMethodField()
    topic_title = serializers.SerializerMethodField()
    topic_id = serializers.SerializerMethodField()
    id = serializers.SerializerMethodField()
    title = serializers.SerializerMethodField()
    deadline = serializers.SerializerMethodField()
    order = serializers.SerializerMethodField()

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

    def get_order(self, instance):
        return instance["order"]

    class Meta:
        fields = ["course_id", "course_title",
                  "topic_id", "topic_title",
                  "id", "title",
                  "deadline", "order"]


class CreateProgressSerializer(serializers.ModelSerializer):
    course_id = serializers.IntegerField()

    class Meta:
        model = CourseProgress
        fields = ["course_id"]

    def update(self, instance, validated_data):
        student_id = self.context.get("student_id")
        course_id = validated_data.pop('course_id')
        course = Course.objects.get(id=course_id)
        enrollment = CourseEnrollment.objects.get(user__id=student_id, course=course)
        course_progress = CourseProgress.objects.create(enrolled_student=enrollment, item=instance)
        return course_progress