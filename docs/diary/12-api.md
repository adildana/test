# 13. Дизайн API

Набросок REST API, покрывающего требования разделов 2–4 и 10. Стиль соответствует стеку из
12.2 (Django REST Framework) и уже принятым в репозитории соглашениям: JWT в заголовке
`Authorization: Bearer <token>`, префикс `/api/`.

Версионирование: `/api/v1/`. Все ответы — JSON в кодировке UTF-8, время — ISO 8601 в UTC
(`2026-09-03T07:00:00Z`), даты — `YYYY-MM-DD`.

---

## 13.1 Общие соглашения

### Пагинация

```
GET /api/v1/entries/?limit=50&cursor=eyJpZCI6…
```

```json
{
  "results": [],
  "next_cursor": "eyJpZCI6…",
  "has_more": true
}
```

Курсорная пагинация, а не постраничная: списки сортируются по дате и постоянно
пополняются, при страницах по номеру записи «съезжают» между запросами.

### Формат ошибок

```json
{
  "error": {
    "code": "validation_error",
    "message": "Проверьте заполненные поля",
    "fields": {
      "hex": "Введите цвет в виде #A1B2C3"
    }
  }
}
```

| Код | HTTP | Когда |
| --- | --- | --- |
| `validation_error` | 400 | Ошибка в полях запроса |
| `unauthorized` | 401 | Нет или истёк токен |
| `forbidden` | 403 | Объект принадлежит другому пользователю (NFR-01) |
| `not_found` | 404 | Объект отсутствует или удалён окончательно |
| `conflict` | 409 | Конфликт версий записи (NFR-32) |
| `payload_too_large` | 413 | Превышен размер файла |
| `quota_exceeded` | 422 | Исчерпана квота хранилища (Q16) |
| `rate_limited` | 429 | Слишком много запросов |

Сообщения `message` приходят на языке пользователя и пригодны для показа как есть (11.4).

### Идемпотентность

Создание объектов поддерживает заголовок `Idempotency-Key`: повторная отправка того же
ключа возвращает ранее созданный объект. Нужно для офлайн-очереди (12.10), которая может
отправить операцию дважды.

---

## 13.2 Аутентификация

| Метод | Путь | Описание |
| --- | --- | --- |
| `POST` | `/api/v1/auth/register/` | Регистрация; создаёт данные по умолчанию (ONB-02) |
| `POST` | `/api/v1/auth/login/` | Возвращает `access` и `refresh` |
| `POST` | `/api/v1/auth/refresh/` | Обновление токена |
| `POST` | `/api/v1/auth/logout/` | Отзыв `refresh` |
| `POST` | `/api/v1/auth/password/change/` | Смена пароля |
| `DELETE` | `/api/v1/auth/account/` | Удаление аккаунта со всеми данными (NFR-10) |

## 13.3 Записи

| Метод | Путь | Описание |
| --- | --- | --- |
| `GET` | `/api/v1/entries/` | Список; фильтры `date_from`, `date_to`, `template`, `tag`, `q`, `person` |
| `POST` | `/api/v1/entries/` | Создание |
| `GET` | `/api/v1/entries/{id}/` | Чтение с телом документа |
| `PATCH` | `/api/v1/entries/{id}/` | Изменение; принимает `revision` для контроля конфликтов |
| `DELETE` | `/api/v1/entries/{id}/` | В корзину (мягкое удаление) |
| `POST` | `/api/v1/entries/{id}/restore/` | Восстановление из корзины |
| `GET` | `/api/v1/entries/{id}/versions/` | История версий (NAV-43) |
| `POST` | `/api/v1/entries/{id}/versions/{v}/restore/` | Восстановление версии |
| `POST` | `/api/v1/entries/{id}/export/` | Экспорт записи: `format` = `pdf` \| `docx` \| `md` \| `html` (ED-11) |

Создание записи по шаблону:

```json
POST /api/v1/entries/
{
  "template_id": "1f7c…",
  "entry_date": "2026-08-27",
  "title": "Дюна",
  "body": { "type": "doc", "content": [] },
  "tags": ["фантастика"],
  "field_values": {
    "author": "Фрэнк Герберт",
    "status": "finished",
    "started_at": "2026-08-12",
    "finished_at": "2026-08-27",
    "rating": 4,
    "recommended_by": "9ab2…"
  }
}
```

