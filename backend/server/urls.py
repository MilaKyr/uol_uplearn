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

from backend.elearning import views

router = routers.DefaultRouter()
router.register(r'courses', views.CourseView, basename="course")
router.register(r'students', views.StudentView, basename="students")
router.register(r'teachers', views.TeacherView, basename="teachers")
router.register(r'users', views.UserView, basename="users")
router.register(r'topics', views.TopicView, basename="topics")
router.register(r'lessons', views.LessonView, basename="lessons")
router.register(r'feedbacks', views.FeedbackView, basename="feedbacks")
router.register(r'notifications', views.NotificationsView, basename="notifications")

# Wire up our API using automatic URL routing.
# Additionally, we include login URLs for the browsable API.

urlpatterns = [
    path('api/chat/', include('chat.urls')),
    path('api/home/inbox', views.HomeView.as_view({'get': 'inbox'}), name="inbox"),
    path('api/topics/<int:pk>/change_lesson_order', views.TopicView.as_view({'put': 'change_lesson_order'}), name='topic-change-lesson-order'),
    path('api/user/photo', views.HomeView.as_view({'put': 'update_photo', 'get': 'get_photo'}), name='update-photo'),
    path('api/user/update/status', views.HomeView.as_view({'put': 'set_status'}), name='set-status'),
    path('api/user/update/name', views.HomeView.as_view({'put': 'set_name'}), name='change-name'),
    path('api/user/update/email', views.HomeView.as_view({'put': 'set_email'}), name='change-email'),
    path('api/user/update/bio', views.HomeView.as_view({'put': 'set_bio'}), name='change-bio'),
    path("api/home/", views.HomePageView.as_view({'get': 'retrieve'}), name="home"),
    path("api/tags", views.TagsView.as_view({'get': 'list'}), name="tags"),
    path("api/home/course_titles", views.HomePageView.as_view({'get': 'my_course_titles'}), name="my_course_titles"),

    path("api/users/<int:pk>/avatar", views.UserView.as_view({'get': 'get_avatar'}), name='avatar'),
    path('api/enrollments/<int:pk>/block', views.EnrollmentView.as_view({'put': 'block'}), name='block-from-course'),
    path('api/enrollments/<int:pk>/remove', views.EnrollmentView.as_view({'put': 'remove'}), name='remove-from-course'),

    path('api/notifications/seen', views.NotificationsView.as_view({'post': 'seen'}), name='course-search'),
    path('api/users/search', views.UserView.as_view({'get': 'search'}), name='users-search'),
    path('api/courses/search', views.CourseView.as_view({'get': 'search'}), name='course-search'),
    path('api/courses/<int:pk>/photo', views.CourseView.as_view({'put': 'update_photo', 'get': 'get_photo'}), name='change-bio'),
    path('api/courses/<int:pk>/students', views.CourseView.as_view({'get': 'enrolled'}), name='enrolled-students'),
    path('api/courses/<int:pk>/edit', views.CourseEditView.as_view({'get': 'retrieve'}), name='change-bio'),
    path('api/courses/<int:pk>/active', views.CourseEditView.as_view({'post': 'active'}), name='change-bio'),
    path('api/lessons/<int:pk>/file', views.LessonEditView.as_view({'post': 'attach'}), name='change-bio'),
    path('api/lessons/<int:pk>/files', views.LessonView.as_view({'get': 'files'}), name='change-bio'),
    path('api/lessons/<int:pk>/content', views.LessonEditView.as_view({'post': 'fill'}), name='change-bio'),

    path("api/courses/new", views.CourseView.as_view({'get': 'new_course_id'}), name="new-course-id"),

    path('api/lessons/in_topic', views.LessonView.as_view({'get': 'by_topic'}), name='lessons-by-topic'),
    path('api/lessons/add_content', views.LessonView.as_view({'post': 'add_content'}), name='lessons-add-content'),
    path('api/lessons/<int:pk>/change_content_order', views.LessonView.as_view({'put': 'change_content_order'}),
         name='lessons-change-content-order'),
    path('api/lessons/<int:pk>/done', views.LessonView.as_view({'post': 'done'}),name='lesson-done'),

    path('api/feedbacks/by_course', views.FeedbackView.as_view({'get': 'by_course'}), name='feedback-by-course'),
    # path('api/feedbacks/by_student', views.FeedbackView.as_view({'get': 'by_student'}), name='feedback-by-student'),

    path('api/courses/<int:pk>/enroll', views.CourseView.as_view({'post': 'enroll'}), name='feedback-by-student'),
    path('api/students/<int:pk>/todo_for', views.StudentView.as_view({'get': 'todo_for'}), name='todo-for-month'),
    path('api/topics/for_course', views.TopicView.as_view({"get": 'for_course'}), name='topics-for-course'),
    path('api/', include(router.urls)),
    path("api/register/", views.CustomRegistrationView.as_view(), name="rest_register"),
    path("api/login/", LoginView.as_view(), name="rest_login"),
    path("api/logout/", views.CustomLogoutView.as_view(), name="rest_logout"),

    path("api/token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("api/token/refresh/", get_refresh_view().as_view(), name="token_refresh"),

    path('api/api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('admin/', admin.site.urls),
]
