import datetime
import json

import pytest
from rest_framework.test import APIClient
from rest_framework import status
from elearning.models import *
from elearning.serializers import *

client = APIClient()

def register_student():
    payload = {
        "username": "test_student",
        "first_name": "Test",
        "last_name": "User",
        "email": "email@email.com",
        "password1": "test_password",
        "password2": "test_password",
        "role": "student"
    }
    response = client.post("/api/register/", payload, format="json")
    return response.data["access"]


def register_teacher():
    payload =  {
        "username": "test_username",
        "first_name": "Test",
        "last_name": "User",
        "email": "email@email.com",
        "password1": "test_password",
        "password2": "test_password",
        "role": "teacher"
    }
    response = client.post("/api/register/", payload, format="json")
    return response.data["access"]

def create_course(token):
    start_date = datetime.datetime.now() + datetime.timedelta(days=3)
    duration = datetime.timedelta(days=30)
    payload = {
        "title": "Test",
        "description": "Test",
        "start_date": start_date,
        "duration": duration,
        "photo": "image.png"
    }
    client.post("/api/courses/", data=payload,
                headers={'AUTHORIZATION': f" Bearer {token}"})

def create_topic(token, n_hours=None):
    n_hours = datetime.timedelta(days=4) if n_hours is None else n_hours
    payload = {
        "course_id": 1,
        "title": "Topic title",
        "description": "Topic description",
        "n_hours": n_hours
    }
    client.post("/api/topics/", data=payload,
                headers={'AUTHORIZATION': f" Bearer {token}"})

def create_lessons(token, n=1):
    for num in range(n):
        payload = {
            "topic_id": 1,
            "course_id": 1,
            "title": f"Test title {num}",
        }
        client.post("/api/lessons/", data=payload,
                    headers={'AUTHORIZATION': f" Bearer {token}"})

def enroll(access_token):
    client.post("/api/courses/1/enroll/",
                headers={'AUTHORIZATION': f" Bearer {access_token}"})

def create_content(token, n=1):
    for num in range(n):
        payload = {
            "lesson_id": 1,
            "kind": "text",
            "text": f"Test {num}"
        }
        client.post("/api/lessons/add_content/", data=payload,
                               headers={'AUTHORIZATION': f" Bearer {token}"})

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
    response = client.post("/api/register/", payload, format="json")
    assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
def test_login(student_group):
    register_student()
    payload = {
        "username": "test_student",
        "email": "email@email.com",
        "password": "test_password",
    }
    response = client.post("/api/login/", payload, format="json")
    assert response.status_code == status.HTTP_200_OK

