from rest_framework.pagination import PageNumberPagination


class FlexiblePageNumberPagination(PageNumberPagination):
    """
    Pagination class that allows clients to control page size.
    Useful for guest browsing where we need to fetch all available rooms.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 1000
