import uuid
from django.db import models

from elearning.models import User, Course

class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(to=User,  on_delete=models.CASCADE, related_name="recipient")
    person = models.ForeignKey(to=User, on_delete=models.CASCADE, null=True, related_name="person")
    course = models.ForeignKey(to=Course, on_delete=models.CASCADE, null=True)
    text = models.CharField(max_length=250)
    created = models.DateTimeField(auto_now_add=True)
    seen = models.BooleanField(default=False)
