# Haven

Reddit-style community platform.

```
haven/
├── backend/    # Django + DRF API (JWT auth, communities, posts, comments, votes)
└── frontend/   # React + TypeScript + Vite (the sakura-themed landing/login UI)
```

## Run both

**Backend** (http://localhost:8000):
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # fill in your Supabase DB credentials
python manage.py migrate
python manage.py runserver
```

**Frontend** (http://localhost:5173):
```bash
cd frontend
npm install
cp .env.example .env      # defaults to http://localhost:8000/api, edit if needed
npm run dev
```

CORS on the backend is already open for `localhost:5173`. Each half also has its own README/details — see `backend/README.md`.

## What's in the frontend so far
`Landing.tsx` and `Login.tsx` are the sakura-themed screens you designed, ported 1:1 from the original HTML/CSS/JS into React + TS (petal canvas, storm transition, vine-bloom form fields all preserved). `Login.tsx` is wired to the real `/api/auth/login/` endpoint via `src/api/client.ts`, which also handles JWT storage + silent refresh. `App.tsx` holds the landing ↔ login state machine that used to live in the vanilla `<script>` tag.
