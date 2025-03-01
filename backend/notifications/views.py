from rest_framework import permissions, generics
from rest_framework.response import Response

from chat.models import Message
from .models import Notification
from .serializers import NotificationSerializer, NotificationSeenSerializer
from .permissions import IsSeenByRecipient

class InboxView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def retrieve(self, request, *args, **kwargs):
        n_notifications = Notification.objects.filter(recipient=request.user, seen=False).count()
        n_messages = Message.objects.filter(recipient=request.user, seen=False).count()
        return Response({
            'new_notifications': n_notifications,
            'new_messages': n_messages,
        })

class NotificationListCreateView(generics.ListCreateAPIView):
    queryset = Notification.objects.all().order_by('-created')
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsSeenByRecipient]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return NotificationSeenSerializer
        return self.serializer_class

