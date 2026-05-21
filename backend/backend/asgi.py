"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup() # for separate deployment

from django.core.asgi import get_asgi_application

django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter


import chat.routing
import notifications.routing
from chat.token_auth import TokenAuthMiddleware


application = ProtocolTypeRouter({
    "http": django_asgi_app,
    'websocket': TokenAuthMiddleware(
        URLRouter([
            *notifications.routing.websocket_urlpatterns,
            *chat.routing.websocket_urlpatterns,

        ])
    )
})

