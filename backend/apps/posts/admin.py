from django.contrib import admin

from .models import Post


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("title", "community", "author", "score", "comment_count", "created_at")
    list_filter = ("community", "kind", "is_removed")
