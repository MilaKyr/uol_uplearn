import base64
import datetime
import json
import uuid

from dateutil import relativedelta
import pytest
from django.core.files import File
from django.db.models import Value, Prefetch
from django.http import HttpRequest
from django.utils import timezone

from elearning.serializers import *
from elearning.models import *
from tests.utils import get_role
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied


COURSE_IMG_PATH = (
    "seeding/data/photos/courses/rubaitul-azad-ZIPFteu-R8k-unsplash_JRGhzsf.jpg"
)


def compare_images(result):
    return "_".join(result.split("_")[:-1]) + ".jpg" == "/media/" + COURSE_IMG_PATH


@pytest.mark.django_db
def test_registered_student_serializer(registered_student):

    expected = {
        "id": str(registered_student.id),
        "name": f"{registered_student.user.first_name} {registered_student.user.last_name}",
        "photo": None,
        "status": "started",
    }
    serialized = RegisteredStudentSerializer(registered_student)
    assert serialized.data == expected


@pytest.mark.django_db
def test_create_feedback(student, course, enrolled_student):
    assert Feedback.objects.count() == 0
    enrolled = CourseEnrollment.objects.get(user=student, course=course)
    enrolled.status = "finished"
    enrolled.save()
    request = HttpRequest()
    request.user = student
    result = CourseCreateFeedback(context={"request": request}).create(
        {"course_id": course.id, "rating": 3}
    )
    assert result is not None
    assert Feedback.objects.count() == 1


#
@pytest.mark.django_db
def test_create_feedback_fails(student, course):
    request = HttpRequest()
    request.user = student
    with pytest.raises(PermissionDenied):
        CourseCreateFeedback(context={"request": request}).create(
            {"course_id": course.id, "rating": 3}
        )


@pytest.mark.django_db
def test_create_feedback_negative_rating(student, course):
    with pytest.raises(serializers.ValidationError):
        serializer = CourseCreateFeedback(
            context={"student_id": student.id},
            data={"course_id": course.id, "rating": -1},
        )
        serializer.is_valid(raise_exception=True)


@pytest.mark.django_db
def test_create_feedback_too_big_rating(student, course):
    with pytest.raises(serializers.ValidationError):
        serializer = CourseCreateFeedback(
            context={"student_id": student.id},
            data={"course_id": course.id, "rating": 10},
        )
        serializer.is_valid(raise_exception=True)


@pytest.mark.django_db
def test_course_short_serializer(course, teacher):
    course_instance = (
        Course.objects.filter(id=course.id)
        .annotate(average_rating=Value(4.75))
        .annotate(n_students=Value(10))
        .get()
    )
    serializer = CourseShortSerializer(course_instance)
    expected = {
        "id": str(course.id),
        "title": course.title,
        "created": course.created.strftime("%d/%m/%Y"),
        "start_date": course.start_date.strftime("%d %B, %Y"),
        "duration": course.duration.days,
        "average_rating": 4.75,
        "n_students": 10,
        "teacher": {"id": str(teacher.id), "name": teacher.full_name, "photo": None},
        "tags": [],
    }
    assert compare_images(serializer.data["photo"])
    result = serializer.data
    result.pop("photo")
    assert json.dumps(result, sort_keys=True) == json.dumps(expected, sort_keys=True)


@pytest.mark.django_db
def test_course_owner_short_serializer(registered_student, course):
    course_instance = (
        Course.objects.filter(id=course.id)
        .annotate(average_rating=Value(4.75))
        .annotate(n_students=Value(3))
        .get()
    )
    serializer = CourseOwnerSerializer(course_instance)
    expected = {
        "id": str(course.id),
        "title": course.title,
        "is_active": False,
        "created": course.created.strftime("%d/%m/%Y"),
        "start_date": course.start_date.strftime("%d %B, %Y"),
        "average_rating": 4.75,
        "n_students": 3,
        "registered_students": [
            {
                "id": str(registered_student.id),
                "name": f"{registered_student.user.first_name} {registered_student.user.last_name}",
                "photo": None,
                "status": "started",
            }
        ],
    }
    assert compare_images(serializer.data["photo"])
    result = serializer.data
    result.pop("photo")
    assert json.dumps(result, sort_keys=True) == json.dumps(expected, sort_keys=True)


