import pytest

from elearning.models import Course, User
from seeding.fill_db import delete_all_objects, fill_database
from django.contrib.auth.models import Group

@pytest.mark.django_db
def test_delete_all_objects(student_group, teacher_group, course):
    assert Course.objects.count() == 1
    assert Group.objects.count() == 2
    delete_all_objects()
    assert Course.objects.count() == 0
    assert Group.objects.count() == 0

@pytest.mark.django_db
def test_fill_db():
    assert Course.objects.count() == 0
    assert Group.objects.count() == 0
    fill_database()
    assert Course.objects.count() == 5
    assert Group.objects.count() == 2

@pytest.mark.django_db
def test_student_permissions_the_same_as_group():
    assert Group.objects.count() == 0
    fill_database()
    student= User.objects.prefetch_related("groups").filter(groups__name="student").first()
    student_group = Group.objects.get(name="student")
    group_permissions = [perm.codename for perm in student_group.permissions.all()]
    user_permissions = [perm.split(".")[-1] for perm in student.get_all_permissions()]
    assert group_permissions.sort() == user_permissions.sort()


@pytest.mark.django_db
def test_teacher_permissions_the_same_as_group():
    assert Group.objects.count() == 0
    fill_database()
    teacher= User.objects.prefetch_related("groups").filter(groups__name="student").first()
    teacher_group = Group.objects.get(name="teacher")
    group_permissions = [perm.codename for perm in teacher_group.permissions.all()]
    user_permissions = [perm.split(".")[-1] for perm in teacher.get_all_permissions()]
    assert group_permissions.sort() == user_permissions.sort()