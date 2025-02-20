import datetime
import json
from io import BytesIO
from dateutil import relativedelta
from PIL import Image
import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db.models import Value
from django.utils import timezone

from backend.elearning import *
from backend.elearning import *


@pytest.mark.django_db
def test_reistered_student_serializer(registered_student):
    expected = {
        "id": registered_student.user.id,
        'first_name': registered_student.user.first_name,
        'last_name': registered_student.user.last_name,
        'photo_url': registered_student.user.photo.url,
    }
    serialized = RegisteredStudentShortSerializer(registered_student)
    assert serialized.data == expected


@pytest.mark.django_db
def test_create_feedback(student, course, enrolled_student):
    assert len(Feedback.objects.all()) == 0
    assert (CourseCreateFeedback(context={"student_id": student.id}).create({"course_id": course.id, "rating": 3})
            is not None )

@pytest.mark.django_db
def test_create_feedback_fails(student, course):
    with pytest.raises(serializers.ValidationError):
        CourseCreateFeedback(context={"student_id": student.id}
                             ).create({"course_id": course.id, "rating": 3})


@pytest.mark.django_db
def test_create_feedback_negative_rating(student, course):
    with pytest.raises(serializers.ValidationError):
        serializer = CourseCreateFeedback(context={"student_id": student.id},
                                          data={"course_id": course.id, "rating": -1})
        serializer.is_valid(raise_exception=True)

@pytest.mark.django_db
def test_create_feedback_too_big_rating(student, course):
    with pytest.raises(serializers.ValidationError):
        serializer = CourseCreateFeedback(context={"student_id": student.id}, data={"course_id": course.id, "rating": 10})
        serializer.is_valid(raise_exception=True)


@pytest.mark.django_db
def test_course_short_serializer(course):
    course_instance = (Course.objects
                       .filter(id=course.id)
                       .annotate(average_rating=Value(4.75))
                       .annotate(n_students=Value(10))
                       .get())
    serializer = CourseShortSerializer(course_instance)
    expected = {
        "id": course.id,
        "title": course.title,
        "created": course.created.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        "start_date": course.start_date.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        "photo": course.photo.url,
        "average_rating": 4.75,
        "n_students": 10
    }
    assert json.dumps(serializer.data, sort_keys=True) == json.dumps(expected, sort_keys=True)

@pytest.mark.django_db
def test_course_owner_short_serializer(registered_student, course):
    course_instance = (Course.objects
                       .filter(id=course.id)
                       .annotate(average_rating=Value(4.75))
                       .get())
    serializer = CourseOwnerShortSerializer(course_instance)
    expected = {
        "id": course.id,
        "title": course.title,
        "is_active": False,
        "created": course.created.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        "start_date": course.start_date.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        "photo": course.photo.url,
        "average_rating": 4.75,
        "registered_students": [
            {
                "id": registered_student.user.id,
                'first_name': registered_student.user.first_name,
                'last_name': registered_student.user.last_name,
                'photo_url': registered_student.user.photo.url,
            }
        ]
    }
    assert json.dumps(serializer.data, sort_keys=True) == json.dumps(expected, sort_keys=True)


@pytest.mark.django_db
def test_teacher_serializer(teacher):
    expected = {
        "id": teacher.id,
        "username": teacher.username,
        'first_name':teacher.first_name,
        'last_name': teacher.last_name,
        'photo': "",
    }
    serialized = TeacherSerializer(teacher)
    assert serialized.data == expected


@pytest.mark.django_db
def test_course_serializer(course):
    course_instance = (Course.objects
                       .filter(id=course.id)
                       .prefetch_related("feedback")
                       .prefetch_related("topics")
                       .annotate(average_rating=Value(4.75))
                       .get())

    expected = {
        "id": course.id,
        "title": course.title,
        "is_active": course.is_active,
        "description": course.description,
        "created": course.created.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        "start_date": course.start_date.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        "photo": course.photo.url,
        "average_rating": 4.75,
        "duration": str(course.duration),
        "teacher": {
            "id": course.teacher.id,
            "username": course.teacher.username,
            'first_name': course.teacher.first_name,
            'last_name': course.teacher.last_name,
            'photo': "",
        },
        "topics": [],
        'feedback': []
    }
    serialized = CourseSerializer(course_instance)
    assert serialized.data == expected

@pytest.mark.django_db
def test_create_course(teacher):
    assert len(Course.objects.all()) == 0
    now = timezone.now()
    assert (CourseSerializer(context={"teacher": teacher}).create({"photo": "image.jpg",
                                                         "title": "Test",
                                                         "description": "Test",
                                                         "start_date": datetime.datetime.now(tz=now.tzinfo),
                                                         "duration": datetime.timedelta(hours=7)})
            is not None )

@pytest.mark.django_db
def test_create_course_too_short_duration(teacher):
    with pytest.raises(serializers.ValidationError):
        now = timezone.now()
        start = datetime.datetime.now(tz=now.tzinfo) + datetime.timedelta(days=3)
        serializer = CourseSerializer(context={"teacher": teacher}, data={"photo": "image.jpg",
                                                         "title": "Test",
                                                         "description": "Test",
                                                         "start_date": start,
                                                         "duration": datetime.timedelta(minutes=7)})
        serializer.is_valid(raise_exception=True)

