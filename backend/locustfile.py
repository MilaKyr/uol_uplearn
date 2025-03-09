from locust import HttpUser, between, task
import json

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup() # for separate deployment

from elearning.models import Course, User


class APIUser(HttpUser):
    wait_time = between(5, 15)

    def on_start(self):
        response  = self.client.post(f"/api/login/", {
            "email": "norma@gregory.com",
            "password": "12345678!!!"
        })
        token = response.json()
        self.client.headers = {'Authorization': f'Bearer {token["access"]}'}

    @task
    def courses_list(self):
        self.client.get(f"/api/courses/")

    @task
    def inbox(self):
        self.client.get(f"/api/notifications/inbox/")

    @task
    def notifications(self):
        self.client.get(f"/api/notifications/")

    @task
    def new_course_id(self):
        self.client.get(f"/api/new_course_id")

    @task
    def course(self):
        course = Course.objects.filter(is_active=True).first()
        self.client.get(f"/api/courses/{course.id}/")

    @task
    def feedbacks(self):
        self.client.get(f"/api/feedbacks/")

    @task
    def dashboard(self):
        user = User.objects.last()
        self.client.get(f"/api/dashboard/{user.id}")
