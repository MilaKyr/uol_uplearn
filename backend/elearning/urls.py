from django.contrib import admin
from django.urls import include, path, re_path

from dj_rest_auth.jwt_auth import get_refresh_view
from dj_rest_auth.views import LoginView
from dj_rest_auth.registration.views import RegisterView
from rest_framework_simplejwt.views import TokenVerifyView

from . import views


urlpatterns = [
    path('chat/', include('chat.urls')),
    path('notifications/', include('notifications.urls')),

    path('courses/', views.CourseListCreateView.as_view()),
    path('courses/search', views.CourseSearch.as_view()),
    path('courses/<str:pk>/', views.CourseDetail.as_view()),
    path('courses/study/<str:pk>/', views.CourseStudyDetail.as_view()),
    path('courses/edit/<str:pk>/', views.CourseEditView.as_view()),
    path('courses/<str:pk>/students', views.EnrolledStudentsView.as_view()),
    path('courses/<str:pk>/photo', views.CoursePhotoView.as_view()),
    path('new_course_id', views.NewCourseIdView.as_view()),

    path('topics/<str:pk>/', views.TopicView.as_view()),

    # lesson
    path('lessons/<str:pk>/', views.LessonRetrieveDestroyUpdateView.as_view()),
    path('lessons/progress/<str:pk>/', views.CourseProgressUpdateView.as_view()),
    # lesson's files
    path('lessons/files/<str:pk>/', views.LessonFilesRetrieveUpdateView.as_view()),

    # feedbacks
    path('feedbacks/', views.FeedbackListCreateView.as_view()),
    path('feedbacks/<str:pk>/', views.FeedbackUpdateView.as_view()),

    # tags
    path('tags/', views.TagsView.as_view()),


    path("dashboard/<str:pk>", views.UserRetrieveView.as_view()),
    path("home/course_titles", views.CourseTitlesView.as_view()),
    path('dashboard/photo/<str:pk>', views.UserPhotoRetrieveUpdateView.as_view()),
    path('home/settings/<str:pk>', views.SettingsRetrieveUpdateSerializer.as_view()),
    path('todo_for', views.TodoListView.as_view()),
    path("users/avatar/<str:pk>/", views.UserAvatarRetrieveView.as_view()),
    path('users/search', views.UserSearchListView.as_view()),


    path('enrollments/<str:pk>/', views.EnrollmentStatusUpdateView.as_view()),
    path('enrollments/', views.EnrollmentCreateView.as_view()),

    path("register/", RegisterView.as_view(), name="rest_register"),
    path("login/", LoginView.as_view(), name="rest_login"),
    path("logout/", views.CustomLogoutView.as_view(), name="rest_logout"),
    path("token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("token/refresh/", get_refresh_view().as_view(), name="token_refresh"),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
]
