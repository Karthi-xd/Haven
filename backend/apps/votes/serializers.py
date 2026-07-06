from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers

from .models import Vote


class VoteSerializer(serializers.ModelSerializer):
    target_type = serializers.ChoiceField(choices=["post", "comment"], write_only=True)
    target_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Vote
        fields = ["id", "value", "target_type", "target_id", "created_at"]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        target_type = validated_data.pop("target_type")
        target_id = validated_data.pop("target_id")
        model = "post" if target_type == "post" else "comment"
        content_type = ContentType.objects.get(app_label=model + "s", model=model)
        vote, _ = Vote.objects.update_or_create(
            user=self.context["request"].user,
            content_type=content_type,
            object_id=target_id,
            defaults={"value": validated_data["value"]},
        )
        return vote
