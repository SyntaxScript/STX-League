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
│   ├── config.js                ← Supabase URL + publishable key
│   ├── supabase-client.js       ← клиент + auth
│   ├── common.js                ← шапка/футер/preloader/auth UI
│   ├── hero.js                  ← particles + countdown + typewriter
│   ├── teams.js                 ← рендер approved-команд из БД
│   ├── register.js              ← регистрация в Supabase
│   ├── admin.js                 ← админ-панель (доступ через RLS)
│   └── accordion.js             ← rules + faq
