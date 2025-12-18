# Edited By
# -> Ahmed Looth Adam, UWE ID: 24050761

from rest_framework import viewsets, permissions
from .models import Booking
from .serializers import BookingSerializer, BookingListSerializer, BookingDetailSerializer
from .permissions import IsOwnerOrStaff

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaff]

    def get_serializer_class(self):
        if self.action == 'list':
            return BookingListSerializer
        if self.action == 'retrieve':
            return BookingDetailSerializer
        return BookingSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Booking.objects.all()
        return Booking.objects.filter(user=user)
