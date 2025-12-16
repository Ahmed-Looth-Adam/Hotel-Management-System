from django.db import models
from django.conf import settings

# Create your models here.

class AuditLog(models.Model):
    """Stores administrative actions taken on user accounts."""

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='actions_performed', 
    )
    
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='profile_audits', 
    )
    
    action_time = models.DateTimeField(auto_now_add=True)
    description = models.TextField()
    
    class Meta:
        ordering = ['-action_time']
        verbose_name = "Audit Log Entry"
        verbose_name_plural = "Audit Log Entries"
    
    def __str__(self):
        return f'{self.actor.username} {self.description} on {self.target_user.username} at {self.action_time.strftime("%Y-%m-%d %H:%M")}'