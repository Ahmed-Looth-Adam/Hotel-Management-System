from django.db import models

class Hotel(models.Model):
    """Hotel location/property"""
    name = models.CharField(max_length=200)
    location = models.CharField(max_length=100)
    address = models.TextField()
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    star_rating = models.IntegerField(default=3)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} - {self.city}"


class RoomType(models.Model):
    """Room type/category"""
    name = models.CharField(max_length=100)
    capacity = models.IntegerField()
    description = models.TextField(blank=True)
    amenities = models.JSONField(default=list)  # List of amenities
    
    def __str__(self):
        return f"{self.name} (Capacity: {self.capacity})"


class Room(models.Model):
    """Individual room"""
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('cleaning', 'Cleaning'),
        ('out_of_service', 'Out of Service'),
    ]
    
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='rooms')
    room_type = models.ForeignKey(RoomType, on_delete=models.PROTECT, related_name='rooms')
    room_number = models.CharField(max_length=10)
    floor = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['hotel', 'floor', 'room_number']
        unique_together = ['hotel', 'room_number']
    
    def __str__(self):
        return f"{self.hotel.name} - Room {self.room_number}"


class RoomRate(models.Model):
    """Pricing for room types"""
    SEASON_CHOICES = [
        ('off_peak', 'Off-Peak'),
        ('peak', 'Peak Season'),
    ]
    
    room_type = models.ForeignKey(RoomType, on_delete=models.CASCADE, related_name='rates')
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='rates')
    season_type = models.CharField(max_length=20, choices=SEASON_CHOICES)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    valid_from = models.DateField()
    valid_to = models.DateField()
    
    class Meta:
        ordering = ['hotel', 'room_type', 'valid_from']
    
    def __str__(self):
        return f"{self.room_type.name} - {self.hotel.name} - £{self.price_per_night} ({self.season_type})"