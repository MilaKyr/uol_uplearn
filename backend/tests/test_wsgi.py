import pytest
from django.test import RequestFactory
from django.urls import Resolver404

from backend.server.wsgi import application


"""Test code was inspired from: https://stackoverflow.com/questions/60505112/django-unittest-wsgi-py"""


def test_handles_request(rf: RequestFactory):
    with pytest.raises(Resolver404):
        application.resolve_request(rf.get("/unknown"))
