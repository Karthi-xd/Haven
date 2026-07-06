import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user so we can extend it later (avatar, karma, bio) without a migration headache."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=50, blank=True)
    bio = models.CharField(max_length=280, blank=True)
    avatar_url = models.URLField(blank=True)  # used for preset/avatar-service avatars (e.g. dicebear)
    avatar_image = models.FileField(upload_to="avatars/%Y/%m/", blank=True, null=True)  # user-uploaded picture, takes priority when set
    interests = models.CharField(max_length=300, blank=True)  # comma-separated topic tags chosen at signup
    karma = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email"]

    def __str__(self):
        return self.username
