import datetime
from django.utils import timezone
from django.db import utils
import pytest
from elearning.models import course_topic_directory_path, Course, Lesson, Files
from rest_framework.exceptions import ValidationError
from django.core.files import File

COURSE_IMG_PATH = 'seeding/data/photos/courses/rubaitul-azad-ZIPFteu-R8k-unsplash_JRGhzsf.jpg'

@pytest.mark.django_db
def test_course_topic_directory_path(course):
    today = datetime.datetime.today()
    expected = course_topic_directory_path(course, "file.pdf")
    assert expected == f"files/{today.strftime('%Y-%m-%d')}/file.pdf"

@pytest.mark.django_db
def test_courses_not_unique(teacher, course):
    with pytest.raises(utils.IntegrityError):
        now = timezone.now()
        Course.objects.create(teacher=teacher, title="Title",
                                  photo="some_photo.jpg",
                                 description="Description2", start_date=datetime.datetime.now(tz=now.tzinfo),
                                 duration=datetime.timedelta(hours=20))
@pytest.mark.django_db
def test_filename():
    new_file = Files.objects.create(file=File(open(COURSE_IMG_PATH, "rb")))
    assert new_file.filename().startswith("rubaitul-azad-ZIPFteu-R8k-unsplash")

