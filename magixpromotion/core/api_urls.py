from django.urls import path

from .api import epk_list_view, site_settings_view

urlpatterns = [
    path("", site_settings_view, name="site-settings-api"),
    path("epk/", epk_list_view, name="epk-list-api"),
]