@pytest.mark.django_db
def test_teacher_serializer(teacher):
    expected = {
        "id": str(teacher.id),
        "name": f"{teacher.first_name} {teacher.last_name}",
        "photo": None,
        "is_online": teacher.is_online,
        "role": get_role(teacher),
        "bio": teacher.bio,
    }
    serialized = TeacherSerializer(teacher)
    assert serialized.data == expected


@pytest.mark.django_db
def test_course_serializer(course, feedback, lesson, student, enrolled_student):
    course_instance = (
        Course.objects.filter(id=course.id)
        .prefetch_related("registered_students")
        .prefetch_related("topics")
        .annotate(average_rating=Value(4.75))
        .annotate(n_students=Value(3))
        .get()
    )

    expected = {
        "id": str(course.id),
        "title": course.title,
        "is_active": course.is_active,
        "description": course.description,
        "created": course.created.strftime("%d/%m/%Y"),
        "start_date": course.start_date.strftime("%d %B, %Y"),
        "average_rating": 4.75,
        "n_students": 3,
        "duration": course.duration.days,
        "teacher": {
            "id": str(course.teacher.id),
            "name": f"{course.teacher.first_name} {course.teacher.last_name}",
            "photo": None,
        },
        "topics": [
            {
                "id": str(lesson.topic.id),
                "title": lesson.topic.title,
                "n_hours": lesson.topic.n_hours,
                "description": lesson.topic.description,
                "lessons": [
                    {
                        "id": str(lesson.id),
                        "title": lesson.title,
                        "deadline": lesson.deadline.strftime("%d %B, %Y"),
                        "done": False,
                    }
                ],
            }
        ],
        "feedback": [
            {
                "id": str(feedback.id),
                "user": {
                    "id": str(feedback.enrollment.user.id),
                    "name": f"{feedback.enrollment.user.first_name} {feedback.enrollment.user.last_name}",
                    "photo": None,
                },
                "text": feedback.text,
                "rating": feedback.rating,
                "created": feedback.created.strftime("%d %B, %Y"),
            }
        ],
        "tags": [],
        "enrolled": False,
    }
    serializer = CourseSerializer(course_instance)
    assert compare_images(serializer.data["photo"])
    result = serializer.data
    result.pop("photo")
    print(json.dumps(result, sort_keys=True))
    print("-" * 20)
    print(json.dumps(expected, sort_keys=True))
    assert json.dumps(result, sort_keys=True) == json.dumps(expected, sort_keys=True)


@pytest.mark.django_db
def test_course_w_progress_short_serializer(course, student, enrolled_student):
    course_instances = (
        Course.objects.prefetch_related("registered_students")
        .prefetch_related("topics")
        .prefetch_related("topics__study_lessons")
        .prefetch_related("registered_students__feedback")
        .filter(registered_students__user=enrolled_student.user)
        .annotate(overall=Value(5))
        .all()
    )
    expected = {
        "id": str(enrolled_student.course.id),
        "title": enrolled_student.course.title,
        "enrolled": enrolled_student.created.strftime("%d %B, %Y"),
        "progress": 0.0,
        "status": "started",
    }
    done = [
        (
            enrolled_student.course.id,
            enrolled_student.user.id,
            enrolled_student.created.strftime("%d %B, %Y"),
            0,
        )
    ]
    serializer = CourseWithProgressSerializer(
        course_instances, many=True, context={"done": done}
    )
    assert compare_images(serializer.data[0]["photo"])
    result = serializer.data
    result[0].pop("photo")
    assert json.dumps(result, sort_keys=True) == json.dumps([expected], sort_keys=True)


@pytest.mark.django_db
def test_course_w_progress_short_serializer_no_tasks(course, student, enrolled_student):
    course_instances = (
        Course.objects.prefetch_related("registered_students")
        .prefetch_related("topics")
        .prefetch_related("topics__study_lessons")
        .prefetch_related("registered_students__feedback")
        .filter(registered_students__user=enrolled_student.user)
        .annotate(overall=Value(0))
        .all()
    )
    expected = {
        "id": str(enrolled_student.course.id),
        "title": enrolled_student.course.title,
        "enrolled": enrolled_student.created.strftime("%d %B, %Y"),
        "progress": 0.0,
        "status": "started",
    }
    done = [
        (
            enrolled_student.course.id,
            enrolled_student.user.id,
            enrolled_student.created.strftime("%d %B, %Y"),
            0,
        )
    ]
    serializer = CourseWithProgressSerializer(
        course_instances, many=True, context={"done": done}
    )
    assert compare_images(serializer.data[0]["photo"])
    result = serializer.data
    result[0].pop("photo")
    assert json.dumps(result, sort_keys=True) == json.dumps([expected], sort_keys=True)


