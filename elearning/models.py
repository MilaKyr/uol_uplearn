from django.core.exceptions import ValidationError
from django.db import models
from django.contrib.auth.models import AbstractUser
from elearning.validators import validate_course_duration, \
    validate_topic_duration


class User(AbstractUser):
    ROLE_CHOICES = (
        ('administrator', 'Administrator'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    )
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.EmailField()
    status = models.CharField(max_length=256, blank=True)
    role = models.CharField(max_length=15, choices=ROLE_CHOICES)
    photo = models.ImageField(null=True)


class Course(models.Model):
    teacher = models.ForeignKey(to=User, on_delete=models.CASCADE, related_name="courses")
    is_active = models.BooleanField(default=False)
    photo = models.ImageField()
    title = models.CharField(max_length=256)
    desc = models.CharField(max_length=512, name ="description")
    start_date = models.DateTimeField()
    created = models.DateTimeField(auto_now_add=True)
    duration = models.DurationField()

    class Meta:
        unique_together = ('teacher', 'title')

class Topic(models.Model):
    course = models.ForeignKey(to=Course, on_delete=models.CASCADE, related_name="topics")
    title = models.CharField(max_length=256)
    desc = models.CharField(max_length=512, name ="description")
    n_hours = models.DurationField(validators=[validate_topic_duration])

    class Meta:
        unique_together = ('course', 'title')


class StudyItem(models.Model):
    topic = models.ForeignKey(to=Topic, on_delete=models.CASCADE, related_name="study_lessons")
    course = models.ForeignKey(to=Course, on_delete=models.CASCADE, related_name="lessons")
    title = models.CharField(max_length=256)
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    deadline = models.DateTimeField(null=True)
    order = models.IntegerField()

    class Meta:
        unique_together = ('topic', 'title')


def course_topic_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT / user_<id>/<filename>
    return 'course_{0}/topic_{1}/{2}'.format( instance.item.topic.course.id, instance.item.id, filename)

class ItemContent(models.Model):
    TYPE_CHOICES = (
        ('text', 'Text'),
        ('image', 'image'),
        ('file', 'File'),
        ('video', 'Video'),
    )
    item = models.ForeignKey(to=StudyItem, on_delete=models.CASCADE, related_name="content")
    kind = models.CharField(max_length=24, choices=TYPE_CHOICES)
    img = models.ImageField(null=True, blank=True)
    text = models.TextField(null=True, blank=True)
    file = models.FileField(upload_to=course_topic_directory_path, null=True, blank=True)
    video = models.FilePathField(path="media/video", null=True, blank=True)
    order = models.IntegerField()

class Feedback(models.Model):
    user = models.ForeignKey(to=User, on_delete=models.DO_NOTHING)
    course = models.ForeignKey(to=Course, on_delete=models.CASCADE, related_name="feedback")
    text = models.CharField(max_length=256)
    created = models.DateTimeField(auto_now_add=True)
    rating = models.IntegerField()

    class Meta:
        unique_together = ('user', 'course')

class CourseEnrollment(models.Model):
    STATUS_CHOICES = (
        ('started', 'In Progress'),
        ('finished', 'Done'),
    )
    user = models.ForeignKey(to=User, on_delete=models.CASCADE, related_name="enrollment")
    course = models.ForeignKey(to=Course, on_delete=models.CASCADE, related_name="registered_students")
    created = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=25, choices=STATUS_CHOICES)

    class Meta:
        unique_together = ('user', 'course')


class CourseProgress(models.Model):
    enrolled_student = models.ForeignKey(to=CourseEnrollment, on_delete=models.CASCADE, related_name="progress")
    item = models.ForeignKey(to=StudyItem, on_delete=models.CASCADE, related_name="item_done_status")

    class Meta:
        unique_together = ('enrolled_student', 'item')