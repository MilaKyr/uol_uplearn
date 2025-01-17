import datetime
from django.utils import timezone
from django.db import utils
import pytest
from elearning.models import course_topic_directory_path, Course

@pytest.mark.django_db
def test_course_topic_directory_path(lesson_content):
    expected = course_topic_directory_path(lesson_content, "file.pdf")
    assert expected == f"course_1/topic_1/file.pdf"

@pytest.mark.django_db
def test_courses_not_unique(teacher, course):
    with pytest.raises(utils.IntegrityError):
        now = timezone.now()
        Course.objects.create(teacher=teacher, title="Title",
                                  photo="some_photo.jpg",
                                 description="Description2", start_date=datetime.datetime.now(tz=now.tzinfo),
                                 duration=datetime.timedelta(hours=20))

