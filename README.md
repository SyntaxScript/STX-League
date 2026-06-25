# STX League MD — структура проекта

Сайт турнира по CS2 с реальным бэкендом на Supabase + Discord OAuth.

## 📁 Структура

```
/
├── index.html, about.html, format.html, ...  ← 11 страниц
│
├── css/style.css                ← все стили
│
├── js/
│   ├── config.js                ← Supabase URL + publishable key (публичные)
│   ├── supabase-client.js       ← клиент + auth (window.STX)
│   ├── common.js                ← шапка/футер/preloader/auth UI
│   ├── hero.js                  ← particles + countdown + typewriter
│   ├── teams.js                 ← рендер approved-команд из БД
│   ├── register.js              ← регистрация в Supabase
│   ├── admin.js                 ← админ-панель (доступ через RLS)
│   └── accordion.js             ← rules + faq
│
├── supabase/
│   ├── schema.sql               ← миграция БД (запустить в SQL Editor)
│   └── seed_admins.sql          ← добавление админов
│
├── setup/                       ← пошаговые инструкции
│   ├── README.md                ← план всех этапов
│   ├── 01_SPACESHIP_DNS.md
│   ├── 02_SUPABASE_SETUP.md
│   ├── 03_DISCORD_OAUTH.md
│   ├── 04_ADD_ADMIN.md
│   └── 05_AUTH_REDIRECTS.md
│
└── backup/                      ← резервная копия исходного monofile
    └── index_original_full.html
```

## 🚀 Быстрый старт (сейчас)

### 1. Применить SQL в Supabase
1. Supabase Dashboard → **SQL Editor** → **+ New query**
2. Скопировать содержимое `supabase/schema.sql` → **Run**
3. Должно показать `Success. No rows returned`
4. Затем — **+ New query** → скопировать `supabase/seed_admins.sql` → **Run**
5. Проверка: в Table Editor → `admins` должны быть 3 строки

### 2. Настроить Discord OAuth в Supabase
1. Authentication → Providers → **Discord** → Enable
2. Вставить Client ID и Client Secret из Discord Developer Portal
3. Скопировать **Callback URL** → вставить в Discord App → OAuth2 → Redirects → Save

### 3. Настроить Redirect URLs в Supabase
- Authentication → URL Configuration
- **Site URL**: `https://stxleague.xyz`
- **Redirect URLs**: добавить `https://stxleague.xyz/*` и `http://localhost:8000/*` для тестов
- См. подробно: `setup/05_AUTH_REDIRECTS.md`

### 4. Локальный тест
```bash
cd /home/user
python3 -m http.server 8000
# Открыть http://localhost:8000/
```

⚠️ **Не открывай через `file://`** — Supabase OAuth работает только через `http://` или `https://`.

### 5. Деплой
После того как локально всё работает — заливаем на GitHub Pages (будет в `setup/06_DEPLOY.md`).

## 🔐 Защита

Текущий уровень защиты:

| Угроза | Защищено? | Как |
|---|---|---|
| Подсмотреть пароль через F12 | ✅ Да | Пароля нет — авторизация через Discord OAuth |
| Войти в админку обходным путём | ✅ Да | RLS на стороне Postgres проверяет `is_admin()` |
| Отправить 100 заявок с 1 аккаунта | ✅ Да | UNIQUE constraint `one_team_per_captain` в БД |
| Одобрить свою заявку | ✅ Да | RLS-политика разрешает UPDATE только админам |
| Подделать Discord ID | ✅ Да | JWT-подпись проверяется Supabase |
| Превысить 16 команд | ✅ Да | Триггер `check_max_approved_teams` в БД |
| Удалить чужие данные | ✅ Да | RLS-политика DELETE только для админов |
| Прямой SQL-инъекшн | ✅ Да | Supabase использует параметризованные запросы |
| Перехват трафика | ⚠️ После HTTPS | GitHub Pages + Cloudflare дадут HTTPS |
| DDoS атака | ⚠️ Частично | Cloudflare защитит, но Free-тариф ограничен |
| Спам-боты на регистрации | ⚠️ Частично | Discord-вход = барьер; капчу можно добавить позже |

## 👥 Управление администраторами

**Добавить админа:**
```sql
insert into public.admins (discord_id, discord_username, note)
values ('1234567890123456789', 'nickname', 'Помощник');
```

**Удалить:**
```sql
delete from public.admins where discord_id = '1234567890123456789';
```

**Узнать Discord ID:** Discord → Настройки → Расширенные → Режим разработчика → ПКМ по нику → «Копировать ID пользователя»

## 🗂️ Просмотр заявок

- Публичная страница `/teams.html` — показывает только **approved** команды
- Админ-панель `/admin.html` — все заявки (pending/approved/rejected) с действиями
- В Supabase Dashboard → Table Editor → `teams` — прямой доступ к данным

## 📊 Аудит

Все действия админов (одобрение/отклонение/удаление) автоматически логируются:
```sql
select * from audit_log order by created_at desc limit 50;
```

## 🆘 Откат на старую версию

Если что-то пойдёт не так с Supabase — `backup/index_original_full.html` остаётся рабочей single-file версией с `localStorage`.

```bash
cp backup/index_original_full.html index.html
# и удалить js/config.js, js/supabase-client.js + обновить admin.html
```

## 📞 Контакты

Если что-то не работает — пиши в чат, разберёмся.
