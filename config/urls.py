"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls.i18n import i18n_patterns

from .views import IndexView

urlpatterns = [
    path('i18n/', include('django.conf.urls.i18n')),
    # API остаётся без префикса языка
    path('api/', include('config.api_urls')),
]

urlpatterns += i18n_patterns(
    path('', IndexView.as_view(), name='index'),
    path('admin/', admin.site.urls),
)

# Serve static and media files in DEBUG mode
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
