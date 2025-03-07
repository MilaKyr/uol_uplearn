import json

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from chat.models import Message
from notifications.models import Notification



class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['user_id']
        self.group_name = f'public_room_{self.room_name}'
        await self.channel_layer.group_add(self.group_name,
                                           self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data=None, bytes_data=None):
        data = json.loads(text_data)

        if "notification_id" in data["data"]:
            notification_id = data['data']['notification_id']
            await self.seen_notification(notification_id)
        else:
            message_id = data['data']['message_id']
            await self.seen_message(message_id)


    async def new_message(self, event):
        message_id = event["id"]
        message = event["message"]
        sender_id = event["sender_id"]
        await self.send(text_data=json.dumps({
                'body': message,
                "id": message_id,
                'sender_id': sender_id,
        }))

    async def new_notification(self, event):
        print("new_notification", event)
        message = event["message"]
        sender_name = event["sender_name"]
        course_id = event["course_id"]
        course_title = event["course_title"]
        notification_id = event["notification_id"]
        await self.send(text_data=json.dumps({
            'body': message,
            'notification_id': notification_id,
            'sender_name': sender_name,
            'course_id': course_id,
            'course_title': course_title,
        }))

    @sync_to_async
    def seen_notification(self, notification_id):
        notification = Notification.objects.get(id=notification_id)
        notification.seen = True
        notification.save()

    @sync_to_async
    def seen_message(self, message_id):
        notification = Message.objects.get(id=message_id)
        notification.seen = True
        notification.save()