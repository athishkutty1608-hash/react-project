# Backend: FastAPI and Django

This folder contains **two independent backends** that serve the same React (Vite) frontend. Both expose the **same endpoints** and return the **same JSON**, so the frontend can switch between them by changing one line in `frontend/.env`. No React code changes.

| Backend | Framework | Folder | Default port | Database file |
|---|---|---|---|---|
| Backend 1 | Python **FastAPI** | `fastapi_app/` | `8000` | `app.db` |
| Backend 2 | Python **Django** (+ Django REST Framework) | `django_app/` | `8001` | `db.sqlite3` |

> The two backends have **separate databases**. A user registered on FastAPI does not exist on Django (and vice versa). Register again after switching.

---

## Table of contents

1. [Project structure](#1-project-structure)
2. [How authentication works](#2-how-authentication-works)
3. [The API contract (both backends)](#3-the-api-contract-both-backends)
4. [Run the FastAPI backend](#4-run-the-fastapi-backend)
5. [Run the Django backend](#5-run-the-django-backend)
6. [Connect the frontend](#6-connect-the-frontend)
7. [Test the endpoints](#7-test-the-endpoints)
8. [FastAPI vs Django: what is different](#8-fastapi-vs-django-what-is-different)
9. [Troubleshooting](#9-troubleshooting)
10. [Security notes](#10-security-notes)

---

## 1. Project structure

```
project-react/
├── frontend/                  React + Vite app
│   ├── .env                   VITE_API_URL=... (which backend to use)
│   └── src/api/api.js         all requests to the backend live here
└── backend/
    ├── README.md              this file
    ├── fastapi_app/
    │   ├── venv/              FastAPI's own virtual environment
    │   ├── main.py            the whole FastAPI app
    │   └── app.db             SQLite database (created automatically)
    └── django_app/
        ├── venv/              Django's own virtual environment
        ├── manage.py          Django's command-line tool
        ├── db.sqlite3         SQLite database (created by migrate)
        ├── config/            project settings and root URLs
        │   ├── settings.py
        │   └── urls.py
        └── accounts/          our auth app
            ├── authentication.py   reads the login cookie
            ├── views.py            register / login / logout / me
            └── urls.py             maps paths to views
```

Each backend has **its own `venv`** so their packages never mix.

---

## 2. How authentication works

Both backends use the same idea: **JWT stored in an httpOnly cookie**.

```
1. User submits the login form
2. React (axios) sends  POST /auth/login  { email, password }
3. Backend checks the password against the stored HASH
4. Backend creates a JWT (a signed token that says "this is user 5, valid 8 hours")
5. Backend sends it back inside an httpOnly cookie named  access_token
6. The browser attaches that cookie automatically to every later request
7. Protected endpoints (like /auth/me) read the cookie, verify the token, find the user
```

Why a cookie instead of localStorage?

- **httpOnly** means JavaScript cannot read the cookie, so a script injected into your page (XSS) cannot steal the token.
- Passwords are **never stored as plain text**. FastAPI uses `bcrypt`. Django uses its built-in password hasher.
- The frontend only keeps the user's **profile** (name, email) in `localStorage` so the UI can show the right buttons after a refresh. Real permission checks always happen on the server.

For this to work, three things must line up:

| Where | Setting | Why |
|---|---|---|
| Frontend `api.js` | `withCredentials: true` | makes the browser send and accept cookies |
| Backend CORS | `allow_credentials` / `CORS_ALLOW_CREDENTIALS = True` | lets the browser accept the cookie |
| Backend CORS | origin is exactly `http://localhost:5173` (not `*`) | browsers reject `*` when cookies are used |

---

## 3. The API contract (both backends)

Both backends must follow this contract, because the frontend depends on it.

| Method | Path | Request body | Success reply | Error reply |
|---|---|---|---|---|
| `POST` | `/auth/register` | `{ "name", "email", "password" }` | `201` `{ "user": { "name", "email" } }` | `400` `{ "detail": "Email already registered" }` |
| `POST` | `/auth/login` | `{ "email", "password" }` | `200` `{ "user": { "name", "email" } }` + sets cookie | `401` `{ "detail": "Incorrect email or password" }` |
| `POST` | `/auth/logout` | none | `200` `{ "message": "Logged out" }` + clears cookie | none |
| `GET` | `/auth/me` | none (uses cookie) | `200` `{ "user": { "name", "email" } }` | `401` `{ "detail": "Not authenticated" }` |

Rules:

- Errors always use the key **`detail`**. The interceptor in `api.js` reads `error.response.data.detail`.
- Passwords must be **at least 6 characters**.
- Emails are stored **lowercase**.
- Paths have **no trailing slash** (`/auth/login`, not `/auth/login/`). Django cannot redirect a POST that is missing the slash, so the URLs are defined without it.

---

## 4. Run the FastAPI backend

### First-time setup

```powershell
cd backend\fastapi_app
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn sqlalchemy bcrypt PyJWT "pydantic[email]"
```

Your prompt should now start with `(venv)`.

### Start the server

```powershell
uvicorn main:app --reload --port 8000
```

- API: <http://localhost:8000>
- Interactive docs (try every endpoint in the browser): <http://localhost:8000/docs>

The database file `app.db` and the `users` table are created automatically on first start.

### How the code is organized (`main.py`)

| Part | What it does |
|---|---|
| `engine`, `SessionLocal`, `Base` | connect to the SQLite database with SQLAlchemy |
| `User` class | defines the `users` table: `id`, `name`, `email`, `password_hash` |
| `RegisterIn`, `LoginIn` | Pydantic models that validate incoming JSON automatically (bad email → `422`) |
| `get_db()` | gives each request its own database session, closes it afterwards |
| `CORSMiddleware` | allows `http://localhost:5173` and cookies |
| `register` | checks the email is unused, hashes the password, saves the user |
| `login` | verifies the password, creates the JWT, sets the httpOnly cookie |
| `get_current_user` | dependency that reads the cookie and returns the user (or `401`) |
| `logout` | deletes the cookie |
| `me` | returns the logged-in user (uses `get_current_user`) |

---

## 5. Run the Django backend

### First-time setup

```powershell
cd backend\django_app
python -m venv venv
venv\Scripts\activate
pip install django djangorestframework django-cors-headers PyJWT
django-admin startproject config .
python manage.py startapp accounts
```

Then add the code files listed below, and **create the database tables**:

```powershell
python manage.py migrate
```

> **Do not skip `migrate`.** Django keeps users in a table called `auth_user`. Without migrating, every login or register fails with `no such table: auth_user`.

### Start the server

```powershell
python manage.py runserver 8001
```

- API: <http://localhost:8001>
- Opening `http://localhost:8001/` in the browser shows a 404. That is normal, an API has no home page.

### Files you must edit or create

**`config/settings.py`** (add to the existing lists)

```python
INSTALLED_APPS = [
    # ...keep the existing ones...
    "corsheaders",
    "rest_framework",
    "accounts",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",   # must be FIRST
    # ...keep the existing ones...
]

CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]
CORS_ALLOW_CREDENTIALS = True

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [],   # we use our own cookie check
}
```

**`config/urls.py`** (replace the whole file)

```python
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("auth/", include("accounts.urls")),
]
```

**`accounts/urls.py`** (new file, `startapp` does not create it)

```python
from django.urls import path
from . import views

urlpatterns = [
    path("register", views.register),
    path("login", views.login),
    path("logout", views.logout),
    path("me", views.me),
]
```

**`accounts/authentication.py`** and **`accounts/views.py`**: use the code from the setup guide. Summary of what they do:

| File | What it does |
|---|---|
| `authentication.py` | `CookieJWTAuthentication` reads `access_token` from the cookie, verifies the JWT, and returns the user |
| `views.py` → `register` | validates input, creates the user (email is used as the username) |
| `views.py` → `login` | `authenticate()` checks the hashed password, then creates the JWT and sets the cookie |
| `views.py` → `logout` | deletes the cookie |
| `views.py` → `me` | protected by `CookieJWTAuthentication` + `IsAuthenticated` |

Note: Django's built-in `User` model has no "name" field, so the name is stored in `first_name`.

---

## 6. Connect the frontend

The frontend chooses a backend through `frontend/.env`:

```
# FastAPI
VITE_API_URL=http://localhost:8000

# Django (comment the line above and use this one instead)
# VITE_API_URL=http://localhost:8001
```

Rules:

- **Restart `npm run dev`** after changing `.env`. Vite only reads it at startup.
- Both servers can run at the same time (ports 8000 and 8001). The `.env` decides which one the frontend talks to.
- The browser origin must stay `http://localhost:5173`. If Vite prints a different port, update the CORS setting in the backend.

---

## 7. Test the endpoints

Test the backend **before** blaming the frontend.

### FastAPI: use the built-in docs

Open <http://localhost:8000/docs>, expand an endpoint, click **Try it out**, then **Execute**.

### Either backend: PowerShell (`curl.exe`)

Replace the port with `8000` (FastAPI) or `8001` (Django).

```powershell
# Register
curl.exe -X POST http://localhost:8001/auth/register -H "Content-Type: application/json" -d "{\"name\":\"Ravi\",\"email\":\"ravi@mail.com\",\"password\":\"secret123\"}"

# Login (-c saves the cookie to a file)
curl.exe -X POST http://localhost:8001/auth/login -H "Content-Type: application/json" -c cookies.txt -d "{\"email\":\"ravi@mail.com\",\"password\":\"secret123\"}"

# Who am I? (-b sends the saved cookie)
curl.exe http://localhost:8001/auth/me -b cookies.txt

# Logout
curl.exe -X POST http://localhost:8001/auth/logout -b cookies.txt
```

### Full test through the frontend

1. Start one backend, then `npm run dev`.
2. Open `/login`, choose **Register**, and create an account. You should be logged in and redirected home.
3. Refresh the page. You stay logged in.
4. Click **Logout**. The Login button returns.
5. Log in with a wrong password. You should see **Incorrect email or password** in red.
6. Stop this backend, switch `.env` to the other one, restart `npm run dev`, and repeat.

---

## 8. FastAPI vs Django: what is different

| | FastAPI | Django (+ DRF) |
|---|---|---|
| Style | small and explicit, everything in one file here | "batteries included", split into project and apps |
| Database | SQLAlchemy (we define the table ourselves) | built-in ORM, `auth_user` table created by `migrate` |
| Users | our own `User` model | Django's built-in `User` |
| Password hashing | `bcrypt` (manual) | built in (`create_user`, `authenticate`) |
| Input validation | automatic through Pydantic models | manual checks in the view (or DRF serializers) |
| Error format | `{"detail": ...}` by default | we return `{"detail": ...}` ourselves to match |
| API docs | automatic at `/docs` | not included by default |
| Admin panel | none | built in at `/admin/` (create an admin with `python manage.py createsuperuser`) |
| Start command | `uvicorn main:app --reload --port 8000` | `python manage.py runserver 8001` |

Both produce identical responses for the four auth endpoints. That is the whole point: **the frontend does not know or care which one it is talking to.**

---

## 9. Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `install : The term 'install' is not recognized` | typed `install axios` without `npm` | run `npm install axios` |
| `ImportError: cannot import name 'views' from 'config'` | `config/urls.py` contains `from . import views`, but `config/` has no `views.py` | replace `config/urls.py` with the version in section 5 |
| `no such table: auth_user` | Django migrations were never applied | stop the server, run `python manage.py migrate`, start again |
| `You have 18 unapplied migration(s)` | same as above | `python manage.py migrate` |
| Browser console: **CORS policy** error | backend does not allow the frontend origin | check `allow_origins` / `CORS_ALLOWED_ORIGINS` is exactly `http://localhost:5173`, and credentials are enabled |
| Login works but `/auth/me` returns `401` | cookie is not being sent | make sure `withCredentials: true` is in `api.js` and the frontend and backend use `localhost` consistently (not `127.0.0.1` on one side) |
| `ModuleNotFoundError: No module named 'corsheaders'` (or `rest_framework`, `jwt`, `fastapi`) | package missing in this venv | activate the right venv (`(venv)` in the prompt) and `pip install` it |
| `No module named 'accounts'` | app not created, or wrong folder | run `python manage.py startapp accounts` from the folder that contains `manage.py` |
| `Cannot reach the server. Is the backend running?` (shown in the login card) | backend is off, or `.env` port is wrong | start the backend, check `VITE_API_URL`, restart `npm run dev` |
| `422 Unprocessable Entity` (FastAPI) | request body failed validation (bad email, password under 6 characters) | send valid data |
| `Not Found: /` and `Not Found: /favicon.ico` in the Django log | you opened the server root in a browser | harmless, ignore |
| Activation blocked: "running scripts is disabled" | PowerShell execution policy | `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` |

---

## 10. Security notes

This setup is good for **learning and local development**. Before deploying:

- **Move secrets out of the code.** FastAPI has `SECRET_KEY = "change-this-in-production"` hard-coded. Load it from an environment variable. Django's `SECRET_KEY` in `settings.py` must also be kept private.
- **Turn on `secure=True`** in `set_cookie(...)` (both backends) once you use HTTPS.
- **Set `DEBUG = False`** in Django and configure `ALLOWED_HOSTS` for production.
- **Restrict CORS** to your real frontend domain, never `*`.
- **Use a real database** (PostgreSQL) instead of SQLite for production.
- **Do not commit** these files. Add them to `.gitignore`:

```
venv/
__pycache__/
*.pyc
app.db
db.sqlite3
.env
cookies.txt
```

- **Never trust the frontend.** The user object in `localStorage` can be edited in DevTools. Any permission check (admin-only pages, data access) must be enforced by the backend.
- **Save your dependencies** so others can reproduce the setup (run inside each activated venv):

```powershell
pip freeze > requirements.txt
```

  and install them later with `pip install -r requirements.txt`.