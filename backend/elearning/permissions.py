from rest_framework import permissions

from .models import CourseEnrollment


def find_owner(obj):
    if obj._meta.model.__name__ == "User":
        return obj
    if obj._meta.model.__name__ == "Feedback":
        return obj.enrollment.user
    if obj._meta.model.__name__ == "Course":
        return obj.teacher
    if obj._meta.model.__name__ == "CourseEnrollment":
        return obj.course.teacher


def find_course(obj):
    if obj._meta.model.__name__ == "Course":
        return obj
    return obj.course


class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        # Deny access if the user is not authenticated
        return request.user.is_student()


class IsTeacher(permissions.BasePermission):
    def has_permission(self, request, view):
        # Deny access if the user is not authenticated
        return request.user.is_teacher()


class UpdateDeleteIfOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Only an owner (teacher) of the course cab update or destroy it
        if request.method in ["PATCH", "PUT", "DELETE"]:
            owner = find_owner(obj)
            return owner == request.user
        return True


class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        owner = find_owner(obj)
        # Only an owner (teacher) of the course cab update or destroy it
        return owner == request.user


class OwnerOrEnrolled(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Only an owner (teacher) of the course cab update or destroy it
        course = find_course(obj)
        if request.user.is_student():
            return True
        return course.teacher == request.user


class IsEnrolled(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        course = find_course(obj)
        enrolled = CourseEnrollment.objects.filter(course=course, user=request.user)
        return enrolled.exists()


class TeacherWriter(permissions.BasePermission):
    def has_permission(self, request, view):
        # Deny access if the user is not authenticated
        if request.method in ["POST", "PATCH", "PUT"]:
            return request.user.is_teacher()
        return True


class HasAccess(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_teacher():
            return True
        course = find_course(obj)
        enrolled = CourseEnrollment.objects.filter(course=course, user=request.user)
        if enrolled.exists():
            return enrolled.get().status not in ["blocked", "removed"]
        return False


class FinishedCourse(permissions.BasePermission):
    def has_permission(self, request, view):
        # Deny access if the user is not authenticated
        if request.method in ["POST", "PATCH", "PUT"]:
            course_id = request.data.get("course_id")
            if course_id is None:
                return False
            enrolled = CourseEnrollment.objects.filter(
                course__id=course_id, user=request.user
            )
            if enrolled.exists():
                return enrolled.get().status == "finished"
        return True
