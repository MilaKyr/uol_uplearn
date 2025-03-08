import datetime
import json
import uuid
import pytest
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from elearning.serializers import *
from elearning.models import *
from django.db.models import signals
from tests.utils import course_payload, register_student, register_teacher, create_course, enroll, \
random_password, random_email
from notifications.models import Notification

from elearning.models import CourseEnrollment

from notifications.signals import enrollment_created

client = APIClient()


@pytest.mark.django_db
def test_register(student_group):
    payload = {
        "username": "test_username",
        "first_name": "Test",
        "last_name": "User",
        "email": "email@email.com",
        "password1": "test_password",
        "password2": "test_password",
        "role": "student",
        "token": None,
    }
    response = client.post("/api/register/", payload, format="json")
    assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
def test_login(student_group):
    password = random_password()
    email = random_email()
    student = register_student(password, email)
    payload = {
        "email": email,
        "password": password,
    }
    response = client.post("/api/login/", payload, format="json")
    assert User.objects.get(id=student['user']['id']).is_online
    assert response.status_code == status.HTTP_200_OK

@pytest.mark.django_db
def test_logout(student_group):
    password = random_password()
    email = random_email()
    student = register_student(password, email)
    payload = { "email": email,"password": password,}
    response = client.post("/api/login/", payload, format="json")
    assert response.status_code == status.HTTP_200_OK
    response = client.post("/api/logout/", payload,
                           headers={'AUTHORIZATION':
                                        f" Bearer {student['access']}"},
                           format="json")
    assert response.status_code == status.HTTP_200_OK
    assert not User.objects.get(id=student['user']['id']).is_online


@pytest.mark.django_db
def test_list_courses(student_group, active_course):
    student = register_student()
    response = client.get("/api/courses/", headers={'AUTHORIZATION':
                                                        f" Bearer {student['access']}"})
    assert response.status_code == status.HTTP_200_OK
    assert len(json.loads(response.content)) == 1


@pytest.mark.django_db
def test_get_course(student_group, active_course):
    student = register_student()
    response = client.get(f"/api/courses/{active_course.id}/", headers={'AUTHORIZATION':
                                                        f" Bearer {student['access']}"})
    assert response.status_code == status.HTTP_200_OK
    result = json.loads(response.content)
    assert result["id"] == str(active_course.id)
    assert result["title"] == active_course.title
    assert result["average_rating"] == 0.0
    assert result["description"] == active_course.description


@pytest.mark.django_db
def test_create_course_teacher_fails(teacher_group):
    teacher = register_teacher()
    assert Course.objects.count() == 0
    start_date = timezone.now() + datetime.timedelta(days=3)
    duration = datetime.timedelta(days=30)
    payload = {
        "title": "Test",
        "description": "Test",
        "start_date": start_date,
        "duration": duration,
    }
    response = client.post("/api/courses/", data=payload,
                           headers={'AUTHORIZATION':f" Bearer {teacher['access']}"})
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_create_course_past_start_date(teacher_group, teacher):
    teacher = register_teacher()
    assert Course.objects.count() == 0
    start_date = timezone.now() - datetime.timedelta(days=3)
    duration = datetime.timedelta(days=30)
    payload = {
        "title": "Test",
        "description": "Test",
        "start_date": start_date,
        "duration": duration,
        "photo": "image.png"
    }
    response = client.post("/api/courses/", data=payload,
                           headers={'AUTHORIZATION':f" Bearer {teacher['access']}"})
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    response_content = json.loads(response.content)
    assert "start_date" in response_content


@pytest.mark.django_db
def test_enroll(student_group, course):
    student = register_student()
    response = client.post("/api/enrollments/",
                           data={"course_id": str(course.id)},
                           headers={'AUTHORIZATION': f" Bearer {student['access']}"},
                           format="json")
    assert response.status_code == status.HTTP_201_CREATED
    assert CourseEnrollment.objects.count() == 1

@pytest.mark.django_db
def test_enroll_course_nonexistent(student_group):
    student = register_student()
    signals.post_save.receivers = []
    response = client.post("/api/enrollments/",
                           data={"course_id": str(uuid.uuid4())},
                           headers={'AUTHORIZATION': f" Bearer {student['access']}"},
                           format="json")
    assert response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.django_db
def test_users_found(teacher_group, student):
    teacher = register_teacher()
    response = client.get(f"/api/dashboard/{teacher['user']['id']}",
                           headers={'AUTHORIZATION': f" Bearer {teacher['access']}"})
    assert response.status_code == status.HTTP_200_OK

@pytest.mark.django_db
def test_get_student(teacher_group, student):
    teacher = register_teacher()
    response = client.get(f"/api/dashboard/{student.id}",
                           headers={'AUTHORIZATION': f" Bearer {teacher['access']}"})
    assert response.status_code == status.HTTP_200_OK
    result = json.loads(response.content)
    assert result["id"] == str(student.id)
    assert result["name"] == student.full_name
    assert len(result["courses"]) == 0
    assert "todo" not in result


