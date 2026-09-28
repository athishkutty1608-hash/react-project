# ==============================================================================
# config/urls.py   (read this block first)
# ==============================================================================
# What this file does:
#   It is the ROOT URL file of the whole Django project: the first place Django
#   looks when a request arrives. It does not answer requests itself. It only
#   decides which part of the project should handle the URL.
#
#   Think of it as the reception desk of a building:
#     "Starts with admin/ ?  -> go to the admin panel"
#     "Starts with auth/  ?  -> go to the accounts app"
#     "Anything else      ?  -> 404 Not Found"
#
# How it works together with accounts/urls.py:
#
#   config/urls.py   (this file)  matches the START of the URL: "auth/"
#   accounts/urls.py              matches the REST of the URL:  "login"
#
#   /auth/login  =  "auth/" (this file)  +  "login" (accounts/urls.py)
#                   -> views.login runs
#
# Full map of the project:
#   /admin/          Django's built-in admin panel
#   /auth/register   accounts.views.register
#   /auth/login      accounts.views.login
#   /auth/logout     accounts.views.logout
#   /auth/me         accounts.views.me
#   anything else    404 (for example http://localhost:8001/ shows a 404,
#                    which is normal because an API has no home page)
# ==============================================================================


# ------------------------------------------------------------------------------
# IMPORTS
# ------------------------------------------------------------------------------

# admin -> Django's ready-made admin website. It lets you see and edit database
# data (like users) in the browser. It is included in every new project.
from django.contrib import admin

# path    -> links one URL pattern to a destination.
# include -> "the rest of the URL is handled by ANOTHER urls.py file".
#            It lets each app keep its own URLs, so this file stays small.
from django.urls import include, path


# ------------------------------------------------------------------------------
# THE URL LIST
# ------------------------------------------------------------------------------

# Django looks for a variable with EXACTLY this name: urlpatterns.
# It is a list. Django checks the items from top to bottom and uses the FIRST
# one that matches. If none match, the reply is 404.
urlpatterns = [
    # Any URL starting with "admin/" goes to Django's admin site.
    # admin.site.urls is a ready-made group of URLs (login page, user list...).
    # To use it, create an admin account in the terminal:
    #     python manage.py createsuperuser
    # then open http://localhost:8001/admin/
    path("admin/", admin.site.urls),

    # Any URL starting with "auth/" is passed to accounts/urls.py.
    #   "auth/"                  -> the prefix Django removes from the URL
    #   include("accounts.urls") -> "look inside accounts/urls.py for the rest"
    # The text "accounts.urls" is the Python path to that file:
    #     accounts (the app folder) . urls (the file urls.py)
    # Because of this line, every path in accounts/urls.py automatically gets
    # "auth/" in front of it.
    path("auth/", include("accounts.urls")),
]

# ------------------------------------------------------------------------------
# MISTAKES TO WATCH FOR
# ------------------------------------------------------------------------------
# 1. Writing "from . import views" in THIS file.
#    That line looks for config/views.py, which does not exist, and Django stops
#    with: ImportError: cannot import name 'views' from 'config'.
#    This file only needs include(...). The views live in the accounts app.
#
# 2. Forgetting the "auth/" line.
#    Then /auth/login gives 404 and the React app cannot log in.
#
# 3. Changing "auth/" to something else (for example "api/").
#    Then the frontend must change too, because api.js calls /auth/login.
#
# 4. Slash rules. The prefix "auth/" ENDS with a slash, while the routes inside
#    accounts/urls.py have none ("login"). Together they make /auth/login, which
#    is exactly what api.js sends. Do not add a slash to the inner routes.