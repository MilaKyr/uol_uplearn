from django.urls import path
from . import views


urlpatterns = [
    path('conversations/', views.ConversationListView.as_view()),
    path('conversations/new', views.ConversationCreateView.as_view()),
    path('conversations/<str:pk>/', views.ConversationRetrieveView.as_view()),
    path('conversations/<str:pk>/seen', views.ConversationUpdateView.as_view()),
]