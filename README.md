# STX League MD — структура проекта

Сайт турнира

## 📁 Структура

```
/
├── index.html, about.html, format.html, ...
│
├── css/style.css                ← все стили
│
├── js/
│   ├── config.js                ← Supabase URL + publishable key
│   ├── supabase-client.js       ← клиент + auth
│   ├── common.js                ← шапка/футер/preloader/auth UI
│   ├── hero.js                  ← particles + countdown + typewriter
│   ├── teams.js                 ← рендер approved-команд из БД
│   ├── register.js              ← регистрация
│   └── accordion.js             ← rules + faq
