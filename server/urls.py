"""
URL configuration for server project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path

from dj_rest_auth.jwt_auth import get_refresh_view
from dj_rest_auth.views import LoginView, LogoutView, UserDetailsView
from rest_framework_simplejwt.views import TokenVerifyView

from rest_framework import routers

from elearning import views

router = routers.DefaultRouter()
router.register(r'courses', views.CourseView, basename="course")
router.register(r'students', views.StudentView, basename="students")
router.register(r'teachers', views.TeacherView, basename="teachers")
router.register(r'topics', views.TopicView, basename="topics")
router.register(r'lessons', views.LessonView, basename="lessons")
router.register(r'feedbacks', views.FeedbackView, basename="feedbacks")

# Wire up our API using automatic URL routing.
# Additionally, we include login URLs for the browsable API.

urlpatterns = [
    path('api/topics/<int:pk>/change_lesson_order', views.TopicView.as_view({'put': 'change_lesson_order'}), name='topic-change-lesson-order'),
    path('api/lessons/in_topic', views.LessonView.as_view({'get': 'by_topic'}), name='lessons-by-topic'),
    path('api/lessons/add_content', views.LessonView.as_view({'post': 'add_content'}), name='lessons-add-content'),
    path('api/lessons/<int:pk>/change_content_order', views.LessonView.as_view({'put': 'change_content_order'}),
         name='lessons-change-content-order'),
    path('api/feedbacks/by_course', views.FeedbackView.as_view({'get': 'by_course'}), name='feedback-by-course'),
    path('api/feedbacks/by_student', views.FeedbackView.as_view({'get': 'by_student'}), name='feedback-by-student'),
    path('api/course/<int:pk>/enroll', views.CourseView.as_view({'post': 'enroll'}), name='feedback-by-student'),
    path('api/students/<int:pk>/todo_for', views.StudentView.as_view({'get': 'todo_for'}), name='todo-for-month'),
    path('api/topics/for_course', views.TopicView.as_view({"get": 'for_course'}), name='topics-for-course'),
    path('api/', include(router.urls)),
    path("api/register/", views.CustomRegistrationView.as_view(), name="rest_register"),
    path("api/login/", LoginView.as_view(), name="rest_login"),
    path("api/logout/", LogoutView.as_view(), name="rest_logout"),
    path("api/token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("api/token/refresh/", get_refresh_view().as_view(), name="token_refresh"),

    path('api/api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('admin/', admin.site.urls),
]
