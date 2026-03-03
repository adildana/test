from rest_framework import serializers
from .models import Booking


class BookingSerializer(serializers.ModelSerializer):
    room_name = serializers.CharField(source='room.name', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'room', 'room_name', 'user', 'check_in', 'check_out',
            'status', 'cancelled_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'status', 'cancelled_by', 'created_at', 'updated_at']


class BookingCreateSerializer(serializers.Serializer):
    room_id = serializers.IntegerField()
    check_in = serializers.DateField()
    check_out = serializers.DateField()

    def validate(self, data):
        if data['check_out'] <= data['check_in']:
            raise serializers.ValidationError({
                'check_out': 'Дата выезда должна быть позже даты заезда.'
            })
        return data