@pytest.mark.django_db
def test_get_course_unauthorized(student_group):
    response = client.get("/api/courses/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

@pytest.mark.django_db
def test_list_courses(student_group, active_course):
    access_token = register_student()
    response = client.get("/api/courses/", headers={'AUTHORIZATION':
                                                        f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_200_OK
    assert len(json.loads(response.content)) == 1


@pytest.mark.django_db
def test_get_course(student_group, active_course):
    access_token = register_student()
    response = client.get("/api/courses/1/", headers={'AUTHORIZATION':
                                                        f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_200_OK
    result = json.loads(response.content)
    assert result["id"] == active_course.id
    assert result["title"] == active_course.title
    assert result["photo"] == active_course.photo.url
    assert result["average_rating"] == 0.0
    assert result["description"] == active_course.description

@pytest.mark.django_db
def test_create_course_student_fails(student_group, teacher):
    access_token = register_student()
    start_date = datetime.datetime.today() + datetime.timedelta(days=3)
    duration = datetime.timedelta(days=30)
    payload = {
        "title": "Test",
        "description": "Test",
        "start_date": start_date,
        "duration": duration,
        "photo": "image.png"
    }
    response = client.post("/api/courses/", data=payload, format="json",
                           headers={'AUTHORIZATION':f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_create_course_teacher(teacher_group):
    access_token = register_teacher()
    assert len(Course.objects.all()) == 0
    start_date = datetime.datetime.now() + datetime.timedelta(days=3)
    duration = datetime.timedelta(days=30)
    payload = {
        "title": "Test",
        "description": "Test",
        "start_date": start_date,
        "duration": duration,
        "photo": "image.png"
    }
    response = client.post("/api/courses/", data=payload,
                           headers={'AUTHORIZATION':f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_200_OK
    assert len(Course.objects.all()) == 1

@pytest.mark.django_db
def test_create_course_past_start_date(teacher_group, teacher):
    access_token = register_teacher()
    assert len(Course.objects.all()) == 0
    start_date = datetime.datetime.now() - datetime.timedelta(days=3)
    duration = datetime.timedelta(days=30)
    payload = {
        "title": "Test",
        "description": "Test",
        "start_date": start_date,
        "duration": duration,
        "photo": "image.png"
    }
    response = client.post("/api/courses/", data=payload,
                           headers={'AUTHORIZATION':f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    response_content = json.loads(response.content)
    assert "start_date" in response_content

@pytest.mark.django_db
def test_update_course(teacher_group, teacher):
    access_token = register_teacher()
    create_course(access_token)
    new_title = "NEW title"
    payload = { "title": new_title }
    response = client.put("/api/courses/1/", data=payload,
                           headers={'AUTHORIZATION':f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_200_OK
    assert Course.objects.get(id=1).title == new_title

@pytest.mark.django_db
def test_update_course_notfound(teacher_group, teacher):
    access_token = register_teacher()
    new_title = "NEW title"
    payload = {
        "title": new_title,
    }
    response = client.put("/api/courses/1/", data=payload,
                           headers={'AUTHORIZATION':f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.django_db
def test_update_course_validation_error(teacher_group, teacher):
    access_token = register_teacher()
    create_course(access_token)
    assert len(Course.objects.all()) == 1
    start_date = datetime.datetime.now() - datetime.timedelta(days=3)
    payload = { "start_date": start_date }
    response = client.put("/api/courses/1/", data=payload,
                           headers={'AUTHORIZATION':f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_400_BAD_REQUEST

@pytest.mark.django_db
def test_enroll(student_group, course):
    access_token = register_student()
    response = client.post("/api/courses/1/enroll/",
                           headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_200_OK
    assert len(CourseEnrollment.objects.all()) == 1

@pytest.mark.django_db
def test_enroll_course_nonexistent(student_group):
    access_token = register_student()
    response = client.post("/api/courses/1/enroll/",
                           headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.django_db
def test_enroll_course_unauthorized():
    response = client.post("/api/courses/1/enroll/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

@pytest.mark.django_db
def test_teachers_unauthorized():
    response = client.get("/api/teachers/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

@pytest.mark.django_db
def test_teachers_not_found(student_group):
    access_token = register_student()
    response = client.get("/api/teachers/1/",
                           headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.django_db
def test_students_unauthorized():
    response = client.get("/api/students/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

@pytest.mark.django_db
def test_students_unauthorized_to_post(teacher_group):
    access_token = register_teacher()
    response = client.post("/api/students/",
                          headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_students_unauthorized_to_delete(student_group):
    access_token = register_student()
    response = client.delete("/api/students/1/",
                          headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_students_not_found(teacher_group):
    access_token = register_teacher()
    response = client.get("/api/students/1/",
                           headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.django_db
def test_get_student(teacher_group, student):
    access_token = register_teacher()
    response = client.get("/api/students/1/",
                           headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_200_OK
    result = json.loads(response.content)
    assert result["id"] == student.id
    assert result["first_name"] == student.first_name
    assert len(result["courses"]) == 0
    assert "todo" not in result

@pytest.mark.django_db
def test_todo_for_forbidden(teacher_group, student):
    access_token = register_teacher()
    response = client.get("/api/students/1/todo_for?month=2&year=2025",
                           headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_todo(student_group):
    access_token = register_student()
    response = client.get("/api/students/1/todo_for?month=2&year=2025",
                           headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_200_OK

@pytest.mark.django_db
def test_get_student_by_owner(student_group):
    access_token = register_student()
    response = client.get("/api/students/1/",
                           headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_200_OK
    result = json.loads(response.content)
    assert result["id"] == 1
    assert len(result["courses"]) == 0
    assert len(result["todo"]) == 0


@pytest.mark.django_db
def test_get_teacher_by_student(student_group, teacher):
    access_token = register_student()
    response = client.get("/api/teachers/1/",
                           headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_200_OK
    result = json.loads(response.content)
    assert result["id"] == teacher.id
    assert len(result["courses"]) == 0


@pytest.mark.django_db
def test_get_teacher_by_owner(teacher_group):
    access_token = register_teacher()
    response = client.get("/api/teachers/1/",
                           headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_200_OK
    result = json.loads(response.content)
    assert result["id"] == 1
    assert len(result["courses"]) == 0

@pytest.mark.django_db
def test_topic_view_unauthorized(topic):
    response = client.get("/api/topics/1/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

@pytest.mark.django_db
def test_topics_for_course(teacher_group, topic):
    access_token = register_teacher()
    response = client.get(f"/api/topics/for_course?course_id={topic.course.id}",
                          headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_200_OK
    result = json.loads(response.content)
    assert len(result) == 1

@pytest.mark.django_db
def test_create_topic(teacher_group, teacher):
    access_token = register_teacher()
    create_course(access_token)
    payload = {
        "course_id": 1,
        "title": "Topic title",
        "description": "Topic description",
        "n_hours": datetime.timedelta(days=4)
    }
    response = client.post("/api/topics/", data=payload,
                           headers={'AUTHORIZATION':f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_200_OK
    assert Topic.objects.get(id=1).title == "Topic title"



@pytest.mark.django_db
def test_delete_topic(teacher_group):
    access_token = register_teacher()
    create_course(access_token)
    create_topic(access_token)
    response = client.delete("/api/topics/1/",
                           headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert len(Topic.objects.all()) == 0

@pytest.mark.django_db
def test_create_topic_fails(teacher_group, teacher):
    access_token = register_teacher()
    create_course(access_token)
    payload = {
        "course_id": 1,
        "title": "Topic title",
        "description": "Topic description",
        "n_hours": datetime.timedelta(minutes=3)
    }
    response = client.post("/api/topics/", data=payload,
                           headers={'AUTHORIZATION':f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    result = json.loads(response.content)
    assert "n_hours" in result

@pytest.mark.django_db
def test_create_lesson(teacher_group):
    access_token = register_teacher()
    create_course(access_token)
    create_topic(access_token)
    payload = {
        "topic_id": 1,
        "course_id": 1,
        "title": "Lesson title",
        "order": 1
    }
    response = client.post("/api/lessons/", data=payload,
                           headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_200_OK
    assert len(StudyItem.objects.all()) == 1

@pytest.mark.django_db
def test_change_lesson_order(teacher_group):
    access_token = register_teacher()
    create_course(access_token)
    create_topic(access_token)
    create_lessons(access_token, n=2)
    assert StudyItem.objects.get(id=1).order == 1
    payload = { "order_changes": { "1": 1,"2": 0} }
    response = client.put("/api/topics/1/change_lesson_order/", data=payload,
                           headers={'AUTHORIZATION': f" Bearer {access_token}"},
                           format="json")
    assert response.status_code == status.HTTP_200_OK
    assert len(StudyItem.objects.all()) == 2
    assert StudyItem.objects.get(id=1).order == 2

@pytest.mark.django_db
def test_get_topic(teacher_group, topic):
    access_token = register_teacher()
    response = client.get("/api/topics/1/",
                          headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_200_OK
    result = json.loads(response.content)
    assert result["id"] == topic.id
    assert result["title"] == topic.title

@pytest.mark.django_db
def test_change_order_fails(teacher_group):
    access_token = register_teacher()
    create_course(access_token)
    create_topic(access_token)
    create_lessons(access_token, n=2)
    payload = { "order_changes": { "1": 1} }
    response = client.put("/api/topics/1/change_lesson_order/", data=payload,
                          headers={'AUTHORIZATION': f" Bearer {access_token}"},
                          format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST

@pytest.mark.django_db
def test_get_lesson_unauthorized(lesson):
    response = client.get("/api/lessons/1/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

@pytest.mark.django_db
def test_delete_lesson(teacher_group):
    access_token = register_teacher()
    create_course(access_token)
    create_topic(access_token)
    create_lessons(access_token, n=2)
    assert StudyItem.objects.get(id=1).order == 1
    response = client.delete("/api/lessons/1/",
                          headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.django_db
def test_get_lessons_by_topic(teacher_group, lesson):
    access_token = register_teacher()
    response = client.get("/api/lessons/in_topic?topic_id=1",
                          headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_200_OK
    result = json.loads(response.content)
    assert len(result) == 1

@pytest.mark.django_db
def test_get_lessons_by_topic_not_found(teacher_group, lesson):
    access_token = register_teacher()
    response = client.get("/api/lessons/in_topic",
                          headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.django_db
def test_add_lesson_content(teacher_group):
    access_token = register_teacher()
    create_course(access_token)
    create_topic(access_token)
    create_lessons(access_token)
    payload = {
            "lesson_id": 1,
            "order": 1,
            "kind": "text",
            "text": "test test"
    }
    response = client.post("/api/lessons/add_content/", data=payload,
                          headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_200_OK



@pytest.mark.django_db
def test_change_content_order_fails(teacher_group):
    access_token = register_teacher()
    create_course(access_token)
    create_topic(access_token)
    create_lessons(access_token, n=2)
    create_content(access_token, n=2)
    payload = { "order_changes": {"1": 1} }
    response = client.put("/api/lessons/1/change_content_order/", data=payload,
                          headers={'AUTHORIZATION': f" Bearer {access_token}"},
                          format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_change_content_order_works(teacher_group):
    access_token = register_teacher()
    create_course(access_token)
    create_topic(access_token)
    create_lessons(access_token, n=2)
    create_content(access_token, n=2)
    payload = { "order_changes": { "1": 1, "2": 0 }}
    response = client.put("/api/lessons/1/change_content_order/", data=payload,
                          headers={'AUTHORIZATION': f" Bearer {access_token}"},
                          format="json")
    assert response.status_code == status.HTTP_200_OK
    assert ItemContent.objects.get(id=1).order == 2

@pytest.mark.django_db
def test_lesson_done(student_group, enrolled_student, lesson):
    access_token = register_student()
    enroll(access_token)
    payload = { "course_id": enrolled_student.course.id }
    response = client.post("/api/lessons/1/done/", data=payload,
                          headers={'AUTHORIZATION': f" Bearer {access_token}"},
                          format="json")
    assert response.status_code == status.HTTP_200_OK
    assert len(CourseProgress.objects.all()) == 1


@pytest.mark.django_db
def test_lesson_done_fails(student_group, enrolled_student, lesson):
    access_token = register_student()
    enroll(access_token)
    payload = { "course_id": 45 }
    response = client.post("/api/lessons/1/done/", data=payload,
                          headers={'AUTHORIZATION': f" Bearer {access_token}"},
                          format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST

@pytest.mark.django_db
def test_get_lesson_unregistered(student_group, lesson):
    access_token = register_student()
    response = client.get("/api/lessons/1/",
                          headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

@pytest.mark.django_db
def test_get_lesson(student_group, lesson):
    access_token = register_student()
    enroll(access_token)
    response = client.get("/api/lessons/1/",
                          headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_200_OK

@pytest.mark.django_db
def test_get_feedback_unauthorized():
    response = client.get("/api/feedbacks/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

@pytest.mark.django_db
def test_get_feedback_forbidden(student_group, feedback):
    access_token = register_student()
    response = client.get("/api/feedbacks/1/",
                          headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_delete_feedback_forbidden(student_group, feedback):
    access_token = register_student()
    response = client.delete("/api/feedbacks/1/",
                          headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_update_feedback_forbidden(student_group, feedback):
    access_token = register_student()
    response = client.put("/api/feedbacks/1/",
                          headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_list_feedback_by_course(student_group, feedback):
    access_token = register_student()

    response = client.get(f"/api/feedbacks/by_course?course_id={feedback.course.id}",
                          headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_200_OK
    result = json.loads(response.content)
    assert len(result) == 1

@pytest.mark.django_db
def test_list_feedback_by_unk_course(student_group, feedback):
    access_token = register_student()

    response = client.get("/api/feedbacks/by_course",
                          headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.django_db
def test_list_feedback_by_student_forbidden(student_group, feedback):
    access_token = register_student()
    response = client.get("/api/feedbacks/by_student?student_id=1",
                          headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_list_feedback_by_unk_student(student_group, feedback):
    access_token = register_student()
    response = client.get("/api/feedbacks/by_student",
                          headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_list_feedback_by_student(student_group, course):
    access_token = register_student()
    response = client.post(f"/api/courses/{course.id}/enroll/",
                           headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_200_OK
    payload = {
        "course_id": course.id,
        "text": "test feedback",
        "rating": 3
    }
    response = client.post("/api/feedbacks/", data=payload,
                           headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_200_OK
    user = User.objects.get(username="test_student")
    response = client.get(f"/api/feedbacks/by_student?student_id={user.id}",
                          headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_200_OK
    result = json.loads(response.content)
    assert len(result) == 1

@pytest.mark.django_db
def test_create_update_feedback(student_group, course):
    access_token = register_student()
    enroll(access_token)
    payload = {
        "course_id": 1,
        "text": "test feedback",
        "rating": 3
    }
    response = client.post("/api/feedbacks/", data=payload,
                          headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_200_OK
    assert len(Feedback.objects.all()) == 1
    payload = { "rating": 4 }
    response = client.put("/api/feedbacks/1/", data=payload,
                           headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_200_OK
    assert Feedback.objects.get(id=1).rating == 4

@pytest.mark.django_db
def test_create_update_feedback_fails(student_group, course):
    access_token = register_student()
    enroll(access_token)
    payload = {
        "course_id": 1,
        "text": "test feedback",
        "rating": 3
    }
    response = client.post("/api/feedbacks/", data=payload,
                          headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_200_OK
    assert len(Feedback.objects.all()) == 1
    payload = { "rating": 10 }
    response = client.put("/api/feedbacks/1/", data=payload,
                           headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_400_BAD_REQUEST

@pytest.mark.django_db
def test_create_feedback_fails(student_group, course):
    access_token = register_student()
    enroll(access_token)
    payload = {
        "course_id": 1,
        "text": "test feedback",
        "rating": -1
    }
    response = client.post("/api/feedbacks/", data=payload,
                          headers={'AUTHORIZATION': f" Bearer {access_token}"})
    assert response.status_code == status.HTTP_400_BAD_REQUEST
