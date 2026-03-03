from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Booking
from .serializers import BookingSerializer, BookingCreateSerializer
from rooms.models import Room
from rooms.services import get_available_rooms


class BookingViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet
):
    """ViewSet для бронирований."""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return Booking.objects.all()
        return Booking.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return BookingCreateSerializer
        return BookingSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        room_id = serializer.validated_data['room_id']
        check_in = serializer.validated_data['check_in']
        check_out = serializer.validated_data['check_out']
        try:
            room = Room.objects.get(pk=room_id)
        except Room.DoesNotExist:
            return Response(
                {'error': 'Комната не найдена.'},
                status=status.HTTP_404_NOT_FOUND
            )
        available = get_available_rooms(check_in, check_out)
        if room not in available:
            return Response(
                {'error': 'Комната занята на указанные даты.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        booking = Booking.objects.create(
            room=room,
            user=request.user,
            check_in=check_in,
            check_out=check_out
        )
        return Response(
            BookingSerializer(booking).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        if booking.status == Booking.STATUS_CANCELLED:
            return Response(
                {'error': 'Бронь уже отменена.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not request.user.is_superuser and booking.user != request.user:
            return Response(
                {'error': 'Нет прав на отмену этой брони.'},
                status=status.HTTP_403_FORBIDDEN
            )
        booking.status = Booking.STATUS_CANCELLED
        booking.cancelled_by = request.user
        booking.save()
        return Response(BookingSerializer(booking).data)
