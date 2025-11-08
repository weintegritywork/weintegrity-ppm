import datetime
import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions


class AuthUser:
    def __init__(self, payload: dict):
        self.payload = payload
        self.id = payload.get('sub')
        self.email = payload.get('email')
        self.role = payload.get('role')

    @property
    def is_authenticated(self):
        return True


class JWTAuthentication(BaseAuthentication):
    keyword = 'Bearer'

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith(self.keyword + ' '):
            return None
        token = auth_header.split(' ', 1)[1].strip()
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid token')
        # Attach payload and return an authenticated stand-in user
        request.jwt_payload = payload
        return (AuthUser(payload), token)


def create_token(user_doc: dict) -> str:
    payload = {
        'sub': user_doc['id'],
        'email': user_doc['email'],
        'role': user_doc['role'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=12),
        'iat': datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')


