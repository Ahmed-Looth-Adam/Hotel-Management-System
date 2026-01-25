# Hotel Management System

A comprehensive Hotel Management System built with Django REST Framework (backend) and React (frontend), featuring room management, booking systems, payment processing, and analytics.

---

## 👥 Team Members

| Name | UWE ID | Role |
|------|--------|------|
| Ismail Wasiu Abdul Samad | 24050765 | Lead Developer |
| Ahmed Looth Adam | 24050761 | Developer |
| Ibrahim Waseem | 24050771 | Developer |
| Mohamed Lujain Shakeeb Ahmed | 24050760 | Developer |
| Awf Ibrahim Mohamed | 24047957 | Developer |
| Ismail Vishal | 24050734 | Developer |

---

## 🚀 Technology Stack

### Backend
- Django 5.2+ with Django REST Framework
- PostgreSQL 15
- JWT Authentication (djangorestframework-simplejwt)
- Celery with Redis
- drf-spectacular (OpenAPI/Swagger)

### Frontend
- React 19 + Vite 7
- Material-UI (MUI) v7
- Tailwind CSS v3
- Axios, Formik, React Router v7

### DevOps
- Docker & Docker Compose
- Git & GitHub

---

## 📁 Project Structure

```
Hotel-Management-System/
├── backend/
│   ├── hotel_management/       # Django project settings
│   ├── authentication/         # User management & JWT auth
│   ├── hotels/                 # Hotel & room management
│   ├── bookings/               # Booking system
│   ├── payments/               # Payment processing
│   ├── reports/                # Analytics & reports
│   ├── core/                   # Shared utilities & audit logs
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API service layer
│   │   ├── context/            # React Context providers
│   │   ├── hooks/              # Custom React hooks
│   │   └── utils/              # Utility functions
│   ├── package.json
│   └── vite.config.js
│
├── docker-compose.yml
├── Dockerfile.backend
├── Pipfile
└── .env
```

---

## 🔧 Prerequisites

- Docker Desktop (latest version)
- Git

---

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Ahmed-Looth-Adam/Hotel-Management-System.git
cd Hotel-Management-System
```

### 2. Environment Setup

```bash
cp .env.examples .env
```

Update `.env` with your configuration:

```env
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1,backend

# Database
RDS_DB_NAME=hotel_management_system
RDS_USERNAME=postgres
RDS_PASSWORD=123
RDS_HOST=db
RDS_PORT=5432

# Redis
REDIS_URL=redis://redis:6379/0

# JWT Settings
JWT_ACCESS_TOKEN_LIFETIME=15
JWT_REFRESH_TOKEN_LIFETIME=7

# Field-level Encryption Key (Fernet key for sensitive data)
FIELD_ENCRYPTION_KEY=your-fernet-key-here

# Frontend
FRONTEND_URL=http://localhost:5173
```

### Generating an Encryption Key

The system uses Fernet encryption (AES-128) for sensitive data at rest (passport/ID numbers, 2FA secrets). You must generate a unique encryption key:

```bash
# Generate a new Fernet encryption key
docker-compose exec backend python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Or without Docker:
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Copy the generated key to your `.env` file as `FIELD_ENCRYPTION_KEY`.

> ⚠️ **Important:** Keep your encryption key secure. Data encrypted with one key cannot be decrypted with a different key. If you lose the key, encrypted data becomes unrecoverable.

### 3. Build and Start Services

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f
```

### 4. Initialize Database

```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser
```

### 5. Access the Application

- **Frontend:** http://localhost:5173
- **Backend Admin:** http://localhost:8000/admin
- **API Docs:** http://localhost:8000/api/schema/swagger-ui/

---

## 🐳 Docker Commands

### Service Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart specific service
docker-compose restart backend

# Rebuild
docker-compose up -d --build

# View logs
docker-compose logs -f backend
```

### Backend Commands

```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create migrations
docker-compose exec backend python manage.py makemigrations

# Django shell
docker-compose exec backend python manage.py shell

# Run tests
docker-compose exec backend pytest

# Access container
docker-compose exec backend bash
```

### Frontend Commands

```bash
# Install package
docker-compose exec frontend npm install package-name

# Build for production
docker-compose exec frontend npm run build

# Access container
docker-compose exec frontend sh
```

### Database Management

```bash
# Access PostgreSQL shell
docker-compose exec db psql -U postgres -d hotel_management_system

# Backup database
docker-compose exec db pg_dump -U postgres hotel_management_system > backup_$(date +%Y%m%d).sql

# Restore database
docker-compose exec -T db psql -U postgres hotel_management_system < backup.sql
```

---

## 🌐 API Endpoints

