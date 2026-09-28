# Build the FastAPI Auth Backend Yourself

You have read `main.py` (every line is explained). Now you prove you understand it by **writing it again on your own**. This guide takes you from "guided" to "from memory" in four levels. Do them in order.

| Level | What you do | Help you get |
|---|---|---|
| 1. Fill the blanks | complete `main_practice.py` | a hint on every blank |
| 2. Rebuild in stages | write the file from an empty page, one stage at a time | a goal + a test for each stage |
| 3. From memory | rebuild it in one sitting, no notes | only the checklist |
| 4. Extend it | add new features nobody showed you | a challenge list |

**Golden rule:** typing the code yourself matters. Do not copy and paste. Your fingers learn what your eyes only recognize.

---

## Before you start: explain the big picture

Answer these out loud (or in writing) **without looking at the code**. If you cannot, re-read `main.py`'s top comment block first.

1. What are the 4 endpoints, and what does each one do?
2. What is a **hash**, and why do we store it instead of the password?
3. What is a **JWT**, and what two things are inside ours (`sub` and `exp`)?
4. Why is the token in an **httpOnly cookie** and not in `localStorage`?
5. What does **CORS** protect, and why must `allow_origins` be exact when using cookies?
6. What does `Depends(...)` do?

---

## Level 1: Fill the blanks

Open `main_practice.py`. Replace every `____` with the right code. Each blank has a `HINT`.

Run it:

```powershell
uvicorn main_practice:app --reload --port 8000
```

If Python complains, **read the error from the bottom up**. The last line says what is wrong, and the line above it shows where.

