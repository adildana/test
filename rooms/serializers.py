from rest_framework import serializers
from .models import Room


class RoomSerializer(serializers.ModelSerializer):
    currency = serializers.CharField(default='RUB', read_only=True)

    class Meta:
        model = Room
        fields = ['id', 'name', 'price_per_day', 'currency', 'capacity', 'created_at', 'updated_at']
