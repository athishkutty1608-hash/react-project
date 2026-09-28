# ==============================================================================
# FASTAPI AUTH BACKEND  (read this block first)
# ==============================================================================
# What this file does:
#   It is a small web server that lets users REGISTER, LOGIN, LOGOUT and ask
#   "who am I?" (/auth/me). Our React app talks to it using JSON.
#
# The 6 big ideas in this file (in the order they appear):
#   1. Imports          - the tools we borrow from libraries
#   2. Settings         - constants such as the secret key
#   3. Database         - SQLite + SQLAlchemy, and the "users" table
#   4. Validation       - Pydantic models that check incoming JSON
#   5. App + CORS       - create the server and let React talk to it
#   6. Endpoints        - register, login, logout, me
#
# How login works, in one picture:
#   login form -> POST /auth/login -> server checks password hash
#              -> server creates a JWT token -> puts it in an httpOnly cookie
#              -> browser sends that cookie automatically on every next request
#              -> /auth/me reads the cookie and knows who you are
#
# Run it with:   uvicorn main:app --reload --port 8000
# Try it at:     http://localhost:8000/docs
# ==============================================================================


# ------------------------------------------------------------------------------
# 1. IMPORTS
# ------------------------------------------------------------------------------

# datetime   -> work with dates and times (we need it for the token expiry)
# timedelta  -> a length of time, e.g. "8 hours"
# timezone   -> lets us say "use UTC time" so it is the same on every computer
from datetime import datetime, timedelta, timezone

# bcrypt -> a library that turns a password into a scrambled "hash".
#           A hash cannot be turned back into the password, so even if someone
#           steals the database they cannot read the real passwords.
import bcrypt

# jwt (the PyJWT package) -> creates and verifies JWT tokens.
#           A JWT is a signed piece of text that says "this is user 5".
#           Nobody can change it without knowing our SECRET_KEY.
import jwt

# From FastAPI we need:
#   Cookie        -> read a cookie sent by the browser
#   Depends       -> "run this helper function first and give me its result"
#   FastAPI       -> the main class that creates the app
#   HTTPException -> stop the request and send an error like 401 or 400
#   Response      -> lets us set or delete cookies on the reply
from fastapi import Cookie, Depends, FastAPI, HTTPException, Response

# CORSMiddleware -> gives the browser permission to let our React app
#                   (a different address) talk to this server.
from fastapi.middleware.cors import CORSMiddleware

# From Pydantic we need:
#   BaseModel -> the parent class for "shape of the data" classes
#   EmailStr  -> a text type that must look like a real email
#   Field     -> lets us add rules such as a minimum length
from pydantic import BaseModel, EmailStr, Field

# From SQLAlchemy (a library that lets us use Python instead of raw SQL):
#   Column, Integer, String -> describe the columns of a table
#   create_engine           -> opens the connection to the database
from sqlalchemy import Column, Integer, String, create_engine

# From sqlalchemy.orm:
#   Session          -> the type of a database "conversation" (used for hints)
#   declarative_base -> creates the parent class for our table classes
#   sessionmaker     -> a factory that makes Session objects
from sqlalchemy.orm import Session, declarative_base, sessionmaker


# ------------------------------------------------------------------------------
# 2. SETTINGS (constants)
# ------------------------------------------------------------------------------
# Constants are written in CAPITAL LETTERS. We keep them at the top so they are
# easy to find and change in one place.

# The secret used to SIGN tokens. Anyone who knows it can forge logins!
# Never publish the real one. Later, load it from an environment variable.
SECRET_KEY = "change-this-in-production"  # move to an environment variable later

# The signing method. HS256 = "one shared secret key signs and verifies".
ALGORITHM = "HS256"

# The name of the cookie that will hold our token.
COOKIE_NAME = "access_token"

# How many hours a login lasts before the token expires.
SESSION_HOURS = 8


# ------------------------------------------------------------------------------
# 3. DATABASE (SQLite file: app.db)
# ------------------------------------------------------------------------------

# The engine is the connection to the database.
#   "sqlite:///./app.db" -> use a SQLite database stored in a file called app.db
#                           inside the current folder. It is created if missing.
#   check_same_thread=False -> SQLite normally refuses to be used from more than
#                              one thread. FastAPI uses several, so we allow it.
engine = create_engine("sqlite:///./app.db", connect_args={"check_same_thread": False})

# SessionLocal is a factory: calling SessionLocal() gives us a new database
# session (one "conversation" with the database).
#   bind=engine    -> the sessions use the engine we made above
#   autoflush=False-> do not send changes to the database until we say so
SessionLocal = sessionmaker(bind=engine, autoflush=False)

