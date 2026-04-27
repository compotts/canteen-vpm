# Скрипты миграции

## migrate_dishes.js

Скрипт для переноса названий блюд из статического файла `src/data/catalog.js` в базу данных PostgreSQL.

### Требования

- Node.js 16+
- Переменная окружения `DATABASE_URL` с подключением к PostgreSQL

### Использование

```bash
# Установить зависимости
npm install

# Запустить миграцию
node scripts/migrate_dishes.js
```

### Что делает скрипт

1. Подключается к базе данных через `DATABASE_URL`
2. Создаёт таблицу `dishes` если её нет
3. Загружает все блюда из `src/data/catalog.js`
4. Вставляет/обновляет записи в таблице (UPSERT)
5. Выводит результат в консоль

### Структура таблицы

| Колонка | Тип | Описание |
|---------|-----|---------|
| id | TEXT | Уникальный идентификатор (первичный ключ) |
| category | TEXT | Категория блюда (sriubos, main, salotos, drinks, other) |
| name_lt | TEXT | Название на литовском |
| name_ru | TEXT | Название на русском |
| name_en | TEXT | Название на английском |
| weight | TEXT | Вес/порция |
| price_student | DECIMAL | Цена для студентов |
| price_teacher | DECIMAL | Цена для преподавателей |
| created_at | TIMESTAMP | Время создания |
| updated_at | TIMESTAMP | Время последнего обновления |

### Пример вывода

```
Starting migration...
Table 'dishes' ensured.
Found 130 dishes to migrate.
Migration completed successfully.
```

### Обработка ошибок

Если возникает ошибка:

1. Проверьте `DATABASE_URL`
2. Убедитесь, что база данных доступна
3. Проверьте права доступа
4. Посмотрите полный текст ошибки в консоли

### Откат

Для отката миграции выполните:

```sql
DROP TABLE IF EXISTS dishes;
```
