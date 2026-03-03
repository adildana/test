from django.contrib import admin
from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['room', 'user', 'check_in', 'check_out', 'status', 'created_at']
    list_filter = ['status', 'check_in', 'check_out']
    search_fields = ['room__name', 'user__username']
    list_editable = ['status']
    raw_id_fields = ['room', 'user', 'cancelled_by']
    readonly_fields = ['created_at', 'updated_at']
