from django.db import models
from django.utils.translation import gettext_lazy as _


class Room(models.Model):
    """Hotel room."""

    CURRENCY_RUB = 'RUB'
    CURRENCY_USD = 'USD'
    CURRENCY_EUR = 'EUR'
    CURRENCY_KZT = 'KZT'
    CURRENCY_CHOICES = [
        (CURRENCY_RUB, '₽ Rubles'),
        (CURRENCY_USD, '$ Dollars'),
        (CURRENCY_EUR, '€ Euros'),
        (CURRENCY_KZT, '₸ Tenge'),
    ]

    name = models.CharField(_('Number/name'), max_length=100)
    price_per_day = models.DecimalField(
        _('Price per day'),
        max_digits=10,
        decimal_places=2
    )
    currency = models.CharField(
        _('Currency'),
        max_length=3,
        choices=CURRENCY_CHOICES,
        default=CURRENCY_RUB,
    )
    capacity = models.PositiveIntegerField(_('Places'))
    created_at = models.DateTimeField(_('Created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Updated at'), auto_now=True)

    class Meta:
        verbose_name = _('Room')
        verbose_name_plural = _('Rooms')
        ordering = ['name']

    def __str__(self):
        # choose the right word depending on active language; we avoid
        # gettext here because compilemessages may not be available on
        # Windows (msgfmt missing).  English is the default, Russian will
        # show "мест" no matter the count.
        from django.utils import translation

        lang = translation.get_language() or ''
        if lang.startswith('ru'):
            return f'{self.name} ({self.capacity} мест)'
        return f'{self.name} ({self.capacity} places)'
