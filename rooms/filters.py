import django_filters
from .models import Room


class RoomFilter(django_filters.FilterSet):
    price_per_day_min = django_filters.NumberFilter(field_name='price_per_day', lookup_expr='gte')
    price_per_day_max = django_filters.NumberFilter(field_name='price_per_day', lookup_expr='lte')
    capacity_min = django_filters.NumberFilter(field_name='capacity', lookup_expr='gte')
    capacity_max = django_filters.NumberFilter(field_name='capacity', lookup_expr='lte')

    class Meta:
        model = Room
        fields = ['price_per_day', 'capacity']
