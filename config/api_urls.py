"""
API URL configuration.
"""
from django.urls import path, include

urlpatterns = [
    path('rooms/', include('rooms.urls')),
    path('bookings/', include('bookings.urls')),
    path('auth/', include('config.auth_urls')),
]
