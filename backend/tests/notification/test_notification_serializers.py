import pytest

from notifications.models import Notification
from notifications.serializers import NotificationSeenSerializer


@pytest.mark.django_db
def test_notifications_seen_serializer(notification):
    assert Notification.objects.count() == 1
    assert not Notification.objects.get(id=notification.id).seen
    serializer = NotificationSeenSerializer(instance=notification, data={"seen": True})
    serializer.is_valid(raise_exception=True)
    serializer.save()
    assert Notification.objects.get(id=notification.id).seen
