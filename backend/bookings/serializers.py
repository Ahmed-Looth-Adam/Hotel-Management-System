# Edited By
# -> Ahmed Looth Adam, UWE ID: 24050761

from rest_framework import serializers
from .models import Booking

class BookingSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Booking
        fields = '__all__'
