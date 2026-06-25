# Этап 4.5 — Настройка Redirect URLs в Supabase

> **Зачем**: чтобы после входа через Discord Supabase знал, на какой URL вернуть пользователя. По умолчанию разрешён только `localhost` — нужно добавить твой домен и GitHub Pages.

---

## Шаги

1. Supabase Dashboard → **Authentication** (иконка человечка слева) → **URL Configuration**

2. **Site URL** — основной URL твоего сайта:
   ```
   https://stxleague.xyz
   ```

3. **Redirect URLs** — список разрешённых URL для редиректа после авторизации. Добавь все эти (каждый отдельной строкой):
   ```
   https://stxleague.xyz
   https://stxleague.xyz/*
   https://stxleague.xyz/register.html
   https://stxleague.xyz/admin.html
   http://localhost:8000
   http://localhost:8000/*
   http://127.0.0.1:5500
   http://127.0.0.1:5500/*
   ```
   
   - Первые 4 — для прода
   - Последние 4 — для локальной разработки (если будешь тестировать у себя через `python -m http.server` или Live Server в VS Code)

4. **Save** внизу страницы

---

## ✅ Готово, когда:
- ✅ Site URL = `https://stxleague.xyz`
- ✅ Redirect URLs включают `https://stxleague.xyz/*`

---

## 🆘 Если будет ошибка «Redirect URL not allowed»

После входа через Discord попадёшь на белую страницу с ошибкой — это значит URL не в списке. Просто добавь его в Redirect URLs и сохрани.
