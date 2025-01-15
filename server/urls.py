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

from rest_framework import routers

from elearning import views

router = routers.DefaultRouter()
router.register(r'course', views.CourseView, basename="course")
router.register(r'student', views.StudentView, basename="students")
router.register(r'teacher', views.TeacherView, basename="teachers")
router.register(r'topic', views.TopicView, basename="topics")
router.register(r'lesson', views.LessonView, basename="lessons")
router.register(r'feedback', views.FeedbackView, basename="feedbacks")

# Wire up our API using automatic URL routing.
# Additionally, we include login URLs for the browsable API.

urlpatterns = [
    path('api/topic/<int:pk>/change_lesson_order', views.TopicView.as_view({'put': 'change_lesson_order'}), name='topic-change-lesson-order'),
    path('api/lessons_in_topic', views.LessonView.as_view({'get': 'by_topic'}), name='lessons-by-topic'),
    path('api/lesson/add_content', views.LessonView.as_view({'post': 'add_content'}), name='lessons-add-content'),
    path('api/lesson/<int:pk>/change_content_order', views.LessonView.as_view({'put': 'change_content_order'}),
         name='lessons-change-content-order'),
    path('api/feedback/by_course', views.FeedbackView.as_view({'get': 'by_course'}), name='feedback-by-course'),
    path('api/feedback/by_student', views.FeedbackView.as_view({'get': 'by_student'}), name='feedback-by-student'),
    path('api/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('admin/', admin.site.urls),
]
