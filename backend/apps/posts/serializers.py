from rest_framework import serializers

from apps.users.serializers import UserPublicSerializer

from .models import Post


class PostSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)
    community_slug = serializers.SlugField(source="community.slug", read_only=True)

    class Meta:
        model = Post
        fields = [
            "id", "community", "community_slug", "author", "kind", "title",
            "body", "url", "score", "comment_count", "is_pinned",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "author", "score", "comment_count", "created_at", "updated_at"]
