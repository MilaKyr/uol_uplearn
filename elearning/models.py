from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLE_CHOICES = (
        ('administrator', 'Administrator'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    )

    role = models.CharField(max_length=15, choices=ROLE_CHOICES)
    photo = models.ImageField()


class Course(models.Model):
    teacher = models.ForeignKey(to=User, on_delete=models.CASCADE)
    photo = models.ImageField()
    title = models.CharField(max_length=256)
    desc = models.CharField(max_length=512)
    start_date = models.DateTimeField()
    created = models.DateTimeField(auto_now_add=True)
    duration = models.DurationField()

class Topic(models.Model):
    course = models.ForeignKey(to=Course, on_delete=models.CASCADE)
    title = models.CharField(max_length=256)
    desc = models.DateTimeField()
    n_hours = models.DurationField()

class ContentType(models.Model):
    TYPE_CHOICES = (
        ('text', 'Text'),
        ('image', 'image'),
        ('file', 'File'),
        ('Video', 'Video'),
    )
    type = models.CharField(max_length=15, choices=TYPE_CHOICES)


class StudyItem(models.Model):
    topic = models.ForeignKey(to=Topic, on_delete=models.CASCADE)
    title = models.CharField(max_length=256)
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)


def course_topic_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT / user_<id>/<filename>
    return 'course_{0}/topic_{1}/{2}'.format( instance.topic.course.id, instance.topic.id, filename)

class ItemContent(models.Model):
    item = models.ForeignKey(to=StudyItem, on_delete=models.CASCADE)
    kind = models.ForeignKey(to=ContentType, on_delete=models.CASCADE)
    img = models.ImageField()
    text = models.TextField()
    file = models.FileField()
    video = models.FilePathField(path="media/video")
    order = models.IntegerField()

class Feedback(models.Model):
    user = models.ForeignKey(to=User, on_delete=models.DO_NOTHING)
    course = models.ForeignKey(to=Course, on_delete=models.CASCADE)
    text = models.CharField(max_length=256)
    created = models.DateTimeField(auto_now_add=True)
    rating = models.IntegerField()

class CourseProgress(models.Model):
    STATUS_CHOICES = (
        ('progress', 'In Progress'),
        ('done', 'Done'),
    )
    user = models.ForeignKey(to=User, on_delete=models.CASCADE)
    course = models.ForeignKey(to=Course, on_delete=models.CASCADE)
    item = models.ForeignKey(to=StudyItem, on_delete=models.CASCADE)
    status = models.CharField(max_length=25, choices=STATUS_CHOICES)

