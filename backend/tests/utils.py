import datetime
import json
import string
import uuid
from random import choice
from rest_framework.test import APIClient
from elearning.serializers import *
from elearning.models import *


client = APIClient()


def random_email():
    name = "".join(choice(string.ascii_lowercase) for _ in range(5))
    domain = "".join(choice(string.ascii_lowercase) for _ in range(5))
    return f"{name}@{domain}.com"


def random_password():
    return "".join(choice(string.ascii_letters + string.digits) for _ in range(9))


def random_string(length=10):
    return "".join(choice(string.ascii_letters) for _ in range(length))


course_payload = {
    "id": str(uuid.uuid4()),
    "title": "Test",
    "description": "Test",
    "start_date": datetime.datetime.now() + datetime.timedelta(days=3),
    "end_date": datetime.datetime.now() + datetime.timedelta(days=30),
    "photo": "image.png",
    "tags": ["programming"],
    "topics": [
        {
            "title": "Topic title",
            "description": "Topic description",
            "n_hours": 20,
            "lessons": [
                {
                    "title": f"Test title",
                    "deadline": datetime.datetime.now() + datetime.timedelta(days=3),
                }
            ],
        }
    ],
}


def register_student(password=None, email=None):
    password = password or random_password()
    payload = {
        "username": random_string(5),
        "first_name": random_string(5),
        "last_name": random_string(5),
        "email": email or random_email(),
        "password1": password,
        "password2": password,
        "role": "student",
        "token": None,
    }
    response = client.post("/api/register/", payload, format="json")
    return response.data


def register_teacher(password=None, email=None):
    name = random_string(6)
    token = uuid.uuid5(uuid.NAMESPACE_DNS, name)
    KeyHolder.objects.create(name=name, token=token)
    password = password or random_password()
    payload = {
        "username": random_string(5),
        "first_name": random_string(5),
        "last_name": random_string(5),
        "email": email or random_email(),
        "password1": password,
        "password2": password,
        "role": "teacher",
        "token": token,
    }
    response = client.post("/api/register/", payload, format="json")
    return response.data


def create_course(token):
    response = client.post(
        "/api/courses/",
        data=course_payload,
        headers={"AUTHORIZATION": f" Bearer {token}"},
        format="json",
    )
    result = json.loads(response.content)
    print(result)
    return response.status_code, result


def enroll(access_token, course_id):
    response = client.post(
        "/api/enrollments/",
        data={"course_id": course_id},
        headers={"AUTHORIZATION": f" Bearer {access_token}"},
        format="json",
    )
    result = json.loads(response.content)
    return response.status_code, result


def get_role(user):
    return "student" if user.groups.filter(name="student").exists() else "teacher"
