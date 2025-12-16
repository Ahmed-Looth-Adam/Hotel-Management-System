from datetime import date, timedelta
from decimal import Decimal
from typing import Optional, Dict, List, Any

from hotels.models import (
    Hotel, Room, RoomTypePricing, ViewPricing,
    SeasonalPricing, DayTypePricing, PromotionalDiscount
)


class PricingCalculator:
    """
    Service for calculating room prices with dynamic pricing modifiers.

    Price calculation flow:
    1. Base Price (room type)
    2. + View Modifier
    3. For Each Night:
       a. Apply Seasonal Adjustment (if any)
       b. Apply Day Type Adjustment (if any)
    4. Sum all nights = Subtotal
    5. Apply Promotional Discount (if any)
    6. Final Total Price
    """

    def __init__(self, currency: str = 'GBP'):
        self.currency = currency

    def calculate_room_price(
        self,
        room: Room,
        check_in: date,
        check_out: date,
        number_of_rooms: int = 1,
        promo_code: Optional[str] = None,
        booking_advance_days: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Calculate room price for a booking period.

        Args:
            room: Room model instance
            check_in: Check-in date
            check_out: Check-out date
            number_of_rooms: Number of rooms in booking (for promo calculation)
            promo_code: Optional promotional code
            booking_advance_days: Days in advance the booking is made (for early bird)

        Returns:
            Dictionary with pricing breakdown
        """
        hotel = room.hotel
        number_of_nights = (check_out - check_in).days

        if number_of_nights < 1:
            raise ValueError('Check-out must be at least 1 day after check-in')

        # Step 1: Get base price for room type
        base_price = self.get_base_price(hotel, room.room_type_category)

        if base_price is None:
            raise ValueError(f"No pricing configured for room type: {room.room_type_category}")

        # Step 2: Get view modifier
        view_modifier = self.get_view_modifier(hotel, room.view)
        price_with_view = float(base_price)
        view_adjustment = 0.0

        if view_modifier:
            price_with_view = view_modifier.apply_modifier(float(base_price))
            view_adjustment = price_with_view - float(base_price)

        # Step 3 & 4: Calculate price for each night
        nightly_breakdown = []
        total_before_discount = 0.0
        total_seasonal_adjustment = 0.0
        total_day_type_adjustment = 0.0

        current_date = check_in
        while current_date < check_out:
            night_price = price_with_view
            seasonal_adj = 0.0
            day_type_adj = 0.0

            # Apply seasonal pricing
            seasonal_pricing = self.get_seasonal_pricing_for_date(hotel, current_date)
            if seasonal_pricing:
                price_after_seasonal = seasonal_pricing.apply_modifier(night_price)
                seasonal_adj = price_after_seasonal - night_price
                night_price = price_after_seasonal

            # Apply day-type pricing
            day_type_pricing = self.get_day_type_pricing_for_date(hotel, current_date)
            if day_type_pricing:
                price_after_day_type = day_type_pricing.apply_modifier(night_price)
                day_type_adj = price_after_day_type - night_price
                night_price = price_after_day_type

            nightly_breakdown.append({
                'date': current_date.isoformat(),
                'day_name': current_date.strftime('%A'),
                'base_with_view': round(price_with_view, 2),
                'seasonal_adjustment': round(seasonal_adj, 2),
                'day_type_adjustment': round(day_type_adj, 2),
                'final_price': round(night_price, 2),
                'seasonal_name': seasonal_pricing.season_name if seasonal_pricing else None,
                'day_type_name': day_type_pricing.day_type_name if day_type_pricing else None,
            })

            total_before_discount += night_price
            total_seasonal_adjustment += seasonal_adj
            total_day_type_adjustment += day_type_adj
            current_date += timedelta(days=1)

        # Step 5: Apply promotional discount
        promotion = self.get_best_promotion(
            hotel=hotel,
            number_of_rooms=number_of_rooms,
            number_of_nights=number_of_nights,
            room_type=room.room_type_category,
            check_in_date=check_in,
            promo_code=promo_code,
            booking_advance_days=booking_advance_days
        )

        discount_amount = 0.0
        final_total = total_before_discount

        if promotion:
            final_total = promotion.apply_discount(total_before_discount)
            discount_amount = total_before_discount - final_total

        # Calculate averages
        average_price_per_night = final_total / number_of_nights

        return {
            'currency': self.currency,
            'number_of_nights': number_of_nights,
            'check_in': check_in.isoformat(),
            'check_out': check_out.isoformat(),

            # Base pricing
            'room_type': room.room_type_category,
            'base_price': round(float(base_price), 2),
            'view_name': room.view.name if room.view else None,
            'view_adjustment': round(view_adjustment, 2),
            'price_with_view': round(price_with_view, 2),

            # Adjustments
            'total_seasonal_adjustment': round(total_seasonal_adjustment, 2),
            'total_day_type_adjustment': round(total_day_type_adjustment, 2),

            # Promotional Discount
            'promotion_name': promotion.promotion_name if promotion else None,
            'promotion_description': promotion.promotion_description if promotion else None,
            'discount_amount': round(discount_amount, 2),

            # Totals
            'subtotal_before_discount': round(total_before_discount, 2),
            'total_price': round(final_total, 2),
            'average_price_per_night': round(average_price_per_night, 2),

            # Detailed breakdown
            'nightly_breakdown': nightly_breakdown,

            # Summary for display
            'summary': self._generate_summary(
                base_price=float(base_price),
                view_adjustment=view_adjustment,
                seasonal_adjustment=total_seasonal_adjustment,
                day_type_adjustment=total_day_type_adjustment,
                discount_amount=discount_amount,
                nights=number_of_nights
            ),
        }

    def get_base_price(self, hotel: Hotel, room_type: str) -> Optional[Decimal]:
        """Get base price for room type."""
        pricing = RoomTypePricing.objects.filter(
            hotel=hotel,
            room_type=room_type,
            is_active=True
        ).first()
        return pricing.base_price if pricing else None

    def get_view_modifier(self, hotel: Hotel, view) -> Optional[ViewPricing]:
        """Get view pricing modifier."""
        if not view:
            return None
        return ViewPricing.objects.filter(
            hotel=hotel,
            view=view,
            is_active=True
        ).first()

    def get_seasonal_pricing_for_date(self, hotel: Hotel, target_date: date) -> Optional[SeasonalPricing]:
        """Get seasonal pricing for a specific date."""
        return SeasonalPricing.objects.filter(
            hotel=hotel,
            start_date__lte=target_date,
            end_date__gte=target_date,
            is_active=True
        ).order_by('-priority').first()

    def get_day_type_pricing_for_date(self, hotel: Hotel, target_date: date) -> Optional[DayTypePricing]:
        """Get day type pricing for a specific date."""
        day_of_week = target_date.weekday()

        for day_pricing in DayTypePricing.objects.filter(hotel=hotel, is_active=True):
            if day_of_week in day_pricing.applicable_days:
                return day_pricing
        return None

    def get_best_promotion(
        self,
        hotel: Hotel,
        number_of_rooms: int,
        number_of_nights: int,
        room_type: str,
        check_in_date: date,
        promo_code: Optional[str] = None,
        booking_advance_days: Optional[int] = None
    ) -> Optional[PromotionalDiscount]:
        """Get the best applicable promotional discount."""
        today = date.today()

        # Build query
        promotions = PromotionalDiscount.objects.filter(
            hotel=hotel,
            is_active=True
        ).filter(
            # Check validity period
            models.Q(start_date__isnull=True) | models.Q(start_date__lte=today)
        ).filter(
            models.Q(end_date__isnull=True) | models.Q(end_date__gte=today)
        )

        # Filter by promo code
        if promo_code:
            promotions = promotions.filter(
                models.Q(promo_code=promo_code) | models.Q(promo_code__isnull=True)
            )
        else:
            promotions = promotions.filter(promo_code__isnull=True)

        # Order by priority and discount value
        promotions = promotions.order_by('-priority', '-discount_value')

        # Find first applicable promotion
        for promotion in promotions:
            if promotion.applies_to(
                number_of_rooms=number_of_rooms,
                number_of_nights=number_of_nights,
                room_type=room_type,
                check_in_date=check_in_date,
                booking_advance_days=booking_advance_days
            ):
                return promotion

        return None

    def calculate_multiple_rooms(
        self,
        rooms: List[Room],
        check_in: date,
        check_out: date,
        promo_code: Optional[str] = None,
        booking_advance_days: Optional[int] = None
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
                number_of_rooms=number_of_rooms,
                promo_code=promo_code,
                booking_advance_days=booking_advance_days
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
        base_price = self.get_base_price(hotel, room_type)

        if not base_price:
            return None

        estimated_total = float(base_price) * nights

        return {
            'room_type': room_type,
            'base_price_per_night': round(float(base_price), 2),
            'nights': nights,
            'estimated_total': round(estimated_total, 2),
            'currency': self.currency,
            'note': 'This is a base estimate. Actual price may vary based on dates, view, and promotions.',
        }

    def _generate_summary(
        self,
        base_price: float,
        view_adjustment: float,
        seasonal_adjustment: float,
        day_type_adjustment: float,
        discount_amount: float,
        nights: int
    ) -> List[str]:
        """Generate a human-readable summary."""
        summary = []

        summary.append(f"Base price: {self.currency} {base_price:.2f}")

        if view_adjustment > 0:
            summary.append(f"View premium: +{self.currency} {view_adjustment:.2f}")

        if seasonal_adjustment != 0:
            prefix = '+' if seasonal_adjustment > 0 else ''
            summary.append(f"Seasonal adjustment: {prefix}{self.currency} {seasonal_adjustment:.2f}")

        if day_type_adjustment != 0:
            prefix = '+' if day_type_adjustment > 0 else ''
            summary.append(f"Day type adjustment: {prefix}{self.currency} {day_type_adjustment:.2f}")

        summary.append(f"Total for {nights} night(s)")

        if discount_amount > 0:
            summary.append(f"Promotional discount: -{self.currency} {discount_amount:.2f}")

        return summary


# Import models at module level to avoid circular imports
from django.db import models
