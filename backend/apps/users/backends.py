from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

User = get_user_model()


class EmailBackend(ModelBackend):
    """
    Authenticates by email, not username.

    User.USERNAME_FIELD stays "username" (Django needs some unique field
    there, and we still want usernames for profile URLs), but our actual
    login flow is email + password. Django's default ModelBackend only
    looks for a kwarg named after USERNAME_FIELD, so plain email+password
    logins always fail without this backend.
    """

    def authenticate(self, request, email=None, password=None, **kwargs):
        if email is None:
            email = kwargs.get("username")
        if email is None or password is None:
            return None
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return None
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None

