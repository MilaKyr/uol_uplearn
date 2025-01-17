import pytest
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
import datetime
from django.contrib.auth.models import Group
from elearning.models import *

@pytest.fixture
def student_group(teacher):
    return Group.objects.create(name='Student')
    teacher, created = Group.objects.get_or_create(name='Teacher')
    return student, teacher

@pytest.fixture
def teacher_group(teacher):
    return Group.objects.create(name='Teacher')

@pytest.fixture
def teacher():
    return User.objects.create(first_name="John", last_name="Smith",
                               email="abc@abc.com", password="Abc12345!",
                               role="teacher")

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


@pytest.fixture
def course_progress(enrolled_student, lesson):
    return CourseProgress.objects.create(enrolled_student=enrolled_student, item=lesson)

#
# @pytest.fixture
# def census():
#     return CensusTract.objects.create(data=12345678)
#
#
# @pytest.fixture
# def state():
#     return State.objects.create(name="WA")
#
#

#
#
# @pytest.fixture
# def city():
#     return City.objects.create(name="New city")
#
#
# @pytest.fixture
# def postal_code():
#     return PostalCodes.objects.create(code=17658)
#
#
# @pytest.fixture
# def provider():
#     return ElectricEnergyProvider.objects.create(provider="New provider")
#
#
# @pytest.fixture
# def vehicle_model(model_maker, model_year):
#     payload = {
#         "name": "Test model name",
#         "maker": model_maker,
#         "year": model_year,
#     }
#     return VehicleModels.objects.create(**payload)
#
#
# @pytest.fixture
# def vehicle_instance(vehicle_type, eligibility, vehicle_model):
#     payload = {
#         "model": vehicle_model,
#         "vehicle_type": vehicle_type,
#         "cafv_eligibility": eligibility,
#         "mrsp_price": 100_000,
#         "electric_rage": 350,
#     }
#     return Vehicle.objects.create(**payload)
#
#
# @pytest.fixture
# def address_instance(
#     postal_code,
#     city,
#     county,
#     state,
# ):
#     payload = {
#         "state": state,
#         "county": county,
#         "city": city,
#         "postal_code": postal_code,
#     }
#     return Address.objects.create(**payload)
#
#
# @pytest.fixture
# def registration_instance(
#     census,
#     address_instance,
#     vehicle_instance,
#     provider,
# ):
#     payload = {
#         "dol_vid": "12345",
#         "vehicles": vehicle_instance,
#         "legislative_district": 18,
#         "census": census,
#         "address": address_instance,
#     }
#     record = Registration.objects.create(**payload)
#     record.providers.add(provider)
#     return record