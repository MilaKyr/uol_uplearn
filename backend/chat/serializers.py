from django.db import transaction
from rest_framework import serializers
from elearning.models import User
from .models import Conversation, Message

from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes
from elearning.serializers import UserAuthSerializer

class ConversationSerializer(serializers.ModelSerializer):
    users = UserAuthSerializer(many=True)
    unread_messages = serializers.SerializerMethodField()
    unread_messages_ids = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    @extend_schema_field(OpenApiTypes.OBJECT)
    def get_last_message(self, instance):
        last_message = Message.objects.filter(conversation=instance).order_by('created').last()
        msg_serializer = MessageSerializer(last_message)
        return msg_serializer.data

    @extend_schema_field(OpenApiTypes.INT)
    def get_unread_messages(self, instance):
        user = self.context["request"].user
        n_messages = instance.messages.filter(seen=False, recipient=user).count()
        return n_messages

    @extend_schema_field(OpenApiTypes.OBJECT)
    def get_unread_messages_ids(self, instance):
        user = self.context["request"].user
        messages = instance.messages.filter(seen=False, recipient=user).values_list('id')
        message_ids = [f"{msg_id[0]}" for msg_id in messages if len(msg_id) > 0]
        return message_ids

    class Meta:
        model = Conversation
        fields = ["id", "users", "unread_messages", "unread_messages_ids", "last_message"]

class ConversationCreateSerializer(serializers.Serializer):
    recipient_id = serializers.UUIDField(write_only=True)

    def create(self, validated_data):
        sender = self.context['request'].user
        recipient_id = validated_data.get('recipient_id')
        recipient = User.objects.get(id=recipient_id)
        conversation = Conversation.objects.filter(users__in=[sender]).filter(users__in=[recipient])
        if conversation.exists():
            return conversation.get()
        new_conversation = Conversation.objects.create()
        new_conversation.users.add(sender)
        new_conversation.users.add(recipient)
        return new_conversation

class MessageSerializer(serializers.ModelSerializer):
    sender = UserAuthSerializer()
    recipient = UserAuthSerializer()
    created = serializers.DateTimeField(format="%d %B, %Y")

    class Meta:
        model = Message
        fields=["id", "recipient", 'sender', 'text', 'created']


class ConversationDetailSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True)

    class Meta:
        model = Conversation
        fields = ["id", "messages"]

class SeenMessagesSerializer(serializers.Serializer):
    ids = serializers.ListSerializer(child=serializers.UUIDField(), write_only=True)

    def update(self, instance, validated_data):
        ids = validated_data.pop('ids')
        with transaction.atomic():
            for msg_id in ids:
                msg_object = Message.objects.get(id=msg_id, conversation=instance)
                msg_object.seen = True
                msg_object.save()
        return instance

