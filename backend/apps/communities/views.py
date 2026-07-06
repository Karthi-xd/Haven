from rest_framework import permissions, viewsets

from .models import Community, Membership
from .serializers import CommunitySerializer


class CommunityViewSet(viewsets.ModelViewSet):
    queryset = Community.objects.all()
    serializer_class = CommunitySerializer
    lookup_field = "slug"
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        community = serializer.save(created_by=self.request.user)
        Membership.objects.create(user=self.request.user, community=community, role=Membership.Role.OWNER)
