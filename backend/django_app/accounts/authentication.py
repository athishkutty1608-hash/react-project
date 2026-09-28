# ==============================================================================
# accounts/authentication.py   (read this block first)
# ==============================================================================
# What this file does:
#   It teaches Django REST Framework (DRF) how to answer the question
#   "WHO is making this request?" by reading our login cookie.
#
# Where it is used:
#   In views.py, the protected endpoint `me` says:
#       @authentication_classes([CookieJWTAuthentication])
#       @permission_classes([IsAuthenticated])
#   DRF then runs THIS class before the view. If it finds a valid user, the view
#   runs. If not, DRF sends back a 401 error and the view never runs.
#
# The flow, step by step:
#   1. Browser sends a request. The login cookie "access_token" travels with it.
#   2. authenticate() reads the cookie.
#   3. It verifies the JWT (signature + expiry) using our SECRET_KEY.
#   4. It reads the user's id from the token and loads that user from the database.
#   5. It returns (user, None). DRF stores the user in request.user.
#
# Three possible outcomes of authenticate():
#   return None              -> "no credentials here" (user is anonymous)
#   raise AuthenticationFailed -> "credentials were sent but they are BAD" (401)
#   return (user, None)      -> "this request belongs to this user" (success)
#
# FastAPI comparison: this class does the same job as get_current_user() in
# fastapi_app/main.py.
# ==============================================================================


# ------------------------------------------------------------------------------
# IMPORTS
# ------------------------------------------------------------------------------

# jwt (the PyJWT package) -> verifies JWT tokens.
# A JWT is a signed piece of text that says "this is user 5, valid until 8pm".
# Nobody can change it without knowing our secret key.
import jwt

# settings -> gives access to everything in config/settings.py.
# We need settings.SECRET_KEY, the same secret used to SIGN the token at login.
# (Always import settings from django.conf, never from the settings file directly.)
from django.conf import settings

# User -> Django's built-in user model. Its table is auth_user in the database.
from django.contrib.auth.models import User

# BaseAuthentication -> the parent class every DRF authentication class extends.
# It defines the two methods DRF expects: authenticate() and authenticate_header().
from rest_framework.authentication import BaseAuthentication

# AuthenticationFailed -> an error DRF turns into a 401 reply automatically:
#   { "detail": "the message we pass in" }
# That is the exact format our React api.js interceptor reads.
from rest_framework.exceptions import AuthenticationFailed


# ------------------------------------------------------------------------------
# THE AUTHENTICATION CLASS
# ------------------------------------------------------------------------------

# Our own class. It inherits from BaseAuthentication, so DRF accepts it in
# @authentication_classes([...]).
class CookieJWTAuthentication(BaseAuthentication):
    # A docstring: a short explanation of what the class is for.
    """Reads the login token from the httpOnly cookie."""

    # DRF calls this method automatically on every request that uses this class.
    # "self"    -> the object itself (required in every class method)
    # "request" -> the incoming request (headers, cookies, body...)
    def authenticate(self, request):
        # request.COOKIES is a dictionary of all cookies the browser sent.
        # .get("access_token") returns the cookie's value, or None if it is missing.
        # The name "access_token" must match the cookie name used in the login view.
        token = request.COOKIES.get("access_token")

        # No cookie means the user never logged in (or has logged out).
        if not token:
            # Returning None says: "I found no credentials, so I did not
            # authenticate anyone." The user stays anonymous, and because the
            # view also requires IsAuthenticated, DRF answers with a 401.
            return None  # not logged in

        # try/except: run the code in "try". If it raises an error of the type
        # named in "except", jump to the except block instead of crashing.
        try:
            # Verify the token. jwt.decode needs three things:
            #   token                   -> the text we got from the cookie
            #   settings.SECRET_KEY     -> the secret that checks the signature
            #   algorithms=["HS256"]    -> the signing methods we ACCEPT.
            #                              It must match the algorithm used at login.
            # decode checks TWO things for us:
            #   1. the signature is valid (the token was not forged or edited)
            #   2. the "exp" time has not passed (the token is not expired)
            # If everything is fine, it returns the payload dictionary we stored
            # at login, for example {"sub": "5", "exp": 1780000000}.
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except jwt.PyJWTError:
            # PyJWTError is the parent of all PyJWT errors: fake token, edited
            # token, wrong secret, expired token. We treat them all the same.
            # Raising AuthenticationFailed makes DRF reply 401 with:
            #   { "detail": "Invalid or expired session" }
            raise AuthenticationFailed("Invalid or expired session")

        # The token is genuine. Now find the person it belongs to.
        try:
            # payload["sub"] ("subject") is the user's id, saved as text at login.
            # pk means "primary key" (the id column). Django accepts "5" for pk.
            # .get() returns exactly one user, or raises User.DoesNotExist.
            user = User.objects.get(pk=payload["sub"])
        except User.DoesNotExist:
            # The token is valid, but that user was deleted after it was issued.
            raise AuthenticationFailed("User not found")

        # Success. DRF expects a TUPLE of two values: (user, auth).
        #   user -> becomes request.user in the view
        #   None -> becomes request.auth; we have nothing extra to store there
        return (user, None)

    # DRF calls this method when authentication FAILS, to build the
    # "WWW-Authenticate" header of the error reply.
    def authenticate_header(self, request):
        # The text itself does not matter much; what matters is that we return
        # SOMETHING. Rule inside DRF:
        #   header returned  -> failed authentication is answered with 401
        #   nothing returned -> DRF changes the answer to 403
        # Our React app expects 401 for "not logged in", so we return a word.
        return "Cookie"  # makes DRF answer 401 (not 403) when unauthenticated