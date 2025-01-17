import pytest
from rest_framework.test import APIClient
from rest_framework import status
from elearning.models import *
from elearning.serializers import *

client = APIClient()

def register_student():
    payload = {
        "username": "test_username",
        "first_name": "Test",
        "last_name": "User",
        "email": "email@email.com",
        "password1": "test_password",
        "password2": "test_password",
        "role": "student"
    }
    client.post("/api/register/", payload, format="json")


@pytest.mark.django_db
def test_register(student_group):
    payload = {
        "username": "test_username",
        "first_name": "Test",
        "last_name": "User",
        "email": "email@email.com",
        "password1": "test_password",
        "password2": "test_password",
        "role": "student"
    }
    print(payload)
    response = client.post("/api/register/", payload, format="json")
    print(response.content)
    assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
def test_login(student_group):
    register_student()
    payload = {
        "username": "test_username",
        "email": "email@email.com",
        "password": "test_password",
    }
    print(payload)
    response = client.post("/api/login/", payload, format="json")
    print(response.content)
    assert response.status_code == status.HTTP_200_OK