@pytest.mark.django_db
def test_todo_list_serializer(student, lesson):
    first_date = timezone.now()
    last_date = first_date + relativedelta.relativedelta(days=5)
    todo_list = (
        Lesson.objects.select_related("topic")
        .select_related("topic__course")
        .prefetch_related("topic__course__registered_students")
        .filter(deadline__range=(first_date, last_date))
        .values(
            "id",
            "course_id",
            "topic__course__title",
            "topic__id",
            "topic__title",
            "title",
            "deadline",
        )
    )
    expected = {
        "course_id": str(lesson.course.id),
        "course_title": lesson.course.title,
        "topic_id": str(lesson.topic.id),
        "topic_title": lesson.topic.title,
        "id": str(lesson.id),
        "title": lesson.title,
        "deadline": lesson.deadline.strftime("%d/%m/%Y"),
    }
    serialized = TodoListSerializer(todo_list, many=True)
    result = serialized.data.pop()
    result["id"] = str(result["id"])
    result["topic_id"] = str(result["topic_id"])
    result["course_id"] = str(result["course_id"])
    assert json.dumps(result, sort_keys=True) == json.dumps(expected, sort_keys=True)


@pytest.mark.django_db
def test_student_feedback_serializer(student, lesson):
    first_date = timezone.now()
    last_date = first_date + relativedelta.relativedelta(days=5)
    todo_list = (
        Lesson.objects.select_related("topic")
        .select_related("topic__course")
        .prefetch_related("topic__course__registered_students")
        .filter(deadline__range=(first_date, last_date))
        .values(
            "id",
            "course_id",
            "topic__course__title",
            "topic__id",
            "topic__title",
            "title",
            "deadline",
        )
    )
    expected = {
        "course_id": str(lesson.course.id),
        "course_title": lesson.course.title,
        "topic_id": str(lesson.topic.id),
        "topic_title": lesson.topic.title,
        "id": str(lesson.id),
        "title": lesson.title,
        "deadline": lesson.deadline.strftime("%d/%m/%Y"),
    }
    serialized = TodoListSerializer(todo_list, many=True)
    result = serialized.data.pop()
    result["id"] = str(result["id"])
    result["topic_id"] = str(result["topic_id"])
    result["course_id"] = str(result["course_id"])
    assert json.dumps(result, sort_keys=True) == json.dumps(expected, sort_keys=True)


@pytest.mark.django_db
def test_update_create_progress_serializer(lesson, enrolled_student):
    assert enrolled_student.done_lessons.count() == 0
    request = HttpRequest()
    request.user = enrolled_student.user
    CreateProgressSerializer(context={"request": request}).update(
        lesson, {"course_id": enrolled_student.course.id}
    )
    enrolled_student.refresh_from_db()
    assert enrolled_student.done_lessons.count() == 1


@pytest.mark.django_db
def test_update_create_progress_serializer_fails(lesson, student):
    assert (
        not Lesson.objects.prefetch_related("students")
        .filter(id=lesson.id, students__user=student)
        .exists()
    )
    with pytest.raises(NotFound):
        request = HttpRequest()
        request.user = student
        CreateProgressSerializer(context={"request": request}).update(
            lesson, {"course_id": lesson.course.id}
        )


@pytest.mark.django_db
def test_add_file_to_lesson_serializer(lesson, enrolled_student):
    instance = Lesson.objects.filter(id=lesson.id).prefetch_related("files").get()
    assert instance.files.count() == 0
    LessonEditFilesSerializer().update(
        lesson, {"files": File(open(COURSE_IMG_PATH, "rb"))}
    )
    instance = Lesson.objects.filter(id=lesson.id).prefetch_related("files").get()
    assert instance.files.count() == 1


@pytest.mark.django_db
def test_course_create_serializer_start_fail(teacher):
    assert Course.objects.count() == 0
    now = timezone.now()
    deadline = now + datetime.timedelta(days=1)
    new_course = {
        "title": "Course title",
        "description": "description",
        "start_date": now,
        "end_date": now + datetime.timedelta(days=20),
        "tags": ["a", "b"],
        "topics": [
            {
                "title": "Topic title",
                "description": "Topic desc",
                "n_hours": 20,
                "lessons": [{"title": "Lesson title", "deadline": deadline}],
            }
        ],
    }
    with pytest.raises(ValidationError):
        serializer = CourseShortSerializer(
            context={"teacher_id": teacher.id}, data=new_course
        )  # CHANGED
        serializer.is_valid(raise_exception=True)


