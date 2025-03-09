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
        fields = ("id", "person", "course", "text", "created", "seen")


class NotificationSeenSerializer(serializers.ModelSerializer):
    """ Receives list of notification ids and sets all of them as seen """

    seen = serializers.BooleanField

    class Meta:
        model = Notification
        fields = ("seen",)