Ответ дополнительно содержит `revision`, `body_markdown` и `warnings` (например,
о неизвестных ключах полей — они игнорируются, но не молча).

Конфликт версий:

```json
PATCH /api/v1/entries/{id}/   { "revision": 12, "body": {} }

409 Conflict
{
  "error": {
    "code": "conflict",
    "message": "Запись изменена на другом устройстве",
    "server_revision": 14,
    "conflict_version_id": "77aa…"
  }
}
```

Клиент не перезаписывает данные молча: он показывает выбор, а обе версии остаются
в истории (NFR-32).

## 13.4 Шаблоны

| Метод | Путь | Описание |
| --- | --- | --- |
| `GET` | `/api/v1/templates/` | Список; `kind` = `system` \| `user` |
| `POST` | `/api/v1/templates/` | Создание |
| `PATCH` | `/api/v1/templates/{id}/` | Изменение; поле `apply_to_existing` (по умолчанию `false`, ED-44) |
| `DELETE` | `/api/v1/templates/{id}/` | Удаление; записи сохраняются (ED-45) |
| `POST` | `/api/v1/templates/{id}/duplicate/` | Дублирование |
| `POST` | `/api/v1/templates/from-entry/{entry_id}/` | Шаблон из существующей записи (ED-43) |
| `GET` | `/api/v1/templates/{id}/export/` | Выгрузка шаблона файлом (ED-46) |
| `POST` | `/api/v1/templates/import/` | Загрузка шаблона файлом |
| `GET` | `/api/v1/books/stats/?year=2026` | Статистика чтения (ED-51) |

## 13.5 Шрифты и стили

| Метод | Путь | Описание |
| --- | --- | --- |
| `GET` | `/api/v1/fonts/` | Список шрифтов с начертаниями, размером и местами использования |
| `POST` | `/api/v1/fonts/` | Загрузка (`multipart/form-data`): `family_name`, `license_confirmed`, файлы с указанием `weight` и `style` |
| `DELETE` | `/api/v1/fonts/{id}/` | Удаление; обязательный параметр `replacement_font_id` или `use_system=true` (ED-64) |
| `GET` | `/api/v1/style-sets/` | Наборы стилей |
| `POST` | `/api/v1/style-sets/` | Создание набора |
| `PATCH` | `/api/v1/style-sets/{id}/styles/{role}/` | Изменение одного стиля (ED-81) |
| `POST` | `/api/v1/style-sets/{id}/reset/{role}/` | Сброс системного стиля к исходному (ED-83) |

Ответ загрузки шрифта содержит результаты проверки:

```json
{
  "id": "c4e1…",
  "family_name": "MyHand",
  "faces": [{ "weight": 400, "style": "normal", "format": "woff2", "size_bytes": 918234 }],
  "checks": { "parsed": true, "has_cyrillic": false },
  "warnings": ["В шрифте нет русских букв — они будут показаны другим шрифтом"],
  "quota": { "used_bytes": 13012345, "limit_bytes": 52428800 }
}
```

## 13.6 Вишлист

| Метод | Путь | Описание |
| --- | --- | --- |
| `GET` | `/api/v1/wishlists/` | Списки желаний |
| `POST` | `/api/v1/wishlists/` | Создание списка |
| `GET` | `/api/v1/wishlists/{id}/items/` | Позиции; фильтры `status`, `priority`, `tag`, `for_person` |
| `POST` | `/api/v1/wishlists/{id}/items/` | Создание позиции (обязателен только `title`) |
| `PATCH` | `/api/v1/wishlist-items/{id}/` | Изменение |
| `DELETE` | `/api/v1/wishlist-items/{id}/` | В корзину |
| `POST` | `/api/v1/wishlists/{id}/items/reorder/` | Порядок: массив идентификаторов (WL-04) |
| `POST` | `/api/v1/wishlist-items/{id}/move/` | Перенос или копирование в другой список (WL-07) |
| `POST` | `/api/v1/wishlists/{id}/export/` | Постановка задачи экспорта PDF |
| `GET` | `/api/v1/exports/{job_id}/` | Статус задачи и ссылка на файл |
| `POST` | `/api/v1/wishlists/{id}/share/` | Включение публичной ссылки (WL-11) |
| `DELETE` | `/api/v1/wishlists/{id}/share/` | Отзыв ссылки (немедленный, NFR-06) |
| `POST` | `/api/v1/link-preview/` | Разбор Open Graph по URL (WL-10); только по явному действию (NFR-07) |
| `GET` | `/public/wishlists/{slug}/` | Публичный просмотр без авторизации, только чтение |

