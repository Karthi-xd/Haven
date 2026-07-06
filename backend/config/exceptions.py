"""
Custom DRF exception handler.

Without this, a dropped Supabase Postgres connection (network blip, pooler
recycling a connection, DB asleep) surfaces to the frontend as a raw 500 with
a Python traceback — which axios reports as "no response" and the UI can't
show anything useful.

This catches the DB-specific exceptions and returns a clean 503 JSON body
so the frontend's getErrorMessage() can show something like "Can't reach the
server" instead of a blank failure.
"""
import logging

from django.db import DatabaseError, InterfaceError, OperationalError
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger("haven.db")


def custom_exception_handler(exc, context):
    # Let DRF handle everything it already knows how to (validation errors,
    # auth errors, 404s, etc.) first.
    response = drf_exception_handler(exc, context)
    if response is not None:
        return response

    # Anything DRF didn't handle that looks like a database connectivity
    # problem gets a friendly, consistent shape instead of bubbling up as an
    # unhandled 500.
    if isinstance(exc, (OperationalError, InterfaceError, DatabaseError)):
        logger.error("Database connection error: %s", exc)
        return Response(
            {"detail": "Can't reach the database right now. Please try again in a moment."},
            status=503,
        )

    return None