@pytest.mark.django_db
def test_todo(student_group):
    student = register_student()
    response = client.get("/api/todo_for?month=2&year=2025",
                           headers={'AUTHORIZATION': f" Bearer {student['access']}"})
    assert response.status_code == status.HTTP_200_OK

@pytest.mark.django_db
def test_todo_with_week(student_group):
    student = register_student()
    response = client.get("/api/todo_for?month=2&year=2025&week=8",
                           headers={'AUTHORIZATION': f" Bearer {student['access']}"})
    assert response.status_code == status.HTTP_200_OK

@pytest.mark.django_db
def test_get_users_home(student_group):
    student = register_student()
    response = client.get(f"/api/dashboard/{student['user']['id']}",
                           headers={'AUTHORIZATION': f" Bearer {student['access']}"})
    assert response.status_code == status.HTTP_200_OK
    result = json.loads(response.content)
    assert result["id"] == student['user']['id']
    assert len(result["courses"]) == 0
    assert len(result["todo"]) == 0


@pytest.mark.django_db
def test_get_teacher_by_owner(teacher_group):
    teacher = register_teacher()
    response = client.get(f"/api/dashboard/{teacher['user']['id']}",
                           headers={'AUTHORIZATION': f" Bearer {teacher['access']}"})
    assert response.status_code == status.HTTP_200_OK
    result = json.loads(response.content)
    assert result["id"] == teacher['user']['id']
    assert len(result["courses"]) == 0


@pytest.mark.django_db
def test_topics_with_lesson_student_works(student_group, topic, lesson):
    student = register_student()
    enroll(student["access"], str(topic.course.id))
    response = client.get(f"/api/topics/{topic.id}/",
                          headers = {'AUTHORIZATION': f" Bearer {student['access']}"})
    assert response.status_code == status.HTTP_200_OK

@pytest.mark.django_db
def test_create_course(teacher_group):
    teacher = register_teacher()
    status_code, _ = create_course(teacher["access"])
    assert status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
def test_lesson_done(student_group, course, lesson):
    student = register_student()
    enroll(student['access'], str(lesson.course.id))
    response = client.patch(f"/api/lessons/progress/{lesson.id}/",
                          headers={'AUTHORIZATION': f" Bearer {student['access']}"})
    assert response.status_code == status.HTTP_200_OK
    enrollment = CourseEnrollment.objects.prefetch_related("done_lessons").get(user__id=student['user']['id'])
    assert enrollment.done_lessons.count() == 1

@pytest.mark.django_db
def test_get_lesson_unregistered(student_group, lesson):
    student = register_student()
    response = client.get(f"/api/lessons/{lesson.id}/",
                          headers={'AUTHORIZATION': f" Bearer {student['access']}"})
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_get_lesson(student_group, lesson):
    student = register_student()
    enroll(student['access'], str(lesson.course.id))
    response = client.get(f"/api/lessons/{lesson.id}/",
                          headers={'AUTHORIZATION': f" Bearer {student['access']}"})
    assert response.status_code == status.HTTP_200_OK

@pytest.mark.django_db
def test_create_update_feedback(student_group, course):
    student = register_student()
    enroll(student['access'], str(course.id))
    # changing status to finished, otherwise it's forbidden
    enrollment = CourseEnrollment.objects.get(user=student['user']['id'], course=course.id)
    enrollment.status = "finished"
    enrollment.save()
    payload = {
        "course_id": str(course.id),
        "text": "test feedback",
        "rating": 3
    }
    response = client.post("/api/feedbacks/", data=payload,
                          headers={'AUTHORIZATION': f" Bearer {student['access']}"})
    assert response.status_code == status.HTTP_201_CREATED
    response = client.get("/api/feedbacks/", data=payload,
                           headers={'AUTHORIZATION': f" Bearer {student['access']}"})
    assert response.status_code == status.HTTP_200_OK
    feedbacks = json.loads(response.content)
    feedback_id = feedbacks[0]['feedback']['id']
    response = client.patch(f"/api/feedbacks/{feedback_id}/", data={ "rating": 4 },
                           headers={'AUTHORIZATION': f" Bearer {student['access']}"})
    assert response.status_code == status.HTTP_200_OK
    assert Feedback.objects.get(id=feedback_id).rating == 4

