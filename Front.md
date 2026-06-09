# API Documentation — Frontend Integration

## Общие правила

### Базовый URL (!!! Без /api)
```
https://verdant-current-6097.fly.dev
```

### Аутентификация
- **Cookie-based**: после `POST /login` сервер устанавливает сессионную cookie.
- Фронтенд прикрепляет cookie к каждому запросу (браузер делает это автоматически).
- На незащищённые эндпоинты возвращается `401 Unauthorized` (JSON) или редирект на `/login`.

### Content-Type по умолчанию
- Все `POST` запросы — `application/x-www-form-urlencoded`.
- JSON-ответы возвращаются только если клиент отправляет заголовок `Accept: application/json` или `X-Requested-With: XMLHttpRequest`.

### Формат ответов
**Успех (HTML)** — редирект `302` или рендер шаблона `200`.
**Успех (JSON для AJAX):**
```json
{"detail": "...", "id": 1, ...}
```
**Ошибка (JSON):**
```json
{"detail": "Сообщение об ошибке"}
```

---

## 1. Auth

### 1.1 GET /login
Отдаёт HTML-форму логина (шаблон `login.html`).

### 1.2 POST /login
**Вход в систему.**

| Поле | Тип | Обязательно | Описание |
|---|---|---|---|
| `login` | string | да | Логин |
| `password` | string | да | Пароль |

**Успех (JSON, 200):**
```json
{
  "detail": "Login successful",
  "user": {
    "id": 1,
    "login": "admin",
    "full_name": "Главный администратор",
    "role": "admin",
    "status": "active"
  }
}
```
**Ошибки:** `400` (нет полей), `401` (неверные данные), `403` (учётная запись неактивна).

### 1.3 GET /logout
Очищает сессию. Редирект на `/login`.

---

## 2. Dashboard

### 2.1 GET /dashboard
**Главная панель.** Отдаёт HTML с данными:
- Последние измерения по активным датчикам (сгруппированы по узлам)
- Активные алерты (до 10 шт.)
- Статистика: всего узлов, оборудования, оборудования в fault

### 2.2 GET /api/current
**JSON для AJAX-обновлений (polling).**

**Успех (200):**
```json
{
  "nodes": [
    {
      "node_id": 1,
      "node_name": "Узел 1",
      "sensors": [
        {
          "sensor_id": 1,
          "sensor_name": "Датчик температуры",
          "sensor_type": "temperature",
          "unit": "°C",
          "measured_at": "2026-06-09T12:34:56",
          "temperature_supply": 85.2,
          "temperature_return": 55.1,
          "pressure": 0.89,
          "flow_rate": 120.5,
          "heat_load": 3.45
        }
      ]
    }
  ]
}
```
Все числовые поля могут быть `null`.

---

## 3. Users (ADMIN)

### 3.1 GET /admin/users
**Список пользователей.** HTML. Роль: `admin`.

### 3.2 POST /admin/users/add

| Поле | Тип | Обязательно | Описание |
|---|---|---|---|
| `login` | string | да | Уникальный логин |
| `password` | string | да | Пароль |
| `full_name` | string | нет | Полное имя (если пусто — копия login) |
| `role` | string | да | `operator`, `engineer`, `energetic`, `admin` |

**Успех (JSON, 201):**
```json
{"detail": "User created", "id": 5}
```
**Ошибки:** `400` (нет полей / неверная роль), `409` (логин занят).

### 3.3 POST /admin/users/{user_id}/status
**Смена статуса пользователя.**

| Поле | Тип | Обязательно | Описание |
|---|---|---|---|
| `status` | string | да | `active` или `inactive` |

**Успех (JSON, 200):**
```json
{"detail": "Status updated", "status": "inactive"}
```
**Ошибки:** `404` (не найден), `400` (неверный статус).

---

## 4. Heat Nodes (ADMIN)

Все типы узлов: `pump_station`, `supply`, `return`, `consumer`, `other`.

### 4.1 GET /admin/nodes
**Список узлов.** HTML.

### 4.2 POST /admin/nodes/add

| Поле | Тип | Обязательно | Описание |
|---|---|---|---|
| `node_name` | string | да | Название (уникальное) |
| `location` | string | нет | Адрес/местоположение |
| `node_type` | string | да | Один из: `pump_station`, `supply`, `return`, `consumer`, `other` |
| `description` | string | нет | Описание |

**Успех (JSON, 201):**
```json
{"detail": "Node created", "id": 10}
```
**Ошибки:** `400` (нет названия / неверный тип), `409` (название занято).

