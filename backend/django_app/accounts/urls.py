# ==============================================================================
# accounts/urls.py   (read this block first)
# ==============================================================================
# What this file does:
#   It is a "phone book" for the accounts app. It connects a URL path to the
#   function (view) that should answer it.
#
# How a request finds its view (two files work together):
#
#   config/urls.py   ->  path("auth/", include("accounts.urls"))
#                        "Anything starting with auth/ -> look in accounts/urls.py"
#
#   accounts/urls.py ->  path("login", views.login)
#                        "The rest of the path is 'login' -> run views.login"
#
#   Put together:   /auth/ + login  =  /auth/login   ->   views.login()
#
# The full list our React api.js calls:
#
#   URL             view function      what it does
#   /auth/register  views.register     create an account
#   /auth/login     views.login        check password, set the cookie
#   /auth/logout    views.logout       delete the cookie
#   /auth/me        views.me           who is logged in?
#
# Note: the HTTP method (POST or GET) is NOT decided here. Each view declares
# it with @api_view(["POST"]) or @api_view(["GET"]) in views.py.
# ==============================================================================


# ------------------------------------------------------------------------------
# IMPORTS
# ------------------------------------------------------------------------------

# path -> the function that links one URL pattern to one view.
from django.urls import path

# "from . import views" means: from THIS folder (the dot means "here"),
# import the file views.py. It works because accounts/ contains views.py.
# (The same line failed in config/urls.py earlier, because the config/ folder
# has no views.py. The dot always refers to the folder the file is in.)
from . import views


# ------------------------------------------------------------------------------
# THE URL LIST
# ------------------------------------------------------------------------------

# Django looks for a variable with EXACTLY this name: urlpatterns.
# It is a list of path(...) items. Django checks them from top to bottom
# and uses the FIRST one that matches. If none match, the reply is 404.
urlpatterns = [
    # path(route, view)
    #   route -> the URL text to match (after the "auth/" prefix)
    #   view  -> the function to run. We write views.register, WITHOUT brackets:
    #            we hand over the function itself, and Django calls it later
    #            when a request arrives. (views.register() would run it now.)
    #
    # POST /auth/register -> create a new user
    path("register", views.register),

    # POST /auth/login -> verify credentials and set the login cookie
    path("login", views.login),

    # POST /auth/logout -> remove the login cookie
    path("logout", views.logout),

    # GET /auth/me -> return the currently logged-in user (protected)
    path("me", views.me),
]

# ------------------------------------------------------------------------------
# WHY THERE IS NO TRAILING SLASH (e.g. "login", not "login/")
# ------------------------------------------------------------------------------
# Django's default style is "login/" with a slash at the end. Our React api.js
# calls "/auth/login" WITHOUT the slash. If the route had a slash, Django would
# try to redirect /auth/login to /auth/login/, and a redirect cannot carry the
# body of a POST request. The request would fail.
# So the route text here must match exactly what the frontend sends.
#
# Mistakes to watch for:
#   - Writing path("login/", ...) here while api.js calls "/auth/login"  -> error
#   - Forgetting path("auth/", include("accounts.urls")) in config/urls.py -> 404
#   - Misspelling a view name (views.regester) -> AttributeError on startup