@pytest.mark.django_db
def test_create_update_feedback_fails(student_group, course):
    student = register_student()
    enroll(student['access'], str(course.id))
    # changing status to finished, otherwise it's forbidden
    enrollment = CourseEnrollment.objects.get(user=student['user']['id'], course=course.id)
    enrollment.status = "finished"
    enrollment.save()
    # sending feedback
    payload = {
        "course_id": str(course.id),
        "text": "test feedback",
        "rating": 3
    }
    response = client.post("/api/feedbacks/", data=payload,
                          headers={'AUTHORIZATION': f" Bearer {student['access']}"})
    assert response.status_code == status.HTTP_201_CREATED
    feedback = Feedback.objects.first()
    assert feedback is not None
    payload = { "rating": 10 }
    response = client.put(f"/api/feedbacks/{feedback.id}/", data=payload,
                           headers={'AUTHORIZATION': f" Bearer {student['access']}"})
    assert response.status_code == status.HTTP_400_BAD_REQUEST

@pytest.mark.django_db
def test_create_feedback_fails(student_group, course):
    student = register_student()
    enroll(student['access'], str(course.id))
    payload = {
        "course_id": str(course.id),
        "text": "test feedback",
        "rating": -1
    }
    response = client.post("/api/feedbacks/", data=payload,
                          headers={'AUTHORIZATION': f" Bearer {student['access']}"})
    assert response.status_code == status.HTTP_400_BAD_REQUEST

@pytest.mark.django_db
def test_course_search_all(student_group, active_course):
    student = register_student()
    response = client.get("/api/courses/search",
                          headers={'AUTHORIZATION': f" Bearer {student['access']}"})
    assert response.status_code == status.HTTP_200_OK
    result = json.loads(response.content)
    assert len(result) == 1
    assert result[0]["id"] == str(active_course.id)

@pytest.mark.django_db
def test_course_search_title(student_group, active_course):
    student = register_student()
    response = client.get(f"/api/courses/search?query={active_course.title[:3]}",
                          headers={'AUTHORIZATION': f" Bearer {student['access']}"})
    assert response.status_code == status.HTTP_200_OK
    result = json.loads(response.content)
    assert len(result) == 1
    assert result[0]["id"] == str(active_course.id)

@pytest.mark.django_db
def test_course_search_tag(student_group, tag, active_course):
    student = register_student()
    response = client.get(f"/api/courses/search?tag={tag.name}",
                          headers={'AUTHORIZATION': f" Bearer {student['access']}"})
    assert response.status_code == status.HTTP_200_OK
    result = json.loads(response.content)
    assert len(result) == 0

@pytest.mark.django_db
def test_course_search_tag_with_title_none(student_group, tag, active_course):
    student = register_student()
    response = client.get(f"/api/courses/search?tag={tag.name}&query={active_course.title}",
                          headers={'AUTHORIZATION': f" Bearer {student['access']}"})
    assert response.status_code == status.HTTP_200_OK
    result = json.loads(response.content)
    assert len(result) == 0

@pytest.mark.django_db
def test_course_search_tag_with_title_found(student_group, tag, active_course_tag):
    student = register_student()
    response = client.get(f"/api/courses/search?tag={tag.name}&query={active_course_tag.title}",
                          headers={'AUTHORIZATION': f" Bearer {student['access']}"})
    assert response.status_code == status.HTTP_200_OK
    result = json.loads(response.content)
    assert len(result) == 1
    assert result[0]["id"] == str(active_course_tag.id)

@pytest.mark.django_db
def test_get_new_course_id(teacher_group, lesson):
    teacher = register_teacher()
    response = client.get(f"/api/new_course_id",
                          headers={'AUTHORIZATION': f" Bearer {teacher['access']}"})
    assert response.status_code == status.HTTP_201_CREATED

@pytest.mark.django_db
def test_get_study_course_teacher_works(teacher_group, course):
    teacher = register_teacher()
    _, course = create_course(teacher['access'])
    response = client.get(f"/api/courses/study/{course['id']}/",
                          headers={'AUTHORIZATION': f" Bearer {teacher['access']}"})
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_get_study_course_student_works(student_group, course, topic, lesson):
    student = register_student()
    enroll(student['access'], f"{course.id}")
    response = client.get(f"/api/courses/study/{course.id}/",
                          headers={'AUTHORIZATION': f" Bearer {student['access']}"})
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_get_study_course_student_done_works(student_group, course, topic, lesson):
    student = register_student()
    enroll(student['access'], f"{course.id}")
    response = client.patch(f"/api/lessons/progress/{lesson.id}/",
               headers={'AUTHORIZATION': f" Bearer {student['access']}"})
    assert response.status_code == status.HTTP_200_OK
    response = client.get(f"/api/courses/study/{course.id}/",
                          headers={'AUTHORIZATION': f" Bearer {student['access']}"})
    assert response.status_code == status.HTTP_200_OK
    result = json.loads(response.content)
    assert result['topics'][0]['lessons'][0]['done']


