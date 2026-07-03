from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserPublicSerializer(serializers.ModelSerializer):
    """What everyone else sees when they view a profile."""

    class Meta:
        model = User
        fields = ["id", "username", "display_name", "bio", "avatar_url", "karma", "created_at"]
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "display_name"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserMeSerializer(serializers.ModelSerializer):
    """Serializer for retrieving and updating current user's profile info."""

    class Meta:
        model = User
        fields = ["id", "username", "email", "display_name", "bio", "avatar_url", "karma", "created_at"]
        read_only_fields = ["id", "email", "karma", "created_at"]

