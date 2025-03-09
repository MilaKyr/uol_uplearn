from django.urls import path
from . import views


urlpatterns = [
    path(r"", views.NotificationListView.as_view()),
    path(r"<str:pk>", views.NotificationUpdateView.as_view()),
    path("inbox/", views.InboxView.as_view(), name="inbox"),
]
