from django.contrib import admin
from .models import Room


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'price_per_day', 'currency', 'capacity', 'created_at']
    list_filter = ['capacity', 'currency']
    search_fields = ['name']
    list_editable = ['price_per_day', 'currency', 'capacity']
