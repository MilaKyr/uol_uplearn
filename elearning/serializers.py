from django.db.models import Avg
from rest_framework import serializers

from elearning.models import Course, User, Feedback, StudyItem, Topic, ItemContent


class UserSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField()
    role = serializers.ReadOnlyField()
    photo = serializers.ImageField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'role', 'photo']



class FeedbackSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)

    class Meta:
        model = Feedback
        fields = ['text', 'rating', 'student']
        read_only_fields = ['created']

class CourseLessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyItem
        fields = ['title']

class CourseTopicSerializer(serializers.ModelSerializer):
    study_lessons = CourseLessonSerializer(many=True)

    class Meta:
        model = Topic
        fields = ['title', 'n_hours', 'study_lessons']


class CourseSerializer(serializers.ModelSerializer):
    teacher = UserSerializer(read_only=True)
    topics = CourseTopicSerializer(many=True, read_only=True)
    feedback = FeedbackSerializer(many=True, read_only=True)
    photo = serializers.ImageField()

    class Meta:
        model = Course
        fields = ['id','title', 'is_active', 'desc', 'start_date', 'duration', 'photo', 'teacher', 'topics',
                  'feedback', 'created']
        ordering = ['-created']


class CourseShortSerializer(serializers.ModelSerializer):
    average_rating = serializers.SerializerMethodField()

    def get_average_rating(self, instance):
        return instance.average_rating

    class Meta:
        model = Course
        fields = ['id', 'title', 'start_date', 'photo',
                  'average_rating', 'created']


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
        ordering = ["id"]


class LessonSerializer(serializers.ModelSerializer):
    topic = serializers.SlugRelatedField(
        read_only=True,
        slug_field="id"
    )
    content = LessonContentSerializer(many=True)

    class Meta:
        model = StudyItem
        fields = ['topic', 'id', 'title', 'content',
                  'created', 'modified', 'order']
        ordering = ["order"]