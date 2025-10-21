# Edited By
# -> Ahmed Looth Adam, UWE ID: 24050761

from django.contrib import admin
from .models import Booking

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'room_number', 'check_in_date', 'check_out_date', 'status', 'total_price')
    list_filter = ('status', 'check_in_date', 'check_out_date')
    search_fields = ('user__username', 'room_number')