@pytest.mark.django_db
def test_enrolled_students(teacher_group, active_course):
    teacher = register_teacher()
    response = client.get(f"/api/enrollments/students?course_id{active_course.id}",
                          headers={'AUTHORIZATION': f" Bearer {teacher['access']}"})
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_update_enrollment_status(teacher_group, student_group):
    teacher = register_teacher()
    student = register_student()
    signals.post_save.disconnect(receiver=enrollment_created, sender=CourseEnrollment)
    _, course = create_course(teacher['access'])
    enroll(student['access'], course['id'])
    enrollment = CourseEnrollment.objects.get(course__id=course['id'], user__id=student['user']['id'])
    assert enrollment.status == "started"
    response = client.patch(f"/api/enrollments/{enrollment.id}/", data={"status": "blocked"},
                          headers={'AUTHORIZATION': f" Bearer {teacher['access']}"}, format="json")
    assert response.status_code == status.HTTP_200_OK
    assert CourseEnrollment.objects.get(id=enrollment.id).status == "blocked"


@pytest.mark.django_db
def test_user_search_all(teacher_group, student_group):
    teacher1 = register_teacher()
    teacher2 = register_teacher()
    student = register_student()
    response = client.get(f"/api/users/search",
                          headers={'AUTHORIZATION': f" Bearer {teacher1['access']}"})
    result = json.loads(response.content)
    assert len(result) == 2
    assert [user['id'] for user in result].sort() == [student['user']['id'], teacher2['user']['id']].sort()

@pytest.mark.django_db
def test_user_search_students(teacher_group, student_group):
    teacher1 = register_teacher()
    student = register_student()
    response = client.get(f"/api/users/search?role=Student",
                          headers={'AUTHORIZATION': f" Bearer {teacher1['access']}"})
    result = json.loads(response.content)
    assert len(result) == 1
    assert [user['id'] for user in result] == [student['user']['id']]

@pytest.mark.django_db
def test_user_search_by_status(teacher_group, student_group, course):
    teacher1 = register_teacher()
    student = register_student()
    _, course = create_course(teacher1['access'])
    enroll(student['access'], course['id'])
    response = client.get(f"/api/users/search?status=started",
                          headers={'AUTHORIZATION': f" Bearer {teacher1['access']}"})
    result = json.loads(response.content)
    assert len(result) == 1
    assert [user['id'] for user in result] == [student['user']['id']]

@pytest.mark.django_db
def test_user_search_by_name(teacher_group, student_group):
    teacher1 = register_teacher()
    student = register_student()
    student_name= student['user']['name'].split(" ")
    response = client.get(f"/api/users/search?query={student_name[0]}",
                          headers={'AUTHORIZATION': f" Bearer {teacher1['access']}"})
    result = json.loads(response.content)
    assert len(result) == 1
    assert [user['id'] for user in result] == [student['user']['id']]

@pytest.mark.django_db
def test_user_search_by_course(teacher_group, student_group):
    teacher1 = register_teacher()
    _, course = create_course(teacher1['access'])
    _ = register_student()
    response = client.get(f"/api/users/search?course_id={course['id']}",
                          headers={'AUTHORIZATION': f" Bearer {teacher1['access']}"})
    result = json.loads(response.content)
    assert len(result) == 0

@pytest.mark.django_db
def test_user_search_by_course_enrolled(teacher_group, student_group):
    teacher1 = register_teacher()
    _, course = create_course(teacher1['access'])
    student = register_student()
    enroll(student['access'], course['id'])
    response = client.get(f"/api/users/search?course_id={course['id']}",
                            headers={'AUTHORIZATION': f" Bearer {teacher1['access']}"})
    result = json.loads(response.content)
    assert len(result) == 1
    assert [user['id'] for user in result] == [student['user']['id']]

@pytest.mark.django_db
def test_student_update_settings(student_group):
    new_status = "new status"
    student = register_student()
    client.patch(f"/api/home/settings/{student['user']['id']}",
                 data={"status": new_status}, format="json",
                 headers={'AUTHORIZATION': f" Bearer {student['access']}"})
    assert User.objects.get(id=student['user']['id']).status == new_status

@pytest.mark.django_db
def test_teacher_update_settings(teacher_group):
    new_bio = "new bio"
    teacher = register_teacher()
    client.patch(f"/api/home/settings/{teacher['user']['id']}",
                 data={"bio": new_bio}, format="json",
                 headers={'AUTHORIZATION': f" Bearer {teacher['access']}"})
    assert User.objects.get(id=teacher['user']['id']).bio == new_bio

@pytest.mark.django_db
def test_retrieve_file(teacher_group):
    teacher = register_teacher()
    _, course = create_course(teacher['access'])
    lesson = Lesson.objects.get(course__id=course['id'])
    response = client.get(f"/api/lessons/files/{lesson.id}/",
                          headers={'AUTHORIZATION': f" Bearer {teacher['access']}"})
    assert response.status_code == status.HTTP_200_OK