### Authentication
```
POST   /api/auth/register/
POST   /api/auth/login/
POST   /api/auth/logout/
POST   /api/auth/token/refresh/
POST   /api/auth/password-reset/
```

### Hotels & Rooms
```
GET    /api/hotels/
GET    /api/rooms/
GET    /api/rooms/search/
PATCH  /api/rooms/{id}/status/
```

### Bookings
```
GET    /api/bookings/
POST   /api/bookings/
PATCH  /api/bookings/{id}/
DELETE /api/bookings/{id}/
```

### Payments & Reports
```
POST   /api/payments/
GET    /api/invoices/{id}/
GET    /api/reports/occupancy/
GET    /api/reports/revenue/
```

**Full API documentation:** http://localhost:8000/api/schema/swagger-ui/

---

## 🔐 Security Features

- JWT-based authentication with access/refresh tokens
- Two-Factor Authentication (2FA) with TOTP (Time-based One-Time Password)
- Password strength validation (min 8 chars, uppercase, lowercase, number)
- Password expiration policy for staff/managers (6 months)
- Account lockout after 5 failed login attempts (15 min)
- Automatic session timeout (15 min access token)
- Email verification required for guest registration
- **Field-level encryption for sensitive data at rest** (passport/ID numbers, 2FA secrets using Fernet AES-128)
- Comprehensive audit logging for sensitive operations
- CORS configuration for secure cross-origin requests
- Role-based access control (RBAC)

---

## 👤 User Roles & Access Levels

The system supports four distinct user roles with different access levels:

### 1. Guest (Default)
**Registration:** Open to public via `/register`

**Capabilities:**
- Browse hotels and rooms
- Make room bookings
- Manage their own bookings
- Edit bookings before check-in
- Add multiple rooms to bookings
- Save payment cards for future use
- View booking history
- Update profile information

**Restrictions:**
- Cannot access admin/staff/manager features
- Cannot see other users' bookings

### 2. Staff
**Creation:** Admin creates staff accounts and assigns them to a hotel

**Capabilities:**
- View all bookings for assigned hotel
- Check-in/check-out guests
- Manage room status (Available, Cleaning, Out of Service)
- View daily operations dashboard
- Process booking modifications
- All guest capabilities

**Restrictions:**
- Limited to assigned hotel only
- Cannot modify hotel settings
- Cannot create/delete users

**2FA:** Required for all staff users

### 3. Manager
**Creation:** Admin creates manager accounts and assigns them to hotels

**Capabilities:**
- Manage assigned hotels (pricing, policies, services)
- View bookings for managed hotels
- Configure seasonal pricing
- Manage ancillary services
- Update hotel policies
- Manage hotel galleries
- View hotel reports and analytics
- All staff capabilities

**Restrictions:**
- Can only manage assigned hotels
- Cannot access system-wide settings
- Cannot create admin users

**2FA:** Required for all manager users

### 4. Admin (Superuser)
**Creation:** Via `python manage.py createsuperuser` command

**Capabilities:**
- Full system access
- Manage all users (create, edit, delete)
- Assign managers to hotels
- Assign staff to hotels
- Configure system-wide settings
- Access all hotels and bookings
- View all reports
- Django admin panel access

**2FA:** Required for all admin users

---

## 🚪 User Registration & Authentication

### Guest Registration

1. **Navigate to Registration Page**
   ```
   http://localhost:5173/register
   ```

2. **Fill in Registration Form**
   - Username (unique)
   - Email address (unique, must be valid)
   - Password (min 8 chars, must include uppercase, lowercase, and number)
   - Confirm password
   - Optional: First name, last name, phone, address details

3. **Email Verification**
   - Check your email inbox for verification link
   - Click the verification link to activate your account
   - Return to login page

4. **Login**
   - Use your username and password
   - No 2FA required for guest users

### Staff/Manager/Admin Login with 2FA

#### First-Time 2FA Setup

1. **Login with Credentials**
   ```
   http://localhost:5173/login
   ```
   - Enter username and password
   - If 2FA is not set up, you'll be redirected to 2FA setup

2. **Set Up 2FA**
   - Install an authenticator app (Google Authenticator, Authy, Microsoft Authenticator)
   - Scan the QR code displayed
   - Or manually enter the secret key shown
   - Enter the 6-digit verification code from your authenticator app
   - Click "Verify & Enable 2FA"

3. **2FA Enabled**
   - You'll be logged in automatically
   - 2FA is now required for all future logins

#### Subsequent Logins with 2FA

1. **Enter Credentials**
   ```
   http://localhost:5173/login
   ```
   - Enter username and password
   - Click "Sign In"

