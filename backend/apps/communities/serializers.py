from rest_framework import serializers

from .models import Community


class CommunitySerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(source="members.count", read_only=True)

    class Meta:
        model = Community
        fields = [
            "id", "slug", "name", "description", "icon_url",
            "banner_url", "created_by", "member_count", "created_at",
        ]
        read_only_fields = ["id", "created_by", "created_at"]
