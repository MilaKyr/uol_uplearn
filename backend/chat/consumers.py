import json

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from elearning.serializers import BasicUserSerializer
from .models import Message, Conversation
from elearning.models import User

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'
        try:
            await self.channel_layer.group_add(self.room_group_name,
                                           self.channel_name)
        except BaseException as e:
            print(e)

        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        await super().disconnect(code)

    async def receive(self, text_data=None, bytes_data=None):
        data = json.loads(text_data)
        if 'message_id' in data["data"]:
            message_id = data["data"]["message_id"]
            await self.seen_message(message_id)
        else:
            conversation_id = data['data']['conversation_id']
            sender_id = data['data']['sender_id']
            recipient_id = data['data']['recipient_id']
            body = data['data']['body']

            message = await self.save_message(conversation_id, body, recipient_id)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'id': message.id,
                    'body': body,
                    'recipient_id': recipient_id,
                    'sender_id': sender_id
                }
            )


    async def chat_message(self, event):
        body = event["body"]
        recipient_id = event["recipient_id"]
        sender_id = event["sender_id"]
        message_id = event["id"]

        await self.send(text_data=json.dumps({
            'body': body,
            'recipient_id': recipient_id,
            'sender_id': sender_id,
            'id': message_id
        }))



    @sync_to_async
    def save_message(self, conversation_id, body, recipient_id):
        user = self.scope['user']
        conversation = Conversation.objects.get(id=conversation_id)
        recipient = User.objects.get(id=recipient_id)
        return Message.objects.create(conversation=conversation, text=body, recipient=recipient, sender=user)

    @sync_to_async
    def seen_message(self, message_id):
        message = Message.objects.get(id=message_id)
        message.seen = True
        message.save()