@pytest.mark.django_db
def test_create_course_wrong_start(teacher):
    with pytest.raises(serializers.ValidationError):
        now = timezone.now()
        start = datetime.datetime.now(tz=now.tzinfo) - datetime.timedelta(days=3)
        serializer = CourseSerializer(context={"teacher": teacher}, data={"photo": "image.jpg",
                                                         "title": "Test",
                                                         "description": "Test",
                                                         "start_date": start,
                                                         "duration": datetime.timedelta(minutes=7)})
        serializer.is_valid(raise_exception=True)


@pytest.mark.django_db
def test_create_topic(course):
    assert len(Topic.objects.all()) == 0
    serializer = TopicCreateSerializer(data={"course_id": course.id,
                                            "title": "Test",
                                            "description": "Test",
                                            "n_hours": datetime.timedelta(hours=6),})
    serializer.is_valid(raise_exception=True)
    serializer.save()
    assert len(Topic.objects.all()) == 1


@pytest.mark.django_db
def test_create_topic_too_short_duration(course):
    with pytest.raises(serializers.ValidationError):
        serializer = TopicCreateSerializer(data={"course_id": course.id,
                                 "title": "Test",
                                 "description": "Test",
                                 "n_hours": datetime.timedelta(minutes=1),})
        serializer.is_valid(raise_exception=True)


@pytest.mark.django_db
def test_create_lesson_content(lesson):
    assert len(ItemContent.objects.all()) == 0
    serializer = LessonContentCreateSerializer(data={"lesson_id": lesson.id,
                                            "kind": "text",
                                            "text": "test"})
    serializer.is_valid(raise_exception=True)
    serializer.save()
    assert len(ItemContent.objects.all()) ==  1

def temporary_image():
    bts = BytesIO()
    img = Image.new("RGB", (100, 100))
    img.save(bts, 'jpeg')
    return SimpleUploadedFile("test.jpg", bts.getvalue())

def temporary_file():
    return SimpleUploadedFile("hello.pdf", b"file_content", content_type="file/pdf")


@pytest.mark.django_db
def test_lesson_content_no_text(lesson, tmp_path):
    with pytest.raises(serializers.ValidationError):
        serializer = LessonContentCreateSerializer(data={"lesson_id": lesson.id,
                                                         "kind": "text",
                                                         "img": temporary_image(),
                                                         "file": temporary_file()})
        serializer.is_valid(raise_exception=True)


@pytest.mark.django_db
def test_lesson_content_no_image(lesson):
    with pytest.raises(serializers.ValidationError):
        serializer = LessonContentCreateSerializer(data={"lesson_id": lesson.id,
                                                         "kind": "image",
                                                         "text": "test",
                                                         "file": temporary_file()})
        serializer.is_valid(raise_exception=True)

@pytest.mark.django_db
def test_lesson_content_no_file(lesson, tmp_path):
    with pytest.raises(serializers.ValidationError):
        serializer = LessonContentCreateSerializer(data={"lesson_id": lesson.id,
                                                         "kind": "file",
                                                         "text": "test",
                                                         "img": temporary_image()})
        serializer.is_valid(raise_exception=True)



@pytest.mark.django_db
def test_create_lesson(topic, course):
    assert len(ItemContent.objects.all()) == 0
    assert (LessonCreateSerializer().create({"topic_id": topic.id,
                                             "course_id": course.id,
                                            "title": "Test"})
            is not None )



@pytest.mark.django_db
def test_change_lesson_order(topic, lessons):
    assert len(StudyItem.objects.all()) == 2
    changes = {
        lessons[1].id: 0,
        lessons[0].id: 1,
    }
    serializer = LessonOrderSerializer(context={"topic_id": lessons[0].topic.id}, data= {"order_changes": changes})
    serializer.is_valid(raise_exception=True)
    serializer.update(
        topic, {"order_changes": changes}
    )
    changed_lessons = StudyItem.objects.all().order_by('order')
    assert changed_lessons[0] == lessons[1]


@pytest.mark.django_db
def test_change_lesson_order_not_sequential(topic, lessons):
    assert len(StudyItem.objects.all()) == 2
    changes = {
        lessons[1].id: 1,
        lessons[0].id: 2,
    }
    with pytest.raises(serializers.ValidationError):
        serializer = LessonOrderSerializer(context={"topic_id": topic.id},
                              data={"order_changes": changes}
        )
        serializer.is_valid(raise_exception=True)


@pytest.mark.django_db
def test_change_lesson_order_partial(topic, lessons):
    assert len(StudyItem.objects.all()) == 2
    changes = {
        lessons[1].id: 0,
    }
    with pytest.raises(serializers.ValidationError):
        serializer = LessonOrderSerializer(context={"topic_id": topic.id},
                              data={"order_changes": changes}
        )
        serializer.is_valid(raise_exception=True)


