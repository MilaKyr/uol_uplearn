"""
ASGI config for server project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os  # pragma: no cover
from channels.routing import ProtocolTypeRouter, URLRouter

from django.core.asgi import get_asgi_application  # pragma: no cover

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')  # pragma: no cover

django_asgi_app = get_asgi_application()  # pragma: no cover

import backend.chat.routing
import notifications.routing
from backend.chat.token_auth import TokenAuthMiddleware

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    'websocket': TokenAuthMiddleware(
        URLRouter([
            *notifications.routing.websocket_urlpatterns,
            *backend.chat.routing.websocket_urlpatterns,

        ])
    )
})