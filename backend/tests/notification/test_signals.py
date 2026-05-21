import pytest
import json
import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.db.models import signals

from notifications.models import Notification
from elearning.models import CourseEnrollment
from tests.utils import register_student, register_teacher, create_course, enroll
from notifications.signals import enrollment_created

client = APIClient()


@pytest.mark.django_db
def test_new_enroll(student_group, course):
    student = register_student()
    signals.post_save.connect(receiver=enrollment_created, sender=CourseEnrollment)
    response = client.post(
        "/api/enrollments/",
        data={"course_id": str(course.id)},
        headers={"AUTHORIZATION": f" Bearer {student['access']}"},
        format="json",
    )
    assert response.status_code == status.HTTP_201_CREATED
    assert CourseEnrollment.objects.count() == 1


@pytest.mark.django_db
def test_update_enrollment_status(teacher_group, student_group):
    teacher = register_teacher()
    student = register_student()
    signals.post_save.connect(receiver=enrollment_created, sender=CourseEnrollment)
    _, course = create_course(teacher["access"])
    enroll(student["access"], course["id"])
    enrollment = CourseEnrollment.objects.get(
        course__id=course["id"], student__user__id=student["user"]["id"]
    )
    assert enrollment.status == "started"
    assert Notification.objects.filter(
        person__id=student["user"]["id"],
        recipient__id=teacher["user"]["id"],
        course__id=course["id"],
    ).exists()

    client.patch(
        f"/api/enrollments/{enrollment.id}/",
        data={"status": "blocked"},
        headers={"AUTHORIZATION": f" Bearer {teacher['access']}"},
        format="json",
    )
    assert Notification.objects.filter(
        person__id=teacher["user"]["id"],
        recipient__id=student["user"]["id"],
        course__id=course["id"],
    ).exists()
