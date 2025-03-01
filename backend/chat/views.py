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

#
# class ConversationView(viewsets.GenericViewSet ,generics.RetrieveAPIView):
#     queryset = Conversation.objects.all()
#     serializer_class = ConversationSerializer
#     permission_classes = [ConversationPermission]
#
#     @action(detail=True, methods=["put"])
#     def seen(self, request, *args, **kwargs):
#         try:
#             conversation = self.get_object()
#             serializer = SeenMessagesSerializier(
#                 instance=conversation,
#                 data=request.data)
#             if serializer.is_valid(raise_exception=True):
#                 serializer.save()
#                 return Response(status=status.HTTP_200_OK)
#         except KeyError as e:
#             return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)
#
#     def list(self, request, *args, **kwargs):
#         conversations = (Conversation
#                          .objects
#                          .prefetch_related("users")
#                          .prefetch_related("messages")
#                          .filter(users__in=[request.user])
#                          .all())
#         serializer = self.serializer_class(conversations, many=True)
#         conversations_resp = serializer.data
#         for resp in conversations_resp:
#             last_message = Message.objects.filter(conversation__id=resp["id"]).last()
#             msg_serializer = MessageSerializer(last_message)
#             resp["last_message"] = msg_serializer.data
#         return Response(serializer.data)
#
#     def retrieve(self, request, *args, **kwargs):
#         conversation = self.get_object()
#         serializer = self.serializer_class(conversation)
#         response = serializer.data
#         messages = Message.objects.filter(conversation=conversation).order_by('created').all()
#         serializer = MessageSerializer(messages, many=True)
#         response["messages"] = serializer.data
#         return Response(response)
#
#     def create(self, request, *args, **kwargs):
#         try:
#             serializer = ConversationCreateSerializer(
#                 data=request.data,
#                 context={"sender_id": request.user.id})
#             if serializer.is_valid(raise_exception=True):
#                 conversation = serializer.save()
#                 return Response({"id": conversation.id}, status=status.HTTP_200_OK)
#         except KeyError as e:
#             return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)
#
#
#
