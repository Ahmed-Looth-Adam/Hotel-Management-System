# Edited By
# -> Ahmed Looth Adam, UWE ID: 24050761

"""
URL configuration for hotel_management project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from authentication import views as auth_views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Dashboard
    path('', auth_views.dashboard, name='dashboard'),

    # API auth endpoints (JSON-based for frontend)
    path('auth/', include('authentication.urls')),

    # Built-in Django auth template views (for admin/password reset)
    # Moved to different path to avoid conflicts with API endpoints
    path('accounts/', include('django.contrib.auth.urls')),

    # JWT endpoints
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Bookings API
    path('api/', include('bookings.urls')),

    # Hotels API
    path('api/hotels/', include('hotels.urls')),

    # Reports API
    path('api/reports/', include('reports.urls')),

    # Payments API
    path('api/payments/', include('payments.urls')),

    # Core API (Notifications)
    path('api/', include('core.urls')),

    # API Schema
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
