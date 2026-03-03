@echo off
:: Быстрый запуск сервера с PostgreSQL (рекомендуемый для проверки)

REM отключаем SQLite и работаем с PostgreSQL
set USE_SQLITE=0
echo USE_SQLITE is set to %USE_SQLITE%

REM активируем виртуальное окружение
call venv\Scripts\activate.bat

echo Обновляю pip и устанавливаю зависимости...
python -m pip install --upgrade pip
pip install -r requirements.txt

echo Поднимаю контейнер с PostgreSQL (если Docker установлен)...
docker compose up -d

echo Применяю миграции и собираю статику...
python manage.py migrate
python manage.py collectstatic --noinput

echo Запуск сервера на http://127.0.0.1:8000 (PostgreSQL)
python manage.py runserver

@echo off
:: Быстрый запуск сервера (CMD)

REM включаем sqlite для разработки
set USE_SQLITE=1
echo USE_SQLITE is set to %USE_SQLITE%

REM активируем виртуальное окружение
call venv\Scripts\activate.bat

echo Обновляю pip и устанавливаю зависимости...
python -m pip install --upgrade pip
pip install -r requirements.txt

echo Применяю миграции и собираю статическую...
python manage.py migrate
python manage.py collectstatic --noinput

echo Запуск сервера на http://127.0.0.1:8000
python manage.py runserver
