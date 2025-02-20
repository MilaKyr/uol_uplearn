import datetime
from django.utils import timezone
from django.db import utils
import pytest
from backend.elearning import course_topic_directory_path, Course, StudyItem, ItemContent


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

@pytest.mark.django_db
def test_get_latest_lesson_order(teacher, lesson):
    latest = StudyItem.get_next_order_number(lesson.course_id)
    assert latest == 1

@pytest.mark.django_db
def test_get_latest_content_order(teacher, lesson_content):
    latest = ItemContent.get_next_order_number(lesson_content.item.id)
    assert latest == 1


