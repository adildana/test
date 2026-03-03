from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class RoomsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'rooms'

    # We can't rely on compiled .mo files on Windows without gettext/msgfmt,
    # so return a hardcoded Russian name when the current language starts with
    # 'ru'.  Django reads `verbose_name` and `verbose_name_plural` directly
    # when rendering the admin index, so this ensures the headings show
    # correctly even if translation tools are missing.
    @property
    def verbose_name(self):
        from django.utils import translation
        if translation.get_language() and translation.get_language().startswith('ru'):
            return 'Комнаты'
        return 'Rooms'

    @property
    def verbose_name_plural(self):
        from django.utils import translation
        if translation.get_language() and translation.get_language().startswith('ru'):
            return 'Комнаты'
        return 'Rooms'
