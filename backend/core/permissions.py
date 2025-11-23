from rest_framework.permissions import BasePermission


class IsAdminOrPOForWrites(BasePermission):
    def has_permission(self, request, view):
        # Allow read operations for all authenticated users
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        
        # For write operations, check JWT payload
        payload = getattr(request, 'jwt_payload', None)
        if not payload:
            print("DEBUG: No JWT payload found")
            return False
        
        role = payload.get('role')
        print(f"DEBUG: User role: {role}, Method: {request.method}")
        
        # Allow Admin and ProductOwner to create/update/delete
        is_allowed = role in ('Admin', 'ProductOwner')
        print(f"DEBUG: Permission granted: {is_allowed}")
        return is_allowed


class IsAdminForUserWrites(BasePermission):
    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        payload = getattr(request, 'jwt_payload', None)
        if not payload:
            return False
        role = payload.get('role')
        return role == 'Admin'