# Base is the parent class for all our table classes.
# SQLAlchemy uses it to keep a list of every table we define.
Base = declarative_base()


# A class that inherits from Base becomes a database TABLE.
# One object of this class = one row in the table.
class User(Base):
    # The real name of the table inside the database.
    __tablename__ = "users"

    # id: whole number, the primary key (unique ID). It counts 1, 2, 3... by itself.
    id = Column(Integer, primary_key=True)

    # name: text, required (nullable=False means "cannot be empty/NULL").
    name = Column(String, nullable=False)

    # email: text, must be unique (no two users share an email),
    #        index=True makes searching by email fast, and it is required.
    email = Column(String, unique=True, index=True, nullable=False)

    # password_hash: the scrambled password. We NEVER store the real password.
    password_hash = Column(String, nullable=False)


# Look at every class that inherits from Base and create its table in the
# database if the table does not exist yet. Safe to run every time.
Base.metadata.create_all(engine)  # creates the table if it doesn't exist


# A "dependency" function. FastAPI calls it for us before an endpoint runs
# and gives the endpoint the result (a database session).
def get_db():
    # Open a new session for this one request.
    db = SessionLocal()
    try:
        # yield = "hand the session to the endpoint and pause here".
        # The endpoint runs while we are paused on this line.
        yield db
    finally:
        # finally ALWAYS runs, even if the endpoint crashed.
        # We close the session so connections are never left open.
        db.close()


# ------------------------------------------------------------------------------
# 4. REQUEST SHAPES (validation)
# ------------------------------------------------------------------------------
# These classes describe what JSON the frontend MUST send.
# FastAPI checks every request against them automatically.
# If the data is wrong, FastAPI replies with 422 and never runs our code.


# The JSON for POST /auth/register must look like:
#   { "name": "Ravi", "email": "ravi@mail.com", "password": "secret123" }
class RegisterIn(BaseModel):
    # name must be text with at least 1 character (not empty).
    name: str = Field(min_length=1)
    # email must look like an email (has @ and a domain), otherwise 422.
    email: EmailStr
    # password must be text with at least 6 characters.
    password: str = Field(min_length=6)


# The JSON for POST /auth/login must look like:
#   { "email": "ravi@mail.com", "password": "secret123" }
class LoginIn(BaseModel):
    email: EmailStr
    password: str


# A helper that builds the reply we send to the frontend.
# We write it once so register, login and me all return the same shape.
def user_out(user: User):
    # Never return the password hash. Send only what React needs.
    return {"user": {"name": user.name, "email": user.email}}


# ------------------------------------------------------------------------------
# 5. APP + CORS
# ------------------------------------------------------------------------------

# Create the application. "app" is the name we give to uvicorn:
#   uvicorn main:app   ->  file main.py, variable app
app = FastAPI()

# CORS: browsers block a page on one address (localhost:5173, React) from
# calling a server on another address (localhost:8000, FastAPI) unless the
# SERVER says it is allowed. This middleware adds that permission.
app.add_middleware(
    CORSMiddleware,
    # Only this address may call us. For cookies it must be exact, "*" is refused.
    allow_origins=["http://localhost:5173"],  # your Vite address
    # Allow cookies to travel with requests. Needed for our login cookie.
    allow_credentials=True,                   # needed for cookies
    # Allow every HTTP method (GET, POST, ...).
    allow_methods=["*"],
    # Allow every request header (for example Content-Type).
    allow_headers=["*"],
)


# ------------------------------------------------------------------------------
# 6. ENDPOINTS
# ------------------------------------------------------------------------------
# An endpoint is a function attached to a URL and an HTTP method.
# The line starting with @ is a "decorator": it tells FastAPI
# "run the function below when this method + URL is requested".


