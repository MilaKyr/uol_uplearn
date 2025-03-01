import uuid

import pytest
from django.core.files.images import ImageFile
from django.db.models.signals import post_save
from django.utils import timezone
import datetime
from django.contrib.auth.models import Group
from notifications.models import Notification
from elearning.models import User, Course, Lesson, Feedback, CourseEnrollment, Topic, Tag, KeyHolder
from django.db.models import signals

COURSE_IMG_PATH = 'seeding/data/photos/courses/rubaitul-azad-ZIPFteu-R8k-unsplash_JRGhzsf.jpg'

@pytest.fixture
def key_holder():
    return KeyHolder.objects.create(name='some-name', token=uuid.uuid5(uuid.NAMESPACE_DNS, 'some-name'))

@pytest.fixture
def student_group():
    return Group.objects.create(name='student')

@pytest.fixture
def teacher_group():
    return Group.objects.create(name='teacher')

@pytest.fixture
def teacher(key_holder, teacher_group):
    teacher = User.objects.create(username="test_teacher",
                               key_holder=key_holder,
                               first_name="John", last_name="Smith",
                               email="abc@abc.com", password="Abc12345!",
                               bio="some bio")
    teacher.groups.add(teacher_group)
    return teacher

@pytest.fixture
def student(student_group):
    student = User.objects.create(username="student1", first_name="James", last_name="Johns",
                               email="abc@abc.com", password="12345678!!!")
    student.groups.add(student_group)
    return student

@pytest.fixture
def course(teacher, key_holder):
    now = timezone.now()
    return Course.objects.create(teacher=teacher,
                                 photo=ImageFile(open(COURSE_IMG_PATH, "rb")),
                                 title="Title",
                                 description="Description", start_date=datetime.datetime.now(tz=now.tzinfo),
                                 duration=datetime.timedelta(hours=20))

@pytest.fixture
def active_course(teacher):
    now = timezone.now()
    return Course.objects.create(teacher=teacher, photo=ImageFile(open(COURSE_IMG_PATH, "rb")), title="Title",
                                 is_active=True,
                                 description="Description", start_date=datetime.datetime.now(tz=now.tzinfo),
                                 duration=datetime.timedelta(hours=20))

@pytest.fixture
def registered_student(student, course):
    return CourseEnrollment.objects.create(user=student, course=course,
                                           status="started")

@pytest.fixture
def topic(course):
    return Topic.objects.create(course=course, title="Topic title",
                                    description="Topic description",
                                    n_hours=20)

@pytest.fixture
def lesson(topic, course):
    now = timezone.now()
    deadline = now + datetime.timedelta(days=1)
    return Lesson.objects.create(topic=topic, course=course, title="Item title",
                                    deadline=deadline)

@pytest.fixture
def lessons(topic, course, lesson):
    Lesson.objects.create(topic=topic, course=course, title="Item title 2",)
    return Lesson.objects.all()

@pytest.fixture
def enrolled_student(student, course):
    return CourseEnrollment.objects.create(user=student, course=course, status="started")

@pytest.fixture
def feedback(enrolled_student, course):
    return Feedback.objects.create(user=enrolled_student, course=course,
                                   text="test", rating=5)

@pytest.fixture
def notification(course, teacher):
    signals.post_save.receivers = []
    inst =  Notification.objects.create(
        recipient=course.teacher, course=course, person=course.teacher, text="test", seen=False)
    return inst

@pytest.fixture
def tag():
    return Tag.objects.create(name="test")

@pytest.fixture
def active_course_tag(teacher, tag):
    now = timezone.now()
    instance = Course.objects.create(teacher=teacher, photo=ImageFile(open(COURSE_IMG_PATH, "rb")), title="Title",
                                 is_active=True,
                                 description="Description", start_date=datetime.datetime.now(tz=now.tzinfo),
                                 duration=datetime.timedelta(hours=20))
    instance.tags.add(tag)
    return instance

@pytest.fixture
def active_course_tag(teacher, tag):
    now = timezone.now()
    instance = Course.objects.create(teacher=teacher, photo=ImageFile(open(COURSE_IMG_PATH, "rb")), title="Title",
                                 is_active=True,
                                 description="Description", start_date=datetime.datetime.now(tz=now.tzinfo),
                                 duration=datetime.timedelta(hours=20))
    instance.tags.add(tag)
    return instance