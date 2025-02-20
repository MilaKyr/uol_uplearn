from django.shortcuts import render

from .models import Conversation, Message
from django.db import transaction, connection
from django.db.models import Avg, FloatField, Count, IntegerField, Case, When, Q, Prefetch
from django.http import FileResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework import permissions, viewsets, status, views
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .serializers import ConversationListSerializer, MessageSerializer, ConversationCreateSerializer, \
    SeenMessagesSerializier


class ConversationView(viewsets.ModelViewSet):
    queryset = Conversation.objects.all()
    serializer_class = ConversationListSerializer

    @action(detail=True, methods=["put"])
    def seen(self, request, *args, **kwargs):
        try:
            conversation = self.get_object()
            serializer = SeenMessagesSerializier(
                instance=conversation,
                data=request.data)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(status=status.HTTP_200_OK)
        except KeyError as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)

    def list(self, request, *args, **kwargs):
        conversations = (Conversation
                         .objects
                         .prefetch_related("users")
                         .prefetch_related("messages")
                         .filter(users__in=[request.user])
                         .all())
        serializer = self.serializer_class(conversations, many=True)
        conversations_resp = serializer.data
        for resp in conversations_resp:
            last_message = Message.objects.filter(conversation__id=resp["id"]).last()
            msg_serializer = MessageSerializer(last_message)
            resp["last_message"] = msg_serializer.data
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        conversation = self.get_object()
        serializer = self.serializer_class(conversation)
        response = serializer.data
        messages = Message.objects.filter(conversation=conversation).order_by('created').all()
        serializer = MessageSerializer(messages, many=True)
        response["messages"] = serializer.data
        return Response(response)

    def create(self, request, *args, **kwargs):
        try:
            serializer = ConversationCreateSerializer(
                data=request.data,
                context={"sender_id": request.user.id})
            if serializer.is_valid(raise_exception=True):
                conversation = serializer.save()
                return Response({"id": conversation.id}, status=status.HTTP_200_OK)
        except KeyError as e:
            return Response(data=f"{e}", status=status.HTTP_400_BAD_REQUEST)



