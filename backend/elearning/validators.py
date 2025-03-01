import datetime

from django.utils import timezone
from rest_framework.serializers import ValidationError


def validate_start_date(value):
    now = timezone.now()
    if value < datetime.datetime.now(tz=now.tzinfo):
        raise ValidationError(f"Should start after today")

def feedback_between_1_5(value):
    if value > 5 or value < 1:
        raise ValidationError(f"Feedback value must be between 1 and 5. Got {value}")