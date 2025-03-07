from rest_framework import permissions
from .models import Notification

class IsSeenByRecipient(permissions.BasePermission):
    def has_permission(self, request, view):
        # Deny access if the user is not authenticated
        # if request.method in ["POST"]:
        #     for id_ in request.data["ids"]:
        #         notification = Notification.objects.filter(id=id_)
        #         if not notification.exists() or notification.get().recipient != request.user:
        #             return False
        #     return True
        return True