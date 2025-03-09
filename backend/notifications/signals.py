from django.db import transaction
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from chat.models import Message
from notifications.models import Notification
from elearning.models import CourseEnrollment, Lesson, CourseEnrollment, Topic


@receiver(post_save, sender=Message)
def message_created(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'public_room_{f"{instance.recipient.id}"}',
            {
                "type": "new_message",
                "id": f"{instance.id}",
                "sender_id": f"{instance.sender.id}",
                "message": instance.text,
            },
        )


@receiver(post_save, sender=Notification)
def notification_created(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'public_room_{f"{instance.recipient.id}"}',
            {
                "type": "new_notification",
                "notification_id": f"{instance.id}",
                "recipient_id": f"{instance.recipient.id}",
                "sender_name": instance.person.full_name,
                "course_id": f"{instance.course.id}",
                "course_title": instance.course.title,
                "message": instance.text,
            },
        )


@receiver(post_save, sender=CourseEnrollment)
def enrollment_created(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            recipient=instance.course.teacher.user,
            person=instance.student.user,
            course=instance.course,
            text="enrolled in a course",
        )
    else:
        if instance.status != instance.cached_status:
            if instance.status != "finished":
                action_name = (
                    "un-blocked" if instance.status == "started" else instance.status
                )
                Notification.objects.create(
                    recipient=instance.student.user,
                    person=instance.course.teacher.user,
                    course=instance.course,
                    text=f"{action_name} you in the course",
                )


@receiver(post_save, sender=Lesson)
def lesson_updated(sender, instance, created, **kwargs):
    if not created:
        enrollments = CourseEnrollment.objects.filter(
            status="started", course=instance.course
        ).all()
        with transaction.atomic():
            for enrolled in enrollments:
                Notification.objects.create(
                    recipient=enrolled.student.user,
                    person=instance.course.teacher.user,
                    course=instance.course,
                    text=f"updated material in {instance.title} lesson in the course",
                )


@receiver(post_delete, sender=Topic)
def topic_deleted(sender, instance, created, **kwargs):
    if not created:
        enrollments = CourseEnrollment.objects.filter(
            status="started", course=instance.course
        ).all()
        with transaction.atomic():
            for enrolled in enrollments:
                Notification.objects.create(
                    recipient=enrolled.student.user,
                    person=instance.course.teacher.user,
                    course=instance.course,
                    text=f"deleted {instance.title} topic in the course",
                )


@receiver(post_delete, sender=Lesson)
def lesson_deleted(sender, instance, created, **kwargs):
    enrollments = CourseEnrollment.objects.filter(
        status="started", course=instance.course
    ).all()
    with transaction.atomic():
        for enrolled in enrollments:
            Notification.objects.create(
                recipient=enrolled.student.user,
                person=instance.course.teacher.user,
                course=instance.course,
                text=f"deleted {instance.title} lesson in the course",
            )
