from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.RoomViewSet, basename='room')

urlpatterns = [
    path('available/', views.AvailableRoomsView.as_view(), name='available-rooms'),
    path('', include(router.urls)),
]
