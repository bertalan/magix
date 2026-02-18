from django.conf import settings
from django.conf.urls.i18n import i18n_patterns
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from wagtail import urls as wagtail_urls
from wagtail.admin import urls as wagtailadmin_urls
from wagtail.api.v2.router import WagtailAPIRouter
from wagtail.api.v2.views import PagesAPIViewSet
from wagtail.contrib.sitemaps.views import sitemap as wagtail_sitemap
from wagtail.documents import urls as wagtaildocs_urls
from wagtail.documents.api.v2.views import DocumentsAPIViewSet
from wagtail.images.api.v2.views import ImagesAPIViewSet

from artists.api import ArtistAPIViewSet
from booking.views import booking_submit_api
from core.search import autocomplete_api, search_api
from events.api import EventAPIViewSet
from navigation.api import menu_api

# Wagtail API v2 router
api_router = WagtailAPIRouter("wagtailapi")
api_router.register_endpoint("pages", PagesAPIViewSet)
api_router.register_endpoint("images", ImagesAPIViewSet)
api_router.register_endpoint("documents", DocumentsAPIViewSet)
api_router.register_endpoint("artists", ArtistAPIViewSet)
api_router.register_endpoint("events", EventAPIViewSet)

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("admin/", include(wagtailadmin_urls)),
    path("documents/", include(wagtaildocs_urls)),
    # API
    path("api/v2/", api_router.urls),
    path("api/v2/site-settings/", include("core.api_urls")),
    path("api/v2/menu/<str:location>/", menu_api, name="menu_api"),
    # Search API
    path("api/v2/search/autocomplete/", autocomplete_api, name="autocomplete_api"),
    path("api/v2/search/", search_api, name="search_api"),
    # Booking API
    path("api/v2/booking/submit/", booking_submit_api, name="booking_submit_api"),
    # SEO
    path("sitemap.xml", wagtail_sitemap),
    # EPK download protetto
    path("press/", include("core.epk_urls")),
]

# URL localizzate (le pagine Wagtail rispondono sotto prefisso lingua)
urlpatterns += i18n_patterns(
    path("", include(wagtail_urls)),
)

if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [path("__debug__/", include(debug_toolbar.urls))] + urlpatterns
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
