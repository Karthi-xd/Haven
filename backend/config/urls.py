from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.users.urls")),
    path("api/communities/", include("apps.communities.urls")),
    path("api/posts/", include("apps.posts.urls")),
    path("api/comments/", include("apps.comments.urls")),
    path("api/votes/", include("apps.votes.urls")),
]