### 4.3 POST /admin/nodes/{node_id}/edit

Те же поля, что и add. **Успех (JSON, 200):**
```json
{"detail": "Node updated"}
```

### 4.4 POST /admin/nodes/{node_id}/delete
**Успех (JSON, 200):**
```json
{"detail": "Node deleted"}
```

---

## 5. Sensors (ADMIN)

Типы датчиков: `temperature`, `pressure`, `flow`, `heat`, `combined`.
Статусы: `active`, `inactive`, `fault`.

### 5.1 GET /admin/sensors
**Список датчиков.** HTML. Включает все узлы для выпадающего списка.

### 5.2 POST /admin/sensors/add

| Поле | Тип | Обязательно | Описание |
|---|---|---|---|
| `node_id` | int | да | ID узла |
| `sensor_name` | string | да | Название |
| `sensor_type` | string | да | Тип (см. выше) |
| `unit` | string | да | Единица измерения (напр. `°C`, `МПа`) |

Статус нового датчика — `active` (фиксировано).

**Успех (JSON, 201):**
```json
{"detail": "Sensor created", "id": 35}
```

### 5.3 POST /admin/sensors/{sensor_id}/edit

| Поле | Тип | Обязательно | Описание |
|---|---|---|---|
| `node_id` | int | нет | Новый ID узла |
| `sensor_name` | string | да | Название |
| `sensor_type` | string | да | Тип |
| `unit` | string | нет | Единица (необновляется, если не передана) |
| `status` | string | нет | Новый статус |

**Успех (JSON, 200):**
```json
{"detail": "Sensor updated"}
```

### 5.4 POST /admin/sensors/{sensor_id}/delete

**Успех (JSON, 200):**
```json
{"detail": "Sensor deleted"}
```

---

## 6. Measurements

### 6.1 GET /measurements/archive
**Архив измерений.** HTML. Пагинация (50 на страницу).

Параметры query:
| Параметр | Тип | Описание |
|---|---|---|
| `page` | int | Номер страницы |
| `sensor_id` | int | Фильтр по датчику |
| `node_id` | int | Фильтр по узлу |
| `date_from` | date | `YYYY-MM-DD` |
| `date_to` | date | `YYYY-MM-DD` |

### 6.2 GET /measurements/add
**Форма добавления.** HTML. Загружает активные датчики для выбора.

### 6.3 POST /measurements/add

| Поле | Тип | Обязательно | Описание |
|---|---|---|---|
| `sensor_id` | int | да | ID активного датчика |
| `temperature_supply` | float | нет | Температура подачи, °C [-50..200] |
| `temperature_return` | float | нет | Температура обратки, °C [-50..200] |
| `pressure` | float | нет | Давление, МПа [0..10] |
| `flow_rate` | float | нет | Расход, м³/ч [0..5000] |
| `measured_at` | datetime | нет | ISO 8601. Если пусто — текущее время сервера |

**Успех (JSON, 201):**
```json
{"detail": "Measurement created", "id": 604}
```
**Ошибки:** `400` (нет sersor_id / неверный датчик / значения вне диапазона).

*Тепловая нагрузка (`heat_load`) рассчитывается автоматически на сервере.*

---

## 7. Alerts

Уровни: `warning`, `critical`, `emergency`.
Статусы: `active`, `resolved`.
Типы: `range_violation`, `dynamic_spike`, `sensor_fault`.

### 7.1 GET /alerts
**Список алертов.** HTML. Пагинация (50).

Параметры query:
| Параметр | Тип | Описание |
|---|---|---|
| `page` | int | Номер |
| `status` | string | `active` / `resolved` |
| `alert_level` | string | `warning` / `critical` / `emergency` |
| `date_from` | date | `YYYY-MM-DD` |
| `date_to` | date | `YYYY-MM-DD` |

### 7.2 POST /alerts/{alert_id}/resolve
**Закрыть алерт.** Роль: `engineer`, `admin`.

**Успех (JSON, 200):**
```json
{"detail": "Alert resolved"}
```
**Ошибки:** `404` (не найден), `400` (уже resolved).

---

## 8. Equipment

Состояния: `working`, `stopped`, `fault`.
Типы: `pump`, `valve`, `heat_exchanger`, `other`.

### 8.1 GET /equipment
**Список оборудования.** HTML.

Параметры query:
| Параметр | Тип | Описание |
|---|---|---|
| `state` | string | Фильтр по состоянию |
| `node_id` | int | Фильтр по узлу |

