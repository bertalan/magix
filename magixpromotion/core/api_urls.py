from django.urls import path

from .api import site_settings_view

urlpatterns = [
    path("", site_settings_view, name="site-settings-api"),
]
