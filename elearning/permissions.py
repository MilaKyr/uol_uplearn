import rest_framework.permissions
from rest_framework import permissions


class UserCoursePermission(permissions.BasePermission):

    def has_permission(self, request, view):
        # Deny access if the user is not authenticated
        if not request.user.is_authenticated:
            return False
        # create course can only a teacher
        if view.action == 'create':
            return request.user.role == "teacher"
        # # enroll can only student
        if view.action == "enroll":
            return request.user.role == "student"
        return True

    def has_object_permission(self, request, view, obj):
        # Deny actions on objects if the user is not authenticated
        if not request.user.is_authenticated:
            return False
        # Update or destroy can only an owner (teacher) of the course
        if view.action in ['update', 'partial_update', 'destroy']:
            return obj.teacher == request.user

        return True

class UserPermission(permissions.BasePermission):

    def has_permission(self, request, view):
        # Deny access if the user is not authenticated
        if not request.user.is_authenticated:
            return False
        # create course can only a teacher
        if request.method in rest_framework.permissions.SAFE_METHODS:
            return True

        return False

    def has_object_permission(self, request, view, obj):
        # Deny actions on objects if the user is not authenticated
        if not request.user.is_authenticated:
            return False

        is_owner = obj == request.user
        if view.action == "todo_for" and not is_owner:
            return False


        return True

class TopicPermission(permissions.BasePermission):

    def has_permission(self, request, view):
        # Deny access if the user is not authenticated
        if not request.user.is_authenticated:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        # Deny actions on objects if the user is not authenticated
        if not request.user.is_authenticated:
            return False

        is_owner = obj.course.teacher == request.user
        if view.action in ["create", "update", "partial_update",
                           "change_lesson_order"]:
            return is_owner

        if request.method == "delete":
            return is_owner

        return True

class LessonPermission(permissions.BasePermission):

    def has_permission(self, request, view):
        # Deny access if the user is not authenticated
        if not request.user.is_authenticated:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        # Deny actions on objects if the user is not authenticated
        if not request.user.is_authenticated:
            return False

        is_owner = obj.topic.course.teacher == request.user
        if view.action in ["create", "update", "partial_update",
                           "add_content", "change_content_order"]:
            return is_owner

        if request.method == "delete":
            return is_owner

        if view.action == "done":
            return request.user.role == "student"

        return True

class FeedbackPermission(permissions.BasePermission):

    def has_permission(self, request, view):
        # Deny access if the user is not authenticated
        if not request.user.is_authenticated:
            return False

        if view.action == "by_student":
            return request.user.id == request.GET.get('student_id')

        if view.action in ["create", "update", "partial_update"]:
            return request.user.role == "student"

        if request.method == "delete":
            return False

        return True

    def has_object_permission(self, request, view, obj):
        # Deny actions on objects if the user is not authenticated
        if not request.user.is_authenticated:
            return False

        is_owner = obj.user == request.user
        if view.action in ["create", "update", "partial_update"]:
            return is_owner

        return True