@pytest.mark.django_db
def test_change_lesson_content_order(lesson, lesson_contents):
    assert len(ItemContent.objects.all()) == 2
    changes = {
        lesson_contents[1].id: 0,
        lesson_contents[0].id: 1,
    }
    serializer = LessonContentOrderSerializer(context={"lesson_id": lesson.id}, data={"order_changes": changes})
    serializer.is_valid(raise_exception=True)
    serializer.update(
        lesson, {"order_changes": changes}
    )
    serializer.is_valid(raise_exception=True)
    changed_lesson_contents = ItemContent.objects.all().order_by('order')
    assert changed_lesson_contents[0] == lesson_contents[1]
    assert changed_lesson_contents[1] == lesson_contents[0]


@pytest.mark.django_db
def test_change_lesson_content_order_not_sequential(lesson,lesson_contents):
    assert len(ItemContent.objects.all()) == 2
    changes = {
        lesson_contents[1].id: 0,
        lesson_contents[0].id: 2,
    }
    with pytest.raises(serializers.ValidationError):
        serializer = LessonContentOrderSerializer(context={"lesson_id": lesson.id},
                              data={"order_changes": changes}
        )
        serializer.is_valid(raise_exception=True)


@pytest.mark.django_db
def test_change_lesson_content_order_partial(lesson,lesson_contents):
    assert len(ItemContent.objects.all()) == 2
    changes = {
        lesson_contents[1].id: 0,
    }
    with pytest.raises(serializers.ValidationError):
        serializer = LessonContentOrderSerializer(context={"lesson_id": lesson.id},
                              data={"order_changes": changes}
        )
        serializer.is_valid(raise_exception=True)

@pytest.mark.django_db
def test_course_w_progress_short_serializer(course, student, enrolled_student):
    course_instances = (Course.objects
                       .prefetch_related("registered_students")
                       .prefetch_related("topics")
                       .prefetch_related("topics__study_lessons")
                       .prefetch_related("feedback")
                       .filter(registered_students__user=enrolled_student.user)
                       .annotate(overall=Value(5))
                       .all()
                       )
    expected = {
        "id": enrolled_student.course.id,
        "title": enrolled_student.course.title,
        'photo': enrolled_student.course.photo.url,
        'enrolled': enrolled_student.created.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        'progress': 0.0,
    }
    done = [(enrolled_student.course.id, enrolled_student.created.strftime("%Y-%m-%dT%H:%M:%S.%fZ"), 0)]
    serialized = CourseWithProgressShortSerializer(course_instances, many=True, context={"done": done})
    assert json.dumps(serialized.data, sort_keys=True) == json.dumps([expected], sort_keys=True)

@pytest.mark.django_db
def test_course_w_progress_short_serializer_no_tasks(course, student, enrolled_student):
    course_instances = (Course.objects
                       .prefetch_related("registered_students")
                       .prefetch_related("topics")
                       .prefetch_related("topics__study_lessons")
                       .prefetch_related("feedback")
                       .filter(registered_students__user=enrolled_student.user)
                       .annotate(overall=Value(0))
                       .all()
                       )
    expected = {
        "id": enrolled_student.course.id,
        "title": enrolled_student.course.title,
        'photo': enrolled_student.course.photo.url,
        'enrolled': enrolled_student.created.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        'progress': 0.0,
    }
    done = [(enrolled_student.course.id, enrolled_student.created.strftime("%Y-%m-%dT%H:%M:%S.%fZ"), 0)]
    serialized = CourseWithProgressShortSerializer(course_instances, many=True, context={"done": done})
    assert json.dumps(serialized.data, sort_keys=True) == json.dumps([expected], sort_keys=True)


@pytest.mark.django_db
def test_todo_list_serializer(student, lesson):
    now = timezone.now()
    date_now = datetime.datetime.now()
    first_date = datetime.datetime(date_now.year, date_now.month, 1, tzinfo=now.tzinfo)
    last_date = first_date + relativedelta.relativedelta(months=1)
    todo_list = (StudyItem.objects
                         .select_related("topic")
                         .select_related("topic__course")
                         .prefetch_related("topic__course__registered_students")
                         .filter(deadline__range=(first_date, last_date))
                         .values("id", "course_id", "topic__course__title",
                         "topic__id", "topic__title",
                         "title", "deadline", "order")
                        )
    expected = {
        "course_id": lesson.course.id,
        "course_title": lesson.course.title,
        "topic_id": lesson.topic.id,
        "topic_title": lesson.topic.title,
        "id": lesson.id,
        "title": lesson.title,
        "deadline": lesson.deadline.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        "order": lesson.order
    }
    serialized = TodoListSerializer(todo_list, many=True)
    result = serialized.data.pop()
    result["deadline"] = result["deadline"].strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    assert json.dumps(result, sort_keys=True) == json.dumps(expected, sort_keys=True)


@pytest.mark.django_db
def test_update_create_progress_serializer(lesson, enrolled_student):
    assert CourseProgress.objects.all().count() == 0
    CreateProgressSerializer(context={"student_id": enrolled_student.user.id}).update(
        lesson, {"course_id": enrolled_student.course.id}
    )
    assert CourseProgress.objects.all().count() == 1

