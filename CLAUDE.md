# Hotel Management System (HMS)

## Project Overview

A comprehensive Hotel Management System for the **Advanced Software Development** module (UFCF8S-30-2). This system allows users to search for rooms, check availability, and make bookings. Hotel staff manage room inventory, guest reservations, check-in/check-out processes, and billing.

### Key Objectives
- Multi-hotel property management (London, Paris, New York, etc.)
- Room booking with various room types (Standard, Deluxe, Suite, Family Room, Penthouse)
- Role-based access control for Guests, Staff, Managers, and Admins
- Secure authentication with audit logging
- Payment processing and invoice generation
- Reports and analytics

## Technology Stack

### Backend
- **Framework:** Django 5.2+ with Django REST Framework
- **Database:** PostgreSQL 15
- **Cache/Message Broker:** Redis
- **Task Queue:** Celery
- **Authentication:** JWT (djangorestframework-simplejwt)
- **API Docs:** drf-spectacular (OpenAPI/Swagger)

### Frontend
- **Framework:** React 19 with Vite 7
- **UI Library:** Material-UI (MUI) v7
- **Styling:** Tailwind CSS v3
- **Routing:** React Router v7
- **HTTP Client:** Axios
- **Forms:** Formik + Yup

### Infrastructure
- Docker & Docker Compose
- PostgreSQL 15 (port 5433)
- Redis (port 6379)
- Backend API (port 8000)
- Frontend Dev Server (port 5173)

## Project Structure

```
Hotel-Management-System/
├── backend/                    # Django REST Framework backend
│   ├── authentication/         # User management, JWT auth, audit logging
│   ├── hotels/                 # Hotel & room management, pricing
│   ├── bookings/               # Reservation system
│   ├── payments/               # Payment processing, invoicing
│   ├── reports/                # Analytics & reporting
│   ├── core/                   # Shared utilities & audit logs
│   └── hotel_management/       # Django project settings
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── pages/              # Page components by feature
│   │   ├── components/         # Reusable UI components
│   │   ├── services/           # API service layer
│   │   ├── context/            # React Context (AuthContext)
│   │   ├── hooks/              # Custom React hooks
│   │   └── utils/              # Utility functions
│   └── vite.config.js          # Vite configuration
├── a-docs/                     # Project documentation
├── docker-compose.yml          # Container orchestration
├── Dockerfile.backend          # Backend container
├── Pipfile                     # Python dependencies
└── .env                        # Environment configuration
```

## Backend Apps

| App | Purpose | Key Models |
|-----|---------|------------|
| `authentication` | User management, JWT auth | User, LoginAuditLog |
| `hotels` | Property & room management | Hotel, Room, RoomType, Amenity, AncillaryService |
| `bookings` | Reservation system | Booking, BookingGuest, RoomReassignment |
| `payments` | Payment & invoicing | Payment, Invoice, InvoiceItem, CancellationFee |
| `reports` | Analytics & reporting | Revenue, Occupancy reports |
| `core` | Shared utilities | AuditLog |

## User Roles & Permissions

### 1. Guest
- Search rooms, check availability and prices
- Make, view, and cancel bookings
- View booking history and invoices
- Manage user profile

### 2. Front Desk Staff
- Manage guest bookings (create, update, cancel)
- Perform guest check-in and check-out
- Manage room status (assign for cleaning, etc.)
- Process payments and generate bills

### 3. Hotel Manager
- Generate reports (occupancy, revenue, demographics)
- Manage room rates and availability
- Manage front desk staff accounts

### 4. Admin
- Maintain all user accounts (including managers)
- Configure system settings
- Add new hotel locations

### Staff User Fields (Admin-created users)
When Admin creates staff/manager users, the following fields are available:
- **first_name**, **last_name** (required)
- **email** (required)
- **phone_number**
- **profile_picture** (image upload)

## Security Requirements

### Authentication & Access Control
- Role-Based Access Control (RBAC)
- JWT tokens (15 min access, 7 days refresh)
- Secure cookies with HttpOnly and Secure flags
- Account lockout after 5 failed login attempts (15 min lockout)
- Strong password policy (min 8 chars, upper/lowercase, number, special char)
- Auto-logout after 15 minutes of inactivity
- Audit logs for logins, bookings, payments, check-in/out

### Data Security
- Database access controls
- Encrypted sensitive data at rest
- HSTS enforcement
- CORS configuration
- CSRF protection

## Fee Structure

### Room Rates (Per Night - GBP)
| Room Type | Capacity | Off-Peak | Peak Season |
|-----------|----------|----------|-------------|
| Standard Double | 2 | 120 | 180 |
| Deluxe King | 2 | 180 | 250 |
| Family Suite | 4 | 240 | 320 |
| Penthouse | 4 | 500 | 750 |

### Cancellation Fees
| Notice Period | Fee |
|--------------|-----|
| More than 14 days | Free |
| 3-14 days | 50% of first night |
| Less than 72 hours | 100% of first night |
| No-Show | 100% of entire booking |

### Ancillary Services
| Service | Fee (GBP) |
|---------|-----------|
| Airport Transfer (One-way) | 50 |
| Full English Breakfast (Per Person/Day) | 20 |
| Spa Access (Per Person/Day) | 35 |
| Late Check-out (until 2 PM) | 40 |

## API Endpoints

Base URL: `http://localhost:8000/api`