Экспорт PDF:

```json
POST /api/v1/wishlists/{id}/export/
{
  "item_ids": ["a1…", "b2…", "c3…", "d4…"],
  "layout": "cards",
  "page_size": "A4",
  "orientation": "portrait",
  "include": { "photos": true, "prices": false, "links": true,
               "comments": true, "tags": false, "qr_codes": true,
               "hidden_statuses": false },
  "cover_page": true,
  "style_set_id": "8f2a…"
}
```

```json
202 Accepted
{ "job_id": "e91b…", "status": "queued" }
```

```json
GET /api/v1/exports/e91b…/
{
  "status": "done",
  "progress": { "done": 4, "total": 4 },
  "file_url": "https://…/wishlist-2026-08-28.pdf?signature=…",
  "expires_at": "2026-08-28T18:30:00Z",
  "warnings": ["Шрифт «MyHand» не содержит кириллицу — заменён на Inter"]
}
```

## 13.7 Люди

| Метод | Путь | Описание |
| --- | --- | --- |
| `GET` | `/api/v1/person-categories/` | Категории |
| `POST` | `/api/v1/person-categories/` | Создание |
| `DELETE` | `/api/v1/person-categories/{id}/` | Удаление; обязателен `move_to_category_id` или `leave_uncategorized=true` (PPL-04) |
| `GET` | `/api/v1/people/` | Список; фильтры `category`, `q`, `archived`, сортировка `next_date` |
| `POST` | `/api/v1/people/` | Создание (обязателен только `display_name`) |
| `GET` | `/api/v1/people/{id}/` | Карточка целиком, включая даты, цвета, предпочтения |
| `PATCH` | `/api/v1/people/{id}/` | Изменение |
| `DELETE` | `/api/v1/people/{id}/` | В корзину |
| `POST` | `/api/v1/people/{id}/archive/` | Архивирование (PPL-104) |
| `GET` | `/api/v1/people/{id}/mentions/` | Записи дневника с упоминанием (PPL-95) |
| `POST` | `/api/v1/people/import/` | Импорт из vCard (PPL-105) |

Вложенные коллекции карточки:

| Метод | Путь | Описание |
| --- | --- | --- |
| `POST` `PATCH` `DELETE` | `/api/v1/people/{id}/social-links/{link_id?}/` | Ссылки на соцсети |
| `POST` | `/api/v1/social-links/resolve/` | Нормализация ввода и определение платформы (PPL-25) |
| `POST` `PATCH` `DELETE` | `/api/v1/people/{id}/dates/{date_id?}/` | Важные даты |
| `POST` `PATCH` `DELETE` | `/api/v1/people/{id}/colors/{color_id?}/` | Любимые цвета |
| `POST` `PATCH` `DELETE` | `/api/v1/people/{id}/preferences/{item_id?}/` | «Любит» и «не любит» (`kind`) |
| `GET` `POST` `PATCH` `DELETE` | `/api/v1/people/{id}/comments/{comment_id?}/` | Лента комментариев |

Нормализация ссылки выполняется на сервере, чтобы клиент и PDF показывали одно и то же:

```json
POST /api/v1/social-links/resolve/
{ "input": "@ivanov" }

200 OK
{
  "url": "https://t.me/ivanov",
  "platform": "telegram",
  "display_name": "ivanov",
  "icon": "telegram"
}
```

```json
POST /api/v1/social-links/resolve/
{ "input": "javascript:alert(1)" }

400 Bad Request
{ "error": { "code": "validation_error",
             "message": "Такую ссылку открыть нельзя. Допустимы адреса, начинающиеся с http:// или https://" } }
```

## 13.8 Даты и напоминания

