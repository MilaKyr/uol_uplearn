import json

import pytest
from rest_framework.test import APIClient
from rest_framework import status
from elearning.serializers import *
from elearning.models import *
from django.db.models import signals

from tests.utils import (
    course_payload,
    register_student,
    register_teacher,
    create_course,
    enroll,
    random_password,
    random_email,
)

client = APIClient()


@pytest.mark.django_db
def test_get_course_unauthorized(student_group):
    response = client.get("/api/courses/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_create_course_student_forbidden(student_group):
    student = register_student()
    response = client.post(
        "/api/courses/",
        data=course_payload,
        format="json",
        headers={"AUTHORIZATION": f" Bearer {student['access']}"},
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_enroll_course_unauthorized(course):
    signals.post_save.receivers = []
    response = client.post(
        "/api/enrollments/", data={"course_id": str(course.id)}, format="json"
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_students_todo_for_unauthorized():
    response = client.get("/api/todo_for")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_topics_unauthorized(topic, lesson):
    response = client.get(f"/api/topics/{topic.id}/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_topics_with_lesson_student_forbidden(student_group, topic, lesson):
    student = register_student()
    response = client.get(
        f"/api/topics/{topic.id}/",
        headers={"AUTHORIZATION": f" Bearer {student['access']}"},
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_get_lesson_unauthorized(lesson):
    response = client.get(f"/api/lessons/{lesson.id}/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_get_feedback_unauthorized():
    response = client.get("/api/feedbacks/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_delete_feedback_not_allowed(student_group, feedback):
    student = register_student()
    response = client.delete(
        f"/api/feedbacks/{feedback.id}/",
        headers={"AUTHORIZATION": f" Bearer {student['access']}"},
    )
    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED


@pytest.mark.django_db
def test_update_feedback_forbidden(student_group, feedback):
    student = register_student()
    response = client.put(
        f"/api/feedbacks/{feedback.id}/",
        headers={"AUTHORIZATION": f" Bearer {student['access']}"},
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_get_study_course_student_forbidden(student_group, course):
    student = register_student()
    response = client.get(
        f"/api/courses/study/{course.id}/",
        headers={"AUTHORIZATION": f" Bearer {student['access']}"},
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_edit_others_course(teacher_group, active_course):
    teacher = register_teacher()
    response = client.get(
        f"/api/courses/edit/{active_course.id}/",
        headers={"AUTHORIZATION": f" Bearer {teacher['access']}"},
    )
    result = json.loads(response.content)
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_update_enrollment_status_other_teacher_fails(teacher_group, student_group):
    teacher1 = register_teacher()
    teacher2 = register_teacher()
    student = register_student()
    _, course = create_course(teacher1["access"])
    enroll(student["access"], course["id"])
    enrollment = CourseEnrollment.objects.get(
        course__id=course["id"], student__user__id=student["user"]["id"]
    )
    response = client.patch(
        f"/api/enrollments/{enrollment.id}/",
        payload={"status": "blocked"},
        headers={"AUTHORIZATION": f" Bearer {teacher2['access']}"},
        format="json",
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_user_search_forbidden(student_group):
    student = register_student()
    response = client.get(
        f"/api/users/search", headers={"AUTHORIZATION": f" Bearer {student['access']}"}
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_user_search_works(teacher_group):
    teacher = register_teacher()
    response = client.get(
        f"/api/users/search", headers={"AUTHORIZATION": f" Bearer {teacher['access']}"}
    )
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_update_lesson_works(teacher_group):
    teacher = register_teacher()
    _, course = create_course(teacher["access"])
    lesson = Lesson.objects.get(course__id=course["id"])
    response = client.patch(
        f"/api/lessons/{lesson.id}/",
        data={"html": "test"},
        format="json",
        headers={"AUTHORIZATION": f" Bearer {teacher['access']}"},
    )
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_list_feedback(teacher_group):
    teacher = register_teacher()
    response = client.get(
        f"/api/feedbacks/",
        data={"html": "test"},
        format="json",
        headers={"AUTHORIZATION": f" Bearer {teacher['access']}"},
    )
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_create_update_feedback_forbidden(student_group, course):
    """ User didn't finish the course """
    student = register_student()
    enroll(student["access"], str(course.id))
    payload = {"course_id": str(course.id), "text": "test feedback", "rating": 3}
    response = client.post(
        "/api/feedbacks/",
        data=payload,
        headers={"AUTHORIZATION": f" Bearer {student['access']}"},
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_get_study_course_student_forbidden(student_group, active_course):
    """ User is not enrolled """
    student = register_student()
    response = client.get(
        f"/api/courses/study/{active_course.id}/",
        headers={"AUTHORIZATION": f" Bearer {student['access']}"},
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_get_study_course_teacher_works(teacher_group, course):
    """ Teacher is not course owner"""
    teacher = register_teacher()
    response = client.get(
        f"/api/courses/study/{course.id}/",
        headers={"AUTHORIZATION": f" Bearer {teacher['access']}"},
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_update_settings_forbidden(student_group, teacher):
    new_status = "new status"
    student = register_student()
    response = client.patch(
        f"/api/home/settings/profile/{teacher.user.id}",
        data={"status": new_status},
        format="json",
        headers={"AUTHORIZATION": f" Bearer {student['access']}"},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_update_settings_ok(student_group, teacher):
    new_status = "new status"
    student = register_student()
    response = client.patch(
        f"/api/home/settings/{student['user']['id']}",
        data={"status": new_status},
        format="json",
        headers={"AUTHORIZATION": f" Bearer {student['access']}"},
    )
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_get_feedback_not_allowed(student_group, feedback):
    student = register_student()
    response = client.get(
        f"/api/feedbacks/{feedback.id}/",
        headers={"AUTHORIZATION": f" Bearer {student['access']}"},
    )
    assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
