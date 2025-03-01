import json

import pytest
from rest_framework.test import APIClient
from rest_framework import status
from elearning.serializers import *
from elearning.models import *
from django.db.models import signals

from tests.utils import register_student, register_teacher, create_course, enroll, \
random_password, random_email

client = APIClient()


@pytest.mark.django_db
def test_update_notifications_forbidden(teacher_group, notification):
    teacher = register_teacher()
    response = client.post(f"/api/notifications/",
                           data={'ids': [str(notification.id)]}, format="json",
                          headers={'AUTHORIZATION': f" Bearer {teacher['access']}"})
    assert response.status_code == status.HTTP_403_FORBIDDEN