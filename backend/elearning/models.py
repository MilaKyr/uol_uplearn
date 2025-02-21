import os
import random

from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLE_CHOICES = (
        ('administrator', 'Administrator'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    )
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.EmailField()
    status = models.CharField(max_length=256, blank=True, null=True)
    role = models.CharField(max_length=15, choices=ROLE_CHOICES)
    photo = models.ImageField(null=True)
    bio = models.TextField(null=True)
    is_online = models.BooleanField(default=False)

def generate_random_color():
    r = lambda: random.randint(0, 255)
    return'#%02X%02X%02X' % (r(), r(), r())

class Tag(models.Model):
    name = models.CharField(max_length=256, unique=True)
    color = models.CharField(max_length=24, default=generate_random_color)

class Course(models.Model):
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
    course = models.ForeignKey(to=Course, on_delete=models.CASCADE, related_name="topics")
    title = models.CharField(max_length=256)
    desc = models.TextField(name ="description")
    n_hours = models.IntegerField()

    class Meta:
        unique_together = ('course', 'title')

def course_topic_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT / user_<id>/<filename>
    return f'files/{filename}'


class Files(models.Model):
    file = models.FileField(upload_to=course_topic_directory_path)

    def filename(self):
        return os.path.basename(self.file.name)

class Lesson(models.Model):
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
    user = models.ForeignKey(to=User, on_delete=models.CASCADE, related_name="enrollment")
    course = models.ForeignKey(to=Course, on_delete=models.CASCADE, related_name="registered_students")
    created = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=25, choices=STATUS_CHOICES)

    class Meta:
        unique_together = ('user', 'course')


class Feedback(models.Model):
    user = models.ForeignKey(to=CourseEnrollment, on_delete=models.CASCADE, related_name="feedback")
    course = models.ForeignKey(to=Course, on_delete=models.CASCADE, related_name="feedback")
    text = models.CharField(max_length=256)
    created = models.DateTimeField(auto_now_add=True)
    rating = models.IntegerField()

    class Meta:
        unique_together = ('user', 'course')


class CourseProgress(models.Model):
    enrolled_student = models.ForeignKey(to=CourseEnrollment, on_delete=models.CASCADE, related_name="progress")
    item = models.ForeignKey(to=Lesson, on_delete=models.CASCADE, related_name="lesson_status")

    class Meta:
        unique_together = ('enrolled_student', 'item')

class Notification(models.Model):
    recipient = models.ForeignKey(to=User,  on_delete=models.CASCADE, related_name="recipient")
    person = models.ForeignKey(to=User, on_delete=models.DO_NOTHING, null=True, related_name="person")
    course = models.ForeignKey(to=Course, on_delete=models.CASCADE, null=True)
    text = models.CharField(max_length=250)
    created = models.DateTimeField(auto_now_add=True)
    seen = models.BooleanField(default=False)
