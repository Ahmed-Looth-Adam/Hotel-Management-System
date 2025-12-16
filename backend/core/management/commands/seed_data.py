# Edited By
# -> Ismail Wasiu Abdul Samad, UWE ID: 24050765

"""
Management command to seed the database with comprehensive test data.
Run with: python manage.py seed_data
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from decimal import Decimal
from datetime import date, timedelta
import random

from authentication.models import User
from hotels.models import (
    Hotel, Room, RoomType, RoomView, RoomRate,
    AmenityCategory, Amenity, RoomAmenity,
    RoomTypePricing, ViewPricing, SeasonalPricing,
    HotelPolicy, AncillaryService
)
from bookings.models import Booking
from payments.models import Payment, Invoice, BookingServiceCharge


class Command(BaseCommand):
    help = 'Seed database with comprehensive test data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        self.stdout.write('Starting database seeding...')

        with transaction.atomic():
            if options['clear']:
                self.clear_data()

            self.create_users()
            self.create_hotels()
            self.create_room_types()
            self.create_room_views()
            self.create_amenities()
            self.create_rooms()
            self.create_ancillary_services()
            self.create_pricing()
            self.create_policies()
            self.create_bookings()
            self.create_payments()

        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))

    def clear_data(self):
        """Clear existing data in proper order"""
        self.stdout.write('Clearing existing data...')
        Payment.objects.all().delete()
        BookingServiceCharge.objects.all().delete()
        Invoice.objects.all().delete()
        Booking.objects.all().delete()
        RoomAmenity.objects.all().delete()
        Room.objects.all().delete()
        Amenity.objects.all().delete()
        AmenityCategory.objects.all().delete()
        RoomView.objects.all().delete()
        RoomType.objects.all().delete()
        AncillaryService.objects.all().delete()
        RoomTypePricing.objects.all().delete()
        ViewPricing.objects.all().delete()
        SeasonalPricing.objects.all().delete()
        HotelPolicy.objects.all().delete()
        Hotel.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

    def create_users(self):
        """Create test users with different roles"""
        self.stdout.write('Creating users...')

        # Admin user
        self.admin, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@hotelmanagement.com',
                'first_name': 'System',
                'last_name': 'Administrator',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        self.admin.set_password('admin@123')
        self.admin.save()

        # Manager user
        self.manager, _ = User.objects.get_or_create(
            username='manager',
            defaults={
                'email': 'manager@hotelmanagement.com',
                'first_name': 'Hotel',
                'last_name': 'Manager',
                'role': 'manager',
                'is_staff': True,
            }
        )
        self.manager.set_password('manager@123')
        self.manager.save()

        # Staff user
        self.staff, _ = User.objects.get_or_create(
            username='staff',
            defaults={
                'email': 'staff@hotelmanagement.com',
                'first_name': 'Front Desk',
                'last_name': 'Staff',
                'role': 'staff',
            }
        )
        self.staff.set_password('staff@123')
        self.staff.save()

        # Guest users with diverse demographics
        self.guests = []
        guest_data = [
            {'username': 'john.doe', 'first_name': 'John', 'last_name': 'Doe', 'email': 'john.doe@example.com', 'country': 'United Kingdom'},
            {'username': 'jane.smith', 'first_name': 'Jane', 'last_name': 'Smith', 'email': 'jane.smith@example.com', 'country': 'United States'},
            {'username': 'pierre.martin', 'first_name': 'Pierre', 'last_name': 'Martin', 'email': 'pierre.martin@example.com', 'country': 'France'},
            {'username': 'hans.mueller', 'first_name': 'Hans', 'last_name': 'Mueller', 'email': 'hans.mueller@example.com', 'country': 'Germany'},
            {'username': 'yuki.tanaka', 'first_name': 'Yuki', 'last_name': 'Tanaka', 'email': 'yuki.tanaka@example.com', 'country': 'Japan'},
            {'username': 'maria.garcia', 'first_name': 'Maria', 'last_name': 'Garcia', 'email': 'maria.garcia@example.com', 'country': 'Spain'},
            {'username': 'ahmed.hassan', 'first_name': 'Ahmed', 'last_name': 'Hassan', 'email': 'ahmed.hassan@example.com', 'country': 'Egypt'},
            {'username': 'chen.wei', 'first_name': 'Chen', 'last_name': 'Wei', 'email': 'chen.wei@example.com', 'country': 'China'},
            {'username': 'emma.wilson', 'first_name': 'Emma', 'last_name': 'Wilson', 'email': 'emma.wilson@example.com', 'country': 'Australia'},
            {'username': 'carlos.silva', 'first_name': 'Carlos', 'last_name': 'Silva', 'email': 'carlos.silva@example.com', 'country': 'Brazil'},
        ]

        for data in guest_data:
            guest, _ = User.objects.get_or_create(
                username=data['username'],
                defaults={
                    'email': data['email'],
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'role': 'guest',
                    'country': data['country'],
                }
            )
            guest.set_password('guest@123')
            guest.save()
            self.guests.append(guest)

        self.stdout.write(f'  Created {len(self.guests) + 3} users')

    def create_hotels(self):
        """Create test hotels"""
        self.stdout.write('Creating hotels...')

        hotel_data = [
            {
                'name': 'Grand Plaza Hotel',
                'description': 'A luxurious 5-star hotel in the heart of London, offering world-class amenities and exceptional service.',
                'location': 'Central London',
                'address': '123 Oxford Street',
                'city': 'London',
                'country': 'United Kingdom',
                'star_rating': 5,
                'room_capacity': 200,
            },
            {
                'name': 'Seaside Resort',
                'description': 'Beautiful beachfront resort with stunning ocean views and direct beach access.',
                'location': 'Brighton Beach',
                'address': '45 Marine Parade',
                'city': 'Brighton',
                'country': 'United Kingdom',
                'star_rating': 4,
                'room_capacity': 150,
            },
            {
                'name': 'Mountain Lodge',
                'description': 'Cozy mountain retreat perfect for hiking enthusiasts and nature lovers.',
                'location': 'Lake District',
                'address': '78 Windermere Road',
                'city': 'Windermere',
                'country': 'United Kingdom',
                'star_rating': 3,
                'room_capacity': 50,
            },
        ]

        self.hotels = []
        for data in hotel_data:
            hotel, _ = Hotel.objects.get_or_create(
                name=data['name'],
                defaults={**data, 'manager': self.manager, 'is_active': True}
            )
            self.hotels.append(hotel)

        self.stdout.write(f'  Created {len(self.hotels)} hotels')

    def create_room_types(self):
        """Create room types"""
        self.stdout.write('Creating room types...')

        room_type_data = [
            {'name': 'Single', 'capacity': 1, 'description': 'Comfortable room for single occupancy'},
            {'name': 'Double', 'capacity': 2, 'description': 'Spacious room with double bed'},
            {'name': 'Twin', 'capacity': 2, 'description': 'Room with two single beds'},
            {'name': 'Suite', 'capacity': 4, 'description': 'Luxurious suite with separate living area'},
            {'name': 'Family', 'capacity': 5, 'description': 'Large room perfect for families'},
            {'name': 'Penthouse', 'capacity': 6, 'description': 'Top-floor luxury accommodation'},
        ]

        self.room_types = []
        for data in room_type_data:
            rt, _ = RoomType.objects.get_or_create(
                name=data['name'],
                defaults=data
            )
            self.room_types.append(rt)

        self.stdout.write(f'  Created {len(self.room_types)} room types')

    def create_room_views(self):
        """Create room views for each hotel"""
        self.stdout.write('Creating room views...')

        view_data = [
            {'name': 'City View', 'description': 'Panoramic city skyline views'},
            {'name': 'Garden View', 'description': 'Peaceful garden views'},
            {'name': 'Sea View', 'description': 'Beautiful ocean views'},
            {'name': 'Pool View', 'description': 'Views of the swimming pool area'},
            {'name': 'Mountain View', 'description': 'Stunning mountain scenery'},
        ]

        self.room_views = []
        for hotel in self.hotels:
            for data in view_data:
                rv, _ = RoomView.objects.get_or_create(
                    hotel=hotel,
                    name=data['name'],
                    defaults={'description': data['description'], 'is_active': True}
                )
                self.room_views.append(rv)

        self.stdout.write(f'  Created {len(self.room_views)} room views')

    def create_amenities(self):
        """Create amenity categories and amenities"""
        self.stdout.write('Creating amenities...')

        amenity_categories = [
            {'name': 'Room Essentials', 'description': 'Basic room amenities'},
            {'name': 'Bathroom', 'description': 'Bathroom amenities'},
            {'name': 'Entertainment', 'description': 'In-room entertainment'},
            {'name': 'Comfort', 'description': 'Comfort features'},
        ]

        amenities_by_category = {
            'Room Essentials': [
                {'name': 'WiFi', 'icon': 'wifi'},
                {'name': 'Air Conditioning', 'icon': 'ac_unit'},
                {'name': 'Mini Bar', 'icon': 'local_bar'},
                {'name': 'Safe', 'icon': 'lock'},
                {'name': 'Desk', 'icon': 'desk'},
            ],
            'Bathroom': [
                {'name': 'Private Bathroom', 'icon': 'bathroom'},
                {'name': 'Bathtub', 'icon': 'bathtub'},
                {'name': 'Shower', 'icon': 'shower'},
                {'name': 'Hair Dryer', 'icon': 'hair_dryer'},
                {'name': 'Toiletries', 'icon': 'soap'},
            ],
            'Entertainment': [
                {'name': 'Flat-screen TV', 'icon': 'tv'},
                {'name': 'Cable Channels', 'icon': 'live_tv'},
                {'name': 'Streaming Services', 'icon': 'stream'},
            ],
            'Comfort': [
                {'name': 'Balcony', 'icon': 'balcony'},
                {'name': 'Coffee Machine', 'icon': 'coffee'},
                {'name': 'Iron', 'icon': 'iron'},
                {'name': 'Blackout Curtains', 'icon': 'curtains'},
            ],
        }

        self.amenities = []
        for hotel in self.hotels:
            for cat_data in amenity_categories:
                category, _ = AmenityCategory.objects.get_or_create(
                    hotel=hotel,
                    name=cat_data['name'],
                    defaults={'description': cat_data['description'], 'is_active': True}
                )

                for amenity_data in amenities_by_category.get(cat_data['name'], []):
                    amenity, _ = Amenity.objects.get_or_create(
                        hotel=hotel,
                        category=category,
                        name=amenity_data['name'],
                        defaults={'icon': amenity_data['icon'], 'is_active': True}
                    )
                    self.amenities.append(amenity)

        self.stdout.write(f'  Created {len(self.amenities)} amenities')

    def create_rooms(self):
        """Create rooms for each hotel"""
        self.stdout.write('Creating rooms...')

        room_configs = [
            {'floor': 1, 'room_type_category': 'standard', 'max_occupancy': 2, 'bed_size': 'double', 'bed_count': 1},
            {'floor': 1, 'room_type_category': 'standard', 'max_occupancy': 2, 'bed_size': 'twin', 'bed_count': 2},
            {'floor': 2, 'room_type_category': 'deluxe', 'max_occupancy': 3, 'bed_size': 'queen', 'bed_count': 1},
            {'floor': 2, 'room_type_category': 'deluxe', 'max_occupancy': 4, 'bed_size': 'king', 'bed_count': 1},
            {'floor': 3, 'room_type_category': 'suite', 'max_occupancy': 4, 'bed_size': 'king', 'bed_count': 2},
            {'floor': 3, 'room_type_category': 'suite', 'max_occupancy': 6, 'bed_size': 'king', 'bed_count': 2},
        ]

        self.rooms = []
        for hotel in self.hotels:
            hotel_views = RoomView.objects.filter(hotel=hotel)
            room_types = self.room_types

            for i, config in enumerate(room_configs, start=1):
                room_number = f"{config['floor']}{str(i).zfill(2)}"
                room, created = Room.objects.get_or_create(
                    hotel=hotel,
                    room_number=room_number,
                    defaults={
                        'floor': config['floor'],
                        'room_type': random.choice(room_types),
                        'room_type_category': config['room_type_category'],
                        'max_occupancy': config['max_occupancy'],
                        'bed_size': config['bed_size'],
                        'bed_count': config['bed_count'],
                        'view': random.choice(list(hotel_views)) if hotel_views.exists() else None,
                        'is_available': True,
                        'is_active': True,
                        'status': 'available',
                    }
                )
                self.rooms.append(room)

                # Add some amenities to each room
                if created:
                    hotel_amenities = Amenity.objects.filter(hotel=hotel)
                    selected_amenities = random.sample(list(hotel_amenities), min(8, len(hotel_amenities)))
                    for amenity in selected_amenities:
                        RoomAmenity.objects.get_or_create(room=room, amenity=amenity)

        self.stdout.write(f'  Created {len(self.rooms)} rooms')

    def create_ancillary_services(self):
        """Create ancillary services as per coursework requirements"""
        self.stdout.write('Creating ancillary services...')

        services_data = [
            {
                'name': 'Airport Transfer',
                'service_type': 'airport_transfer',
                'description': 'Private car transfer to/from airport',
                'price': Decimal('50.00'),
                'pricing_type': 'per_booking',
            },
            {
                'name': 'Breakfast',
                'service_type': 'breakfast',
                'description': 'Full English breakfast buffet',
                'price': Decimal('20.00'),
                'pricing_type': 'per_person_per_day',
            },
            {
                'name': 'Spa Access',
                'service_type': 'spa',
                'description': 'Full day access to spa facilities',
                'price': Decimal('35.00'),
                'pricing_type': 'per_person',
            },
            {
                'name': 'Late Checkout',
                'service_type': 'late_checkout',
                'description': 'Extend checkout until 2pm',
                'price': Decimal('40.00'),
                'pricing_type': 'per_booking',
            },
            {
                'name': 'Room Service',
                'service_type': 'room_service',
                'description': '24-hour in-room dining',
                'price': Decimal('15.00'),
                'pricing_type': 'per_booking',
            },
            {
                'name': 'Parking',
                'service_type': 'parking',
                'description': 'Secure underground parking',
                'price': Decimal('25.00'),
                'pricing_type': 'per_day',
            },
        ]

        self.ancillary_services = []
        for hotel in self.hotels:
            for data in services_data:
                service, _ = AncillaryService.objects.get_or_create(
                    hotel=hotel,
                    service_type=data['service_type'],
                    defaults={
                        'name': data['name'],
                        'description': data['description'],
                        'price': data['price'],
                        'pricing_type': data['pricing_type'],
                        'is_active': True,
                    }
                )
                self.ancillary_services.append(service)

        self.stdout.write(f'  Created {len(self.ancillary_services)} ancillary services')

    def create_pricing(self):
        """Create pricing configurations"""
        self.stdout.write('Creating pricing configurations...')

        # Room type pricing
        room_type_prices = {
            'standard': Decimal('100.00'),
            'deluxe': Decimal('180.00'),
            'suite': Decimal('320.00'),
        }

        for hotel in self.hotels:
            for room_type, price in room_type_prices.items():
                RoomTypePricing.objects.get_or_create(
                    hotel=hotel,
                    room_type=room_type,
                    defaults={'base_price': price, 'is_active': True}
                )

            # View pricing modifiers
            for view in RoomView.objects.filter(hotel=hotel):
                ViewPricing.objects.get_or_create(
                    hotel=hotel,
                    view=view,
                    defaults={
                        'modifier_type': 'percentage',
                        'modifier_value': Decimal(str(random.randint(5, 25))),
                        'is_active': True,
                    }
                )

            # Seasonal pricing
            seasons = [
                {'season_name': 'Peak Summer', 'start_date': date(2025, 6, 1), 'end_date': date(2025, 8, 31), 'modifier_value': Decimal('30.00')},
                {'season_name': 'Christmas', 'start_date': date(2025, 12, 20), 'end_date': date(2026, 1, 5), 'modifier_value': Decimal('50.00')},
                {'season_name': 'Easter', 'start_date': date(2025, 4, 10), 'end_date': date(2025, 4, 25), 'modifier_value': Decimal('20.00')},
            ]

            for season in seasons:
                SeasonalPricing.objects.get_or_create(
                    hotel=hotel,
                    season_name=season['season_name'],
                    defaults={
                        'start_date': season['start_date'],
                        'end_date': season['end_date'],
                        'modifier_type': 'percentage',
                        'modifier_value': season['modifier_value'],
                        'is_active': True,
                    }
                )

        self.stdout.write('  Created pricing configurations')

    def create_policies(self):
        """Create hotel policies"""
        self.stdout.write('Creating hotel policies...')

        policies = [
            {
                'policy_type': 'cancellation',
                'title': 'Cancellation Policy',
                'description': 'Free cancellation up to 14 days before check-in. 50% fee for cancellations 3-14 days before. 100% fee for cancellations within 72 hours or no-show.',
            },
            {
                'policy_type': 'check_in_out',
                'title': 'Check-in/Check-out Times',
                'description': 'Check-in: 3:00 PM. Check-out: 11:00 AM. Early check-in and late checkout subject to availability and additional charges.',
            },
            {
                'policy_type': 'payment',
                'title': 'Payment Policy',
                'description': 'Full payment required at time of booking. We accept all major credit cards, debit cards, and bank transfers.',
            },
            {
                'policy_type': 'general',
                'title': 'House Rules',
                'description': 'No smoking in rooms. Pets allowed in designated rooms only (additional fee applies). Quiet hours: 10 PM - 7 AM.',
            },
        ]

        for hotel in self.hotels:
            for policy in policies:
                HotelPolicy.objects.get_or_create(
                    hotel=hotel,
                    policy_type=policy['policy_type'],
                    defaults={
                        'title': policy['title'],
                        'description': policy['description'],
                        'is_active': True,
                    }
                )

        self.stdout.write('  Created hotel policies')

    def create_bookings(self):
        """Create sample bookings"""
        self.stdout.write('Creating bookings...')

        # Get base prices for room types
        room_type_prices = {
            'standard': Decimal('100.00'),
            'deluxe': Decimal('180.00'),
            'suite': Decimal('320.00'),
            'superior': Decimal('140.00'),
            'family': Decimal('250.00'),
        }

        self.bookings = []
        for i in range(30):
            user = random.choice(self.guests)
            room = random.choice(self.rooms)

            # Create bookings across different time periods
            days_offset = random.randint(-60, 60)
            check_in = date.today() + timedelta(days=days_offset)
            nights = random.randint(1, 7)
            check_out = check_in + timedelta(days=nights)

            # Determine status based on dates
            if check_out < date.today():
                booking_status = random.choice(['checked_out', 'cancelled'])
            elif check_in <= date.today() <= check_out:
                booking_status = 'checked_in'
            else:
                booking_status = random.choice(['confirmed', 'pending', 'cancelled'])

            # Calculate total price based on room type
            price_per_night = room_type_prices.get(room.room_type_category, Decimal('100.00'))
            total_price = price_per_night * nights

            booking, created = Booking.objects.get_or_create(
                user=user,
                room=room,
                check_in_date=check_in,
                defaults={
                    'hotel': room.hotel,
                    'room_number': room.room_number,
                    'check_out_date': check_out,
                    'status': booking_status,
                    'total_price': total_price,
                    'guests_count': random.randint(1, room.max_occupancy),
                    'special_requests': random.choice(['', 'High floor please', 'Extra pillows', 'Late check-in', 'Anniversary celebration']),
                }
            )
            if created:
                self.bookings.append(booking)

        self.stdout.write(f'  Created {len(self.bookings)} bookings')

    def create_payments(self):
        """Create payments for confirmed/completed bookings"""
        self.stdout.write('Creating payments...')

        payment_count = 0
        for booking in self.bookings:
            if booking.status in ['confirmed', 'checked_in', 'checked_out']:
                payment, created = Payment.objects.get_or_create(
                    booking=booking,
                    defaults={
                        'amount': booking.total_price,
                        'payment_method': random.choice(['credit_card', 'debit_card', 'bank_transfer']),
                        'status': 'completed' if booking.status in ['checked_in', 'checked_out'] else 'pending',
                        'description': f'Payment for booking at {booking.room.hotel.name}',
                        'processed_by': self.staff if random.random() > 0.5 else None,
                    }
                )
                if created:
                    payment_count += 1

        self.stdout.write(f'  Created {payment_count} payments')
