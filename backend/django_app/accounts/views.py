# ==============================================================================
# accounts/views.py   (read this block first)
# ==============================================================================
# What this file does:
#   It holds the 4 "views": the functions that actually answer requests.
#   A view receives a request and returns a response.
#
#   urls.py decides WHICH view runs. This file decides WHAT it does.
#
#   URL             view       what it does
#   /auth/register  register   create a user (password is hashed by Django)
#   /auth/login     login      check password, create a JWT, set the cookie
#   /auth/logout    logout     delete the cookie
#   /auth/me        me         return the logged-in user (protected)
#
# Every view has three "decorators" (the lines starting with @) above it.
# A decorator adds behavior to the function underneath it:
#
#   @api_view(["POST"])            -> which HTTP method(s) are allowed.
#                                     Any other method gets 405 Method Not Allowed.
#   @authentication_classes([...]) -> HOW to find out who the user is.
#                                     [] = don't even try (anyone may call it).
#   @permission_classes([...])     -> WHO is allowed in.
#                                     AllowAny = everyone, IsAuthenticated = logged in only.
#
# Django comparison with FastAPI (fastapi_app/main.py):
#   - FastAPI validates JSON automatically with Pydantic models.
#     Here we check the input ourselves, inside each view.
#   - FastAPI needs bcrypt to hash passwords.
#     Django hashes them for us (create_user) and checks them for us (authenticate).
# ==============================================================================


# This line was added by Django when the app was created. We do not use render
# (it is for HTML pages, and our API sends JSON), so it is safe to delete.
from django.shortcuts import render

# Create your views here.

# ------------------------------------------------------------------------------
# IMPORTS
# ------------------------------------------------------------------------------

# datetime -> dates and times (for the token expiry)
# timedelta -> a length of time, e.g. "8 hours"
# timezone -> lets us say "use UTC" so it is the same on every computer
from datetime import datetime, timedelta, timezone

# jwt (the PyJWT package) -> creates JWT tokens.
# A JWT is a signed piece of text saying "this is user 5, valid for 8 hours".
import jwt

# settings -> access to config/settings.py. We need settings.SECRET_KEY to sign tokens.
from django.conf import settings

# authenticate -> Django's function that checks a username + password.
# It compares the typed password with the stored HASH and returns the user
# if they match, or None if they do not.
from django.contrib.auth import authenticate

# User -> Django's built-in user model (table: auth_user).
from django.contrib.auth.models import User

# The three decorators explained in the block at the top.
from rest_framework.decorators import api_view, authentication_classes, permission_classes

# AllowAny -> anyone can call the view. IsAuthenticated -> only logged-in users.
from rest_framework.permissions import AllowAny, IsAuthenticated

# Response -> DRF's way of sending a JSON reply. We give it a dictionary and a
# status code, and DRF converts the dictionary into JSON.
from rest_framework.response import Response

# Our own class from authentication.py. It reads the login cookie.
from .authentication import CookieJWTAuthentication


# ------------------------------------------------------------------------------
# SETTINGS
# ------------------------------------------------------------------------------

# How many hours a login lasts before the token expires.
SESSION_HOURS = 8


# ------------------------------------------------------------------------------
# HELPER
# ------------------------------------------------------------------------------

# Builds the reply shape the React app expects: {"user": {"name", "email"}}.
# Written once so register, login and me all return the same shape.
def user_data(user):
    # Django's User has no "name" field, so we saved the name in first_name.
    # We never include the password hash.
    return {"user": {"name": user.first_name, "email": user.email}}


# ------------------------------------------------------------------------------
# REGISTER: POST /auth/register
# ------------------------------------------------------------------------------