| Метод | Путь | Описание |
| --- | --- | --- |
| `GET` | `/api/v1/dates/upcoming/?days=30` | Ближайшие даты всех людей (NAV-11, PPL-45) |
| `GET` | `/api/v1/dates/{id}/reminders/` | Правила напоминаний даты |
| `PUT` | `/api/v1/dates/{id}/reminders/` | Полная замена набора правил |
| `POST` | `/api/v1/dates/{id}/reminders/preview/` | Предпросмотр расписания без сохранения (PPL-57) |
| `POST` | `/api/v1/people/{id}/reminders/apply-to-all/` | Применить настройки ко всем датам человека (PPL-55) |
| `GET` | `/api/v1/notifications/` | Уведомления пользователя; `unread=true` |
| `POST` | `/api/v1/notifications/{id}/read/` | Отметить прочитанным |
| `POST` | `/api/v1/notifications/{id}/snooze/` | Отложить (PPL-60) |
| `GET` | `/api/v1/notifications/log/` | Журнал отправок (PPL-65) |
| `POST` | `/api/v1/devices/` | Регистрация устройства для push |
| `GET` | `/api/v1/dates/export.ics` | Выгрузка в календарь (PPL-47) |

Предпросмотр расписания — тот же расчёт, что использует планировщик (12.7), поэтому текст
в интерфейсе не может разойтись с фактической отправкой:

```json
POST /api/v1/dates/{id}/reminders/preview/
{
  "rules": [
    { "offset_days": 0,  "mode": "once", "time_of_day": "10:00" },
    { "offset_days": 7,  "mode": "once", "time_of_day": "10:00" },
    { "offset_days": 30, "mode": "once", "time_of_day": "10:00" }
  ]
}

200 OK
{
  "timezone": "Asia/Almaty",
  "occurrences": [
    { "scheduled_for": "2026-08-04T05:00:00Z", "local": "2026-08-04 10:00", "offset_days": 30 },
    { "scheduled_for": "2026-08-27T05:00:00Z", "local": "2026-08-27 10:00", "offset_days": 7 },
    { "scheduled_for": "2026-09-03T05:00:00Z", "local": "2026-09-03 10:00", "offset_days": 0 }
  ],
  "human_readable": "Напомню 4 августа, 27 августа и 3 сентября в 10:00 по времени Астаны"
}
```

## 13.9 Музыка

| Метод | Путь | Описание |
| --- | --- | --- |
| `GET` | `/api/v1/discs/` | Самостоятельные диски раздела «Музыка» (MUS-23) |
| `POST` | `/api/v1/discs/` | Создание диска; `owner_type` = `entry` \| `person` \| `standalone` |
| `GET` | `/api/v1/discs/{id}/` | Диск с треками и их доступностью |
| `PATCH` | `/api/v1/discs/{id}/` | Название, обложка, режим воспроизведения, автозапуск |
| `DELETE` | `/api/v1/discs/{id}/` | Удаление диска (запись и человек не затрагиваются) |
| `POST` | `/api/v1/discs/{id}/tracks/` | Добавление трека по ссылке |
| `PATCH` | `/api/v1/tracks/{id}/` | Название, исполнитель, фрагмент, запомненная позиция |
| `DELETE` | `/api/v1/tracks/{id}/` | Удаление трека |
| `POST` | `/api/v1/discs/{id}/tracks/reorder/` | Порядок треков (MUS-04) |
| `POST` | `/api/v1/music/resolve/` | Разбор ссылки и метаданные без сохранения (MUS-30) |
| `POST` | `/api/v1/music/consent/` | Включение музыкального виджета (MUS-50) |
| `DELETE` | `/api/v1/music/consent/` | Отзыв согласия; диски сохраняются как списки ссылок (MUS-51) |

Разбор ссылки выполняется на сервере, чтобы клиент, мини-плеер и экспорт работали с одним
результатом:

```json
POST /api/v1/music/resolve/
{ "input": "https://youtu.be/kfLuuLLLtiY?t=95" }

200 OK
{
  "source": "youtube",
  "external_id": "kfLuuLLLtiY",
  "title": "Nuvole Bianche",
  "artist": "Ludovico Einaudi",
  "thumbnail_url": "https://…/cached/kfLuuLLLtiY.webp",
  "start_seconds": 95,
  "availability": "ok",
  "embed_url": "https://www.youtube-nocookie.com/embed/kfLuuLLLtiY"
}
```

Недоступное видео — не ошибка запроса: трек всё равно можно сохранить, чтобы не потерять
ссылку (MUS-34). Причина недоступности возвращается полем `availability`, а текст для
пользователя берётся из 16.9:

