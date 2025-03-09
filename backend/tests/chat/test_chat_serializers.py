import json

import pytest
from django.http import HttpRequest

from chat.serializers import *
from chat.models import *
from tests.utils import get_role


@pytest.mark.django_db
def test_conversation_serializer(conversation, message, student, teacher):
    request = HttpRequest()
    request.user = message.recipient
    serialized = ConversationSerializer(conversation, context={"request": request})
    expected = {
        "id": f"{conversation.id}",
        "unread_messages": 1,
        "unread_messages_ids": [f"{message.id}"],
        "last_message": {
            "id": f"{message.id}",
            "recipient": {
                "id": f"{message.recipient.id}",
                "name": f"{message.recipient.full_name}",
                "photo": None,
                "is_online": message.recipient.is_online,
                "role": get_role(message.recipient),
            },
            "sender": {
                "id": f"{message.sender.id}",
                "name": f"{message.sender.full_name}",
                "photo": None,
                "is_online": message.sender.is_online,
                "role": get_role(message.sender),
            },
            "text": message.text,
            "created": message.created.strftime("%d %B, %Y"),
        },
    }
    result = serialized.data
    users = result.pop("users")
    expected_users = [
        {
            "id": f"{teacher.id}",
            "name": f"{teacher.full_name}",
            "photo": None,
            "is_online": teacher.is_online,
            "role": get_role(teacher),
        },
        {
            "id": f"{student.id}",
            "name": f"{student.full_name}",
            "photo": None,
            "is_online": student.is_online,
            "role": get_role(student),
        },
    ]
    for user in expected_users:
        assert user in users
    assert json.dumps(result, sort_keys=True) == json.dumps(expected, sort_keys=True)


@pytest.mark.django_db
def test_conversation_detail_serializer(conversation, message, student, teacher):
    serialized = ConversationDetailSerializer(conversation)
    expected = {
        "id": f"{conversation.id}",
        "messages": [
            {
                "id": f"{message.id}",
                "recipient": {
                    "id": f"{message.recipient.id}",
                    "name": f"{message.recipient.full_name}",
                    "photo": None,
                    "is_online": message.recipient.is_online,
                    "role": get_role(message.recipient),
                },
                "sender": {
                    "id": f"{message.sender.id}",
                    "name": f"{message.sender.full_name}",
                    "photo": None,
                    "is_online": message.sender.is_online,
                    "role": get_role(message.sender),
                },
                "text": message.text,
                "created": message.created.strftime("%d %B, %Y"),
            }
        ],
    }
    print(message.sender)
    assert json.dumps(serialized.data, sort_keys=True) == json.dumps(
        expected, sort_keys=True
    )


@pytest.mark.django_db
def test_conversation_seen_serializer(conversation, message, student, teacher):
    assert not message.seen
    serialized = SeenMessagesSerializer(conversation, data={"ids": [f"{message.id}"]})
    serialized.is_valid(raise_exception=True)
    serialized.save()
    assert Message.objects.get(id=message.id).seen


@pytest.mark.django_db
def test_conversation_create_serializer(student, teacher):
    assert Conversation.objects.count() == 0
    request = HttpRequest()
    request.user = student
    serialized = ConversationCreateSerializer(
        data={"recipient_id": f"{teacher.id}"}, context={"request": request}
    )
    serialized.is_valid(raise_exception=True)
    serialized.save()
    assert Conversation.objects.count() == 1
