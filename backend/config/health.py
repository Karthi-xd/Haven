from django.db import connection
from django.db.utils import Error as DjangoDBError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """
    GET /api/health/

    Confirms the backend process is up AND can actually reach the database
    (a live TCP connection to Django doesn't guarantee Supabase Postgres is
    reachable). Useful for debugging "why won't login work" — hit this
    endpoint directly to see whether the problem is the API server or the DB.
    """
    db_ok = True
    db_error = None
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except DjangoDBError as exc:
        db_ok = False
        db_error = str(exc)

    status = 200 if db_ok else 503
    return Response(
        {
            "api": "ok",
            "database": "ok" if db_ok else "unreachable",
            "database_error": db_error,
        },
        status=status,
    )
