from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter

from .models import Room
from .serializers import RoomSerializer
from .filters import RoomFilter
from .services import get_available_rooms


class RoomViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для просмотра комнат (публичный доступ)."""
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = RoomFilter
    ordering_fields = ['price_per_day', 'capacity']
    ordering = ['name']


class AvailableRoomsView(APIView):
    """Поиск свободных комнат в заданном временном интервале."""
    def get(self, request):
        check_in = request.query_params.get('check_in')
        check_out = request.query_params.get('check_out')
        if not check_in or not check_out:
            return Response(
                {'error': 'Параметры check_in и check_out обязательны.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            from datetime import datetime
            check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
            check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Даты должны быть в формате YYYY-MM-DD.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if check_out_date <= check_in_date:
            return Response(
                {'error': 'Дата выезда должна быть позже даты заезда.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        rooms = get_available_rooms(check_in_date, check_out_date)
        serializer = RoomSerializer(rooms, many=True)
        return Response(serializer.data)
