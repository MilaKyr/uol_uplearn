from .models import Notification

from django.db import transaction
from rest_framework import serializers

from elearning.serializers import UserAuthSerializer, CourseBasicSerializer

class NotificationSerializer(serializers.ModelSerializer):
    """ Serializes notification """
    person = UserAuthSerializer()
    course = CourseBasicSerializer()
    created = serializers.DateTimeField(format="%d %B, %Y")

    class Meta:
        model = Notification
        fields = ('id', 'person', 'course', 'text', 'created', 'seen')


class NotificationSeenSerializer(serializers.Serializer):
    """ Receives list of notification ids and sets all of them as seen """
    ids = serializers.ListSerializer(child=serializers.UUIDField(), min_length=1)

    def to_representation(self, instance):
        return {}

    def create(self, validated_data):
        sampled_notification = None
        ids = validated_data.pop("ids")
        with transaction.atomic():
            for ind in ids:
                notification = Notification.objects.get(id=ind)
                notification.seen = True
                notification.save()
                if sampled_notification is None:
                    sampled_notification = notification
        return sampled_notification
