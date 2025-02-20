from django.urls import path, include
from . import views
from rest_framework import routers

router = routers.DefaultRouter()
router.register(r'', views.ConversationView, basename="conversation")

urlpatterns = [
    path('', include(router.urls)),
    path('<int:pk>/seen', views.ConversationView.as_view({'put': 'seen'}), name="seen-messages"),
]