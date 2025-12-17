"""
Hotel Data Seeder
Seeds hotels, rooms, pricing, services, and policies based on documentation.

Usage:
    python manage.py seed_hotels
    python manage.py seed_hotels --clear-only  # Only clear data without seeding
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from datetime import date, timedelta
import random

from hotels.models import (
    Hotel, Room, RoomType, RoomTypePricing, RoomView, ViewPricing,
    SeasonalPricing, DayTypePricing, AncillaryService, HotelPolicy,
    AmenityCategory, Amenity, RoomAmenity, Gallery, GalleryImage,
    RoomRate, PromotionalDiscount, LateCheckoutRequest
)


class Command(BaseCommand):
    help = 'Seed hotel data: 4 hotels with 50 rooms each, pricing, services, and policies'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear-only',
            action='store_true',
            help='Only clear existing data without seeding new data',
        )

    def handle(self, *args, **options):
        clear_only = options.get('clear_only', False)

        self.stdout.write(self.style.WARNING('Starting hotel data seeder...'))

        with transaction.atomic():
            # Step 1: Clear existing data
            self.clear_data()

            if clear_only:
                self.stdout.write(self.style.SUCCESS('Data cleared successfully. No new data seeded.'))
                return

            # Step 2: Create Room Types
            room_types = self.create_room_types()

            # Step 3: Create Hotels
            hotels = self.create_hotels()

            # Step 4: Create Rooms for each hotel
            for hotel in hotels:
                self.create_rooms(hotel, room_types)
                self.create_room_type_pricing(hotel)
                self.create_room_views_and_pricing(hotel)
                self.create_seasonal_pricing(hotel)
                self.create_day_type_pricing(hotel)
                self.create_ancillary_services(hotel)
                self.create_hotel_policies(hotel)
                self.create_amenities(hotel)

        self.stdout.write(self.style.SUCCESS('Hotel data seeded successfully!'))
        self.print_summary(hotels)

    def clear_data(self):
        """Clear all hotel-related data"""
        self.stdout.write('Clearing existing hotel data...')

        # Clear in order to respect foreign key constraints
        LateCheckoutRequest.objects.all().delete()
        RoomAmenity.objects.all().delete()
        GalleryImage.objects.all().delete()
        Gallery.objects.all().delete()
        Amenity.objects.all().delete()
        AmenityCategory.objects.all().delete()
        PromotionalDiscount.objects.all().delete()
        DayTypePricing.objects.all().delete()
        SeasonalPricing.objects.all().delete()
        ViewPricing.objects.all().delete()
        RoomView.objects.all().delete()
        RoomRate.objects.all().delete()
        RoomTypePricing.objects.all().delete()
        AncillaryService.objects.all().delete()
        HotelPolicy.objects.all().delete()
        Room.objects.all().delete()
        RoomType.objects.all().delete()
        Hotel.objects.all().delete()

        self.stdout.write(self.style.SUCCESS('  ✓ Existing data cleared'))

    def create_room_types(self):
        """Create room types based on documentation"""
        self.stdout.write('Creating room types...')

        room_types_data = [
            {
                'name': 'Standard Double',
                'capacity': 2,
                'description': 'Comfortable room with a double bed, perfect for couples or solo travelers.',
                'amenities': ['Free WiFi', 'TV', 'Air Conditioning', 'Private Bathroom', 'Desk'],
            },
            {
                'name': 'Deluxe King',
                'capacity': 2,
                'description': 'Spacious room with a king-size bed and premium amenities for a luxurious stay.',
                'amenities': ['Free WiFi', 'Smart TV', 'Air Conditioning', 'Private Bathroom', 'Minibar', 'Safe', 'Desk', 'Bathrobe'],
            },
            {
                'name': 'Family Suite',
                'capacity': 4,
                'description': 'Large suite ideal for families, featuring separate sleeping areas and extra space.',
                'amenities': ['Free WiFi', 'Smart TV', 'Air Conditioning', 'Private Bathroom', 'Minibar', 'Safe', 'Living Area', 'Kitchenette', 'Bathrobe'],
            },
            {
                'name': 'Penthouse',
                'capacity': 4,
                'description': 'Ultimate luxury penthouse with panoramic views, premium furnishings, and exclusive amenities.',
                'amenities': ['Free WiFi', 'Smart TV', 'Air Conditioning', 'Private Bathroom', 'Minibar', 'Safe', 'Living Area', 'Kitchen', 'Bathrobe', 'Private Terrace', 'Jacuzzi', 'Butler Service'],
            },
        ]

        room_types = {}
        for rt_data in room_types_data:
            room_type = RoomType.objects.create(**rt_data)
            # Map to category key
            if 'Standard' in rt_data['name']:
                room_types['standard'] = room_type
            elif 'Deluxe' in rt_data['name']:
                room_types['deluxe'] = room_type
            elif 'Family' in rt_data['name']:
                room_types['suite'] = room_type
            elif 'Penthouse' in rt_data['name']:
                room_types['penthouse'] = room_type

        self.stdout.write(self.style.SUCCESS(f'  ✓ Created {len(room_types)} room types'))
        return room_types

    def create_hotels(self):
        """Create 4 hotels in different locations"""
        self.stdout.write('Creating hotels...')

        hotels_data = [
            {
                'name': 'Grand Hotel London',
                'location': 'Central London',
                'address': '100 Park Lane, Mayfair',
                'city': 'London',
                'country': 'United Kingdom',
                'description': 'A prestigious 5-star hotel in the heart of London, offering world-class service and stunning views of Hyde Park.',
                'star_rating': 5,
                'room_capacity': 50,
            },
            {
                'name': 'Le Parisien Palace',
                'location': 'Champs-Élysées',
                'address': '25 Avenue des Champs-Élysées',
                'city': 'Paris',
                'country': 'France',
                'description': 'An elegant Parisian hotel combining classic French architecture with modern luxury, steps from the Arc de Triomphe.',
                'star_rating': 5,
                'room_capacity': 50,
            },
            {
                'name': 'Manhattan Skyline Hotel',
                'location': 'Midtown Manhattan',
                'address': '350 Fifth Avenue',
                'city': 'New York',
                'country': 'United States',
                'description': 'A contemporary luxury hotel in the heart of NYC with breathtaking skyline views and direct access to world-famous attractions.',
                'star_rating': 5,
                'room_capacity': 50,
            },
            {
                'name': 'Dubai Marina Resort',
                'location': 'Dubai Marina',
                'address': 'Palm Jumeirah, Marina Walk',
                'city': 'Dubai',
                'country': 'United Arab Emirates',
                'description': 'An opulent beachfront resort offering unparalleled Arabian hospitality with private beach access and panoramic sea views.',
                'star_rating': 5,
                'room_capacity': 50,
            },
        ]

        hotels = []
        for hotel_data in hotels_data:
            hotel = Hotel.objects.create(**hotel_data)
            hotels.append(hotel)

        self.stdout.write(self.style.SUCCESS(f'  ✓ Created {len(hotels)} hotels'))
        return hotels

    def create_rooms(self, hotel, room_types):
        """Create 50 rooms per hotel distributed across room types"""
        self.stdout.write(f'Creating rooms for {hotel.name}...')

        # Distribution: 25 Standard, 15 Deluxe, 7 Suite, 3 Penthouse = 50 rooms
        room_distribution = [
            ('standard', 25, 'queen', 1, 2),
            ('deluxe', 15, 'king', 1, 2),
            ('suite', 7, 'king', 2, 4),
            ('penthouse', 3, 'king', 2, 4),
        ]

        room_number = 100
        rooms_created = 0

        for room_type_key, count, bed_size, bed_count, max_occupancy in room_distribution:
            room_type = room_types.get(room_type_key)
            for i in range(count):
                floor = (room_number // 100)
                Room.objects.create(
                    hotel=hotel,
                    room_type=room_type,
                    room_number=str(room_number),
                    floor=floor,
                    room_type_category=room_type_key,
                    bed_size=bed_size,
                    bed_count=bed_count,
                    max_occupancy=max_occupancy,
                    status='available',
                    is_available=True,
                    is_active=True,
                )
                room_number += 1
                rooms_created += 1

                # Move to next floor every 10 rooms
                if room_number % 100 == 10:
                    room_number = ((room_number // 100) + 1) * 100

        self.stdout.write(self.style.SUCCESS(f'  ✓ Created {rooms_created} rooms for {hotel.name}'))

    def create_room_type_pricing(self, hotel):
        """Create pricing based on documentation"""
        # From documentation:
        # Standard Double: Off-Peak 120, Peak 180
        # Deluxe King: Off-Peak 180, Peak 250
        # Family Suite: Off-Peak 240, Peak 320
        # Penthouse: Off-Peak 500, Peak 750

        pricing_data = [
            ('standard', 120, 180),
            ('deluxe', 180, 250),
            ('suite', 240, 320),
            ('penthouse', 500, 750),
        ]

        for room_type, off_peak, peak in pricing_data:
            RoomTypePricing.objects.create(
                hotel=hotel,
                room_type=room_type,
                off_peak_price=off_peak,
                peak_price=peak,
                currency='GBP',
                is_active=True,
            )

        self.stdout.write(self.style.SUCCESS(f'  ✓ Created room type pricing for {hotel.name}'))

    def create_room_views_and_pricing(self, hotel):
        """Create room views with price modifiers"""
        views_data = [
            ('City View', 'Standard city view from the room', 'percentage', 0),
            ('Garden View', 'Peaceful garden view', 'percentage', 5),
            ('Pool View', 'Overlooks the swimming pool area', 'percentage', 10),
            ('Sea View', 'Beautiful ocean/sea view', 'percentage', 15),
            ('Panoramic View', 'Premium panoramic view of the surroundings', 'percentage', 20),
        ]

        for name, description, modifier_type, modifier_value in views_data:
            view = RoomView.objects.create(
                hotel=hotel,
                name=name,
                description=description,
                is_active=True,
            )

            if modifier_value > 0:
                ViewPricing.objects.create(
                    hotel=hotel,
                    view=view,
                    modifier_type=modifier_type,
                    modifier_value=modifier_value,
                    is_active=True,
                )

        self.stdout.write(self.style.SUCCESS(f'  ✓ Created room views and pricing for {hotel.name}'))

    def create_seasonal_pricing(self, hotel):
        """Create seasonal pricing periods"""
        current_year = date.today().year

        seasons_data = [
            ('Winter Off-Peak', date(current_year, 1, 1), date(current_year, 3, 31), False),
            ('Spring Off-Peak', date(current_year, 4, 1), date(current_year, 5, 31), False),
            ('Summer Peak', date(current_year, 6, 1), date(current_year, 8, 31), True),
            ('Autumn Off-Peak', date(current_year, 9, 1), date(current_year, 11, 30), False),
            ('Christmas Peak', date(current_year, 12, 1), date(current_year, 12, 31), True),
            # Next year
            ('Winter Off-Peak', date(current_year + 1, 1, 1), date(current_year + 1, 3, 31), False),
            ('Spring Off-Peak', date(current_year + 1, 4, 1), date(current_year + 1, 5, 31), False),
            ('Summer Peak', date(current_year + 1, 6, 1), date(current_year + 1, 8, 31), True),
        ]

        for name, start, end, is_peak in seasons_data:
            SeasonalPricing.objects.create(
                hotel=hotel,
                season_name=name,
                start_date=start,
                end_date=end,
                is_peak_season=is_peak,
                is_active=True,
            )

        self.stdout.write(self.style.SUCCESS(f'  ✓ Created seasonal pricing for {hotel.name}'))

    def create_day_type_pricing(self, hotel):
        """Create day-of-week pricing (weekend surcharge)"""
        # Weekend surcharge (Friday, Saturday, Sunday)
        DayTypePricing.objects.create(
            hotel=hotel,
            day_type_name='Weekend',
            applicable_days=[4, 5, 6],  # Friday=4, Saturday=5, Sunday=6
            modifier_type='percentage',
            modifier_value=10,  # 10% weekend surcharge
            is_active=True,
        )

        self.stdout.write(self.style.SUCCESS(f'  ✓ Created day type pricing for {hotel.name}'))

    def create_ancillary_services(self, hotel):
        """Create ancillary services based on documentation"""
        # From documentation:
        # Airport Transfer (One-way): 50 GBP
        # Full English Breakfast (Per Person/Day): 20 GBP
        # Spa Access (Per Person/Day): 35 GBP
        # Late Check-out (until 2 PM): 40 GBP

        services_data = [
            {
                'name': 'Airport Transfer (One-way)',
                'description': 'Luxury chauffeur service to or from the airport in a premium vehicle.',
                'service_type': 'airport_transfer',
                'price': 50,
                'pricing_type': 'one_time',
            },
            {
                'name': 'Full English Breakfast',
                'description': 'Traditional full English breakfast served in our restaurant, including eggs, bacon, sausages, beans, toast, and freshly brewed coffee or tea.',
                'service_type': 'breakfast',
                'price': 20,
                'pricing_type': 'per_person_per_day',
            },
            {
                'name': 'Spa Access',
                'description': 'Full day access to our luxury spa facilities including pool, sauna, steam room, and fitness center.',
                'service_type': 'spa',
                'price': 35,
                'pricing_type': 'per_person_per_day',
            },
            {
                'name': 'Late Check-out (until 2 PM)',
                'description': 'Extend your stay until 2 PM on your checkout day, subject to availability.',
                'service_type': 'late_checkout',
                'price': 40,
                'pricing_type': 'one_time',
            },
            {
                'name': 'Parking',
                'description': 'Secure underground parking for your vehicle.',
                'service_type': 'parking',
                'price': 25,
                'pricing_type': 'per_day',
            },
            {
                'name': 'Laundry Service',
                'description': 'Same-day laundry and dry cleaning service.',
                'service_type': 'laundry',
                'price': 30,
                'pricing_type': 'per_booking',
            },
            {
                'name': 'In-Room Dining',
                'description': '24-hour room service with full menu available.',
                'service_type': 'room_service',
                'price': 15,
                'pricing_type': 'one_time',
            },
        ]

        for service_data in services_data:
            AncillaryService.objects.create(
                hotel=hotel,
                currency='GBP',
                is_active=True,
                **service_data,
            )

        self.stdout.write(self.style.SUCCESS(f'  ✓ Created ancillary services for {hotel.name}'))

    def create_hotel_policies(self, hotel):
        """Create hotel policies based on documentation"""
        policies_data = [
            # Cancellation Policy (from documentation)
            {
                'policy_type': 'cancellation',
                'title': 'Cancellation Policy',
                'description': '''Our cancellation policy is as follows:

• More than 14 days before check-in: FREE cancellation
• 3-14 days before check-in: 50% of first night's rate
• Less than 72 hours before check-in: 100% of first night's rate
• No-Show: 100% of entire booking

All cancellation fees are calculated based on the room rate at the time of booking. Refunds will be processed within 5-7 business days.''',
            },
            {
                'policy_type': 'check_in_out',
                'title': 'Check-in/Check-out Policy',
                'description': '''Check-in and Check-out Times:

• Standard Check-in: 2:00 PM (14:00)
• Standard Check-out: 12:00 PM (noon)
• Early Check-in: Subject to availability, please contact reception
• Late Check-out: Available until 2:00 PM for £40 (subject to availability)
• Maximum Late Check-out: 6:00 PM (subject to approval)

Valid photo ID and credit card required at check-in. The credit card holder must be present.''',
            },
            {
                'policy_type': 'payment',
                'title': 'Payment Policy',
                'description': '''Payment Terms:

• A valid credit card is required to guarantee all reservations
• Full payment is due at check-out unless otherwise arranged
• We accept: Visa, MasterCard, American Express, and Debit Cards
• A pre-authorization hold may be placed on your card at check-in for incidentals
• Currency: All prices are in GBP (British Pounds)

For group bookings or extended stays, please contact our reservations team for special payment arrangements.''',
            },
            {
                'policy_type': 'house_rules',
                'title': 'House Rules',
                'description': '''General House Rules:

• Smoking is strictly prohibited in all indoor areas. Designated smoking areas are available outside.
• Quiet hours: 10:00 PM - 8:00 AM
• Pets are not allowed unless pre-approved assistance animals
• Maximum occupancy limits must be observed
• Visitors must register at reception
• Pool and spa facilities: 7:00 AM - 10:00 PM
• Gym facilities: 24 hours with room key access
• Appropriate attire required in all public areas

Violation of house rules may result in additional charges or termination of stay.''',
            },
            {
                'policy_type': 'age_restriction',
                'title': 'Age Restriction Policy',
                'description': '''Age Requirements:

• Minimum age for check-in: 18 years old
• Guests under 18 must be accompanied by a parent or legal guardian
• Valid ID with date of birth required at check-in
• Bar and lounge access: 21+ only (ID required)

All guests will be asked to provide valid identification upon check-in.''',
            },
            {
                'policy_type': 'damage_deposit',
                'title': 'Damage & Deposit Policy',
                'description': '''Security Deposit:

• A security deposit or credit card pre-authorization may be required at check-in
• Amount varies based on room type and length of stay
• Deposit will be refunded within 7 days after checkout, pending inspection
• Guests are responsible for any damage to hotel property
• Additional cleaning fees may apply for excessive mess or smoking violations

Please report any pre-existing damage to reception upon check-in.''',
            },
            {
                'policy_type': 'special_requests',
                'title': 'Special Requests Policy',
                'description': '''Special Requests:

• Special requests are subject to availability and cannot be guaranteed
• Please inform us of any special requirements at the time of booking
• Dietary requirements: Please notify us at least 48 hours in advance
• Accessibility needs: We offer accessible rooms - please request when booking
• Celebrations: Let us know about special occasions and we'll try to make them memorable
• Cots and extra beds: Available on request (charges may apply)

Contact our concierge team for any special arrangements.''',
            },
        ]

        for policy_data in policies_data:
            HotelPolicy.objects.create(
                hotel=hotel,
                is_active=True,
                **policy_data,
            )

        self.stdout.write(self.style.SUCCESS(f'  ✓ Created hotel policies for {hotel.name}'))

    def create_amenities(self, hotel):
        """Create amenity categories and amenities for the hotel"""
        amenities_structure = {
            'Bathroom': [
                ('Shower', 'shower'),
                ('Bathtub', 'bathtub'),
                ('Hair Dryer', 'hair_dryer'),
                ('Toiletries', 'toiletries'),
                ('Bathrobes', 'bathrobe'),
                ('Slippers', 'slippers'),
            ],
            'Electronics': [
                ('Smart TV', 'tv'),
                ('Free WiFi', 'wifi'),
                ('USB Charging Ports', 'usb'),
                ('International Power Outlets', 'power'),
                ('Bluetooth Speaker', 'speaker'),
            ],
            'Comfort': [
                ('Air Conditioning', 'ac'),
                ('Heating', 'heating'),
                ('Blackout Curtains', 'curtains'),
                ('Pillow Menu', 'pillow'),
                ('Premium Bedding', 'bed'),
            ],
            'Business': [
                ('Work Desk', 'desk'),
                ('Ergonomic Chair', 'chair'),
                ('High-Speed Internet', 'internet'),
                ('Printer Access', 'printer'),
            ],
            'Food & Beverage': [
                ('Minibar', 'minibar'),
                ('Coffee Machine', 'coffee'),
                ('Kettle', 'kettle'),
                ('Room Service', 'room_service'),
            ],
            'Safety': [
                ('In-Room Safe', 'safe'),
                ('Smoke Detector', 'smoke'),
                ('Fire Extinguisher', 'fire'),
                ('Electronic Door Lock', 'lock'),
            ],
        }

        for category_name, amenities_list in amenities_structure.items():
            category = AmenityCategory.objects.create(
                hotel=hotel,
                name=category_name,
                is_active=True,
            )

            for amenity_name, icon in amenities_list:
                Amenity.objects.create(
                    hotel=hotel,
                    category=category,
                    name=amenity_name,
                    icon=icon,
                    is_active=True,
                )

        self.stdout.write(self.style.SUCCESS(f'  ✓ Created amenities for {hotel.name}'))

    def print_summary(self, hotels):
        """Print summary of seeded data"""
        self.stdout.write('\n' + '=' * 50)
        self.stdout.write(self.style.SUCCESS('SEEDING SUMMARY'))
        self.stdout.write('=' * 50)

        self.stdout.write(f'\nHotels created: {len(hotels)}')
        for hotel in hotels:
            room_count = Room.objects.filter(hotel=hotel).count()
            self.stdout.write(f'  • {hotel.name} ({hotel.city}) - {room_count} rooms')

        self.stdout.write(f'\nRoom Types: {RoomType.objects.count()}')
        self.stdout.write(f'Total Rooms: {Room.objects.count()}')
        self.stdout.write(f'Room Type Pricing Entries: {RoomTypePricing.objects.count()}')
        self.stdout.write(f'Ancillary Services: {AncillaryService.objects.count()}')
        self.stdout.write(f'Hotel Policies: {HotelPolicy.objects.count()}')
        self.stdout.write(f'Seasonal Pricing Entries: {SeasonalPricing.objects.count()}')
        self.stdout.write(f'Amenity Categories: {AmenityCategory.objects.count()}')
        self.stdout.write(f'Amenities: {Amenity.objects.count()}')

        self.stdout.write('\n' + '=' * 50)
        self.stdout.write(self.style.SUCCESS('Room Distribution per Hotel:'))
        self.stdout.write('  • Standard Double: 25 rooms')
        self.stdout.write('  • Deluxe King: 15 rooms')
        self.stdout.write('  • Family Suite: 7 rooms')
        self.stdout.write('  • Penthouse: 3 rooms')
        self.stdout.write('=' * 50 + '\n')