```json
200 OK
{
  "source": "youtube",
  "external_id": "abc123",
  "title": null,
  "availability": "embedding_denied",
  "message": "Автор запретил воспроизведение вне YouTube",
  "source_url": "https://www.youtube.com/watch?v=abc123"
}
```

Ссылка на плейлист возвращает список треков и сводку по недоступным:

```json
POST /api/v1/music/resolve/
{ "input": "https://www.youtube.com/playlist?list=PLxxxx" }

200 OK
{
  "kind": "playlist",
  "tracks": [],
  "total": 15,
  "unavailable": 3
}
```

Попытка обратиться к музыкальным эндпоинтам без согласия (MUS-50):

```json
403 Forbidden
{ "error": { "code": "forbidden",
             "message": "Музыкальный виджет отключён в настройках приватности" } }
```

## 13.10 Виджеты

| Метод | Путь | Описание |
| --- | --- | --- |
| `GET` | `/api/v1/widget-types/` | Реестр доступных типов: ключ, название, иконка, схема `data`, нужно ли согласие или разрешение (WID-02) |
| `POST` | `/api/v1/widgets/` | Создание экземпляра: `owner_type`, `owner_id`, `type`, `data` |
| `PATCH` | `/api/v1/widgets/{id}/` | Изменение данных или свёрнутого состояния |
| `DELETE` | `/api/v1/widgets/{id}/` | Удаление (обратимо вместе с записью) |
| `POST` | `/api/v1/widgets/{id}/duplicate/` | Дублирование, в том числе «как в прошлой записи» (WID-12) |
| `POST` | `/api/v1/widgets/{id}/refresh/` | Обновление снимка внешних данных по явному действию (WID-07) |
| `POST` | `/api/v1/widgets/reorder/` | Порядок блоков-виджетов у владельца |

Данные виджета проверяются по схеме его типа, поэтому ошибки приходят в обычном формате
с указанием полей:

```json
POST /api/v1/widgets/
{
  "owner_type": "entry",
  "owner_id": "1f7c…",
  "type": "countdown",
  "data": { "target_date": "2026-13-40", "label": "Отпуск" }
}

400 Bad Request
{
  "error": {
    "code": "validation_error",
    "message": "Проверьте заполненные поля",
    "fields": { "data.target_date": "Некорректная дата" }
  }
}
```

Виджеты с внешними данными возвращают снимок и время его получения — клиент не должен
запрашивать сервис сам:

```json
GET /api/v1/entries/{id}/
{
  "widgets": [
    {
      "id": "b8e1…",
      "type": "weather",
      "schema_version": 1,
      "snapshot_at": "2026-08-28T19:04:00Z",
      "data": { "temperature_c": 24, "condition": "clear", "city": "Алматы" }
    }
  ]
}
```

Обращение к типу, требующему согласия, без согласия — та же ошибка, что у музыки (13.9):
`403 forbidden` с текстом о настройках приватности (WID-09).

## 13.11 Сквозные разделы

| Метод | Путь | Описание |
| --- | --- | --- |
| `GET` | `/api/v1/today/` | Данные экрана «Сегодня» одним запросом (NAV-10…NAV-14) |
| `GET` | `/api/v1/search/?q=…&types=entries,people` | Единый поиск (SRCH-01…SRCH-05) |
| `GET` `POST` `PATCH` `DELETE` | `/api/v1/tags/` | Справочник тегов, переименование, слияние (TAG-02, TAG-03) |
| `GET` | `/api/v1/calendar/?month=2026-09` | Календарь месяца (CAL-01) |
| `GET` `PATCH` | `/api/v1/settings/` | Настройки пользователя (10.5) |
| `GET` | `/api/v1/trash/` | Содержимое корзины |
| `POST` | `/api/v1/trash/{type}/{id}/restore/` | Восстановление |
| `DELETE` | `/api/v1/trash/` | Полная очистка корзины |
| `POST` | `/api/v1/attachments/` | Загрузка файла (`multipart/form-data`) |
| `POST` | `/api/v1/data/export/` | Постановка задачи полного экспорта (NFR-20) |
| `POST` | `/api/v1/data/import/` | Импорт архива (NFR-22) |
| `GET` | `/api/v1/data/usage/` | Занятое место с разбивкой (SET-05) |

Экран «Сегодня» отдаётся одним запросом сознательно: собирать его пятью запросами к разным
модулям означает пять раундтрипов на самом частом экране приложения.
