import pytest
import json
import pytest
from rest_framework.test import APIClient
from rest_framework import status
from elearning.serializers import *
from elearning.models import *
from notifications.signals import enrollment_created
from django.db.models import signals

client = APIClient()

from tests.utils import register_teacher, register_student, create_course, enroll


@pytest.mark.django_db
def test_get_create_notifications_works(teacher_group, student_group):
    signals.post_save.connect(receiver=enrollment_created, sender=CourseEnrollment)
    teacher = register_teacher()
    student = register_student()
    _, course = create_course(teacher["access"])
    enroll(student["access"], course["id"])
    response = client.get(
        f"/api/notifications/",
        headers={"AUTHORIZATION": f" Bearer {teacher['access']}"},
    )
    assert response.status_code == status.HTTP_200_OK
    result = json.loads(response.content)
    assert len(result) == 1
    response = client.patch(
        f"/api/notifications/{result[0]['id']}",
        data={"seen": True},
        format="json",
        headers={"AUTHORIZATION": f" Bearer {teacher['access']}"},
    )
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_inbox(teacher_group):
    teacher = register_teacher()
    response = client.get(
        f"/api/notifications/inbox/",
        headers={"AUTHORIZATION": f" Bearer {teacher['access']}"},
    )
    result = json.loads(response.content)
    assert result["new_notifications"] == 0 and result["new_messages"] == 0
