@echo off
:: Быстрый запуск сервера c SQLite (для локальной разработки)

REM включаем sqlite для разработки
set USE_SQLITE=1
echo USE_SQLITE is set to %USE_SQLITE%

REM активируем виртуальное окружение
call venv\Scripts\activate.bat

echo Обновляю pip и устанавливаю зависимости...
python -m pip install --upgrade pip
pip install -r requirements.txt

echo Применяю миграции и собираю статику...
python manage.py migrate
python manage.py collectstatic --noinput

echo Запуск сервера на http://127.0.0.1:8000 (SQLite)
python manage.py runserver

