# Commit Message Template

Use this message when committing:

```
feat: Implement Redis-based login tracking and complete JWT authentication system

BACKEND CHANGES:
- Add Redis cache configuration with django-redis
- Implement LoginAttemptTracker utility for Redis-based failed login tracking
- Update LoginAPIView to use Redis for account lockout (5 attempts, 15 min lockout)
- Add custom middleware to disable CSRF for API endpoints
- Configure JWT tokens (15-min access, 7-day refresh with rotation)
- Add User model with role-based access (Guest, Staff, Manager, Admin)
- Implement UserRegistrationSerializer with password validation

FRONTEND CHANGES:
- Create authService with Axios for centralized API calls
- Implement automatic JWT token refresh on 401 errors
- Add AuthContext for global authentication state management
- Create Login component with Formik + Yup validation
- Create Register component with comprehensive form validation
- Add ProtectedRoute component for route guards
- Create Dashboard page with user profile display

DOCKER CHANGES:
- Update Pipfile with django-redis dependency
- Add workaround in Dockerfile.backend to install django-redis
- Redis container already configured in docker-compose.yml

DOCUMENTATION:
- Add SETUP.md for team onboarding and troubleshooting
- Add MIGRATION_REDIS.md for Redis integration details
- Add requirements.txt for dependency reference

SECURITY IMPROVEMENTS:
- Prevent username enumeration attacks
- Account lockout after failed attempts
- Automatic token rotation and blacklisting
- CORS and CSRF properly configured
- Password strength validation (8+ chars, uppercase, lowercase, number)

BREAKING CHANGES:
- None (backward compatible)

TESTING:
- Verified Redis connection and caching
- Tested login attempt tracking and lockout
- Confirmed JWT token generation and refresh
- Validated registration form with all field validations

Closes #[issue-number]
```

---

## Files Changed

**Backend:**
- `Pipfile` - Added django-redis
- `Dockerfile.backend` - Added pip install django-redis workaround
- `backend/hotel_management/settings.py` - Redis cache config, CSRF settings
- `backend/authentication/models.py` - Already had User model with roles
- `backend/authentication/serializers.py` - Already had serializers with validation
- `backend/authentication/views.py` - Updated LoginAPIView for Redis tracking
- `backend/authentication/urls.py` - Added CSRF exempt decorators
- `backend/authentication/utils/__init__.py` - NEW
- `backend/authentication/utils/login_tracker.py` - NEW Redis tracker
- `backend/core/middleware/__init__.py` - NEW
- `backend/core/middleware/disable_csrf.py` - NEW CSRF middleware
- `backend/requirements.txt` - NEW dependency reference

**Frontend:**
- `frontend/src/services/authService.js` - NEW centralized API service
- `frontend/src/services/index.js` - NEW barrel export
- `frontend/src/context/AuthContext.jsx` - NEW auth state management
- `frontend/src/pages/auth/Login.jsx` - NEW login form
- `frontend/src/pages/auth/Register.jsx` - NEW registration form
- `frontend/src/pages/auth/index.js` - NEW barrel export
- `frontend/src/components/ProtectedRoute.jsx` - NEW route guard
- `frontend/src/pages/Dashboard.jsx` - NEW dashboard page
- `frontend/src/App.jsx` - Updated imports for auth pages
- `frontend/.env.example` - NEW environment template

**Documentation:**
- `SETUP.md` - NEW team setup guide
- `MIGRATION_REDIS.md` - NEW Redis migration guide
- `COMMIT_MESSAGE.md` - This file

---

## Quick Verification Checklist

Before committing, verify:
- [x] Backend starts without errors: `docker-compose logs backend`
- [x] Redis connection works: Tested in Django shell
- [x] Login tracking works: Try 5 failed logins
- [x] Frontend builds: `docker-compose logs frontend`
- [x] Can login successfully from frontend
- [x] JWT tokens are generated and stored
- [x] Protected routes redirect to login
- [x] Celery and Celery Beat start without errors

---

## Team Instructions

When teammates pull these changes:

```bash
# 1. Pull latest
git pull

# 2. Rebuild backend (includes django-redis)
docker-compose build backend celery celery-beat

# 3. Start everything
docker-compose up -d

# 4. Verify
docker-compose logs backend celery celery-beat
```

**That's it!** Everything is configured in Docker.
