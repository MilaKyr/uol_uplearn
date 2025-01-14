from django.contrib import admin
from .models import *

admin.site.register(User)
admin.site.register(Course)
admin.site.register(Topic)

admin.site.register(StudyItem)
admin.site.register(ItemContent)
admin.site.register(Feedback)
admin.site.register(CourseProgress)

