from rest_framework import permissions, generics
from rest_framework.response import Response

from chat.models import Message
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer, NotificationSeenSerializer
from .permissions import IsSeenByRecipient

class InboxView(APIView):
    # permission_classes = [permissions.IsAuthenticated]

    def get(self, request, format=None):
        return self.retrieve(request, format)

    def retrieve(self, request, *args, **kwargs):
        n_notifications = Notification.objects.filter(recipient=request.user, seen=False).count()
        n_messages = Message.objects.filter(recipient=request.user, seen=False).count()
        return Response({
            'new_notifications': n_notifications,
            'new_messages': n_messages,
        })

class NotificationListView(generics.ListAPIView):
    queryset = Notification.objects.all().order_by('-created')
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsSeenByRecipient]

    def get_queryset(self):
        return self.queryset.filter(recipient=self.request.user)


class NotificationUpdateView(generics.UpdateAPIView):
    queryset = Notification.objects.all().order_by('-created')
    serializer_class = NotificationSeenSerializer
    permission_classes = [permissions.IsAuthenticated, IsSeenByRecipient]

