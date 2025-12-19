from datetime import date, timedelta
from decimal import Decimal
from typing import Optional, Dict, List, Any

from hotels.models import Hotel, Room, RoomTypePricing, SeasonalPricing


class PricingCalculator:
    """
    Service for calculating room prices based on room type and seasonal pricing.

    Price calculation flow:
    1. Get base price for room type (off-peak or peak based on date)
    2. Calculate price for each night based on seasonal pricing
    3. Sum all nights = Total Price
    """

    def __init__(self, currency: str = 'GBP'):
        self.currency = currency

    def calculate_room_price(
        self,
        room: Room,
        check_in: date,
        check_out: date,
        number_of_rooms: int = 1
    ) -> Dict[str, Any]:
        """
        Calculate room price for a booking period.

        Args:
            room: Room model instance
            check_in: Check-in date
            check_out: Check-out date
            number_of_rooms: Number of rooms in booking

        Returns:
            Dictionary with pricing breakdown
        """
        hotel = room.hotel
        number_of_nights = (check_out - check_in).days

        if number_of_nights < 1:
            raise ValueError('Check-out must be at least 1 day after check-in')

        # Get pricing configuration for room type
        room_type_pricing = self.get_room_type_pricing(hotel, room.room_type_category)

        if room_type_pricing is None:
            raise ValueError(f"No pricing configured for room type: {room.room_type_category}")

        # Calculate price for each night
        nightly_breakdown = []
        total_price = 0.0

        current_date = check_in
        while current_date < check_out:
            # Check if date is in peak season
            is_peak = self.is_peak_season(hotel, current_date)

            if is_peak:
                night_price = float(room_type_pricing.peak_price)
                season_type = 'Peak'
            else:
                night_price = float(room_type_pricing.off_peak_price)
                season_type = 'Off-Peak'

            nightly_breakdown.append({
                'date': current_date.isoformat(),
                'day_name': current_date.strftime('%A'),
                'price': round(night_price, 2),
                'season_type': season_type,
            })

            total_price += night_price
            current_date += timedelta(days=1)

        # Calculate average
        average_price_per_night = total_price / number_of_nights

        return {
            'currency': self.currency,
            'number_of_nights': number_of_nights,
            'check_in': check_in.isoformat(),
            'check_out': check_out.isoformat(),

            # Room info
            'room_type': room.room_type_category,
            'room_type_display': room_type_pricing.get_room_type_display(),
            'off_peak_price': round(float(room_type_pricing.off_peak_price), 2),
            'peak_price': round(float(room_type_pricing.peak_price), 2),

            # Totals
            'total_price': round(total_price, 2),
            'average_price_per_night': round(average_price_per_night, 2),

            # Detailed breakdown
            'nightly_breakdown': nightly_breakdown,

            # Summary for display
            'summary': self._generate_summary(
                room_type=room_type_pricing.get_room_type_display(),
                nights=number_of_nights,
                total=total_price
            ),
        }

    def get_room_type_pricing(self, hotel: Hotel, room_type: str) -> Optional[RoomTypePricing]:
        """Get pricing configuration for room type."""
        return RoomTypePricing.objects.filter(
            hotel=hotel,
            room_type=room_type,
            is_active=True
        ).first()

    def is_peak_season(self, hotel: Hotel, target_date: date) -> bool:
        """Check if a date falls within a peak season period."""
        return SeasonalPricing.objects.filter(
            hotel=hotel,
            start_date__lte=target_date,
            end_date__gte=target_date,
            is_peak_season=True,
            is_active=True
        ).exists()

    def calculate_multiple_rooms(
        self,
        rooms: List[Room],
        check_in: date,
        check_out: date
    ) -> Dict[str, Any]:
        """Calculate price for multiple rooms."""
        total_price = 0.0
        room_breakdowns = []
        number_of_rooms = len(rooms)

        for room in rooms:
            pricing = self.calculate_room_price(
                room=room,
                check_in=check_in,
                check_out=check_out,
                number_of_rooms=number_of_rooms
            )
            room_breakdowns.append({
                'room_number': room.room_number,
                'room_type': room.room_type_category,
                'pricing': pricing,
            })
            total_price += pricing['total_price']

        return {
            'total_price': round(total_price, 2),
            'currency': self.currency,
            'number_of_rooms': number_of_rooms,
            'rooms': room_breakdowns,
        }

    def get_quick_estimate(
        self,
        hotel: Hotel,
        room_type: str,
        nights: int = 1
    ) -> Optional[Dict[str, Any]]:
        """Get a quick price estimate (simplified, faster)."""
        pricing = self.get_room_type_pricing(hotel, room_type)

        if not pricing:
            return None

        # Use off-peak price for estimate
        estimated_total = float(pricing.off_peak_price) * nights

        return {
            'room_type': room_type,
            'off_peak_price_per_night': round(float(pricing.off_peak_price), 2),
            'peak_price_per_night': round(float(pricing.peak_price), 2),
            'nights': nights,
            'estimated_total': round(estimated_total, 2),
            'currency': self.currency,
            'note': 'This is an off-peak estimate. Peak season prices may be higher.',
        }

    def _generate_summary(
        self,
        room_type: str,
        nights: int,
        total: float
    ) -> List[str]:
        """Generate a human-readable summary."""
        summary = []
        summary.append(f"Room type: {room_type}")
        summary.append(f"Number of nights: {nights}")
        summary.append(f"Total: {self.currency} {total:.2f}")
        return summary