2. **Enter 2FA Code**
   - You'll be redirected to 2FA verification page
   - Open your authenticator app
   - Enter the current 6-digit code
   - Click "Verify"

3. **Access Granted**
   - Successfully logged in
   - Redirected to appropriate dashboard based on role

### Password Reset

1. **Forgot Password Page**
   ```
   http://localhost:5173/forgot-password
   ```

2. **Enter Email Address**
   - Receive password reset email
   - Click the reset link
   - Enter new password
   - Confirm new password

### Disable/Reset 2FA (Admin Only)

Admins can disable 2FA for users via Django admin panel:
```
http://localhost:8000/admin/authentication/user/
```
- Find the user
- Uncheck "2FA Enabled"
- Clear "2FA Secret" field
- Save

---

## 🏨 Core Features

### 1. Hotel Management
- **Multi-property Support:** Manage multiple hotels
- **Hotel Information:** Name, location, address, star rating, description
- **Manager Assignment:** Assign managers to specific hotels
- **Check-in/Check-out Times:** Configurable per hotel
- **Seasonal Pricing:** Define peak and off-peak seasons with price multipliers
- **Hotel Activation/Deactivation:** Temporarily disable hotels

### 2. Room Management
- **Room Types:** Standard Double, Deluxe King, Family Suite, Penthouse
- **Bed Sizes:** King, Queen, Twin
- **Room Status:** Available, Occupied, Cleaning, Out of Service
- **Room Views:** Ocean, Garden, Beach, City, Mountain
- **Max Occupancy:** Configurable per room
- **Room Galleries:** Multiple image galleries per hotel

### 3. Booking System
- **Multi-room Bookings:** Add multiple rooms in a single booking
- **Date Range Selection:** Check-in and check-out dates
- **Guest Count:** Specify number of guests
- **Booking References:** Unique reference codes (BK-XXXXXXXX)
- **Booking Status:** Confirmed, Checked In, Checked Out, Cancelled, No Show
- **Booking Modification:** Edit bookings before check-in
- **Cancellation Policy:** Automated cancellation fee calculation
  - 14+ days before: Free cancellation
  - 3-14 days before: 50% of first night
  - <72 hours: 100% of first night
  - No-show: 100% of total booking

### 4. Payment Processing
- **Secure Card Storage:** PCI-compliant saved cards with encryption
- **Payment Methods:** Credit/Debit cards
- **Payment Status:** Paid, Partial, Refunded
- **Invoice Generation:** Detailed invoices with itemized charges
- **Refund Processing:** Full and partial refunds
- **Multiple Payments:** Split payments across multiple transactions
- **Saved Cards:** Save cards for future bookings

### 5. Ancillary Services
- **Service Types:**
  - Transportation (Airport pickup/drop-off)
  - Dining (Breakfast buffet, room service)
  - Spa & Wellness (Massages, treatments)
  - Activities (Tours, excursions)
- **Dynamic Pricing:** Per-service pricing
- **Booking Integration:** Add services during booking

### 6. Hotel Policies
- **Policy Types:**
  - Cancellation Policy
  - Check-in Policy
  - Check-out Policy
  - Payment Policy
  - House Rules
  - Children Policy
  - Pet Policy
  - Smoking Policy
- **Multi-language Support:** Ready for internationalization

### 7. Reporting & Analytics
- **Occupancy Reports:** Daily/weekly/monthly occupancy rates
- **Revenue Reports:** Revenue breakdown by hotel/room type
- **Booking Analytics:** Booking trends and statistics
- **Guest Analytics:** Guest demographics and behavior

### 8. Gallery Management
- **Hotel Galleries:** Showcase hotel facilities
- **Room Galleries:** Display room types and views
- **Image Upload:** Multiple images per gallery
- **Primary Image Selection:** Set featured images
- **Sort Order:** Custom image ordering

---

## 🧪 Testing

### Running Tests

The system includes 88 comprehensive tests covering all modules:

```bash
# Run all tests
docker-compose exec backend pytest

# Run with coverage
docker-compose exec backend pytest --cov=. --cov-report=html

# Run specific module tests
docker-compose exec backend pytest authentication/tests.py
docker-compose exec backend pytest hotels/tests.py
docker-compose exec backend pytest bookings/tests.py
docker-compose exec backend pytest payments/tests.py
```

### Test Coverage

| Module | Tests | Coverage |
|--------|-------|----------|
| Authentication | 38 | ~90% models |
| Hotels/Rooms | 30 | ~82% models |
| Bookings | 20 | ~65% models |
| Payments | 2 | ~51% models |
| Core | 2 | ~42% fields |
| Reports | 2 | - |
| **TOTAL** | **88** | **100% Pass Rate** |

