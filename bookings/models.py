from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


class Booking(models.Model):
    """Room booking."""
    STATUS_ACTIVE = 'active'
    STATUS_CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    room = models.ForeignKey(
        'rooms.Room',
        on_delete=models.CASCADE,
        related_name='bookings',
        verbose_name=_('Room')
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookings',
        verbose_name=_('User')
    )
    check_in = models.DateField(_('Check-in date'))
    check_out = models.DateField(_('Check-out date'))
    status = models.CharField(
        _('Status'),
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_ACTIVE
    )
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cancelled_bookings',
        verbose_name=_('Cancelled by')
    )
    created_at = models.DateTimeField(_('Created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Updated at'), auto_now=True)

    class Meta:
        verbose_name = _('Booking')
        verbose_name_plural = _('Bookings')
        ordering = ['-created_at']

    def __str__(self):
        """
        Безопасное строковое представление.

        В админке Django иногда создаёт/обрабатывает объекты Booking,
        у которых ещё нет связанной комнаты (например, при невалидной форме).
        В этом случае прямой доступ к self.room.name приводит к ошибке
        RelatedObjectDoesNotExist, поэтому аккуратно проверяем наличие room.
        """
        if getattr(self, "room_id", None) and getattr(self, "room", None):
            return f'{self.room.name} — {self.user} ({self.check_in} — {self.check_out})'
        booking_id = self.pk if self.pk is not None else "new"
        return f'Booking {booking_id}'

    def clean(self):
        if self.check_out <= self.check_in:
            raise ValidationError({
                'check_out': 'Check-out date must be later than check-in date.'
            })
        if self.status == self.STATUS_ACTIVE:
            overlapping = Booking.objects.filter(
                room=self.room,
                status=self.STATUS_ACTIVE
            ).exclude(pk=self.pk).filter(
                check_in__lt=self.check_out,
                check_out__gt=self.check_in
            )
            if overlapping.exists():
                raise ValidationError(
                    'This room is already booked for the selected dates.'
                )
