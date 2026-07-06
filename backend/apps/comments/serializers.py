from rest_framework import serializers

from apps.users.serializers import UserPublicSerializer

from .models import Comment


class CommentSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "post", "author", "parent", "body", "score", "created_at", "updated_at"]
        read_only_fields = ["id", "author", "score", "created_at", "updated_at"]
