from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.conf import settings
from .mongo import get_db
from .auth import create_token
import os, json, re
import random
from datetime import datetime, timedelta
from django.contrib.auth.hashers import make_password, check_password
from .permissions import IsAdminOrPOForWrites, IsAdminForUserWrites
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException


def send_otp_email(to_email, otp):
    """Send OTP email using Gmail SMTP"""
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    
    gmail_user = os.getenv('GMAIL_USER')
    gmail_password = os.getenv('GMAIL_APP_PASSWORD')
    
    if not gmail_user or not gmail_password:
        raise Exception('Gmail credentials not configured')
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = 'Password Reset Code - WEIntegrity'
    msg['From'] = f'WEIntegrity <{gmail_user}>'
    msg['To'] = to_email
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Your password reset code is:</p>
            <h1 style="color: #4F46E5; font-size: 32px; letter-spacing: 5px; background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px;">{otp}</h1>
            <p style="color: #666;">This code will expire in 10 minutes.</p>
            <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </body>
    </html>
    """
    
    msg.attach(MIMEText(html_content, 'html'))
    
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587, timeout=10)
        server.starttls()
        server.login(gmail_user, gmail_password)
        server.sendmail(gmail_user, to_email, msg.as_string())
        server.quit()
    except Exception as e:
        raise Exception(f'Gmail SMTP error: {e}')


def collection(name):
    return get_db()[name]


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        if not email or not password:
            return Response({'detail': 'email and password required'}, status=400)
        user = collection('users').find_one({'email': email})
        if not user:
            return Response({'detail': 'Invalid credentials'}, status=401)
        if user.get('status') == 'inactive':
            return Response({'detail': 'Your account has been deactivated. Please contact an administrator.'}, status=403)
        stored = user.get('password')
        if stored and stored.startswith('pbkdf2_'):
            if not check_password(password, stored):
                return Response({'detail': 'Invalid credentials'}, status=401)
        else:
            if stored != password:
                return Response({'detail': 'Invalid credentials'}, status=401)
        token = create_token(user)
        safe_user = {k: user[k] for k in user if k not in ('password',)}
        safe_user.pop('_id', None)
        return Response({'access': token, 'user': safe_user})


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        required = ['id','employeeId','firstName','lastName','email','phone','role','department','jobTitle','dateOfJoining','password','status']
        missing = [k for k in required if k not in data]
        if missing:
            return Response({'detail': f'Missing fields: {", ".join(missing)}'}, status=400)
        users = collection('users')
        if users.find_one({'email': data['email']}):
            return Response({'detail': 'Email already registered'}, status=400)
        data = dict(data)
        if data.get('password'):
            data['password'] = make_password(data['password'])
        users.insert_one(data)
        user = users.find_one({'email': data['email']})
        token = create_token(user)
        safe_user = {k: user[k] for k in user if k not in ('password',)}
        safe_user.pop('_id', None)
        return Response({'access': token, 'user': safe_user}, status=201)


class RefreshView(APIView):
    permission_classes = [AllowAny]  # Handle auth manually in the view
    
    def post(self, request):
        payload = getattr(request, 'jwt_payload', None)
        if not payload:
            return Response({'detail': 'No token'}, status=401)
        # lookup user to ensure still valid
        user = collection('users').find_one({'id': payload.get('sub')})
        if not user:
            return Response({'detail': 'User not found'}, status=401)
        token = create_token(user)
        return Response({'access': token})


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'detail': 'Email is required'}, status=400)
        
        # Check if user exists in database
        user = collection('users').find_one({'email': email.lower()})
        if not user:
            # Don't reveal if email exists or not for security
            return Response({'detail': 'If an account exists with this email, a reset code has been sent.'}, status=200)
        
        if user.get('status') == 'inactive':
            return Response({'detail': 'Account is inactive'}, status=400)
        
        # Generate 6-digit OTP
        otp = str(random.randint(100000, 999999))
        
        # Store OTP in database with expiration (10 minutes)
        otp_collection = collection('password_resets')
        expires_at = datetime.utcnow() + timedelta(minutes=10)
        
        # Remove any existing OTPs for this email
        otp_collection.delete_many({'email': email.lower()})
        
        # Store new OTP
        otp_collection.insert_one({
            'email': email.lower(),
            'otp': otp,
            'expires_at': expires_at,
            'created_at': datetime.utcnow()
        })
        
        # Send email with OTP
        try:
            send_otp_email(email, otp)
        except Exception as e:
            # Log error but don't reveal to user
            print(f'[ERROR] Failed to send OTP email: {e}')
        
        # For development, also log OTP to console
        if settings.DEBUG:
            print(f'[DEV] OTP for {email}: {otp}')
        
        return Response({
            'message': 'If an account exists with this email, a reset code has been sent.'
        }, status=200)


class VerifyOtpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        if not email or not otp:
            return Response({'detail': 'Email and OTP are required'}, status=400)
        
        # Verify OTP
        otp_collection = collection('password_resets')
        reset_record = otp_collection.find_one({
            'email': email.lower(),
            'otp': otp
        })
        
        if not reset_record:
            return Response({'detail': 'Invalid OTP'}, status=400)
        
        # Check if OTP has expired
        expires_at = reset_record.get('expires_at')
        if isinstance(expires_at, str):
            try:
                expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            except:
                expires_at = datetime.utcnow() - timedelta(minutes=1)  # Treat as expired if can't parse
        elif not isinstance(expires_at, datetime):
            expires_at = datetime.utcnow() - timedelta(minutes=1)  # Treat as expired if can't parse
        
        # MongoDB might return datetime as datetime object, but we need to ensure it's comparable
        if not isinstance(expires_at, datetime):
            expires_at = datetime.utcnow() - timedelta(minutes=1)
        
        if datetime.utcnow() > expires_at:
            otp_collection.delete_one({'_id': reset_record['_id']})
            return Response({'detail': 'OTP has expired. Please request a new one.'}, status=400)
        
        return Response({'message': 'OTP verified successfully'}, status=200)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        new_password = request.data.get('newPassword')
        
        if not email or not otp or not new_password:
            return Response({'detail': 'Email, OTP, and new password are required'}, status=400)
        
        if len(new_password) < 6:
            return Response({'detail': 'Password must be at least 6 characters long'}, status=400)
        
        # Verify OTP
        otp_collection = collection('password_resets')
        reset_record = otp_collection.find_one({
            'email': email.lower(),
            'otp': otp
        })
        
        if not reset_record:
            return Response({'detail': 'Invalid or expired OTP'}, status=400)
        
        # Check if OTP has expired
        expires_at = reset_record.get('expires_at')
        if isinstance(expires_at, str):
            try:
                expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            except:
                expires_at = datetime.utcnow() - timedelta(minutes=1)  # Treat as expired if can't parse
        elif not isinstance(expires_at, datetime):
            expires_at = datetime.utcnow() - timedelta(minutes=1)  # Treat as expired if can't parse
        
        # MongoDB might return datetime as datetime object, but we need to ensure it's comparable
        if not isinstance(expires_at, datetime):
            expires_at = datetime.utcnow() - timedelta(minutes=1)
        
        if datetime.utcnow() > expires_at:
            otp_collection.delete_one({'_id': reset_record['_id']})
            return Response({'detail': 'OTP has expired. Please request a new one.'}, status=400)
        
        # Find user and update password
        users_collection = collection('users')
        user = users_collection.find_one({'email': email.lower()})
        
        if not user:
            otp_collection.delete_one({'_id': reset_record['_id']})
            return Response({'detail': 'User not found'}, status=404)
        
        # Update password
        hashed_password = make_password(new_password)
        users_collection.update_one(
            {'id': user['id']},
            {'$set': {'password': hashed_password}}
        )
        
        # Delete used OTP
        otp_collection.delete_one({'_id': reset_record['_id']})
        
        return Response({'message': 'Password has been reset successfully'}, status=200)


class BaseCrudView(APIView):
    collection_name = ''

    def get(self, request, id=None):
        coll = collection(self.collection_name)
        if id:
            doc = coll.find_one({'id': id})
            if not doc:
                return Response(status=404)
            doc.pop('_id', None)
            return Response(doc)
        # list
        query = {}
        q = request.GET.get('q')
        if q:
            query['$or'] = [
                {'name': {'$regex': q, '$options': 'i'}},
                {'shortDescription': {'$regex': q, '$options': 'i'}},
                {'email': {'$regex': q, '$options': 'i'}},
                {'number': {'$regex': q, '$options': 'i'}},
            ]
        # pagination
        try:
            page = max(1, int(request.GET.get('page', 1)))
        except Exception:
            page = 1
        try:
            page_size = min(100, max(1, int(request.GET.get('page_size', 20))))
        except Exception:
            page_size = 20
        skip = (page - 1) * page_size
        cursor = coll.find(query).skip(skip).limit(page_size)
        docs = list(cursor)
        for d in docs:
            d.pop('_id', None)
        return Response(docs)

    def post(self, request):
        coll = collection(self.collection_name)
        data = request.data
        coll.insert_one(dict(data))
        # Return the inserted document from database
        inserted = coll.find_one({'id': data.get('id')})
        if inserted:
            inserted.pop('_id', None)
        return Response(inserted or data, status=status.HTTP_201_CREATED)

    def put(self, request, id):
        coll = collection(self.collection_name)
        data = dict(request.data)
        # Hash password if updating users collection
        if self.collection_name == 'users' and 'password' in data and data['password']:
            # Check if password is already hashed
            if not str(data['password']).startswith('pbkdf2_'):
                data['password'] = make_password(data['password'])
        # Remove None/undefined values and prepare update
        update_data = {k: v for k, v in data.items() if v is not None}
        # If we want to unset fields, we need to handle them separately
        # For now, we'll only update fields that have values
        res = coll.update_one({'id': id}, {'$set': update_data})
        if res.matched_count == 0:
            return Response(status=404)
        # Return the updated document from database
        updated = coll.find_one({'id': id})
        if updated:
            updated.pop('_id', None)
        return Response(updated or data)

    def delete(self, request, id):
        coll = collection(self.collection_name)
        res = coll.delete_one({'id': id})
        if res.deleted_count == 0:
            return Response(status=404)
        return Response(status=204)


class UsersView(BaseCrudView):
    collection_name = 'users'
    permission_classes = [IsAdminForUserWrites]


class TeamsView(BaseCrudView):
    collection_name = 'teams'
    permission_classes = [AllowAny]


class ProjectsView(BaseCrudView):
    collection_name = 'projects'
    permission_classes = [IsAdminOrPOForWrites]


class StoriesView(BaseCrudView):
    collection_name = 'stories'
    permission_classes = [AllowAny]


class EpicsView(BaseCrudView):
    collection_name = 'epics'
    permission_classes = [AllowAny]


class SprintsView(BaseCrudView):
    collection_name = 'sprints'
    permission_classes = [AllowAny]


class NotificationsView(BaseCrudView):
    collection_name = 'notifications'
    permission_classes = [AllowAny]


class StoryChatsView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, storyId):
        doc = collection('story_chats').find_one({'storyId': storyId})
        if doc:
            doc.pop('_id', None)
        return Response(doc or {'storyId': storyId, 'messages': []})

    def post(self, request, storyId):
        msg = request.data
        author_id = msg.get('authorId')
        
        # Save the message
        collection('story_chats').update_one(
            {'storyId': storyId},
            {'$push': {'messages': msg}},
            upsert=True
        )
        
        # Create notifications for story team members (excluding the sender)
        try:
            story = collection('stories').find_one({'id': storyId})
            if story and author_id:
                # Get sender info
                sender = collection('users').find_one({'id': author_id})
                sender_name = f"{sender.get('firstName', '')} {sender.get('lastName', '')}".strip() if sender else 'Someone'
                
                # Get story team members
                assigned_team_id = story.get('assignedTeamId')
                assigned_to_id = story.get('assignedToId')
                project_id = story.get('projectId')
                
                notify_user_ids = []
                
                # Get team members if team is assigned
                if assigned_team_id:
                    team = collection('teams').find_one({'id': assigned_team_id})
                    if team:
                        team_members = team.get('memberIds', [])
                        if team.get('leadId'):
                            team_members.append(team.get('leadId'))
                        notify_user_ids.extend(team_members)
                
                # Add assigned user if different
                if assigned_to_id and assigned_to_id not in notify_user_ids:
                    notify_user_ids.append(assigned_to_id)
                
                # Add story creator and updater
                created_by = story.get('createdById')
                updated_by = story.get('updatedById')
                if created_by and created_by not in notify_user_ids:
                    notify_user_ids.append(created_by)
                if updated_by and updated_by not in notify_user_ids:
                    notify_user_ids.append(updated_by)
                
                # Exclude the sender
                notify_user_ids = [uid for uid in notify_user_ids if uid and uid != author_id]
                
                # Create notifications
                notifications_collection = collection('notifications')
                timestamp = datetime.utcnow().isoformat() + 'Z'
                message_preview = msg.get('text', '')[:100]  # First 100 chars
                story_number = story.get('number', storyId)
                
                for user_id in notify_user_ids:
                    notification = {
                        'id': f'notif-{storyId}-{user_id}-{int(datetime.utcnow().timestamp() * 1000)}',
                        'userId': user_id,
                        'message': f'{sender_name} sent a message on story {story_number}: {message_preview}',
                        'link': f'/stories/{storyId}',
                        'isRead': False,
                        'timestamp': timestamp
                    }
                    notifications_collection.insert_one(notification)
        except Exception as e:
            # Don't fail the message send if notification creation fails
            import traceback
            print(f"Error creating notifications: {e}")
            traceback.print_exc()
        
        # Return updated chat document
        doc = collection('story_chats').find_one({'storyId': storyId})
        if doc:
            doc.pop('_id', None)
        return Response(doc or {'storyId': storyId, 'messages': [msg]}, status=201)

    def delete(self, request, storyId):
        messageId = request.GET.get('messageId')
        if not messageId:
            return Response({'detail': 'messageId required'}, status=400)
        collection('story_chats').update_one(
            {'storyId': storyId},
            {'$pull': {'messages': {'id': messageId}}}
        )
        return Response(status=204)


class ProjectChatsView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, projectId):
        doc = collection('project_chats').find_one({'projectId': projectId})
        if doc:
            doc.pop('_id', None)
        return Response(doc or {'projectId': projectId, 'messages': []})

    def post(self, request, projectId):
        msg = request.data
        author_id = msg.get('authorId')
        
        # Save the message
        collection('project_chats').update_one(
            {'projectId': projectId},
            {'$push': {'messages': msg}},
            upsert=True
        )
        
        # Create notifications for project members (excluding the sender)
        try:
            project = collection('projects').find_one({'id': projectId})
            if project and author_id:
                # Get sender info
                sender = collection('users').find_one({'id': author_id})
                sender_name = f"{sender.get('firstName', '')} {sender.get('lastName', '')}".strip() if sender else 'Someone'
                
                # Get all project members
                member_ids = project.get('memberIds', [])
                # Exclude the sender from notifications
                notify_user_ids = [uid for uid in member_ids if uid != author_id]
                
                # Create notifications
                notifications_collection = collection('notifications')
                timestamp = datetime.utcnow().isoformat() + 'Z'
                message_preview = msg.get('text', '')[:100]  # First 100 chars
                
                for user_id in notify_user_ids:
                    notification = {
                        'id': f'notif-{projectId}-{user_id}-{int(datetime.utcnow().timestamp() * 1000)}',
                        'userId': user_id,
                        'message': f'{sender_name} sent a message in {project.get("name", "project")}: {message_preview}',
                        'link': f'/projects/{projectId}',
                        'isRead': False,
                        'timestamp': timestamp
                    }
                    notifications_collection.insert_one(notification)
        except Exception as e:
            # Don't fail the message send if notification creation fails
            import traceback
            print(f"Error creating notifications: {e}")
            traceback.print_exc()
        
        # Return updated chat document
        doc = collection('project_chats').find_one({'projectId': projectId})
        if doc:
            doc.pop('_id', None)
        return Response(doc or {'projectId': projectId, 'messages': [msg]}, status=201)

    def delete(self, request, projectId):
        messageId = request.GET.get('messageId')
        if not messageId:
            return Response({'detail': 'messageId required'}, status=400)
        collection('project_chats').update_one(
            {'projectId': projectId},
            {'$pull': {'messages': {'id': messageId}}}
        )
        return Response(status=204)


