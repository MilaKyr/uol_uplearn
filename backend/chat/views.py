from .models import Conversation
from rest_framework import permissions, generics

from .serializers import ConversationSerializer, ConversationCreateSerializer, \
    SeenMessagesSerializer, ConversationDetailSerializer
from .permissions import IsParticipant


class ConversationListView(generics.ListAPIView):
    queryset = (
        Conversation
        .objects
        .prefetch_related("users")
        .prefetch_related("messages")
    )
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(users__in=[self.request.user])

class ConversationCreateView(generics.CreateAPIView):
    serializer_class = ConversationCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

class ConversationRetrieveView(generics.RetrieveAPIView):
    queryset = Conversation.objects.all()
    serializer_class = ConversationDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsParticipant]

class ConversationUpdateView(generics.UpdateAPIView):
    queryset = Conversation.objects.all()
    serializer_class = SeenMessagesSerializer
    permission_classes = [permissions.IsAuthenticated, IsParticipant]
