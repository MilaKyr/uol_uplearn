from django.urls import path
from . import views


urlpatterns = [
    path(r'', views.NotificationListCreateView.as_view()),
    path('inbox', views.InboxView.as_view(), name="inbox"),
]