# ---- REGISTER: POST /auth/register ------------------------------------------
# status_code=201 means "Created" (better than the default 200 for new things).
@app.post("/auth/register", status_code=201)
# data: RegisterIn  -> FastAPI reads the JSON body, validates it, and gives it to us.
# db = Depends(get_db) -> FastAPI runs get_db() and gives us a database session.
def register(data: RegisterIn, db: Session = Depends(get_db)):
    # Store emails in lowercase so "A@mail.com" and "a@mail.com" are the same.
    email = data.email.lower()

    # Ask the database: "is there already a user with this email?"
    # .filter(...) adds the condition, .first() returns one row or None.
    if db.query(User).filter(User.email == email).first():
        # Stop here and send an error. The frontend shows "detail" in red.
        # 400 = "Bad Request" (the client sent something we cannot accept).
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash the password:
    #   data.password.encode() -> bcrypt works with bytes, so text -> bytes
    #   bcrypt.gensalt()       -> random extra data so equal passwords get different hashes
    #   bcrypt.hashpw(...)     -> the scrambled result (bytes)
    #   .decode()              -> bytes -> text, so it can be saved in a String column
    hashed = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()

    # Build a new User object (a new row, not saved yet).
    user = User(name=data.name, email=email, password_hash=hashed)

    # Put it in the session's "to save" list...
    db.add(user)
    # ...and really write it to the database file.
    db.commit()
    # Reload the object so it now knows values made by the database (like its id).
    db.refresh(user)

    # Send back the user's name and email (never the hash).
    return user_out(user)


# ---- LOGIN: POST /auth/login ------------------------------------------------
@app.post("/auth/login")
# response: Response -> FastAPI gives us the outgoing reply so we can add a cookie.
def login(data: LoginIn, response: Response, db: Session = Depends(get_db)):
    # Find the user by email (lowercase, same as in register).
    user = db.query(User).filter(User.email == data.email.lower()).first()

    # Fail if the user does not exist OR the password does not match the hash.
    # bcrypt.checkpw(plain_password, stored_hash) -> True or False (both as bytes).
    # We use ONE message for both cases so attackers cannot learn which emails exist.
    if not user or not bcrypt.checkpw(data.password.encode(), user.password_hash.encode()):
        # 401 = "Unauthorized" (you are not who you claim to be).
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    # Create the JWT token. jwt.encode(payload, secret, algorithm=...) needs 3 things:
    token = jwt.encode(
        {
            # "sub" (subject) = who this token is for: the user's id, as text.
            "sub": str(user.id),
            # "exp" (expires) = the moment the token stops being valid:
            # now (UTC) + 8 hours. PyJWT checks this for us when decoding.
            "exp": datetime.now(timezone.utc) + timedelta(hours=SESSION_HOURS),
        },
        SECRET_KEY,          # signs the token so nobody can forge it
        algorithm=ALGORITHM,  # the signing method
    )

    # Put the token in a cookie on the reply.
    response.set_cookie(
        COOKIE_NAME, token,  # cookie name and value
        httponly=True,       # JavaScript cannot read it (protects against XSS)
        samesite="lax",      # the cookie is not sent on most cross-site requests (CSRF protection)
        max_age=SESSION_HOURS * 3600,  # cookie lifetime in seconds (hours x 3600)
        # secure=True,       # enable when you deploy on HTTPS
    )

    # The frontend receives the user's name and email.
    return user_out(user)


# ---- HELPER: who is logged in? ----------------------------------------------
# This is NOT an endpoint. It is a dependency that protected endpoints reuse.
# Put Depends(get_current_user) on any endpoint that needs a logged-in user.
#
# access_token: str | None = Cookie(default=None)
#   -> FastAPI looks for a cookie named "access_token" in the request.
#      (The parameter name must match COOKIE_NAME.)
#      "str | None" means it is text, or None if the cookie is missing.
def get_current_user(access_token: str | None = Cookie(default=None), db: Session = Depends(get_db)):
    # No cookie at all -> the user never logged in (or logged out).
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        # Verify the token: checks the signature AND the expiry time.
        # algorithms=[...] tells PyJWT which method it is allowed to accept.
        # If it works, "payload" is the dictionary we stored in login.
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        # Fake, changed, or expired token -> reject.
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    # payload["sub"] is text like "5"; convert to a number and load that user.
    # db.get(Model, id) finds a row by primary key, or returns None.
    user = db.get(User, int(payload["sub"]))

    # The token was valid, but the user was deleted since then.
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Hand the user object to whoever asked for it.
    return user


# ---- LOGOUT: POST /auth/logout ----------------------------------------------
@app.post("/auth/logout")
def logout(response: Response):
    # Tell the browser to delete the cookie. Without the cookie, the user is logged out.
    response.delete_cookie(COOKIE_NAME)
    # Any small JSON reply is fine here.
    return {"message": "Logged out"}


# ---- ME: GET /auth/me -------------------------------------------------------
# GET = "read something". No body needed; the cookie identifies the user.
@app.get("/auth/me")
# Depends(get_current_user) runs the helper above FIRST.
# If it raises a 401, this function never runs. Otherwise "user" is the logged-in user.
def me(user: User = Depends(get_current_user)):
    return user_out(user)