import os
import random
import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class KeyHolder(models.Model):
    id = models.UUIDField(primary_key = True, default = uuid.uuid4, editable = False)
    name = models.CharField(max_length=150, unique=True)
    token = models.UUIDField(editable=False)

class User(AbstractUser):
    id = models.UUIDField(primary_key = True, default = uuid.uuid4, editable = False)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.EmailField()
    status = models.CharField(max_length=256, blank=True, null=True)
    photo = models.ImageField(null=True)
    bio = models.TextField(null=True)
    key_holder = models.ForeignKey(to=KeyHolder, on_delete=models.CASCADE, null=True)
    is_online = models.BooleanField(default=False)

    @property
    def full_name(self) -> str:
        """Returns the person's full name."""
        return f"{self.first_name} {self.last_name}"

    def is_student(self) -> bool:
        return self.groups.filter(name='student').exists()

    def is_teacher(self) -> bool:
        return self.groups.filter(name='teacher').exists()

def generate_random_color():
    r = lambda: random.randint(0, 255)
    return'#%02X%02X%02X' % (r(), r(), r())

class Tag(models.Model):
    name = models.CharField(max_length=256, unique=True)
    color = models.CharField(max_length=24, default=generate_random_color)

class Course(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey(to=User, on_delete=models.CASCADE, related_name="courses")
    is_active = models.BooleanField(default=False)
    photo = models.ImageField(null=True)
    title = models.CharField(max_length=256)
    desc = models.TextField(name ="description")
    start_date = models.DateTimeField()
    created = models.DateTimeField(auto_now_add=True)
    duration = models.DurationField()
    tags = models.ManyToManyField(Tag)

    class Meta:
        unique_together = ('teacher', 'title')

class Topic(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(to=Course, on_delete=models.CASCADE, related_name="topics")
    title = models.CharField(max_length=256)
    desc = models.TextField(name ="description")
    n_hours = models.IntegerField()

    class Meta:
        unique_together = ('course', 'title')

def course_topic_directory_path(instance, filename):
    date = timezone.now().strftime(format="%Y-%m-%d")
    return f'files/{date}/{filename}'


class Files(models.Model):
    file = models.FileField(upload_to=course_topic_directory_path)

    def filename(self):
        return os.path.basename(self.file.name)

class Lesson(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    topic = models.ForeignKey(to=Topic, on_delete=models.CASCADE, related_name="lessons")
    course = models.ForeignKey(to=Course, on_delete=models.CASCADE, related_name="lessons")
    title = models.CharField(max_length=256)
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    deadline = models.DateTimeField(null=True)
    html = models.TextField(null=True)
    files = models.ManyToManyField(Files, related_name="lesson")

    class Meta:
        unique_together = ('topic', 'title')


class CourseEnrollment(models.Model):
    STATUS_CHOICES = (
        ('started', 'In Progress'),
        ('finished', 'Done'),
        ('blocked', 'Blocked'),
        ('removed', 'Removed'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(to=User, on_delete=models.CASCADE, related_name="enrollment")
    course = models.ForeignKey(to=Course, on_delete=models.CASCADE, related_name="registered_students")
    created = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=25, choices=STATUS_CHOICES)
    done_lessons = models.ManyToManyField(Lesson, related_name="students")

    def __init__(self, *args, **kwargs) -> None:
        # saving the last status for signals to check if status changed and then send a notification
        super().__init__(*args, **kwargs)
        self.cached_status = self.status

    class Meta:
        unique_together = ('user', 'course')


class Feedback(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    enrollment = models.OneToOneField(to=CourseEnrollment, on_delete=models.CASCADE, related_name="feedback")
    text = models.CharField(max_length=256)
    created = models.DateTimeField(auto_now_add=True)
    rating = models.IntegerField()