# Only POST is allowed.
@api_view(["POST"])
# No authentication: a new visitor has no cookie yet, so do not look for one.
@authentication_classes([])
# Anyone may register, even if not logged in.
@permission_classes([AllowAny])
# "request" is DRF's request object. request.data holds the JSON body.
def register(request):
    # request.data is like a dictionary. .get("name", "") returns the value,
    # or "" if the key is missing (so the code never crashes on missing data).
    # str(...)   -> force it to be text, even if someone sent a number.
    # .strip()   -> remove spaces at the start and the end.
    name = str(request.data.get("name", "")).strip()
    # .lower() -> store emails in lowercase so "A@mail.com" and "a@mail.com" match.
    email = str(request.data.get("email", "")).strip().lower()
    # No strip() on passwords: spaces can be a real part of a password.
    password = str(request.data.get("password", ""))

    # Validate the input. Django does not do this for us here.
    # "not name" is True when name is empty text. "or" means any one problem is enough.
    if not name or not email or len(password) < 6:
        # 400 = Bad Request (the client sent data we cannot accept).
        # The key "detail" is what the React api.js interceptor reads and shows in red.
        return Response(
            {"detail": "Name, email and a password of at least 6 characters are required"},
            status=400,
        )

    # Is the email already taken?
    # We use the email as the username (see below), so we search the username column.
    # .filter(...) adds a condition, .exists() gives True or False.
    if User.objects.filter(username=email).exists():
        return Response({"detail": "Email already registered"}, status=400)

    # Django's User requires a username, but our form has no username field,
    # so we use the email as the username.
    # create_user() does three things: hashes the password, saves the user,
    # and returns the new user. (Never use User(...) with a raw password.)
    user = User.objects.create_user(username=email, email=email, password=password, first_name=name)

    # 201 = Created (better than the default 200 when something new is made).
    return Response(user_data(user), status=201)


# ------------------------------------------------------------------------------
# LOGIN: POST /auth/login
# ------------------------------------------------------------------------------

@api_view(["POST"])
# No authentication and no login required: this is where people LOG IN.
@authentication_classes([])
@permission_classes([AllowAny])
def login(request):
    # Read and clean the input, the same way as in register.
    email = str(request.data.get("email", "")).strip().lower()
    password = str(request.data.get("password", ""))

    # authenticate() looks up the user with this username, hashes the typed
    # password, and compares it with the stored hash.
    # Result: the User object if correct, None if the user or password is wrong.
    user = authenticate(username=email, password=password)  # checks the hashed password

    # Wrong email OR wrong password. We use ONE message for both cases, so an
    # attacker cannot discover which emails are registered.
    if user is None:
        # 401 = Unauthorized (you are not who you claim to be).
        return Response({"detail": "Incorrect email or password"}, status=401)

    # Create the JWT. jwt.encode needs three things:
    token = jwt.encode(
        {
            # "sub" (subject) = who the token is for: the user's id, as text.
            "sub": str(user.id),
            # "exp" (expires) = when the token stops being valid: now + 8 hours.
            # authentication.py checks this automatically when it decodes.
            "exp": datetime.now(timezone.utc) + timedelta(hours=SESSION_HOURS),
        },
        settings.SECRET_KEY,  # signs the token so nobody can forge it
        algorithm="HS256",    # the signing method (must match authentication.py)
    )

    # Build the reply first, because we must attach the cookie to it.
    response = Response(user_data(user))

    # Put the token in a cookie on the reply.
    response.set_cookie(
        "access_token", token,  # cookie name and value (name must match authentication.py)
        httponly=True,          # JavaScript cannot read it (protects against XSS)
        samesite="Lax",         # not sent on most cross-site requests (CSRF protection)
        max_age=SESSION_HOURS * 3600,  # lifetime in seconds (hours x 3600)
        # secure=True,  # enable on HTTPS
    )

    # Send the reply. The browser saves the cookie and sends it back automatically.
    return response


# ------------------------------------------------------------------------------
# LOGOUT: POST /auth/logout
# ------------------------------------------------------------------------------

@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def logout(request):
    # Create a simple reply.
    response = Response({"message": "Logged out"})
    # Tell the browser to delete the cookie. With no cookie, the user is logged out.
    response.delete_cookie("access_token")
    return response


# ------------------------------------------------------------------------------
# ME: GET /auth/me   (the only protected view)
# ------------------------------------------------------------------------------

# GET = "read something". No body is needed; the cookie identifies the user.
@api_view(["GET"])
# Use OUR class: it reads the cookie and finds the user (authentication.py).
@authentication_classes([CookieJWTAuthentication])
# Only logged-in users may enter. If authentication found nobody, DRF replies 401
# and this function never runs.
@permission_classes([IsAuthenticated])
def me(request):
    # request.user was filled in by CookieJWTAuthentication.
    return Response(user_data(request.user))