from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from chat.models import Message
from elearning.models import Notification

@receiver(post_save, sender=Message)
def notification_created(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'public_room_{instance.recipient.id}',
            {
                "type": "notify_me",
                'id': instance.id,
                "sender_id": instance.sender.id,
                "recipient_id": instance.recipient.id,
                "message": instance.text
            }
        )

@receiver(post_save, sender=Notification)
def notification_created(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'public_room_{instance.recipient.id}',
            {
                "type": "new_notification",
                "notification_id": instance.id,
                "recipient_id": instance.recipient.id,
                "sender_first_name": instance.person.first_name,
                "sender_last_name": instance.person.last_name,
                "course_id": instance.course.id,
                "course_title": instance.course.title,
                "message": instance.text
            }
        )