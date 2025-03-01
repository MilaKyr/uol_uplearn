from asgiref.sync import async_to_sync
import pytest

from chat.serializers import *
from chat.models import *
from chat.token_auth import get_user
from tests.utils import register_teacher


@pytest.mark.django_db
def test_get_teacher(teacher_group):
    teacher = register_teacher()
    user = async_to_sync(get_user)(teacher['access'])
    assert f"{user.id}" == teacher['user']['id']

@pytest.mark.django_db
def test_get_anonymous():
    user = async_to_sync(get_user)('random-token')
    assert user.id is None