### Authentication (`/auth/`)
```
POST   /auth/register/              # User registration
POST   /auth/login/                 # JWT login
POST   /auth/logout/                # Logout (blacklist token)
POST   /auth/token/refresh/         # Refresh JWT token
GET    /auth/profile/               # Get user profile
PUT    /auth/profile/               # Update profile
POST   /auth/change-password/       # Change password
POST   /auth/password-reset/        # Request password reset
GET    /auth/admin/users/           # List users (admin)
PATCH  /auth/admin/users/{id}/      # Update user (admin)
```

### Hotels (`/api/hotels/`)
```
GET    /api/hotels/                 # List hotels
POST   /api/hotels/                 # Create hotel
GET    /api/hotels/{id}/            # Get hotel details
PUT    /api/hotels/{id}/            # Update hotel
GET    /api/hotels/{id}/rooms/      # List rooms
POST   /api/hotels/{id}/rooms/      # Create room
GET    /api/hotels/room-types/      # List room types
GET    /api/hotels/amenities/       # List amenities
GET    /api/hotels/ancillary-services/  # List services
```

### Bookings (`/api/bookings/`)
```
GET    /api/bookings/               # List bookings
POST   /api/bookings/               # Create booking
GET    /api/bookings/{id}/          # Get booking details
PUT    /api/bookings/{id}/          # Update booking
POST   /api/bookings/{id}/check-in/ # Check-in guest
POST   /api/bookings/{id}/check-out/# Check-out guest
POST   /api/bookings/{id}/cancel/   # Cancel booking
```

### Payments (`/api/payments/`)
```
GET    /api/payments/               # List payments
POST   /api/payments/               # Create payment
GET    /api/payments/{id}/          # Get payment details
POST   /api/payments/{id}/refund/   # Process refund
GET    /api/invoices/               # List invoices
GET    /api/invoices/{id}/          # Get invoice
```

### Reports (`/api/reports/`)
```
GET    /api/reports/occupancy/      # Occupancy rates
GET    /api/reports/revenue/        # Revenue analytics
GET    /api/reports/demographics/   # Guest demographics
```

**API Documentation:** http://localhost:8000/api/schema/swagger-ui/

## Development Setup

### Prerequisites
- Docker & Docker Compose
- Python 3.13+ (for local development)
- Node.js 18+ (for local frontend development)

### Quick Start with Docker
```bash
# Clone and navigate to project
cd Hotel-Management-System

# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec backend python manage.py migrate

# Create superuser (optional)
docker-compose exec backend python manage.py createsuperuser

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000/api
# API Docs: http://localhost:8000/api/schema/swagger-ui/
```

### Local Development (without Docker)

#### Backend
```bash
cd backend
pip install pipenv
pipenv install --dev
pipenv shell
python manage.py migrate
python manage.py runserver
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Common Development Tasks

### Database Operations
```bash
# Create migrations
docker-compose exec backend python manage.py makemigrations

# Apply migrations
docker-compose exec backend python manage.py migrate

# Access Django shell
docker-compose exec backend python manage.py shell
```

### Testing
```bash
# Run all tests
docker-compose exec backend pytest

# Run specific app tests
docker-compose exec backend pytest authentication/
docker-compose exec backend pytest hotels/
docker-compose exec backend pytest bookings/
```

### Code Quality
```bash
# Format code with Black
docker-compose exec backend black .

# Lint with Flake8
docker-compose exec backend flake8
```

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Key Files Reference

### Backend
- `backend/hotel_management/settings.py` - Django settings
- `backend/hotel_management/urls.py` - Main URL routing
- `backend/authentication/models.py` - User model with roles
- `backend/authentication/permissions.py` - Role-based permissions
- `backend/hotels/models.py` - Hotel, Room, Pricing models
- `backend/bookings/models.py` - Booking models
- `backend/payments/models.py` - Payment & Invoice models

### Frontend
- `frontend/src/App.jsx` - Main routing
- `frontend/src/context/AuthContext.jsx` - Auth state management
- `frontend/src/services/` - API service layer
- `frontend/src/components/ProtectedRoute.jsx` - Route protection

## Environment Variables

Key environment variables in `.env`:
```
# Django
DEBUG=True
SECRET_KEY=<your-secret-key>
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=hotel_management
DB_USER=postgres
DB_PASSWORD=<password>
DB_HOST=db
DB_PORT=5432

# Redis
REDIS_URL=redis://redis:6379/0

# JWT
JWT_ACCESS_TOKEN_LIFETIME=15  # minutes
JWT_REFRESH_TOKEN_LIFETIME=10080  # 7 days

# Security
SESSION_TIMEOUT=15  # minutes
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_TIME=15  # minutes
```

## Room Status Flow

```
Available -> Occupied (check-in)
Occupied -> Cleaning (check-out)
Cleaning -> Available (cleaned)
Any -> Out of Service (maintenance)
Out of Service -> Available (fixed)
```

## Booking Status Flow

```
Pending -> Confirmed (payment received)
Confirmed -> Checked In (guest arrives)
Checked In -> Checked Out (guest leaves)
Checked Out -> Completed (final payment processed)
Any -> Cancelled (cancellation requested)
Confirmed -> No Show (guest doesn't arrive)
```

## Notes for Development

1. **Always use role-based permissions** - Check `authentication/permissions.py` for available permission classes
2. **Audit logging** - All sensitive operations should be logged via `core/models.py` AuditLog
3. **Pricing calculations** - Use the pricing service layer for complex calculations involving seasonal, day-type, and view-based pricing
4. **API responses** - Follow REST conventions with proper HTTP status codes
5. **Frontend state** - Use AuthContext for user authentication state
6. **Protected routes** - Wrap admin/staff routes with ProtectedRoute component
