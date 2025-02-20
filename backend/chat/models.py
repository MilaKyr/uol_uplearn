from django.db import models

from backend.elearning import User

class Conversation(models.Model):
    users = models.ManyToManyField(User, related_name="conversations")
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)


class Message(models.Model):
    conversation = models.ForeignKey(to=Conversation, on_delete=models.CASCADE, related_name="messages")
    text = models.TextField()
    recipient = models.ForeignKey(to=User, on_delete=models.CASCADE, related_name="received_messaged")
    sender = models.ForeignKey(to=User, on_delete=models.CASCADE, related_name="sent_messaged")
    created = models.DateTimeField(auto_now_add=True)
    seen = models.BooleanField(default=False)
