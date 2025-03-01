import pytest
from django.core.files.images import ImageFile
from django.db.models.signals import post_save
from django.utils import timezone
import datetime
from django.contrib.auth.models import Group

from chat.models import Conversation, Message
from django.db.models import signals

@pytest.fixture
def conversation(teacher, student):
    convo = Conversation.objects.create()
    convo.users.add(teacher)
    convo.users.add(student)
    convo.save()
    return convo

@pytest.fixture
def message(conversation, teacher, student):
    return Message.objects.create(conversation=conversation, text="test", recipient=teacher, sender=student)