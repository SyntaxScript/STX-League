# Этап 1 — Подключение домена stxleague.xyz к Cloudflare

> **Зачем Cloudflare**: бесплатный HTTPS, защита от DDoS, удобное управление DNS, в будущем — капча Turnstile.

---

## Часть А. Регистрация в Cloudflare и добавление домена (5 минут)

### 1. Создать аккаунт Cloudflare
1. Открой https://dash.cloudflare.com/sign-up
2. Email + пароль → подтверди email
3. Войди в Dashboard

### 2. Добавить домен
1. На главной странице Dashboard → кнопка **«+ Add a domain»** (или **«Add site»**)
2. Введи: `stxleague.xyz` → **Continue**
3. На странице **«Select a plan»** выбери **Free** (внизу) → **Continue**
4. Cloudflare покажет существующие DNS-записи (скорее всего пусто). Жми **Continue**
5. **ВАЖНО**: Cloudflare покажет 2 nameserver-адреса, например:
   ```
   ada.ns.cloudflare.com
   kirk.ns.cloudflare.com
   ```
   (у тебя будут другие имена — это нормально, у каждого аккаунта свои)
   
   **Не закрывай эту страницу** — скопируй оба адреса.

---

## Часть Б. Изменение nameservers на Spaceship (5 минут)

### 1. Войти в Spaceship
1. Открой https://www.spaceship.com → **Sign in** (вверху справа)
2. После входа → **Dashboard** (или сразу попадёшь на список доменов)

### 2. Найти домен
1. В левом меню → **Manage** → **Domains** (или сразу видишь список на главной)
2. Кликни на **stxleague.xyz**

### 3. Изменить nameservers
1. На странице управления доменом найди раздел **Nameservers** (обычно справа или в табах)
2. Сейчас там стоит **«Spaceship default nameservers»** (или похожее)
3. Нажми кнопку **Manage** → выбери **Custom nameservers**
4. В появившиеся 2 поля вставь nameserver'ы от Cloudflare (которые ты скопировал из Части А, шаг 5):
   ```
   ada.ns.cloudflare.com
   kirk.ns.cloudflare.com
   ```
   (замени на свои реальные значения от Cloudflare!)
5. Нажми **Save** / **Update**
6. Появится подтверждение — обычно «Nameservers updated successfully»

### 4. (Важно!) Отключить DNSSEC
Если Spaceship по умолчанию включил DNSSEC — его нужно временно отключить, иначе DNS-перенос не сработает:
1. На той же странице найди раздел **DNSSEC**
2. Если **включено** (Enabled / Active) — выключи (**Disable**)
3. Если выключено — пропусти этот шаг

---

## Часть В. Подтверждение в Cloudflare (5-60 минут)

1. Вернись в Cloudflare → страница где были показаны nameservers
2. Нажми **«Done, check nameservers»** внизу страницы
3. Cloudflare начнёт проверку. Обычно занимает **5-30 минут**, иногда до 24 часов
4. Когда DNS обновится — Cloudflare пришлёт email:
   ```
   Subject: Cloudflare is now protecting stxleague.xyz
   ```
5. Также в Dashboard статус домена изменится с **«Pending Nameserver Update»** на **«Active»**

---

## ✅ Готово, когда:

- ✅ В Cloudflare Dashboard → `stxleague.xyz` → статус **Active** (зелёная точка)
- ✅ Email от Cloudflare пришёл

---

## 🚀 Что дальше

После этого этапа домен «технически работает», но сайта на нём пока нет — мы привяжем его к GitHub Pages в **Этапе 5** (после того как переделаем код).

Пока DNS обновляется (это может занять до часа) — переходи к **Этапу 2: Supabase** (`02_SUPABASE_SETUP.md`).

---

## 🆘 Если что-то пошло не так

**«Cloudflare пишет, что nameservers не обновились через 24 часа»**
- Проверь в Spaceship, что ты сохранил именно те же ns-адреса, которые Cloudflare показал твоему аккаунту (у каждого свои!)
- Проверь, что DNSSEC выключен
- Используй проверку DNS: https://www.whatsmydns.net/ → введи `stxleague.xyz` → тип записи `NS` → должны показывать cloudflare.com

**«Не вижу раздел Custom Nameservers в Spaceship»**
- Иногда он скрыт под кнопкой **«Advanced settings»** или **«More»**
- Если не нашёл — Spaceship support отвечает быстро (вкладка Help → Chat)
