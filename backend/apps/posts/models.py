import uuid
from django.conf import settings
from django.db import models

from apps.communities.models import Community


class Post(models.Model):
    class Kind(models.TextChoices):
        TEXT = "text", "Text"
        LINK = "link", "Link"
        IMAGE = "image", "Image"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name="posts")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="posts")
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.TEXT)
    title = models.CharField(max_length=300)
    body = models.TextField(blank=True)
    url = models.URLField(blank=True)
    score = models.IntegerField(default=0)          # denormalized upvotes - downvotes
    comment_count = models.IntegerField(default=0)  # denormalized for feed queries
    is_pinned = models.BooleanField(default=False)
    is_removed = models.BooleanField(default=False)  # moderation soft-delete
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["community", "-score"]),
            models.Index(fields=["community", "-created_at"]),
        ]

    def __str__(self):
        return self.title
