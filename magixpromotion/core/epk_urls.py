from django.urls import path

from . import views

urlpatterns = [
    path(
        "epk/<int:epk_id>/download/<str:asset_type>/",
        views.epk_download,
        name="epk_download",
    ),
]