@pytest.mark.django_db
def test_course_create_serializer_fails():
    assert Course.objects.count() == 0
    now = datetime.datetime.now()
    deadline = now + datetime.timedelta(days=1)
    new_course = {
        "title": "Course title",
        "description": "description",
        "start_date": now,
        "end_date": now - datetime.timedelta(minutes=20),
        "tags": ["a", "b"],
        "topics": [
            {
                "title": "Title",
                "description": "Topic desc",
                "n_hours": 20,
                "lessons": [{"title": "Title", "deadline": deadline}],
            }
        ],
    }
    with pytest.raises(ValidationError):
        serializer = CourseShortSerializer(
            context={"teacher_id": 23}, data=new_course
        )  # CHANGED
        serializer.is_valid(raise_exception=True)
        serializer.save()


@pytest.mark.django_db
def test_course_create_serializer(teacher):
    assert Course.objects.count() == 0
    now = datetime.datetime.now()
    deadline = now + datetime.timedelta(days=20)
    new_course = {
        "id": uuid.uuid4(),
        "title": "Course title",
        "description": "description",
        "start_date": now + datetime.timedelta(days=2),
        "end_date": now + datetime.timedelta(minutes=20),
        "tags": ["a", "b"],
        "topics": [
            {
                "title": "Title",
                "description": "Topic desc",
                "n_hours": 20,
                "lessons": [{"title": "Title", "deadline": deadline}],
            }
        ],
    }
    request = HttpRequest()
    request.user = teacher
    serializer = CourseCreateSerializer(context={"request": request}, data=new_course)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    assert Course.objects.count() == 1


@pytest.mark.django_db
def test_prefetch_enrollment_serializer(enrolled_student):
    enrollment = (
        CourseEnrollment.objects.select_related("course")
        .prefetch_related("user")
        .get(user__id=enrolled_student.user.id)
    )
    serializier = PrefetchEnrollmentSerializer(enrollment)
    expected = {
        "id": str(enrolled_student.id),
        "user_id": str(enrolled_student.user.id),
        "name": enrolled_student.user.full_name,
        "role": get_role(enrolled_student.user),
        "photo": None,
        "status": enrolled_student.status,
    }
    result = serializier.data
    result["user_id"] = str(result["user_id"])
    assert json.dumps(result, sort_keys=True) == json.dumps(expected, sort_keys=True)


@pytest.mark.django_db
def test_custom_registration(student_group):
    assert User.objects.count() == 0
    payload = {
        "password1": "abcdfghjk123",
        "password2": "abcdfghjk123",
        "email": "abc@abc.com",
        "first_name": "First",
        "last_name": "Last",
        "role": "student",
        "token": None,
    }
    serializer = CustomRegisterSerializer(data=payload)
    serializer.is_valid(raise_exception=True)
    assert Group.objects.count() == 1
    serializer.save(request={})
    assert User.objects.count() == 1


@pytest.mark.django_db
def test_custom_login(student_group):
    payload = {
        "password1": "abcdfghjk123",
        "password2": "abcdfghjk123",
        "email": "abc@abc.com",
        "first_name": "First",
        "last_name": "Last",
        "role": "student",
        "token": None,
    }
    serializer = CustomRegisterSerializer(data=payload)
    serializer.is_valid(raise_exception=True)
    user = serializer.save(request={})
    assert User.objects.count() == 1
    user_instance = User.objects.get(id=user.id)
    user_instance.is_online = False
    user_instance.save()
    assert not User.objects.get(id=user.id).is_online
    data = {"email": "abc@abc.com", "password": "abcdfghjk123"}
    CustomLoginSerializer(context={"request": {}}).validate(data)
    assert User.objects.get(id=user.id).is_online


@pytest.mark.django_db
def test_login_fails(student):
    assert User.objects.count() == 1
    assert not User.objects.get(id=student.id).is_online
    data = {"email": "abc@abc.com", "password": "abcdfghjk123"}
    with pytest.raises(ValidationError):
        CustomLoginSerializer(context={"request": {}}).validate(data)


@pytest.mark.django_db
def test_get_course(course):
    serializer = CourseRetireveUpdateSerializer(course)
    result = serializer.data
    assert result["duration"] == course.duration.days
