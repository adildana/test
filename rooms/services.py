from .models import Room
from bookings.models import Booking


def get_available_rooms(check_in, check_out):
    """Возвращает комнаты, свободные в указанном интервале дат."""
    booked_room_ids = Booking.objects.filter(
        status=Booking.STATUS_ACTIVE
    ).filter(
        check_in__lt=check_out,
        check_out__gt=check_in
    ).values_list('room_id', flat=True).distinct()
    return Room.objects.exclude(id__in=booked_room_ids)
