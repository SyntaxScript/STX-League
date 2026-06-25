# Этап 3 — Discord OAuth Application

> **Что делаем**: создаём приложение в Discord, чтобы пользователи могли «Войти через Discord» по-настоящему (не mock).

---

## Часть А. Создать приложение в Discord Developer Portal

### 1. Войти
1. Открой https://discord.com/developers/applications
2. Войди под своим Discord-аккаунтом

### 2. Создать application
1. Кнопка **New Application** (правый верх)
2. **Name**: `STX League MD`
3. ✅ Согласись с Developer ToS
4. **Create**

### 3. Базовая инфа (опционально)
На странице **General Information** можешь:
- Загрузить иконку приложения (логотип турнира)
- Описание: `Регистрация на турнир по CS2`

### 4. Настроить OAuth2 Redirects
1. Слева в меню → **OAuth2**
2. Раздел **Redirects** → **Add Redirect**
3. **Вставь Callback URL из Supabase** (тот, что скопировал в Этапе 2, Часть В, шаг 4):
   ```
   https://abcdefghijkl.supabase.co/auth/v1/callback
   ```
   (замени на свой реальный URL!)
4. Нажми **Save Changes** (внизу страницы)

### 5. Получить Client ID и Client Secret
На той же странице **OAuth2** в самом верху:

1. **CLIENT ID** — скопируй (это число, например `1234567890123456789`)
2. **CLIENT SECRET** — нажми **Reset Secret** → **Yes, do it!** → **скопируй СРАЗУ** (второй раз не покажет!)

⚠️ **Client Secret — секретный**. Никому не отправляй, не коммить в Git, не выкладывай в публичные чаты.

---

## Часть Б. Заполнить ключи в Supabase

1. Вернись в Supabase Dashboard → **Authentication** → **Providers** → **Discord**
2. Вставь:
   - **Client ID** — из Discord (CLIENT ID)
   - **Client Secret** — из Discord (CLIENT SECRET, который только что скопировал)
3. **Skip nonce check** — оставь как есть (выключено)
4. **Save**

✅ Готово — теперь Supabase знает, как авторизовать пользователей через Discord.

---

## Часть В. Тест авторизации (опционально, для проверки)

Можно сразу проверить:
1. В Supabase → **Authentication** → **Users**
2. Пока список пустой
3. После того как мы переделаем сайт, при первом входе через Discord в этом списке появится твой аккаунт.

---

## ✅ Готово, когда:
- ✅ Discord application создан
- ✅ Redirect URL вставлен и сохранён
- ✅ Client ID + Secret вставлены в Supabase → Authentication → Providers → Discord → Saved
- ✅ Никому не показал Client Secret

---

## 🚀 Что дальше
**Этап 4: Добавить себя в admins** (`04_ADD_ADMIN.md`)

---

## 🆘 Если что-то не сошлось

**«Invalid Redirect URI» при попытке входа через Discord**
- Проверь, что URL в Discord (OAuth2 → Redirects) и URL в Supabase (Authentication → Providers → Discord → Callback URL) **идентичны до символа**, включая `https://` и `/auth/v1/callback`

**«Discord не показывается среди провайдеров после Save»**
- Обнови страницу Supabase Dashboard
- Проверь что переключатель **Enable Sign in with Discord** включён (ON)
