from django.dispatch import Signal
from .models import AuditLog


admin_action_performed = Signal(
    ['actor', 'target_user', 'description']
)

profile_updated = Signal(
    ['user', 'description']
)

def log_admin_action(sender, actor, target_user, description, **kwargs):
    """Saves an audit log entry when the admin_action_performed signal is received."""
    AuditLog.objects.create(
        actor=actor,
        target_user=target_user,
        description=description
    )

def log_user_action(sender, user, description, **kwargs):
    """Saves an AuditLog entry when profile_updated is triggered."""
    # Note: For self-updates, actor and target_user are the same.
    AuditLog.objects.create(
        actor=user,
        target_user=user,
        description=f'[USER ACTION] {description}'
    )

admin_action_performed.connect(log_admin_action)
profile_updated.connect(log_user_action)