import datetime

from django.utils import timezone
from rest_framework.serializers import ValidationError


def validate_start_date(value):
    now = timezone.now()
    if value < datetime.datetime.now(tz=now.tzinfo):
        raise ValidationError(f"Should start after today")
