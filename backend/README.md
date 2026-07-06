# Haven — backend

Django + Django REST Framework API for the Haven Reddit-style platform.
Frontend (React + TS + Vite) lives separately and talks to this over HTTP.

## Setup

```bash
python -m venv venv
source venv/bin/activate        # venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env            # fill in your Supabase DB credentials
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver      # http://localhost:8000
```

## Layout

```
haven-backend/
├── manage.py
├── requirements.txt
├── .env.example
├── config/                 # project settings, root urls
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
└── apps/
    ├── users/               # custom User model, register/login (JWT), profile
    ├── communities/         # Community + Membership ("subreddits")
    ├── posts/                # Post model + feed endpoints
    ├── comments/             # threaded Comment model
    └── votes/                # generic up/down vote on posts or comments
```

## API surface (all under `/api/`)

| Endpoint | Notes |
|---|---|
| `POST /api/auth/register/` | create account |
| `POST /api/auth/login/` | JWT access + refresh |
| `POST /api/auth/login/refresh/` | refresh access token |
| `GET/PATCH /api/auth/me/` | current user |
| `GET /api/auth/<username>/` | public profile |
| `GET/POST /api/communities/` | list/create communities |
| `GET/PATCH/DELETE /api/communities/<slug>/` | community detail |
| `GET/POST /api/posts/?community__slug=<slug>&ordering=-score` | feed, filterable/sortable |
| `GET/POST /api/comments/?post=<id>` | threaded comments (use `parent` for replies) |
| `POST /api/votes/` | body: `{ "target_type": "post", "target_id": "...", "value": 1 }` |

Auth: send `Authorization: Bearer <access_token>` once you have it from `/api/auth/login/`.

## Connecting the existing React frontend

In your frontend `.env`:
```
VITE_API_URL=http://localhost:8000/api
```
`CORS_ALLOWED_ORIGINS` in `.env` already whitelists Vite's default `localhost:5173` — add your actual dev port if different.
