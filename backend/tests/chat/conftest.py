import pytest
from django.core.files.images import ImageFile
from django.db.models.signals import post_save
from django.utils import timezone
import datetime
from django.contrib.auth.models import Group

from chat.models import Conversation, Message
from django.db.models import signals


@pytest.fixture
def conversation(teacher_user, student_user):
    convo = Conversation.objects.create()
    convo.users.add(teacher_user)
    convo.users.add(student_user)
    convo.save()
    return convo


@pytest.fixture
def message(conversation, teacher_user, student_user):
    return Message.objects.create(
        conversation=conversation, text="test",
        recipient=teacher_user,
        sender=student_user
    )
