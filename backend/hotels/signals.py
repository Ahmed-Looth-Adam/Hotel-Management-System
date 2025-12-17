from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Hotel, Gallery


@receiver(post_save, sender=Hotel)
def create_hotel_gallery(sender, instance, created, **kwargs):
    """Auto-create a hotel gallery when a new hotel is created"""
    if created:
        # Check if hotel gallery already exists (shouldn't, but just in case)
        if not Gallery.objects.filter(hotel=instance, gallery_type='hotel').exists():
            Gallery.objects.create(
                hotel=instance,
                name=f"{instance.name} Gallery",
                description=f"Photo gallery for {instance.name}",
                gallery_type='hotel'
            )
