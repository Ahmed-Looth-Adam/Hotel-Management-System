"""
Custom middleware to disable CSRF for API endpoints
"""


class DisableCSRFForAPIMiddleware:
    """
    Middleware to disable CSRF protection for API endpoints that use JWT authentication.
    This allows JWT-authenticated API calls from the frontend without CSRF tokens.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Disable CSRF for API endpoints
        if request.path.startswith('/auth/') or request.path.startswith('/api/'):
            setattr(request, '_dont_enforce_csrf_checks', True)

        response = self.get_response(request)
        return response