You pass Level 1 when the server starts and all the [self-tests](#self-tests) pass.

---

## Level 2: Rebuild in stages (empty file)

Create a new empty file `my_main.py`. Build it **one stage at a time**. After each stage, run the test **before** moving on. This is how professionals work: small steps, tested often.

### Stage 1: A server that starts

**Goal:** a running app with nothing in it.

Write: import `FastAPI`, create `app`.

**Test:**
```powershell
uvicorn my_main:app --reload --port 8000
```
Open <http://localhost:8000/docs>. You should see the docs page (with no endpoints yet).

### Stage 2: The database and the users table

**Goal:** a `users` table with `id`, `name`, `email` (unique), `password_hash`.

Write: `engine`, `SessionLocal`, `Base`, the `User` class, `Base.metadata.create_all(engine)`, and `get_db()`.

**Test:** restart the server. A file called `app.db` must appear in the folder.

> Think: why does `get_db` use `yield` and `try/finally`?

### Stage 3: Validation models

**Goal:** describe the JSON the frontend sends.

Write: `RegisterIn` (name, email, password ≥ 6), `LoginIn` (email, password), and `user_out()`.

**Test:** no visible change yet. Make sure the server still starts without errors.

### Stage 4: CORS

**Goal:** let React on `http://localhost:5173` call your server with cookies.

Write: `app.add_middleware(CORSMiddleware, ...)` with the 4 settings.

**Test:** server starts. (You will see CORS working later, when the frontend connects.)

> Think: which two CORS settings are required for cookies?

### Stage 5: Register

**Goal:** create a user and save a hashed password.

Write: `POST /auth/register` with status `201`. Steps: lowercase the email, reject a duplicate with `400`, hash the password with bcrypt, save, return `user_out(user)`.

**Test:** in `/docs`, run register with:
```json
{ "name": "Ravi", "email": "ravi@mail.com", "password": "secret123" }
```
- Expect `201` and `{ "user": { "name": "Ravi", "email": "ravi@mail.com" } }`.
- Run it again: expect `400 Email already registered`.
- Try password `123`: expect `422`.

### Stage 6: Login

**Goal:** verify the password and hand out a cookie.

Write: `POST /auth/login`. Steps: find the user, check the password with `bcrypt.checkpw`, create the JWT (`sub` + `exp`), `set_cookie` with `httponly=True`, return `user_out(user)`.

**Test:** in `/docs`:
- Correct password: `200`, and the reply headers contain `set-cookie: access_token=...; HttpOnly`.
- Wrong password: `401 Incorrect email or password`.
- Unknown email: the **same** `401` message. (Why is the same message important?)

### Stage 7: Protect a route

**Goal:** a helper that turns a cookie into a user, and the `me` endpoint that uses it.

Write: `get_current_user` (read cookie, decode JWT, load user, three different `401`s) and `GET /auth/me` using `Depends`.

**Test:** with the [curl tests below](#self-tests), `me` works after login and returns `401` without the cookie.

### Stage 8: Logout

**Goal:** remove the cookie.

Write: `POST /auth/logout` with `response.delete_cookie`.

**Test:** login, logout, then `me` must return `401` again.

You pass Level 2 when every stage test passes **and** the frontend can register, log in, and log out.

---

## Level 3: From memory

Close `main.py`, `main_practice.py`, and this file. Set a timer. Rebuild the whole backend in `memory_main.py`.

Use only this checklist as a memory aid:

- [ ] 9 imports groups: datetime, bcrypt, jwt, fastapi, CORS, pydantic, sqlalchemy, sqlalchemy.orm
- [ ] 4 constants: `SECRET_KEY`, `ALGORITHM`, `COOKIE_NAME`, `SESSION_HOURS`
- [ ] `engine` → `SessionLocal` → `Base` → `User` → `create_all` → `get_db`
- [ ] `RegisterIn`, `LoginIn`, `user_out`
- [ ] `app = FastAPI()` + CORS middleware
- [ ] `register`, `login`, `get_current_user`, `logout`, `me`

Scoring:

| Time | Result |
|---|---|
| under 30 minutes, works first try | excellent |
| under 60 minutes, a few fixes | good |
| over 60 minutes, or you peeked | repeat Level 2 for the stages you struggled with |

Repeat Level 3 on another day. Knowledge that survives a night's sleep is knowledge you own.

---

## Level 4: Extend it (new features)

These need you to **think**, not remember. Each one uses ideas already in the file.

1. **Change password:** `POST /auth/change-password` (needs the cookie, old password, new password ≥ 6). Reuse `get_current_user` and `bcrypt`.
2. **Delete account:** `DELETE /auth/me` removes the user and the cookie.
3. **Update name:** `PATCH /auth/me` with `{ "name": "New Name" }`.
4. **Email format check on login:** what happens now if the email is `abc`? Why?
5. **Secret from the environment:** replace the hard-coded `SECRET_KEY` with `os.environ.get("SECRET_KEY", "dev-only")`.
6. **Roles:** add a `role` column (`"user"` or `"admin"`), return it in `user_out`, and add an admin-only endpoint that returns `403` for normal users.
7. **Login attempts:** count failed logins per email and reply `429` after 5 tries.

Hint for changing the table (feature 6): SQLite will not add the new column to the existing `users` table by itself. Delete `app.db` while you experiment (you will lose the test users).

---

## Self-tests

Start your server, then use PowerShell. The `-c` flag saves the cookie, `-b` sends it.

```powershell
# 1. Register (expect 201)
curl.exe -i -X POST http://localhost:8000/auth/register -H "Content-Type: application/json" -d "{\"name\":\"Ravi\",\"email\":\"ravi@mail.com\",\"password\":\"secret123\"}"

# 2. Register again (expect 400 Email already registered)
curl.exe -i -X POST http://localhost:8000/auth/register -H "Content-Type: application/json" -d "{\"name\":\"Ravi\",\"email\":\"ravi@mail.com\",\"password\":\"secret123\"}"

# 3. Short password (expect 422)
curl.exe -i -X POST http://localhost:8000/auth/register -H "Content-Type: application/json" -d "{\"name\":\"Sam\",\"email\":\"sam@mail.com\",\"password\":\"123\"}"

# 4. Wrong password (expect 401)
curl.exe -i -X POST http://localhost:8000/auth/login -H "Content-Type: application/json" -d "{\"email\":\"ravi@mail.com\",\"password\":\"wrong\"}"

# 5. Correct login (expect 200 and a Set-Cookie header with HttpOnly)
curl.exe -i -X POST http://localhost:8000/auth/login -H "Content-Type: application/json" -c cookies.txt -d "{\"email\":\"ravi@mail.com\",\"password\":\"secret123\"}"

# 6. Me WITH the cookie (expect 200)
curl.exe -i http://localhost:8000/auth/me -b cookies.txt

# 7. Me WITHOUT the cookie (expect 401 Not authenticated)
curl.exe -i http://localhost:8000/auth/me

# 8. Logout, then me again (expect 401)
curl.exe -i -X POST http://localhost:8000/auth/logout -b cookies.txt -c cookies.txt
curl.exe -i http://localhost:8000/auth/me -b cookies.txt
```

Scorecard: tests 1 to 8 should return **201, 400, 422, 401, 200, 200, 401, 401**.

---

## Common mistakes (check these when stuck)

| Symptom | Likely cause |
|---|---|
| `422` on a request that looks right | the JSON keys do not match the model (`name`, `email`, `password`) or the password is under 6 characters |
| `me` always returns `401` even after login | the cookie parameter name is not `access_token`, or `COOKIE_NAME` differs from it |
| Every login says "Incorrect email or password" | forgot `.lower()` on the email, or forgot `.encode()` before `bcrypt` |
| `TypeError` about bytes and str | bcrypt needs **bytes** (`.encode()`), and the database column needs **text** (`.decode()`) |
| `no such table: users` | forgot `Base.metadata.create_all(engine)`, or defined it before the `User` class |
| Works in `/docs` but React shows a CORS error | wrong origin, `allow_credentials` not `True`, or Vite is on another port |
| Login works, token never expires | forgot `exp` in the payload |
| `NameError` | used a name before importing or defining it. Order matters |

---

## Final check: can you teach it?

You truly understand the code when you can explain, to a classmate and in your own words:

1. What happens, step by step, from the moment the user clicks **Login** to the moment the Logout button appears.
2. Why the server can trust the cookie without asking the database for the password again.
3. What an attacker could do if `SECRET_KEY` leaked.
4. Why `main.py` returns the same error for "unknown email" and "wrong password".

If you can answer all four, you are ready to build the Django version and compare the two.
