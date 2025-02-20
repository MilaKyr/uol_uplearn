import logging
import datetime
import json

from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

from elearning.models import *

from django.contrib.auth import get_user_model
from django.core.files.images import ImageFile
from django.utils.timezone import make_aware

from .permissions import permissions

BATCH_SIZE=20

def delete_all_objects() -> None:
    User = get_user_model()
    Group.objects.all().delete()
    User.objects.all().delete()
    Tag.objects.all().delete()
    Course.objects.all().delete()
    Topic.objects.all().delete()
    Files.objects.all().delete()
    Lesson.objects.all().delete()
    CourseEnrollment.objects.all().delete()
    Feedback.objects.all().delete()
    CourseProgress.objects.all().delete()
    Notification.objects.all().delete()


def fill_database() -> None:
    delete_all_objects()
    with open('seeding/data/data.json') as f:
        data = json.load(f)

    logging.info("saving Groups...")
    objs = (Group(name="student"), Group(name="teacher"))
    objects = Group.objects.bulk_create(objs, BATCH_SIZE)
    ### Permissions
    for (group_name, permission) in permissions.items():
        for (table_name, table_perms) in permission.items():
            content_type = ContentType.objects.get(app_label='elearning', model=table_name)
            # get all permssions for this model
            perms = Permission.objects.filter(content_type=content_type)
            group = Group.objects.get(name=group_name)
            for perm in perms:
                if perm in table_perms:
                    group.permissions.add(perms)

    logging.info("saving User...")
    objs = (User(first_name=user["first_name"],
                 last_name=user["last_name"],
                 email=user["email"],
                 username=f'{user["first_name"]}_{user["last_name"]}',
                 status=user.get("status"),
                 bio=user.get("bio"),
                 password="pbkdf2_sha256$870000$HNHM7k1iJjGoBgM8gEUZ4A$IKgMAdZNB5zLpPAn9q7QkTZsFZt/PAxVzxL03yqtYow=",
                 role=Group.objects.get(name=user["role"]),
                 photo=ImageFile(open(f'seeding/data/photos/users/{user["photo"]}', "rb"))) for user in data["users"])
    User.objects.bulk_create(objs, BATCH_SIZE)


    logging.info("saving Tags...")
    objs = (Tag(name=tag) for tag in data["tags"])
    Tag.objects.bulk_create(objs, BATCH_SIZE)


    logging.info("saving Courses...")
    objs = (Course(
        teacher=User.objects.get(email=course["teacher"]),
        is_active=course["is_active"],
        photo=ImageFile(open(f'seeding/data/photos/courses/{course["photo"]}', "rb")),
        title=course["title"],
        description=course["description"],
        start_date=make_aware(datetime.datetime.strptime(course["start_date"], "%d/%m/%Y" )),
        duration=datetime.timedelta(days=course["duration"]),
    ) for course in data["courses"])

    Course.objects.bulk_create(objs, BATCH_SIZE)

    logging.info("adding Tags to Courses...")
    through_objs = []
    objects = Course.objects.all()
    for obj in objects:
        course_data = [course for course in data["courses"] if course["title"] == obj.title][0]
        for tag_name in course_data["tags"]:
            through_objs.append(
                Course.tags.through(
                    course=obj,
                    tag=Tag.objects.get(name=tag_name),
                )
            )
    Course.tags.through.objects.bulk_create(through_objs)


    logging.info("saving Topics...")
    objs = (
        Topic(
            course=Course.objects.get(title=course["title"]),
            title=topic["title"],
            description=topic["description"],
            n_hours=topic["n_hours"],
        )
        for course in data["courses"] for topic in course["topics"]
    )
    Topic.objects.bulk_create(objs, BATCH_SIZE)


    logging.info("saving Lessons...")
    objs = (Lesson(
        topic=Topic.objects.get(title=topic["title"], course__title=course["title"]),
        course=Course.objects.get(title=course["title"]),
        title=lesson["title"],
        deadline=make_aware(datetime.datetime.strptime(lesson["deadline"], "%d/%m/%Y" )),
    )  for course in data["courses"] for topic in course["topics"] for lesson in topic["lessons"])
    Lesson.objects.bulk_create(objs, BATCH_SIZE)

    logging.info("saving Course Enrollments...")


    objs = (CourseEnrollment(
        user=User.objects.get(email=enrollment["user"]),
        course=Course.objects.get(title=enrollment["course"]),
        status=enrollment["status"]
    ) for enrollment in data["enrollments"])
    CourseEnrollment.objects.bulk_create(objs, BATCH_SIZE)

    logging.info("saving Course Progress...")
    objs = (CourseProgress(
        enrolled_student=CourseEnrollment.objects.get(user__email=progress["user"], course__title=progress["course"]),
        item=Lesson.objects.get(title=progress["item"], course__title=progress["course"]),
    ) for progress in data["course_progress"])
    CourseProgress.objects.bulk_create(objs, BATCH_SIZE)

    logging.info("saving Feedback...")
    objs = (Feedback(
        user=CourseEnrollment.objects.get(user__email=feedback["user"], course__title=feedback["course"]),
        course=Course.objects.get(title=feedback["course"]),
        text=feedback["text"],
        rating=feedback["rating"],
    ) for feedback in data["feedback"])
    Feedback.objects.bulk_create(objs, BATCH_SIZE)