### 8.2 POST /equipment/add

| Поле | Тип | Обязательно | Описание |
|---|---|---|---|
| `node_id` | int | да | ID узла |
| `equipment_name` | string | да | Название |
| `equipment_type` | string | да | `pump`, `valve`, `heat_exchanger`, `other` |

Новое оборудование создаётся со статусом `working`.

**Успех (JSON, 201):**
```json
{"detail": "Equipment added", "id": 13}
```

### 8.3 POST /equipment/{equipment_id}/state
**Смена состояния.**

| Поле | Тип | Обязательно | Описание |
|---|---|---|---|
| `state` | string | да | `working`, `stopped`, `fault` |

**Успех (JSON, 200):**
```json
{"detail": "State updated", "state": "fault"}
```

---

## 9. Reports

Типы отчётов (в БД): `daily`, `weekly`, `monthly`.
Форматы выгрузки: `xlsx` (Excel 3 листа), `csv`.

### 9.1 GET /reports
**Список сгенерированных отчётов.** HTML. Пагинация (20).

### 9.2 POST /reports/generate
**Сгенерировать отчёт.** Роль: `engineer`, `admin`.

| Поле | Тип | Обязательно | Описание |
|---|---|---|---|
| `date_from` | date | да | Начало периода, `YYYY-MM-DD` |
| `date_to` | date | да | Конец периода, `YYYY-MM-DD` |
| `node_id` | int | нет | Фильтр по узлу |
| `format` | string | нет | `xlsx` (по умолчанию) или `csv` |

**Успех (JSON, 201):**
```json
{
  "detail": "Report generated",
  "id": 15,
  "file_path": "reports\\2026\\06\\report_20260609_204928.csv"
}
```

### 9.3 GET /reports/export/csv?id={report_id}
**Скачать CSV-отчёт.**

| Параметр | Тип | Описание |
|---|---|---|
| `id` | int | ID отчёта из списка |

**Успех (200):** Файл `report_{id}.csv` с BOM (UTF-8-SIG), заголовки на русском.

### 9.4 GET /reports/export/xlsx?id={report_id}
**Скачать XLSX-отчёт.** 3 листа: Summary (агрегаты + алерты), Measurements (все измерения), Alerts.

**Успех (200):** Файл `report_{id}.xlsx`.

**Ошибки:** `400` (нет id), `404` (отчёт или файл не найден).

---

## Ролевая модель

| Роль | Доступ |
|---|---|
| `operator` | Dashboard, Measurements (add + archive), Alerts (list), Equipment (list), Reports (list) |
| `engineer` | Всё что operator + Equipment (add/state), Alerts (resolve), Reports (generate) |
| `energetic` | Dashboard, Measurements (archive), Alerts (list), Equipment (list), Reports (list) |
| `admin` | Всё + Users CRUD, Nodes CRUD, Sensors CRUD |

---

## Модели данных (сокращённо)

### User
```json
{
  "id": 1,
  "login": "admin",
  "full_name": "...",
  "role": "admin",
  "status": "active"
}
```

### HeatNode
```json
{
  "node_id": 1,
  "node_name": "Узел 1",
  "location": "ул. Ленина",
  "node_type": "pump_station",
  "description": "..."
}
```

### Sensor
```json
{
  "sensor_id": 1,
  "node_id": 1,
  "sensor_name": "T1",
  "sensor_type": "temperature",
  "unit": "°C",
  "status": "active"
}
```

### Measurement
```json
{
  "measurement_id": 1,
  "sensor_id": 1,
  "measured_at": "2026-06-09T12:00:00",
  "temperature_supply": 85.2,
  "temperature_return": 55.1,
  "pressure": 0.89,
  "flow_rate": 120.5,
  "heat_load": 3.45
}
```

### Alert
```json
{
  "alert_id": 1,
  "measurement_id": 1,
  "alert_type": "range_violation",
  "alert_level": "warning",
  "message": "Температура подачи выше нормы",
  "created_at": "2026-06-09T12:00:01",
  "status": "active"
}
```

### Equipment
```json
{
  "equipment_id": 1,
  "node_id": 1,
  "equipment_name": "Насос H-1",
  "equipment_type": "pump",
  "state": "working",
  "last_service_date": null
}
```

### Report
```json
{
  "report_id": 1,
  "user_id": 1,
  "date_from": "2026-06-01",
  "date_to": "2026-06-10",
  "report_type": "daily",
  "created_at": "2026-06-10T01:00:00",
  "file_path": "reports/2026/06/report_..."
}
```
