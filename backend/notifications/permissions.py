from rest_framework import permissions
from .models import Notification

class IsSeenByRecipient(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.recipient == request.user