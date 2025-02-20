from django.db import transaction
from rest_framework import serializers
from elearning.models import User
from .models import Conversation, Message

from elearning.serializers import BasicUserSerializer



class ConversationListSerializer(serializers.ModelSerializer):
    users = BasicUserSerializer(many=True)
    unread_messages = serializers.SerializerMethodField()
    unread_messages_ids = serializers.SerializerMethodField()

    def get_unread_messages(self, instance):
        n_messages = instance.messages.filter(seen=False).count()
        return n_messages

    def get_unread_messages_ids(self, instance):
        messages = instance.messages.filter(seen=False).values_list('id')
        message_ids = [msg_id[0] for msg_id in messages if len(msg_id) > 0]
        return message_ids

    class Meta:
        model = Conversation
        fields = ["id", "users", "unread_messages", "unread_messages_ids"]

class ConversationCreateSerializer(serializers.Serializer):
    recipient_id = serializers.IntegerField()

    def create(self, validated_data):
        sender_id = self.context.get("sender_id")
        sender = User.objects.get(id=sender_id)
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
    sender = BasicUserSerializer()
    recipient = BasicUserSerializer()
    created = serializers.SerializerMethodField()

    def get_created(self, instance):
        return instance.created.date()

    class Meta:
        model = Message
        fields=["id", "recipient", 'sender', 'text', 'created']

class SeenMessagesSerializier(serializers.Serializer):
    ids = serializers.ListSerializer(child=serializers.IntegerField())

    def update(self, instance, validated_data):
        ids = validated_data.pop('ids')
        with transaction.atomic():
            for msg_id in ids:
                msg_object = Message.objects.get(id=msg_id, conversation=instance)
                msg_object.seen = True
                msg_object.save()
        return instance