### Test Documentation

For detailed testing documentation, see:
```
Testing_Documentation.ipynb
```

Run tests interactively:
```bash
jupyter notebook Testing_Documentation.ipynb
```

---

## 👥 Demo Accounts

For testing purposes, you can create demo accounts with different roles:

### Create Admin Account
```bash
docker-compose exec backend python manage.py createsuperuser
# Username: admin
# Email: admin@hms.com
# Password: [secure password]
```

### Create Manager Account (via Django Admin)
1. Login to admin panel: http://localhost:8000/admin
2. Go to Authentication → Users
3. Click "Add User"
4. Set username, email, password
5. Set role to "manager"
6. Check "Email verified"
7. Save

Then assign hotel to manager:
1. Go to Hotels → Hotels
2. Edit a hotel
3. Select the manager in "Manager" dropdown
4. Save

### Create Staff Account (via Django Admin)
1. Follow same steps as manager
2. Set role to "staff"
3. Check "Is staff" checkbox
4. Assign to hotel via "Assigned hotel" dropdown

### Create Guest Account
1. Go to registration page: http://localhost:5173/register
2. Fill in registration form
3. Verify email
4. Login

---

## 🔄 Git Workflow

### Git Configuration Setup

**IMPORTANT:** Configure your Git identity before making commits. This ensures your name and UWE ID are included in all commits.

```bash
# Set your name with UWE ID
git config user.name "Your Full Name (UWE ID: XXXXXXXX)"

# Set your UWE email
git config user.email "your.name@live.uwe.ac.uk"

# Verify configuration
git config user.name
git config user.email
```

**Example:**
```bash
git config user.name "Ismail Wasiu Abdul Samad (UWE ID: 24050765)"
git config user.email "Ismail2.Abdulsamad@live.uwe.ac.uk"
```

**Note:** Use `--global` flag to set configuration for all repositories:
```bash
git config --global user.name "Your Full Name (UWE ID: XXXXXXXX)"
git config --global user.email "your.name@live.uwe.ac.uk"
```

### Branch Strategy

```
main (production)
  ↑
staging
  ↑
development
  ↑
feature/US-XX-feature-name
```

### Working on a Feature

```bash
# Update development
git checkout development
git pull origin development

# Create feature branch
git checkout -b feature/US-01-user-registration

# Commit changes
git add .
git commit -m "feat(auth): Add user registration endpoint"

# Push and create PR
git push origin feature/US-01-user-registration
```

### Commit Message Convention

```
<type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, test, chore
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Check port usage
lsof -i :5432
lsof -i :8000
lsof -i :5173

# Stop local PostgreSQL
brew services stop postgresql  # Mac
sudo service postgresql stop   # Linux
```

### Database Connection Issues

```bash
# Restart database
docker-compose restart db

# Reset database (⚠️ deletes data)
docker-compose down -v
docker-compose up -d
docker-compose exec backend python manage.py migrate
```

### Clear Docker Cache

```bash
# Clear all cache
docker system prune -a --volumes -f

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

---

## ⚠️ Important Notes

- Never commit `.env` file
- Always use feature branches
- Run tests before pushing
- Write clear commit messages
- Docker volumes persist data - use `docker-compose down -v` carefully

---

## 📞 Support

- Create an issue on GitHub
- Contact the Scrum Master
- Check `/docs` folder
- Ask in team Slack/Discord channel

---

## 🔑 Creating an Admin User

To access the admin panel and manage the system, create a superuser account:

```bash
# Create superuser
docker-compose exec backend python manage.py createsuperuser
```

You will be prompted to enter:
- Username
- Email address
- Password

Once created, you can log in at:
- **Admin Panel:** http://localhost:8000/admin
- **Frontend:** http://localhost:5173

---

**Last Updated:** January 1, 2026
**Version:** 1.2.0
**Status:** Production Ready

## 📋 Changelog

### Version 1.2.0 (January 1, 2026)
- ✅ Added comprehensive 2FA setup and login documentation
- ✅ Added detailed user roles and access levels
- ✅ Added multi-room booking feature
- ✅ Added saved cards payment feature
- ✅ Added booking edit functionality
- ✅ Added seasonal pricing management
- ✅ Added ancillary services support
- ✅ Added hotel policies management
- ✅ Added gallery management system
- ✅ Fixed manager hotel filtering
- ✅ Fixed manager booking access
- ✅ Added 88 comprehensive tests (100% pass rate)
- ✅ Updated security documentation
- ✅ Added demo accounts setup guide

### Version 1.0.0 (December 20, 2024)
- Initial production release
