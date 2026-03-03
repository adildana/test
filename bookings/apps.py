from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class BookingsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'bookings'

    # same trick as rooms: don't depend on gettext utility, just return a
    # Russian string in RU mode.
    @property
    def verbose_name(self):
        from django.utils import translation
        if translation.get_language() and translation.get_language().startswith('ru'):
            return 'Бронирования'
        return 'Bookings'

    @property
    def verbose_name_plural(self):
        from django.utils import translation
        if translation.get_language() and translation.get_language().startswith('ru'):
            return 'Бронирования'
        return 'Bookings'
