# Миграция названий блюд в базу данных

## Обзор

Этот документ описывает процесс переноса названий блюд из статического файла `src/data/catalog.js` в базу данных PostgreSQL (Neon).

## Структура данных

### Таблица `dishes`

```sql
CREATE TABLE dishes (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  name_lt TEXT NOT NULL,
  name_ru TEXT,
  name_en TEXT,
  weight TEXT,
  price_student DECIMAL(10, 2),
  price_teacher DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Категории

- `sriubos` - Супы
- `main` - Основные блюда
- `salotos` - Салаты
- `drinks` - Напитки
- `other` - Прочее

## Файлы проекта

### Новые файлы

1. **`scripts/migrate_dishes.js`** - Скрипт миграции данных
   - Создает таблицу `dishes` если её нет
   - Загружает данные из `src/data/catalog.js`
   - Использует UPSERT для обновления существующих записей

2. **`api/dishes.js`** - API endpoint для получения блюд
   - `GET /api/dishes` - получить все блюда
   - `GET /api/dishes?category=sriubos` - получить блюда по категории

3. **`src/services/dishes.js`** - Клиентский сервис
   - `loadDishes(category)` - загрузить блюда с сервера

### Изменённые файлы

1. **`src/pages/Catalog.jsx`**
   - Теперь использует API вместо статического `catalogByCategory`
   - Добавлены состояния `allDishes` и `loading`
   - Данные загружаются при изменении категории

## Процесс миграции

### Шаг 1: Подготовка окружения

Убедитесь, что переменная окружения `DATABASE_URL` установлена:

```bash
export DATABASE_URL="postgresql://user:password@host/database"
```

### Шаг 2: Запуск миграции

```bash
node scripts/migrate_dishes.js
```

Скрипт:
1. Создаст таблицу `dishes` если её нет
2. Загрузит все 130+ блюд из `src/data/catalog.js`
3. Обновит существующие записи если они уже есть в БД

### Шаг 3: Проверка миграции

```bash
# Проверить количество блюд
SELECT COUNT(*) FROM dishes;

# Проверить блюда по категориям
SELECT category, COUNT(*) FROM dishes GROUP BY category;

# Просмотреть конкретное блюдо
SELECT * FROM dishes WHERE id = 's1';
```

## API Использование

### Получить все блюда

```bash
curl http://localhost:5173/api/dishes
```

Ответ:
```json
[
  {
    "id": "s1",
    "category": "sriubos",
    "name": "Agurkinė sriuba",
    "nameRu": "Огуречный суп",
    "nameEn": "Cucumber soup",
    "weight": "250/20",
    "priceStudent": 0.25,
    "priceTeacher": 0.28
  },
  ...
]
```

### Получить блюда по категории

```bash
curl http://localhost:5173/api/dishes?category=sriubos
```

## Клиентское использование

```javascript
import { loadDishes } from "../services/dishes.js";

// Загрузить все блюда
const allDishes = await loadDishes();

// Загрузить блюда по категории
const soups = await loadDishes("sriubos");
```

## Откат

Если необходимо откатить миграцию:

```sql
DROP TABLE IF EXISTS dishes;
```

После этого приложение вернётся к использованию статического файла `src/data/catalog.js`.

## Примечания

- Статический файл `src/data/catalog.js` остаётся в проекте для совместимости
- Таблица `dishes` содержит все 130+ блюд из каталога
- Секция `forTranslate` не мигрируется (это блюда в ожидании перевода)
- Цены хранятся как DECIMAL для точности финансовых операций

## Будущие улучшения

1. Добавить админский интерфейс для управления блюдами
2. Добавить возможность редактирования блюд через API
3. Добавить кэширование на клиенте
4. Добавить поддержку динамических меню из внешнего источника
