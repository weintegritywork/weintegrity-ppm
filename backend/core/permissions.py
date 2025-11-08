from rest_framework.permissions import BasePermission


class IsAdminOrPOForWrites(BasePermission):
    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        payload = getattr(request, 'jwt_payload', None)
        if not payload:
            return False
        role = payload.get('role')
        return role in ('Admin', 'ProductOwner')


class IsAdminForUserWrites(BasePermission):
    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        payload = getattr(request, 'jwt_payload', None)
        if not payload:
            return False
        role = payload.get('role')
        return role == 'Admin'


