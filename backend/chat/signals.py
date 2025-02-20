from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from backend.chat.models import Message
from backend.elearning import BasicUserSerializer

@receiver(post_save, sender=Message)
def notification_created(sender, instance, created, **kwargs):
    if created:
        print("Im here!")
        sender_serializer = BasicUserSerializer(instance.sender)
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'chat_lobbyh',
            {
                "type": "notify",
                "sender": sender_serializer.data,
                "message": instance.text
            }
        )