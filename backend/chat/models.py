from django.db import models
import uuid
from elearning.models import User

class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    users = models.ManyToManyField(User, related_name="conversations")
    created = models.DateTimeField(auto_now_add=True)


class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(to=Conversation, on_delete=models.CASCADE, related_name="messages")
    text = models.TextField()
    recipient = models.ForeignKey(to=User, on_delete=models.CASCADE, related_name="received_messaged")
    sender = models.ForeignKey(to=User, on_delete=models.CASCADE, related_name="sent_messaged")
    created = models.DateTimeField(auto_now_add=True)
    seen = models.BooleanField(default=False)
