import uuid

from django.contrib.auth.validators import UnicodeUsernameValidator
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"


class RegisterSerializer(serializers.ModelSerializer):
    # Signup only collects email + password. Username is chosen later in the
    # "Complete Profile" step, so it must NOT be required here — we generate
    # a temporary unique placeholder instead.
    password = serializers.CharField(write_only=True, min_length=8)
    username = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["email", "username", "display_name", "password"]

    def create(self, validated_data):
        if not validated_data.get("username"):
            validated_data["username"] = f"user_{uuid.uuid4().hex[:10]}"
        user = User.objects.create_user(**validated_data)
        return user


class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "display_name", "avatar_url", "karma", "created_at"]
        read_only_fields = fields


class UserMeSerializer(serializers.ModelSerializer):
    # Username is settable exactly once, in the "Complete Profile" step —
    # keep Django's own username validator/uniqueness check active.
    username = serializers.CharField(
        required=False,
        min_length=3,
        max_length=20,
        validators=[UnicodeUsernameValidator()],
    )

    class Meta:
        model = User
        fields = ["id", "username", "email", "display_name", "avatar_url", "bio"]
        read_only_fields = ["id", "email"]

    def validate_username(self, value):
        qs = User.objects.exclude(pk=self.instance.pk) if self.instance else User.objects.all()
        if qs.filter(username__iexact=value).exists():
            raise serializers.ValidationError("That username is already taken.")
        return value
