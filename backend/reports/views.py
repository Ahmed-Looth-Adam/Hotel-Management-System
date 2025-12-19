# Edited By
# -> Ismail Wasiu Abdul Samad, UWE ID: 24050765

from datetime import date, timedelta
from decimal import Decimal
from collections import defaultdict
from django.db.models import Count, Sum, Avg, F, Q
from django.db.models.functions import TruncDate, TruncMonth, TruncYear, ExtractWeekDay
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from bookings.models import Booking
from hotels.models import Hotel, Room
from payments.models import Payment, Invoice, BookingServiceCharge


class ReportsViewSet(viewsets.ViewSet):
    """
    Reports & Analytics API
    Provides occupancy rates, revenue reports, and guest demographics
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def occupancy(self, request):
        """
        Get occupancy rates for a hotel
        Query params:
        - hotel_id: Required
        - period: daily, monthly, yearly (default: daily)
        - start_date: Start of period (default: 30 days ago)
        - end_date: End of period (default: today)
        """
        hotel_id = request.query_params.get('hotel_id')
        period = request.query_params.get('period', 'daily')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if not hotel_id:
            return Response(
                {'error': 'hotel_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            hotel = Hotel.objects.get(id=hotel_id)
        except Hotel.DoesNotExist:
            return Response(
                {'error': 'Hotel not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Parse dates
        if end_date:
            end_date = date.fromisoformat(end_date)
        else:
            end_date = date.today()

        if start_date:
            start_date = date.fromisoformat(start_date)
        else:
            if period == 'daily':
                start_date = end_date - timedelta(days=30)
            elif period == 'monthly':
                start_date = end_date - timedelta(days=365)
            else:  # yearly
                start_date = end_date - timedelta(days=365 * 3)

        # Get total rooms count for the hotel
        total_rooms = Room.objects.filter(hotel=hotel, is_active=True).count()

        if total_rooms == 0:
            return Response({
                'hotel_id': hotel_id,
                'hotel_name': hotel.name,
                'total_rooms': 0,
                'period': period,
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'data': [],
                'summary': {
                    'average_occupancy_rate': 0,
                    'peak_occupancy_date': None,
                    'lowest_occupancy_date': None,
                }
            })

        # Get bookings in the date range
        bookings = Booking.objects.filter(
            hotel=hotel,
            status__in=['confirmed', 'checked_in', 'checked_out', 'completed'],
            check_in_date__lte=end_date,
            check_out_date__gte=start_date
        )

        # Calculate daily occupancy
        daily_data = {}
        current_date = start_date
        while current_date <= end_date:
            occupied_rooms = bookings.filter(
                check_in_date__lte=current_date,
                check_out_date__gt=current_date
            ).count()
            occupancy_rate = (occupied_rooms / total_rooms) * 100 if total_rooms > 0 else 0
            daily_data[current_date] = {
                'date': current_date.isoformat(),
                'occupied_rooms': occupied_rooms,
                'total_rooms': total_rooms,
                'occupancy_rate': round(occupancy_rate, 2)
            }
            current_date += timedelta(days=1)

        # Aggregate based on period
        if period == 'daily':
            data = list(daily_data.values())
        elif period == 'monthly':
            monthly_data = defaultdict(lambda: {'occupied_days': 0, 'total_days': 0, 'total_occupied': 0})
            for date_key, values in daily_data.items():
                month_key = date_key.strftime('%Y-%m')
                monthly_data[month_key]['occupied_days'] += 1 if values['occupied_rooms'] > 0 else 0
                monthly_data[month_key]['total_days'] += 1
                monthly_data[month_key]['total_occupied'] += values['occupied_rooms']
                monthly_data[month_key]['month'] = month_key

            data = []
            for month_key, values in sorted(monthly_data.items()):
                avg_occupancy = (values['total_occupied'] / (values['total_days'] * total_rooms)) * 100
                data.append({
                    'month': values['month'],
                    'average_occupied_rooms': round(values['total_occupied'] / values['total_days'], 2),
                    'total_rooms': total_rooms,
                    'occupancy_rate': round(avg_occupancy, 2)
                })
        else:  # yearly
            yearly_data = defaultdict(lambda: {'total_days': 0, 'total_occupied': 0})
            for date_key, values in daily_data.items():
                year_key = date_key.strftime('%Y')
                yearly_data[year_key]['total_days'] += 1
                yearly_data[year_key]['total_occupied'] += values['occupied_rooms']
                yearly_data[year_key]['year'] = year_key

            data = []
            for year_key, values in sorted(yearly_data.items()):
                avg_occupancy = (values['total_occupied'] / (values['total_days'] * total_rooms)) * 100
                data.append({
                    'year': values['year'],
                    'average_occupied_rooms': round(values['total_occupied'] / values['total_days'], 2),
                    'total_rooms': total_rooms,
                    'occupancy_rate': round(avg_occupancy, 2)
                })

        # Calculate summary statistics
        occupancy_rates = [d.get('occupancy_rate', 0) for d in daily_data.values()]
        avg_occupancy = sum(occupancy_rates) / len(occupancy_rates) if occupancy_rates else 0

        # Find peak and lowest days
        sorted_by_occupancy = sorted(daily_data.items(), key=lambda x: x[1]['occupancy_rate'], reverse=True)
        peak_day = sorted_by_occupancy[0] if sorted_by_occupancy else None
        lowest_day = sorted_by_occupancy[-1] if sorted_by_occupancy else None

        return Response({
            'hotel_id': hotel_id,
            'hotel_name': hotel.name,
            'total_rooms': total_rooms,
            'period': period,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'data': data,
            'summary': {
                'average_occupancy_rate': round(avg_occupancy, 2),
                'peak_occupancy_date': peak_day[0].isoformat() if peak_day else None,
                'peak_occupancy_rate': round(peak_day[1]['occupancy_rate'], 2) if peak_day else None,
                'lowest_occupancy_date': lowest_day[0].isoformat() if lowest_day else None,
                'lowest_occupancy_rate': round(lowest_day[1]['occupancy_rate'], 2) if lowest_day else None,
            }
        })

    @action(detail=False, methods=['get'])
    def revenue(self, request):
        """
        Get revenue reports for a hotel
        Query params:
        - hotel_id: Required
        - period: daily, monthly, yearly (default: monthly)
        - start_date: Start of period
        - end_date: End of period
        - group_by: room_type, service (default: none)
        """
        hotel_id = request.query_params.get('hotel_id')
        period = request.query_params.get('period', 'monthly')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        group_by = request.query_params.get('group_by')

        if not hotel_id:
            return Response(
                {'error': 'hotel_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            hotel = Hotel.objects.get(id=hotel_id)
        except Hotel.DoesNotExist:
            return Response(
                {'error': 'Hotel not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Parse dates
        if end_date:
            end_date = date.fromisoformat(end_date)
        else:
            end_date = date.today()

        if start_date:
            start_date = date.fromisoformat(start_date)
        else:
            if period == 'daily':
                start_date = end_date - timedelta(days=30)
            elif period == 'monthly':
                start_date = end_date - timedelta(days=365)
            else:
                start_date = end_date - timedelta(days=365 * 3)

        # Get completed/paid bookings
        bookings = Booking.objects.filter(
            hotel=hotel,
            status__in=['confirmed', 'checked_out', 'completed'],
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        )

        # Calculate revenue by room type if requested
        if group_by == 'room_type':
            revenue_data = bookings.values(
                room_type=F('room__room_type_category')
            ).annotate(
                total_bookings=Count('id'),
                total_revenue=Sum('total_price'),
                average_booking_value=Avg('total_price')
            ).order_by('-total_revenue')

            data = []
            for item in revenue_data:
                data.append({
                    'room_type': item['room_type'] or 'Unknown',
                    'total_bookings': item['total_bookings'],
                    'total_revenue': float(item['total_revenue'] or 0),
                    'average_booking_value': float(item['average_booking_value'] or 0)
                })

            total_revenue = sum(d['total_revenue'] for d in data)
            total_bookings = sum(d['total_bookings'] for d in data)

            return Response({
                'hotel_id': hotel_id,
                'hotel_name': hotel.name,
                'period': period,
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'group_by': 'room_type',
                'data': data,
                'summary': {
                    'total_revenue': total_revenue,
                    'total_bookings': total_bookings,
                    'average_booking_value': total_revenue / total_bookings if total_bookings > 0 else 0
                }
            })

        # Default: Group by period
        if period == 'daily':
            revenue_data = bookings.annotate(
                period_date=TruncDate('created_at')
            ).values('period_date').annotate(
                total_bookings=Count('id'),
                total_revenue=Sum('total_price')
            ).order_by('period_date')

            data = [{
                'date': item['period_date'].isoformat(),
                'total_bookings': item['total_bookings'],
                'total_revenue': float(item['total_revenue'] or 0)
            } for item in revenue_data]

        elif period == 'monthly':
            revenue_data = bookings.annotate(
                period_month=TruncMonth('created_at')
            ).values('period_month').annotate(
                total_bookings=Count('id'),
                total_revenue=Sum('total_price')
            ).order_by('period_month')

            data = [{
                'month': item['period_month'].strftime('%Y-%m'),
                'total_bookings': item['total_bookings'],
                'total_revenue': float(item['total_revenue'] or 0)
            } for item in revenue_data]

        else:  # yearly
            revenue_data = bookings.annotate(
                period_year=TruncYear('created_at')
            ).values('period_year').annotate(
                total_bookings=Count('id'),
                total_revenue=Sum('total_price')
            ).order_by('period_year')

            data = [{
                'year': item['period_year'].strftime('%Y'),
                'total_bookings': item['total_bookings'],
                'total_revenue': float(item['total_revenue'] or 0)
            } for item in revenue_data]

        total_revenue = sum(d['total_revenue'] for d in data)
        total_bookings = sum(d['total_bookings'] for d in data)

        return Response({
            'hotel_id': hotel_id,
            'hotel_name': hotel.name,
            'period': period,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'group_by': 'period',
            'data': data,
            'summary': {
                'total_revenue': total_revenue,
                'total_bookings': total_bookings,
                'average_booking_value': total_revenue / total_bookings if total_bookings > 0 else 0
            }
        })

    @action(detail=False, methods=['get'])
    def guest_demographics(self, request):
        """
        Get guest booking patterns and demographics
        Query params:
        - hotel_id: Required
        - start_date: Start of period
        - end_date: End of period
        """
        hotel_id = request.query_params.get('hotel_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if not hotel_id:
            return Response(
                {'error': 'hotel_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            hotel = Hotel.objects.get(id=hotel_id)
        except Hotel.DoesNotExist:
            return Response(
                {'error': 'Hotel not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Parse dates
        if end_date:
            end_date = date.fromisoformat(end_date)
        else:
            end_date = date.today()

        if start_date:
            start_date = date.fromisoformat(start_date)
        else:
            start_date = end_date - timedelta(days=365)

        bookings = Booking.objects.filter(
            hotel=hotel,
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        )

        # Booking patterns by day of week
        day_of_week_data = bookings.annotate(
            day_of_week=ExtractWeekDay('check_in_date')
        ).values('day_of_week').annotate(
            count=Count('id')
        ).order_by('day_of_week')

        day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        bookings_by_day = [{
            'day': day_names[item['day_of_week'] - 1] if item['day_of_week'] else 'Unknown',
            'bookings': item['count']
        } for item in day_of_week_data]

        # Average length of stay
        stay_lengths = []
        for booking in bookings:
            stay_lengths.append(booking.number_of_nights)
        avg_stay_length = sum(stay_lengths) / len(stay_lengths) if stay_lengths else 0

        # Stay length distribution
        stay_distribution = defaultdict(int)
        for length in stay_lengths:
            if length <= 1:
                stay_distribution['1 night'] += 1
            elif length <= 3:
                stay_distribution['2-3 nights'] += 1
            elif length <= 7:
                stay_distribution['4-7 nights'] += 1
            else:
                stay_distribution['7+ nights'] += 1

        # Guest count distribution
        guest_counts = bookings.values('guests_count').annotate(
            count=Count('id')
        ).order_by('guests_count')

        guest_distribution = [{
            'guests': item['guests_count'],
            'bookings': item['count']
        } for item in guest_counts]

        # Booking source (by payment method as proxy)
        payment_methods = bookings.values('payment_method').annotate(
            count=Count('id')
        ).order_by('-count')

        payment_distribution = [{
            'payment_method': item['payment_method'] or 'Not specified',
            'bookings': item['count']
        } for item in payment_methods]

        # Repeat guests
        repeat_guests = bookings.values('user').annotate(
            booking_count=Count('id')
        ).filter(booking_count__gt=1).count()

        total_guests = bookings.values('user').distinct().count()

        # Room type preferences
        room_preferences = bookings.values(
            room_type=F('room__room_type_category')
        ).annotate(
            count=Count('id')
        ).order_by('-count')

        room_type_distribution = [{
            'room_type': item['room_type'] or 'Unknown',
            'bookings': item['count']
        } for item in room_preferences]

        return Response({
            'hotel_id': hotel_id,
            'hotel_name': hotel.name,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'total_bookings': bookings.count(),
            'total_unique_guests': total_guests,
            'repeat_guests': repeat_guests,
            'repeat_guest_rate': round((repeat_guests / total_guests) * 100, 2) if total_guests > 0 else 0,
            'average_stay_length': round(avg_stay_length, 2),
            'bookings_by_day_of_week': bookings_by_day,
            'stay_length_distribution': [{'range': k, 'count': v} for k, v in stay_distribution.items()],
            'guest_count_distribution': guest_distribution,
            'room_type_preferences': room_type_distribution,
            'payment_method_distribution': payment_distribution,
        })

    @action(detail=False, methods=['get'])
    def dashboard_summary(self, request):
        """
        Get dashboard summary for managers
        Query params:
        - hotel_id: Optional (if not provided, returns aggregate data)
        """
        hotel_id = request.query_params.get('hotel_id')

        hotel_filter = {}
        if hotel_id:
            try:
                hotel = Hotel.objects.get(id=hotel_id)
                hotel_filter = {'hotel': hotel}
            except Hotel.DoesNotExist:
                return Response(
                    {'error': 'Hotel not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

        today = date.today()
        start_of_month = today.replace(day=1)
        start_of_year = today.replace(month=1, day=1)

        # Today's stats
        todays_checkins = Booking.objects.filter(
            **hotel_filter,
            check_in_date=today,
            status__in=['confirmed', 'checked_in']
        ).count()

        todays_checkouts = Booking.objects.filter(
            **hotel_filter,
            check_out_date=today,
            status__in=['checked_in', 'checked_out']
        ).count()

        # Current occupancy
        total_rooms = Room.objects.filter(
            **{'hotel' if 'hotel' in hotel_filter else 'hotel__isnull': hotel_filter.get('hotel') if 'hotel' in hotel_filter else False},
            is_active=True
        ).count() if hotel_filter else Room.objects.filter(is_active=True).count()

        occupied_rooms = Booking.objects.filter(
            **hotel_filter,
            check_in_date__lte=today,
            check_out_date__gt=today,
            status='checked_in'
        ).count()

        current_occupancy = (occupied_rooms / total_rooms) * 100 if total_rooms > 0 else 0

        # Monthly revenue
        monthly_revenue = Booking.objects.filter(
            **hotel_filter,
            status__in=['confirmed', 'checked_out', 'completed'],
            created_at__date__gte=start_of_month
        ).aggregate(total=Sum('total_price'))['total'] or 0

        # Yearly revenue
        yearly_revenue = Booking.objects.filter(
            **hotel_filter,
            status__in=['confirmed', 'checked_out', 'completed'],
            created_at__date__gte=start_of_year
        ).aggregate(total=Sum('total_price'))['total'] or 0

        # Pending bookings
        pending_bookings = Booking.objects.filter(
            **hotel_filter,
            status='pending'
        ).count()

        # Cancellations this month
        cancellations = Booking.objects.filter(
            **hotel_filter,
            status='cancelled',
            cancelled_at__date__gte=start_of_month
        ).count()

        return Response({
            'date': today.isoformat(),
            'hotel_id': hotel_id,
            'todays_checkins': todays_checkins,
            'todays_checkouts': todays_checkouts,
            'current_occupancy': {
                'occupied_rooms': occupied_rooms,
                'total_rooms': total_rooms,
                'occupancy_rate': round(current_occupancy, 2)
            },
            'monthly_revenue': float(monthly_revenue),
            'yearly_revenue': float(yearly_revenue),
            'pending_bookings': pending_bookings,
            'cancellations_this_month': cancellations
        })

    @action(detail=False, methods=['get'])
    def service_popularity(self, request):
        """
        Get service popularity data - which ancillary services are most selected by guests
        Query params:
        - hotel_id: Optional (filter by hotel)
        """
        hotel_id = request.query_params.get('hotel_id')

        # Build filter
        filters = {}
        if hotel_id:
            try:
                hotel = Hotel.objects.get(id=hotel_id)
                filters['booking__hotel'] = hotel
            except Hotel.DoesNotExist:
                return Response(
                    {'error': 'Hotel not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Aggregate service charges by service name
        service_data = BookingServiceCharge.objects.filter(
            **filters
        ).values('service_name').annotate(
            total_bookings=Count('booking', distinct=True),
            total_quantity=Sum('quantity'),
            total_revenue=Sum('total_price')
        ).order_by('-total_bookings')

        data = [{
            'name': item['service_name'],
            'bookings': item['total_bookings'],
            'quantity': item['total_quantity'],
            'revenue': float(item['total_revenue'] or 0)
        } for item in service_data]

        # Calculate totals
        total_bookings_with_services = BookingServiceCharge.objects.filter(
            **filters
        ).values('booking').distinct().count()

        total_service_revenue = sum(d['revenue'] for d in data)

        return Response({
            'hotel_id': hotel_id,
            'data': data,
            'summary': {
                'total_bookings_with_services': total_bookings_with_services,
                'total_service_revenue': total_service_revenue,
                'most_popular_service': data[0]['name'] if data else None
            }
        })
