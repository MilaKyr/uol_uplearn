from django.contrib import admin
from .models import *


admin.site.register(User)
admin.site.register(Student)
admin.site.register(Teacher)
admin.site.register(Course)
admin.site.register(Topic)
admin.site.register(Tag)
admin.site.register(Lesson)
admin.site.register(Feedback)
admin.site.register(CourseEnrollment)
admin.site.register(KeyHolder)
