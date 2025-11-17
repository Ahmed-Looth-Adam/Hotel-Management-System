# Login Audit Logging System

**Documentation for Hotel Management System**
**Edited By:** Ismail Wasiu Abdul Samad, UWE ID: 24050765
**Date:** November 18, 2025

---

## Overview

Comprehensive audit logging system that tracks all authentication events for security monitoring, compliance, and forensic analysis.

---

## 1. Database Model

**File:** `backend/authentication/models.py:45-89`

### LoginAuditLog Model

Tracks all authentication-related events with the following fields:

#### Event Details
- **event_type**: Type of event (login_success, login_failed, account_locked, logout, token_refresh)
- **username**: Username involved in the event
- **user**: Foreign key to User model (null if user doesn't exist)

#### Request Information
- **ip_address**: Client IP address
- **user_agent**: Browser/client user agent string

#### Security Context
- **success**: Boolean flag for success/failure
- **failure_reason**: Detailed reason for failure
- **failed_attempts_count**: Number of failed attempts at time of event

#### Metadata
- **timestamp**: When the event occurred (auto-generated)

#### Database Indexes
- Composite index on `(timestamp DESC, event_type)` for fast filtering
- Composite index on `(username, timestamp DESC)` for user-specific queries
- Individual indexes on `event_type` and `timestamp`

---

## 2. Audit Logger Service

**File:** `backend/authentication/utils/audit_logger.py`

### Available Methods

#### `log_login_success(request, user)`
Logs successful login attempts.

**Parameters:**
- `request`: Django request object
- `user`: User instance

**Example:**
```python
AuditLogger.log_login_success(request, user)
```

#### `log_login_failed(request, username, reason, failed_attempts=None)`
Logs failed login attempts with detailed context.

**Parameters:**
- `request`: Django request object
- `username`: Attempted username
- `reason`: Reason for failure (e.g., "Incorrect password", "User does not exist")
- `failed_attempts`: Current count of failed attempts (optional)

**Example:**
```python
AuditLogger.log_login_failed(
    request,
    'admin',
    reason='Incorrect password',
    failed_attempts=3
)
```

#### `log_account_locked(request, username, failed_attempts=None)`
Logs account lockout events.

**Parameters:**
- `request`: Django request object
- `username`: Username that was locked
- `failed_attempts`: Number of attempts that triggered lockout (optional)

**Example:**
```python
AuditLogger.log_account_locked(request, 'admin', failed_attempts=5)
```

#### `log_logout(request, user)`
Logs user logout events.

**Parameters:**
- `request`: Django request object
- `user`: User instance

**Example:**
```python
AuditLogger.log_logout(request, user)
```

#### `log_token_refresh(request, user)`
Logs JWT token refresh events.

**Parameters:**
- `request`: Django request object
- `user`: User instance

#### `get_recent_logs(username=None, limit=50)`
Retrieve recent audit logs.

**Parameters:**
- `username`: Filter by specific username (optional)
- `limit`: Maximum number of logs to return (default: 50)

**Returns:** QuerySet of LoginAuditLog objects

**Example:**
```python
# Get all recent logs
logs = AuditLogger.get_recent_logs(limit=100)

# Get logs for specific user
user_logs = AuditLogger.get_recent_logs(username='admin', limit=50)
```

#### `get_failed_attempts(username, hours=24)`
Get failed login attempts for a user within a time window.

**Parameters:**
- `username`: Username to check
- `hours`: Number of hours to look back (default: 24)

**Returns:** QuerySet of failed login attempts

**Example:**
```python
# Get failed attempts in last 24 hours
failed = AuditLogger.get_failed_attempts('admin', hours=24)
print(f"Failed attempts: {failed.count()}")
```

#### `get_suspicious_activity(threshold=5, hours=1)`
Detect accounts with suspicious activity (many failed attempts).

**Parameters:**
- `threshold`: Minimum failed attempts to be flagged (default: 5)
- `hours`: Time window in hours (default: 1)

**Returns:** List of dictionaries with username and attempt count

**Example:**
```python
suspicious = AuditLogger.get_suspicious_activity(threshold=5, hours=1)
for activity in suspicious:
    print(f"{activity['username']}: {activity['attempt_count']} attempts")
```

---

## 3. Integration Points

**File:** `backend/authentication/views.py`

### Login Flow Integration

| Event | Line | Description |
|-------|------|-------------|
| ✅ Successful login | 152 | User authenticated successfully |
| ✅ Failed - non-existent user | 121 | Login attempt for username that doesn't exist |
| ✅ Failed - disabled account | 131 | Login attempt on disabled account |
| ✅ Failed - wrong password | 192-196 | Incorrect password provided |
| ✅ Account locked | 178 | Account locked due to too many failed attempts |
| ✅ User logout | 233-234 | User logged out successfully |

### Data Captured Per Event

Each audit log entry automatically captures:
- **IP Address**: Extracted from request (handles X-Forwarded-For for proxies)
- **User Agent**: Browser/client identification
- **Failure Reason**: Specific reason for authentication failure
- **Failed Attempts Count**: Current number of failed attempts
- **Timestamp**: Exact time of event

---

## 4. Django Admin Interface

**File:** `backend/authentication/admin.py`

### Features

#### Visual Display
- **Color-coded badges**:
  - 🟢 Green: Login Success
  - 🔴 Red: Login Failed
  - 🟠 Orange: Account Locked
  - ⚫ Gray: Logout
  - 🔵 Blue: Token Refresh

#### Searchable Fields
- Username
- IP Address
- User Agent
- Failure Reason

#### Filterable Fields
- Event Type
- Success Status
- Timestamp (with date hierarchy)

#### Security Features
- **Read-only**: Cannot manually create audit logs
- **Immutable**: Cannot delete audit logs
- **Protected**: Ensures audit trail integrity

### Accessing Admin Interface

1. Navigate to: `http://localhost:8000/admin/`
2. Login with admin credentials
3. Go to: **Authentication** → **Login Audit Logs**
4. View, search, and filter logs

---

## 5. Setup Instructions

### Using Dockerb (Recommended)

```bash
# If using docker-compose
docker-compose exec backend python manage.py makemigrations authentication
docker-compose exec backend python manage.py migrate
```

### Using Pipenv (Not recommended as services run in Docker's network)

```bash
# Navigate to project root
cd /path/to/Hotel-Management-System

# Activate virtual environment
pipenv shell

# Install dependencies (if needed)
pipenv install

# Navigate to backend
cd backend

# Create migrations
python manage.py makemigrations authentication

# Apply migrations
python manage.py migrate
```

### Manual Virtual Environment Setup (Alternative)

If you need to create a new venv:

```bash
# Create virtual environment
python3 -m venv venv

# Activate on macOS/Linux
source venv/bin/activate

# Activate on Windows
venv\Scripts\activate

# Install requirements
pip install -r requirements.txt
```

---

## 6. Usage Examples

### Viewing Logs Programmatically

```python
from authentication.utils import AuditLogger
from django.utils import timezone
from datetime import timedelta

# Get recent logs for a user
logs = AuditLogger.get_recent_logs(username='admin', limit=50)
for log in logs:
    print(f"{log.timestamp} - {log.event_type} - {log.ip_address}")

# Get failed attempts in last 24 hours
failed = AuditLogger.get_failed_attempts('admin', hours=24)
print(f"Total failed attempts: {failed.count()}")

# Detect suspicious activity
suspicious = AuditLogger.get_suspicious_activity(threshold=5, hours=1)
for activity in suspicious:
    username = activity['username']
    count = activity['attempt_count']
    print(f"⚠️ Suspicious: {username} has {count} failed attempts in last hour")
```

### Querying Logs with Django ORM

```python
from authentication.models import LoginAuditLog
from django.utils import timezone
from datetime import timedelta

# Get all failed logins in last 7 days
week_ago = timezone.now() - timedelta(days=7)
failed_logins = LoginAuditLog.objects.filter(
    event_type='login_failed',
    timestamp__gte=week_ago
)

# Get all successful logins from specific IP
successful_from_ip = LoginAuditLog.objects.filter(
    event_type='login_success',
    ip_address='192.168.1.100'
)

# Get all account lockouts
lockouts = LoginAuditLog.objects.filter(event_type='account_locked')
```

---

## 7. Example Audit Trail

```
[2025-11-18 00:15:23] LOGIN_FAILED - admin from 192.168.1.100
Event Type: Login Failed
Reason: Incorrect password
Failed Attempts: 3
User Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)

[2025-11-18 00:16:12] LOGIN_FAILED - admin from 192.168.1.100
Event Type: Login Failed
Reason: Incorrect password
Failed Attempts: 4
User Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)

[2025-11-18 00:16:45] ACCOUNT_LOCKED - admin from 192.168.1.100
Event Type: Account Locked
Reason: Account locked due to multiple failed attempts
Failed Attempts: 5
User Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)

[2025-11-18 00:30:12] LOGIN_SUCCESS - admin from 192.168.1.100
Event Type: Login Success
Status: ✓ Success
User Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)

[2025-11-18 02:45:30] LOGOUT - admin from 192.168.1.100
Event Type: Logout
Status: ✓ Success
User Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)
```

---

## 8. Security Benefits

### ✅ Compliance
- **GDPR**: Track data access and authentication events
- **SOC 2**: Maintain comprehensive audit trail
- **PCI DSS**: Monitor authentication and access control
- **ISO 27001**: Evidence of security monitoring

### ✅ Security Monitoring
- Detect brute force attacks
- Identify compromised accounts
- Track unauthorized access attempts
- Monitor suspicious patterns

### ✅ Incident Response
- Investigate security breaches
- Determine scope of compromise
- Track attacker behavior
- Timeline reconstruction

### ✅ User Accountability
- Know who accessed when
- Track user activity patterns
- Prove user actions
- Support non-repudiation

### ✅ Forensic Analysis
- Detailed authentication trail
- IP address tracking
- User agent fingerprinting
- Temporal analysis capabilities

---

## 9. Performance Considerations

### Database Indexes
The model includes optimized indexes for common queries:
- Fast filtering by event type and timestamp
- Efficient user-specific queries
- Optimized for recent logs retrieval

### Storage Management
Consider implementing log rotation:

```python
# Example: Delete logs older than 90 days
from django.utils import timezone
from datetime import timedelta
from authentication.models import LoginAuditLog

ninety_days_ago = timezone.now() - timedelta(days=90)
LoginAuditLog.objects.filter(timestamp__lt=ninety_days_ago).delete()
```

### Archival Strategy
For long-term retention:
1. Export old logs to separate archive database
2. Compress and store as files
3. Use data warehouse for analytics

---

## 10. API Integration (Future Enhancement)

Potential API endpoints for audit log access:

```python
# Future API endpoints (not yet implemented)
GET  /api/audit-logs/              # List all audit logs
GET  /api/audit-logs/{id}/          # Get specific log
GET  /api/audit-logs/user/{username}/  # Get user's logs
GET  /api/audit-logs/suspicious/    # Get suspicious activity
GET  /api/audit-logs/export/        # Export logs as CSV/JSON
```

---

## 11. Troubleshooting

### Logs Not Appearing

**Check 1: Migrations Applied**
```bash
pipenv shell
cd backend
python manage.py showmigrations authentication
```

**Check 2: Model Imported Correctly**
```python
from authentication.models import LoginAuditLog
print(LoginAuditLog.objects.count())
```

**Check 3: Audit Logger Working**
```python
from authentication.utils import AuditLogger
# Should not raise errors
```

### Performance Issues

**Symptom**: Slow queries on audit logs

**Solutions**:
1. Ensure indexes are created
2. Implement pagination
3. Add database query optimization
4. Consider archiving old logs

---

## 12. Virtual Environment Activation Guide

### Pipenv (Used in This Project)

```bash
# Activate Pipenv shell
pipenv shell

# Verify activation (you'll see (Hotel-Management-System) in prompt)
# Example: (Hotel-Management-System) user@machine:~/project$

# Run Django commands
python manage.py runserver

# Deactivate
exit
# or
Ctrl+D
```

### Standard venv (If Created)

```bash
# macOS/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate

# Deactivate (all platforms)
deactivate
```

### Verify Active Environment

```bash
# Check which Python is being used
which python   # macOS/Linux
where python   # Windows

# Should point to project's virtual environment
```

---

## 13. Related Documentation

- **Redis Configuration**: See `a-docs/Redis.md` for Redis setup
- **Authentication System**: See `backend/authentication/views.py`
- **Login Tracking**: See `backend/authentication/utils/login_tracker.py`

---

## Conclusion

The audit logging system is production-ready and provides comprehensive security monitoring. All authentication events are automatically logged with full context, enabling security teams to:
- Monitor for threats in real-time
- Investigate security incidents
- Meet compliance requirements
- Maintain user accountability

**Status**: ✅ Fully Implemented and Ready for Production
