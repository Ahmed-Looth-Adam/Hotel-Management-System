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

from bookings.models import Booking, CheckInRecord
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
        Get occupancy rates for hotels
        Query params:
        - hotel_id: Optional (if not provided, returns aggregate data for all hotels)
        - start_date: Start of period (default: 30 days ago)
        - end_date: End of period (default: today)
        """
        hotel_id = request.query_params.get('hotel_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        # Parse dates
        if end_date:
            end_date = date.fromisoformat(end_date)
        else:
            end_date = date.today()

        if start_date:
            start_date = date.fromisoformat(start_date)
        else:
            start_date = end_date - timedelta(days=30)

        # Build hotel filter
        hotel_filter = {}
        hotel_name = "All Hotels"
        if hotel_id:
            try:
                hotel = Hotel.objects.get(id=hotel_id)
                hotel_filter = {'hotel': hotel}
                hotel_name = hotel.name
            except Hotel.DoesNotExist:
                return Response(
                    {'error': 'Hotel not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Get total rooms count
        room_filter = {'is_active': True}
        if hotel_id:
            room_filter['hotel_id'] = hotel_id
        total_rooms = Room.objects.filter(**room_filter).count()

        if total_rooms == 0:
            return Response({
                'hotel_id': hotel_id,
                'hotel_name': hotel_name,
                'total_rooms': 0,
                'occupied_rooms': 0,
                'available_rooms': 0,
                'occupancy_rate': 0,
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'by_room_type': [],
                'by_hotel': []
            })

        # Get current occupancy (checked_in bookings for today)
        today = date.today()
        booking_filter = {
            'check_in_date__lte': today,
            'check_out_date__gt': today,
            'status': 'checked_in'
        }
        if hotel_id:
            booking_filter['hotel_id'] = hotel_id

        occupied_rooms = Booking.objects.filter(**booking_filter).count()
        available_rooms = total_rooms - occupied_rooms
        occupancy_rate = (occupied_rooms / total_rooms) * 100 if total_rooms > 0 else 0

        # Occupancy by room type
        room_types = Room.objects.filter(**room_filter).values('room_type_category').annotate(
            total=Count('id')
        )

        by_room_type = []
        for rt in room_types:
            room_type = rt['room_type_category']
            total_of_type = rt['total']

            # Count occupied rooms of this type
            occupied_filter = {
                'check_in_date__lte': today,
                'check_out_date__gt': today,
                'status': 'checked_in',
                'room__room_type_category': room_type
            }
            if hotel_id:
                occupied_filter['hotel_id'] = hotel_id

            occupied_of_type = Booking.objects.filter(**occupied_filter).count()
            type_occupancy = (occupied_of_type / total_of_type) * 100 if total_of_type > 0 else 0

            by_room_type.append({
                'room_type': room_type or 'Unknown',
                'total': total_of_type,
                'occupied': occupied_of_type,
                'occupancy_rate': round(type_occupancy, 1)
            })

        # Occupancy by hotel (only when showing all hotels)
        by_hotel = []
        if not hotel_id:
            hotels = Hotel.objects.filter(is_active=True)
            for h in hotels:
                h_total = Room.objects.filter(hotel=h, is_active=True).count()
                h_occupied = Booking.objects.filter(
                    hotel=h,
                    check_in_date__lte=today,
                    check_out_date__gt=today,
                    status='checked_in'
                ).count()
                h_available = h_total - h_occupied
                h_rate = (h_occupied / h_total) * 100 if h_total > 0 else 0

                by_hotel.append({
                    'id': h.id,
                    'name': h.name,
                    'total_rooms': h_total,
                    'occupied': h_occupied,
                    'available': h_available,
                    'occupancy_rate': round(h_rate, 1)
                })

        return Response({
            'hotel_id': hotel_id,
            'hotel_name': hotel_name,
            'total_rooms': total_rooms,
            'occupied_rooms': occupied_rooms,
            'available_rooms': available_rooms,
            'occupancy_rate': round(occupancy_rate, 1),
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'by_room_type': by_room_type,
            'by_hotel': by_hotel
        })

    @action(detail=False, methods=['get'])
    def revenue(self, request):
        """
        Get revenue reports
        Query params:
        - hotel_id: Optional (if not provided, returns aggregate data for all hotels)
        - start_date: Start of period
        - end_date: End of period
        """
        hotel_id = request.query_params.get('hotel_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        # Parse dates
        if end_date:
            end_date = date.fromisoformat(end_date)
        else:
            end_date = date.today()

        if start_date:
            start_date = date.fromisoformat(start_date)
        else:
            start_date = end_date - timedelta(days=30)

        # Build filter
        booking_filter = {
            'status__in': ['confirmed', 'checked_in', 'checked_out', 'completed'],
            'created_at__date__gte': start_date,
            'created_at__date__lte': end_date
        }
        if hotel_id:
            booking_filter['hotel_id'] = hotel_id

        bookings = Booking.objects.filter(**booking_filter)

        # Total revenue and bookings
        totals = bookings.aggregate(
            total_revenue=Sum('total_price'),
            total_bookings=Count('id'),
            average_booking_value=Avg('total_price')
        )

        total_revenue = float(totals['total_revenue'] or 0)
        total_bookings = totals['total_bookings'] or 0
        average_booking_value = float(totals['average_booking_value'] or 0)

        # Pending revenue
        pending_filter = {
            'payment_status': 'pending',
            'created_at__date__gte': start_date,
            'created_at__date__lte': end_date
        }
        if hotel_id:
            pending_filter['hotel_id'] = hotel_id

        pending_revenue = Booking.objects.filter(**pending_filter).aggregate(
            total=Sum('total_price')
        )['total'] or 0

        # Revenue by payment status
        by_payment_status = bookings.values('payment_status').annotate(
            count=Count('id'),
            total=Sum('total_price')
        ).order_by('-total')

        payment_status_data = [{
            'status': item['payment_status'] or 'unknown',
            'count': item['count'],
            'total': float(item['total'] or 0)
        } for item in by_payment_status]

        # Revenue by room type
        by_room_type = bookings.values(
            room_type=F('room__room_type_category')
        ).annotate(
            bookings=Count('id'),
            revenue=Sum('total_price')
        ).order_by('-revenue')

        room_type_data = [{
            'room_type': item['room_type'] or 'Unknown',
            'bookings': item['bookings'],
            'revenue': float(item['revenue'] or 0)
        } for item in by_room_type]

        # Revenue by hotel (only when showing all hotels)
        by_hotel = []
        if not hotel_id:
            hotel_revenue = bookings.values(
                'hotel__id', 'hotel__name'
            ).annotate(
                bookings=Count('id'),
                revenue=Sum('total_price'),
                average=Avg('total_price')
            ).order_by('-revenue')

            for item in hotel_revenue:
                percentage = (float(item['revenue'] or 0) / total_revenue * 100) if total_revenue > 0 else 0
                by_hotel.append({
                    'id': item['hotel__id'],
                    'name': item['hotel__name'],
                    'bookings': item['bookings'],
                    'revenue': float(item['revenue'] or 0),
                    'average': float(item['average'] or 0),
                    'percentage': round(percentage, 1)
                })

        return Response({
            'hotel_id': hotel_id,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'total_revenue': total_revenue,
            'total_bookings': total_bookings,
            'average_booking_value': average_booking_value,
            'pending_revenue': float(pending_revenue),
            'by_payment_status': payment_status_data,
            'by_room_type': room_type_data,
            'by_hotel': by_hotel
        })

    @action(detail=False, methods=['get'])
    def guest_demographics(self, request):
        """
        Get guest booking patterns and demographics
        Query params:
        - hotel_id: Optional (if not provided, returns aggregate data)
        - start_date: Start of period
        - end_date: End of period
        """
        hotel_id = request.query_params.get('hotel_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        # Parse dates
        if end_date:
            end_date = date.fromisoformat(end_date)
        else:
            end_date = date.today()

        if start_date:
            start_date = date.fromisoformat(start_date)
        else:
            start_date = end_date - timedelta(days=365)

        # Build filter
        booking_filter = {
            'created_at__date__gte': start_date,
            'created_at__date__lte': end_date
        }
        if hotel_id:
            booking_filter['hotel_id'] = hotel_id

        bookings = Booking.objects.filter(**booking_filter)
        total_bookings = bookings.count()

        # Demographics by nationality (from check-in records)
        checkin_filter = {
            'booking__created_at__date__gte': start_date,
            'booking__created_at__date__lte': end_date
        }
        if hotel_id:
            checkin_filter['booking__hotel_id'] = hotel_id

        # Get nationality from check-in records (primary guests only for accurate count)
        by_country = CheckInRecord.objects.filter(
            **checkin_filter,
            guest_type='primary'
        ).values('nationality').annotate(
            count=Count('id')
        ).order_by('-count')

        total_checkins = sum(item['count'] for item in by_country)

        country_data = []
        for item in by_country:
            percentage = (item['count'] / total_checkins * 100) if total_checkins > 0 else 0
            country_data.append({
                'country': item['nationality'] or 'Unknown',
                'count': item['count'],
                'percentage': round(percentage, 1)
            })

        # If no check-in records, fall back to user country
        if not country_data:
            by_user_country = bookings.values(
                country=F('user__country')
            ).annotate(
                count=Count('id')
            ).order_by('-count')

            for item in by_user_country:
                if item['country']:  # Only include if country is set
                    percentage = (item['count'] / total_bookings * 100) if total_bookings > 0 else 0
                    country_data.append({
                        'country': item['country'],
                        'count': item['count'],
                        'percentage': round(percentage, 1)
                    })

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

        # Find peak booking day
        peak_day = max(bookings_by_day, key=lambda x: x['bookings'])['day'] if bookings_by_day else None

        # Average length of stay
        stay_lengths = []
        for booking in bookings:
            stay_lengths.append(booking.number_of_nights)
        avg_stay_length = sum(stay_lengths) / len(stay_lengths) if stay_lengths else 0

        # Repeat guests
        repeat_guests = bookings.values('user').annotate(
            booking_count=Count('id')
        ).filter(booking_count__gt=1).count()

        total_guests = bookings.values('user').distinct().count()

        # Average lead time (days between booking creation and check-in)
        lead_times = []
        for booking in bookings:
            lead_time = (booking.check_in_date - booking.created_at.date()).days
            if lead_time >= 0:
                lead_times.append(lead_time)
        avg_lead_time = sum(lead_times) / len(lead_times) if lead_times else 0

        return Response({
            'hotel_id': hotel_id,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'total_bookings': total_bookings,
            'by_country': country_data,
            'bookings_by_day_of_week': bookings_by_day,
            'booking_patterns': {
                'average_stay': round(avg_stay_length, 1),
                'repeat_guests': repeat_guests,
                'average_lead_time': round(avg_lead_time, 0),
                'peak_booking_day': peak_day
            }
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

        # Total bookings and revenue
        booking_filter = {'status__in': ['confirmed', 'checked_in', 'checked_out', 'completed']}
        if hotel_id:
            booking_filter['hotel_id'] = hotel_id

        all_bookings = Booking.objects.filter(**booking_filter)
        total_bookings = all_bookings.count()
        total_revenue = all_bookings.aggregate(total=Sum('total_price'))['total'] or 0

        # Active guests (currently checked in)
        active_filter = {'status': 'checked_in'}
        if hotel_id:
            active_filter['hotel_id'] = hotel_id
        active_guests = Booking.objects.filter(**active_filter).aggregate(
            total=Sum('guests_count')
        )['total'] or 0

        # Current occupancy
        room_filter = {'is_active': True}
        if hotel_id:
            room_filter['hotel_id'] = hotel_id
        total_rooms = Room.objects.filter(**room_filter).count()

        occupied_filter = {
            'check_in_date__lte': today,
            'check_out_date__gt': today,
            'status': 'checked_in'
        }
        if hotel_id:
            occupied_filter['hotel_id'] = hotel_id
        occupied_rooms = Booking.objects.filter(**occupied_filter).count()

        occupancy_rate = (occupied_rooms / total_rooms) * 100 if total_rooms > 0 else 0

        # Bookings by status
        status_filter = {}
        if hotel_id:
            status_filter['hotel_id'] = hotel_id

        bookings_by_status = Booking.objects.filter(**status_filter).values('status').annotate(
            count=Count('id')
        )

        total_all = sum(item['count'] for item in bookings_by_status)
        status_data = []
        for item in bookings_by_status:
            percentage = (item['count'] / total_all * 100) if total_all > 0 else 0
            status_data.append({
                'status': item['status'],
                'count': item['count'],
                'percentage': round(percentage, 1)
            })

        # Top hotels by revenue (only when showing all hotels)
        top_hotels = []
        if not hotel_id:
            hotel_stats = Booking.objects.filter(
                status__in=['confirmed', 'checked_in', 'checked_out', 'completed']
            ).values('hotel__id', 'hotel__name').annotate(
                bookings=Count('id'),
                revenue=Sum('total_price')
            ).order_by('-revenue')[:5]

            for item in hotel_stats:
                h_id = item['hotel__id']
                h_total_rooms = Room.objects.filter(hotel_id=h_id, is_active=True).count()
                h_occupied = Booking.objects.filter(
                    hotel_id=h_id,
                    check_in_date__lte=today,
                    check_out_date__gt=today,
                    status='checked_in'
                ).count()
                h_occupancy = (h_occupied / h_total_rooms * 100) if h_total_rooms > 0 else 0

                top_hotels.append({
                    'id': h_id,
                    'name': item['hotel__name'],
                    'bookings': item['bookings'],
                    'revenue': float(item['revenue'] or 0),
                    'occupancy_rate': round(h_occupancy, 1)
                })

        return Response({
            'date': today.isoformat(),
            'hotel_id': hotel_id,
            'total_bookings': total_bookings,
            'total_revenue': float(total_revenue),
            'active_guests': active_guests,
            'occupancy_rate': round(occupancy_rate, 1),
            'bookings_by_status': status_data,
            'top_hotels': top_hotels
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

        services = [{
            'name': item['service_name'],
            'booking_count': item['total_bookings'],
            'quantity': item['total_quantity'],
            'total_revenue': float(item['total_revenue'] or 0)
        } for item in service_data]

        # Calculate totals
        total_bookings_with_services = BookingServiceCharge.objects.filter(
            **filters
        ).values('booking').distinct().count()

        total_service_revenue = sum(d['total_revenue'] for d in services)

        return Response({
            'hotel_id': hotel_id,
            'services': services,
            'summary': {
                'total_bookings_with_services': total_bookings_with_services,
                'total_service_revenue': total_service_revenue,
                'most_popular_service': services[0]['name'] if services else None
            }
        })
