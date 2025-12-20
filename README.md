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

- JWT-based authentication
- Two-Factor Authentication (2FA) for staff users
- Password strength validation
- Password expiration policy for staff (6 months)
- Account lockout after 5 failed attempts (15 min)
- Automatic session timeout (15 min)
- Email verification for guest registration
- **Field-level encryption for sensitive data at rest** (passport/ID numbers, 2FA secrets)
- Audit logging for sensitive operations
- CORS configuration

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

**Last Updated:** December 20, 2024
**Version:** 1.0.0
**Status:** Production
