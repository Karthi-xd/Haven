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
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "display_name", "avatar_url", "karma", "created_at"]
        read_only_fields = fields

    def get_avatar_url(self, obj):
        return _resolve_avatar_url(obj, self.context.get("request"))


def _resolve_avatar_url(obj, request):
    """An uploaded picture always wins over a preset/pasted avatar_url."""
    if obj.avatar_image:
        url = obj.avatar_image.url
        return request.build_absolute_uri(url) if request else url
    return obj.avatar_url


class UserMeSerializer(serializers.ModelSerializer):
    # Username is settable exactly once, in the "Complete Profile" step —
    # keep Django's own username validator/uniqueness check active.
    username = serializers.CharField(
        required=False,
        min_length=3,
        max_length=20,
        validators=[UnicodeUsernameValidator()],
    )
    # Real file picked from the user's own device (multipart upload).
    avatar_image = serializers.FileField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "display_name", "avatar_url", "avatar_image", "bio", "interests", "karma", "created_at"]
        read_only_fields = ["id", "email", "karma", "created_at"]

    def validate_username(self, value):
        qs = User.objects.exclude(pk=self.instance.pk) if self.instance else User.objects.all()
        if qs.filter(username__iexact=value).exists():
            raise serializers.ValidationError("That username is already taken.")
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["avatar_url"] = _resolve_avatar_url(instance, self.context.get("request"))
        return data

    def update(self, instance, validated_data):
        uploaded_file = validated_data.pop("avatar_image", None)
        if uploaded_file is not None:
            # A freshly uploaded picture replaces any preset avatar_url text.
            if instance.avatar_image:
                instance.avatar_image.delete(save=False)
            instance.avatar_image = uploaded_file
            validated_data["avatar_url"] = ""
        elif validated_data.get("avatar_url") is not None:
            # Switching to a preset/pasted avatar clears any previously uploaded file.
            if instance.avatar_image:
                instance.avatar_image.delete(save=False)
                instance.avatar_image = None
        return super().update(instance, validated_data)
