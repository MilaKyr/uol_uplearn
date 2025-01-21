import pytest
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
import datetime
from django.contrib.auth.models import Group
from elearning.models import *


@pytest.fixture
def teacher():
    return User.objects.create(username="test_teacher",
                               first_name="John", last_name="Smith",
                               email="abc@abc.com", password="Abc12345!",
                               role="teacher")

@pytest.fixture
def student_group():
    return Group.objects.create(name='Student')


@pytest.fixture
def teacher_group():
    return Group.objects.create(name='Teacher')


@pytest.fixture
def student():
    return User.objects.create(username="student1", first_name="James", last_name="Johns",
                               email="abc@abc.com", password="Abc12345!", photo="image.jpg",
                               role="student")

@pytest.fixture
def course(teacher):
    now = timezone.now()
    return Course.objects.create(teacher=teacher, photo="image.jpg", title="Title",
                                 description="Description", start_date=datetime.datetime.now(tz=now.tzinfo),
                                 duration=datetime.timedelta(hours=20))

@pytest.fixture
def active_course(teacher):
    now = timezone.now()
    return Course.objects.create(teacher=teacher, photo="image.jpg", title="Title",
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
                                    n_hours=datetime.timedelta(hours=20))

@pytest.fixture
def lesson(topic, course):
    now = datetime.datetime.now()
    deadline = now + datetime.timedelta(days=1)
    return StudyItem.objects.create(topic=topic, course=course, title="Item title",
                                    deadline=deadline, order=1)

@pytest.fixture
def lessons(topic, course, lesson):
    StudyItem.objects.create(topic=topic, course=course, title="Item title 2",
                                    order=2)
    return StudyItem.objects.all()

@pytest.fixture
def lesson_content(lesson):
    return ItemContent.objects.create(item=lesson, kind="text", text="test", order=1)

@pytest.fixture
def lesson_contents(lesson, lesson_content):
    ItemContent.objects.create(item=lesson, kind="text", text="test 2", order=2)
    return ItemContent.objects.all()


@pytest.fixture
def feedback(student, course):
    return Feedback.objects.create(user=student, course=course,
                                   text="test", rating=5)
@pytest.fixture
def enrolled_student(student, course):
    return CourseEnrollment.objects.create(user=student, course=course, status="started")

