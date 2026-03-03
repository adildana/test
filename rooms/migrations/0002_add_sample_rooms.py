from django.db import migrations


def add_sample_rooms(apps, schema_editor):
    """
    Раньше здесь добавлялись примерные комнаты.
    Сейчас миграция оставлена пустой, чтобы не засорять базу тестовыми данными.
    """
    # Ничего не делаем
    return


def remove_sample_rooms(apps, schema_editor):
    """
    Обратная операция для add_sample_rooms.
    Оставляем пустой, чтобы откат миграции тоже ничего не менял.
    """
    # Ничего не делаем
    return


class Migration(migrations.Migration):

    dependencies = [
        ('rooms', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(add_sample_rooms, remove_sample_rooms),
    ]

