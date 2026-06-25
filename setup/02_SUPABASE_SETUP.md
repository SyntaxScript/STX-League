# Этап 2 — Создание Supabase-проекта

> **Что делаем**: создаём базу данных и систему авторизации в облаке Supabase. Бесплатный тариф (Free).

---

## Часть А. Регистрация и создание проекта (5 минут)

### 1. Войти
1. Открой https://supabase.com
2. Нажми **Start your project** (правый верх)
3. **Continue with GitHub** (используй тот же аккаунт, на котором будет хоститься сайт)
4. Разреши Supabase доступ к GitHub профилю

### 2. Создать проект
1. Кнопка **New project**
2. Если попросит выбрать организацию — создай новую: `stx-league` (имя любое)
3. Заполни:
   | Поле | Значение |
   |---|---|
   | **Name** | `stx-league-md` |
   | **Database Password** | Нажми **«Generate a password»** — **ОБЯЗАТЕЛЬНО СОХРАНИ в надёжное место** (1Password / заметки телефона / KeePass). Восстановить нельзя! |
   | **Region** | `West EU (Frankfurt) eu-central-1` |
   | **Pricing Plan** | `Free` |
4. Нажми **Create new project**
5. **Жди 1-2 минуты** — Supabase разворачивает базу

### 3. Получить ключи API
1. Когда проект готов — слева внизу меню есть иконка ⚙ **Settings**
2. В подменю выбери **API**
3. На странице увидишь:
   - **Project URL** — копируй (вида `https://abcdefghijkl.supabase.co`)
   - **Project API keys** → блок **anon / public** → длинный токен начинается с `eyJ...` — копируй
   - **service_role** key — **НЕ КОПИРУЙ И НЕ ПРИСЫЛАЙ НИКОМУ!** Это полный доступ к БД.

4. **Пришли мне в чат:**
   - `Project URL`
   - `anon public` key
   
   (Эти 2 значения публичные — они в любом случае видны в HTML сайта)

---

## Часть Б. Применить схему БД (3 минуты)

### 1. Открой SQL Editor
1. В левом меню Supabase Dashboard → **SQL Editor** (иконка `</>`)
2. Кнопка **+ New query**

### 2. Вставь и запусти миграцию
1. Открой файл `supabase/schema.sql` из проекта
2. Выдели **весь** код (Ctrl+A) → копируй (Ctrl+C)
3. Вставь в SQL Editor (Ctrl+V)
4. Нажми **Run** (или Ctrl+Enter)

### 3. Проверь результат
Внизу появится:
```
Success. No rows returned
```

Слева в меню → **Table Editor** (иконка таблицы) → ты увидишь созданные таблицы:
- ✅ `admins`
- ✅ `teams`
- ✅ `players`
- ✅ `audit_log`

---

## Часть В. Включить Discord OAuth (2 минуты)

> Это шаг **подготовительный** — сами Client ID/Secret получим в Этапе 3.

1. Левое меню → **Authentication** (иконка человечка) → **Providers**
2. Найди **Discord** в списке → клик
3. Переключатель **Enable Sign in with Discord** → **ON**
4. **Скопируй** значение поля **«Callback URL (for OAuth)»** — оно понадобится в Этапе 3. Выглядит так:
   ```
   https://abcdefghijkl.supabase.co/auth/v1/callback
   ```
5. Поля **Client ID** и **Client Secret** пока пустые — заполним в Этапе 3.
6. Пока **НЕ нажимай Save** (без Client ID он не сохранит).

---

## ✅ Готово, когда:
- ✅ Supabase-проект создан, статус «Active»
- ✅ SQL-миграция выполнена без ошибок
- ✅ Таблицы `admins`, `teams`, `players`, `audit_log` видны в Table Editor
- ✅ Discord Callback URL скопирован
- ✅ Project URL и anon key присланы мне

---

## 🚀 Что дальше
Переходим к **Этапу 3: Discord OAuth Application** (`03_DISCORD_OAUTH.md`)

---

## 🆘 Если ошибка

**«SQL Error: function uuid_generate_v4() does not exist»**
- Запусти отдельно первой строкой: `create extension if not exists "uuid-ossp";`

**«Permission denied for schema public»**
- Это нормально — RLS работает. Запусти миграцию ещё раз — должно пройти.
