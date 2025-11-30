# backend/core/signals.py
# edited by Ibrahim Waseem, UWE ID: 24050771
'''
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from authentication.utils.audit_logger import AuditLogger

User = get_user_model()

# We use post_save for simplicity, but a full audit requires pre_save to get old values.
# doesn't currently use old values, post_save is sufficient for now.
@receiver(post_save, sender=User)
def audit_user_changes(sender, instance, created, **kwargs):
    """
    Signal receiver that logs user profile and password updates.
    Fires whenever a User model instance is saved.
    """
    # log updates, not user creation
    if created:
        # could log a 'USER_CREATED' event here if needed
        return

    # 1. Check if we are inside a password change context (more advanced logging is needed here)
    #    For simplicity, if the user's password field was recently updated, log it.
    #    (Note: Django doesn't expose the old password, only that the hash changed).
    
    # Simple check: If the update came from the admin or a direct model save, log it.
    # In a real app, you'd use a temporary attribute or a more complex approach 
    # (like django-auditlog) to determine the exact fields changed.

    # For this task, we will log a generic profile update.
    # IMPORTANT: The request object is NOT available in signals, so we must assume
    # some defaults or fetch IP/user agent differently (e.g., from a middleware).

    # Since we don't have the request, we'll need a different logging method:
    try:
        # Assuming a signal-friendly logger method that doesn't require 'request'
        AuditLogger.log_profile_update_signal(
            user=instance,
            source='Signal',
            details='Generic update (name, email, or other field) was saved.'
        )
    except Exception as e:
        print(f"Error logging signal change for user {instance.username}: {e}")

'''