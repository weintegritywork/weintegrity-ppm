import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .mongo import get_db

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            # Get chat_id and chat_type from URL
            self.chat_id = self.scope['url_route']['kwargs']['chat_id']
            self.chat_type = self.scope['url_route']['kwargs']['chat_type']
            self.room_group_name = f'chat_{self.chat_type}_{self.chat_id}'

            print(f"[Consumer] Connecting to room: {self.room_group_name}")

            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )

            await self.accept()
            print(f"[Consumer] Connection accepted for room: {self.room_group_name}")
        except Exception as e:
            print(f"[Consumer] Error in connect: {e}")
            import traceback
            traceback.print_exc()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        try:
            print(f"[Consumer] Received message: {text_data}")
            data = json.loads(text_data)
            message_type = data.get('type')

            if message_type == 'chat_message':
                print(f"[Consumer] Processing chat message for room: {self.room_group_name}")
                # Save message to database
                await self.save_message(data)

                # Send message to room group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': data
                    }
                )
                print(f"[Consumer] Message broadcasted to room: {self.room_group_name}")
        except Exception as e:
            print(f"[Consumer] Error in receive: {e}")
            import traceback
            traceback.print_exc()

    # Receive message from room group
    async def chat_message(self, event):
        try:
            print(f"[Consumer] Sending message to WebSocket client")
            message = event['message']

            # Send message to WebSocket
            await self.send(text_data=json.dumps({
                'type': 'chat_message',
                'message': message
            }))
            print(f"[Consumer] Message sent to WebSocket client")
        except Exception as e:
            print(f"[Consumer] Error in chat_message: {e}")
            import traceback
            traceback.print_exc()

    @database_sync_to_async
    def save_message(self, data):
        """Save message to MongoDB"""
        db = get_db()
        collection_name = f"{data['chat_type']}_chats"
        collection = db[collection_name]
        
        # Find the chat document
        chat = collection.find_one({"chat_id": data['chat_id']})
        
        if chat:
            # Add message to messages array
            collection.update_one(
                {"chat_id": data['chat_id']},
                {"$push": {"messages": data['message']}}
            )
        else:
            # Create new chat document
            collection.insert_one({
                "chat_id": data['chat_id'],
                "messages": [data['message']]
            })
