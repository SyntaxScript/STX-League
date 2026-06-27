/* ===== STX League MD — i18n (RU + RO) =====
   Использование в HTML:
     <span data-i18n="hero.title">Текст по умолчанию</span>
     <input data-i18n-placeholder="form.name" placeholder="...">
     <a data-i18n-title="nav.profile" title="...">
   Использование в JS:
     window.I18N.t('hero.title')
     window.I18N.setLang('ro')
     window.I18N.lang  // текущий язык
*/
(function() {
    'use strict';

    var DICT = {
        ru: {
            // ===== Навигация =====
            'nav.about':     'О турнире',
            'nav.format':    'Формат',
            'nav.prizes':    'Призы',
            'nav.schedule':  'Расписание',
            'nav.teams':     'Команды',
            'nav.rules':     'Правила',
            'nav.faq':       'FAQ',
            'nav.partners':  'Партнёры',
            'nav.register':  'Регистрация',
            'nav.login':     'Войти через Discord',
            'nav.logout':    'Выйти',
            'nav.admin':     'Админ-панель',
            'nav.online':    'В сети',

            // ===== Hero =====
            'hero.tag':      'Киберспортивный турнир • Молдова 2026',
            'hero.slogan':   '«Докажи что ты лучший»',
            'hero.cd.days':  'Дней',
            'hero.cd.hours': 'Часов',
            'hero.cd.mins':  'Минут',
            'hero.cd.secs':  'Секунд',
            'hero.btn.register': 'Зарегистрировать команду',
            'hero.btn.more':     'Подробнее',
            'hero.btn.reg_closed': '🔒 Регистрация скоро',

            // ===== About =====
            'about.tag':     'О турнире',
            'about.title':   'STX LEAGUE MD',
            'about.sub':     'Киберспортивный турнир по Counter-Strike 2 в Молдове от Syntax League. Собери свою команду, докажи что ты лучший и сразись за звание чемпиона.',
            'about.card1.title': 'Дата и время',
            'about.card1.text':  '15 Августа 2026<br>Старт в 10:00',
            'about.card2.title': 'Команды',
            'about.card2.text':  '16 команд<br>5v5 • Single Elimination',
            'about.card3.title': 'Призовой фонд',
            'about.card3.text':  '2 500 MDL<br>+ приз MVP турнира',

            // ===== Format =====
            'format.tag':   'Формат',
            'format.title': 'Турнирная сетка',
            'format.sub':   '16 команд • Single Elimination',
            'format.rules.title': 'Регламент',
            'format.r1': '<strong>1/8 финала:</strong> Best of 1 (Bo1)',
            'format.r2': '<strong>1/4 финала:</strong> Best of 3 (Bo3)',
            'format.r3': '<strong>Полуфинал:</strong> Best of 3 (Bo3)',
            'format.r4': '<strong>Гранд-финал:</strong> Best of 5 (Bo5)',
            'format.r5': '<strong>Матч за 3-е место:</strong> Best of 1 (Bo1)',
            'format.maps.title': 'Маппул',

            // ===== Prizes =====
            'prizes.tag':   'Призы',
            'prizes.title': 'Призовой фонд',
            'prizes.sub':   'Общий призовой фонд — 2 500 MDL',
            'prizes.place1': '1 МЕСТО',
            'prizes.place2': '2 МЕСТО',
            'prizes.place3': '3 МЕСТО',
            'prizes.cur':    'MDL',
            'prizes.mvp':    '<strong>MVP турнира</strong> получает эксклюзивный приз от организаторов!',

            // ===== Schedule =====
            'sched.tag':    'Расписание',
            'sched.title':  'Таймлайн турнира',
            'sched.sub':    '15 Августа 2026 • Время местное (EEST)',
            'sched.e1':     'Регистрация<br>и чекин',
            'sched.e2':     'Открытие<br>турнира',
            'sched.e3':     '1/8 финала<br>Bo1',
            'sched.e4':     '1/4 финала<br>Bo3',
            'sched.e5':     'Полуфиналы<br>Bo3',
            'sched.e6':     'Матч за<br>3 место Bo1',
            'sched.e7':     'Гранд-финал<br>Bo5',
            'sched.e8':     'Награждение',

            // ===== Teams =====
            'teams.tag':       'Команды',
            'teams.title':     'Зарегистрированные команды',
            'teams.counter':   'Зарегистрировано:',
            'teams.empty.name': 'Свободный слот',
            'teams.empty.text': 'Ожидаем команду',
            'teams.loading':   'Загрузка...',
            'teams.error':     'Ошибка загрузки',

            // ===== Register =====
            'reg.tag':         'Регистрация',
            'reg.title':       'Зарегистрировать команду',
            'reg.sub':         'Взнос: 200 MDL с команды • 16 слотов',
            'reg.step1':       'Команда',
            'reg.step2':       'Игроки',
            'reg.step3':       'Подтверждение',
            'reg.auth.title':  'Войдите через Discord',
            'reg.auth.hint':   'Для регистрации команды необходима авторизация',
            'reg.auth.btn':    'Войти через Discord',
            'reg.f.name':      'Название команды',
            'reg.f.name.err':  'Введите название',
            'reg.f.name.ph':   'Night Wolves',
            'reg.f.tag':       'Тег (2-5 символов)',
            'reg.f.tag.err':   '2-5 символов',
            'reg.f.tag.ph':    'NW',
            'reg.f.logo':      'Логотип (необязательно, до 5 MB, PNG/JPG/WebP)',
            'reg.f.logo.btn':  '📁 Загрузить логотип',
            'reg.f.logo.err.size': 'Файл слишком большой (максимум 5 MB)',
            'reg.f.logo.err.type': 'Неподдерживаемый формат (только PNG, JPG, WebP)',
            'reg.review.logo': 'Логотип:',
            'reg.err.logo':    'Ошибка загрузки логотипа. Попробуйте файл поменьше или другой формат.',
            'reg.f.contact':   'Контакт капитана (Telegram)',
            'reg.f.contact.err': 'Укажите Telegram',
            'reg.f.contact.ph':  '@username',
            'reg.btn.next':    'Далее',
            'reg.btn.back':    'Назад',
            'reg.btn.submit':  'Отправить заявку',
            'reg.btn.sending': 'Отправка...',
            'reg.players.ph.nick': 'Никнейм игрока',
            'reg.players.ph.steam': 'Steam ID / Ссылка на профиль',
            'reg.players.err':  'Заполните оба поля',
            'reg.sub.ph.nick':  'Никнейм запасного',
            'reg.sub.ph.steam': 'Steam ID / Ссылка (необязательно)',
            'reg.review.title': 'Проверьте данные',
            'reg.review.team':  'Команда:',
            'reg.review.captain': 'Капитан:',
            'reg.review.discord': 'Discord:',
            'reg.review.player':  'Игрок',
            'reg.review.sub':     'Запасной:',
            'reg.agree':       'Согласен с',
            'reg.agree.link':  'правилами турнира',
            'reg.agree.err':   'Необходимо согласиться',
            'reg.ok.title':    'Заявка отправлена!',
            'reg.ok.text':     'Мы свяжемся с капитаном в Telegram для подтверждения.<br>Реквизиты для оплаты взноса (200 MDL) — после подтверждения.',
            'reg.exists.title': 'У вас уже есть заявка',
            'reg.exists.team':  'Команда:',
            'reg.exists.status': 'Статус:',
            'reg.exists.s.pending':  'на рассмотрении',
            'reg.exists.s.approved': 'одобрена ✅',
            'reg.exists.s.rejected': 'отклонена ❌',
            'reg.exists.reason': 'Причина отклонения:',
            'reg.exists.note':   'С каждого Discord-аккаунта разрешена одна заявка.',
            'reg.closed.title':  'Регистрация на турнир пока закрыта',
            'reg.closed.hint':   'Скоро мы откроем приём заявок. Следите за новостями в Discord и Telegram!',
            'reg.closed.discord': 'Discord-сервер',
            'reg.closed.tg':      'Telegram',
            'reg.err.duplicate': 'У вас уже есть заявка с этого Discord-аккаунта.',
            'reg.err.full':      'Все 16 слотов уже заняты.',
            'reg.err.discord':   'Не удалось получить Discord ID. Попробуйте перелогиниться.',
            'reg.err.generic':   'Ошибка отправки:',

            // ===== Rules =====
            'rules.tag':       'Правила',
            'rules.title':     'Регламент турнира',
            'rules.q1.title':  'Общие правила',
            'rules.q1.text':   'Турнир STX League MD проводится в дисциплине Counter-Strike 2. Формат — 5 на 5. К участию допускаются игроки от 14 лет. Использование читов, стороннего ПО, багов, сговор и оскорбительное поведение запрещены',
            'rules.q2.title':  'Формат матчей',
            'rules.q2.text':   '1/8 финала — Bo1. 1/4 и полуфиналы — Bo3. Матч за 3 место — Bo1. Гранд-финал — Bo5. Вето-процесс перед каждым матчем.',
            'rules.q3.title':  'Античит',
            'rules.q3.text':   'Серверный античит + проверки демо. Читы — немедленная дисквалификация всей команды.',
            'rules.q4.title':  'Опоздания и неявки',
            'rules.q4.text':   'Команды обязаны быть за 15 мин до матча. Опоздание до 10 мин — тех. поражение на карте. Более 15 мин — тех. поражение в матче.',
            'rules.q5.title':  'Спорные ситуации',
            'rules.q5.text':   'Решение принимает судья. Капитан может подать протест. Решение судьи — окончательное.',
            'rules.q6.title':  'Дисквалификация',
            'rules.q6.text':   'Причины: читы, баги, сговор, неявка, оскорбления. Взнос не возвращается.',
            'rules.q7.title':  'Замены игроков',
            'rules.q7.text':   'Замена — Замены разрешены только до старта турнира. После начала плей-офф замены запрещены.',

            // ===== FAQ =====
            'faq.tag':        'FAQ',
            'faq.title':      'Частые вопросы',
            'faq.q1.title':   'Сколько стоит участие?',
            'faq.q1.text':    'Взнос — 200 MDL с команды. Оплата после подтверждения заявки.',
            'faq.q2.title':   'Можно ли с неполным составом?',
            'faq.q2.text':    'Нет. На начало матча — 5 игроков. Менее 5 — тех. поражение.',
            'faq.q3.title':   'Разрешены ли читы, баги или сторонние программы?',
            'faq.q3.text':    'Нет. Это строго запрещено. Запрещены: читы, скрипты, баг-абьюз, стороннее ПО, дающее преимущество, любые формы нечестной игры. За подобные нарушения команда получает дисквалификацию.',
            'faq.q4.title':   'Где будет трансляция?',
            'faq.q4.text':    'В Tik-Tok.',
            'faq.q5.title':   'Что будет за оскорбления или токсичное поведение?',
            'faq.q5.text':    'Оскорбления, угрозы, провокации и токсичное поведение запрещены. В зависимости от ситуации организаторы могут выдать: предупреждение, техническое поражение, дисквалификацию.',
            'faq.q6.title':   'Можно ли стримить свои матчи?',
            'faq.q6.text':    'Да, но организаторы рекомендуют использовать задержку на трансляции, чтобы избежать возможных нарушений честной игры.',
            'faq.q7.title':  'Что будет, если команда опоздает?',
            'faq.q7.text':   'Опоздание может привести к техническому поражению или другим последствиям, в зависимости от ситуации.',
            'faq.q8.title':  'Какие карты используются?',
            'faq.q8.text':   'В турнире используется следующий пул карт: Mirage, Inferno, Anubis, Nuke, Ancient, Dust2, Vertigo, Cache.',
            'faq.q9.title':  'Как связаться с организаторами?',
            'faq.q9.text':   'Telegram: @vecnoyteplo | Email: stxleague@gmail.com | Discord: discord.gg/stxleague',
            'faq.q10.title':  'Будет ли следующий турнир?',
            'faq.q10.text':   'Да, STX League MD задумывается как серия турниров. Лучшие команды текущего турнира могут получить приоритет или приглашения на будущие ивенты.',

            // ===== Partners =====
            'partners.tag':   'Партнёры',
            'partners.title': 'Наши партнёры',
            'partners.cta':   'Хотите стать партнёром?',
            'partners.cta.link': 'Свяжитесь с нами',

            // ===== Admin =====
            'admin.tag':      'Администрирование',
            'admin.title':    'Панель управления',
            'admin.loading':  'Проверка доступа...',
            'admin.no_auth.title': 'Требуется авторизация',
            'admin.no_auth.text':  'Войдите через Discord, чтобы продолжить.<br>Доступ имеют только администраторы турнира.',
            'admin.no_auth.btn':   'Войти через Discord',
            'admin.no_admin.title': 'Доступ запрещён',
            'admin.no_admin.text':  'Ваш Discord-аккаунт не имеет прав администратора.<br>Если это ошибка — обратитесь к организаторам.',
            'admin.no_admin.btn':   'Выйти',
            'admin.refresh':  '↻ Обновить',
            'admin.s.total':  'Всего',
            'admin.s.pending': 'Ожидает',
            'admin.s.approved': 'Одобрено',
            'admin.s.rejected': 'Отклонено',
            'admin.col.team':    'Команда',
            'admin.col.captain': 'Капитан',
            'admin.col.discord': 'Discord',
            'admin.col.date':    'Дата',
            'admin.col.status':  'Статус',
            'admin.col.actions': 'Действия',
            'admin.empty':    'Нет заявок',
            'admin.btn.approve': 'Одобрить',
            'admin.btn.reject':  'Отклонить',
            'admin.btn.players': 'Игроки',
            'admin.btn.delete':  'Удалить',
            'admin.st.pending':  'Ожидает',
            'admin.st.approved': 'Одобрено',
            'admin.st.rejected': 'Отклонено',
            'admin.del.title':   '⚠️ Удаление команды',
            'admin.del.text':    'Вы уверены, что хотите удалить эту заявку?',
            'admin.del.warn':    'Это действие нельзя отменить!',
            'admin.del.cancel':  'Отмена',
            'admin.del.confirm': 'Удалить',
            'admin.reject.reason': 'Причина отклонения (опционально):',
            'admin.modal.close':  'Закрыть',
            'admin.err.load':    'Ошибка загрузки заявок:',
            'admin.err.action':  'Ошибка:',
            'admin.settings.title': '⚙️ Настройки сайта',
            'admin.settings.reg.label': 'Регистрация команд',
            'admin.settings.reg.hint': 'Откройте, когда захотите начать приём заявок',
            'admin.settings.reg.open':  'Регистрация открыта — игроки могут подавать заявки',
            'admin.settings.reg.closed': 'Регистрация закрыта — на странице показывается заглушка',
            'admin.settings.saved': '✅ Сохранено',
            'admin.settings.save_err': 'Ошибка сохранения:',
            // Details modal
            'admin.details.logo.title':   'Логотип',
            'admin.details.logo.none':    'Логотип не загружен',
            'admin.details.logo.broken':  '⚠️ Логотип не загружается',
            'admin.details.logo.open':    'Открыть в новой вкладке',
            'admin.details.captain.title': 'Капитан',
            'admin.details.captain.discord': 'Discord:',
            'admin.details.captain.discord_id': 'Discord ID:',
            'admin.details.captain.contact':    'Контакт:',
            'admin.details.players.title': 'Состав',
            'admin.details.no_players':   'Нет игроков',
            'admin.details.sub':          'ЗАПАСНОЙ',
            'admin.details.copy':         'Копировать ссылку',
            'admin.details.submitted':    'Заявка от',
            'admin.details.rejection':    'Причина отклонения',

            // ===== Common =====
            'common.section.tag.about': 'О турнире',
            'common.btt': 'Наверх',
            'common.sound': 'Звук',
            'common.menu': 'Меню',
            'common.loading': 'Загрузка...',
            'common.lang.label': 'Язык',

            // ===== Footer =====
            'foot.contact': 'stxleague@gmail.com &nbsp;|&nbsp; @stxleague',
            'foot.copy':    '&copy; 2026 Syntax League. Все права защищены.',
            'foot.admin':   'Панель администратора',

            // ===== Easter egg =====
            'egg.text':     'Ты нашёл секретный код! Твоя команда автоматически в финале. Шутка 😄<br>Удачи на турнире, легенда!',
            'egg.close':    'Закрыть',

            // ===== HTML lang attribute =====
            'html.lang':    'ru'
        },

        ro: {
            // ===== Navigation =====
            'nav.about':     'Despre turneu',
            'nav.format':    'Format',
            'nav.prizes':    'Premii',
            'nav.schedule':  'Program',
            'nav.teams':     'Echipe',
            'nav.rules':     'Reguli',
            'nav.faq':       'FAQ',
            'nav.partners':  'Parteneri',
            'nav.register':  'Înregistrare',
            'nav.login':     'Conectare prin Discord',
            'nav.logout':    'Ieșire',
            'nav.admin':     'Panou admin',
            'nav.online':    'Online',

            // ===== Hero =====
            'hero.tag':      'Turneu de esports • Moldova 2026',
            'hero.slogan':   '«Demonstrează că ești cel mai bun»',
            'hero.cd.days':  'Zile',
            'hero.cd.hours': 'Ore',
            'hero.cd.mins':  'Minute',
            'hero.cd.secs':  'Secunde',
            'hero.btn.register': 'Înregistrează echipa',
            'hero.btn.more':     'Detalii',
            'hero.btn.reg_closed': '🔒 Înregistrarea va fi deschisă curând',

            // ===== About =====
            'about.tag':     'Despre turneu',
            'about.title':   'STX LEAGUE MD',
            'about.sub':     'Turneu de esports pe Counter-Strike 2 în Moldova, organizat de Syntax League. Adună-ți echipa, demonstrează că ești cel mai bun și luptă pentru titlul de campion.',
            'about.card1.title': 'Data și ora',
            'about.card1.text':  '15 August 2026<br>Start la ora 10:00',
            'about.card2.title': 'Echipe',
            'about.card2.text':  '16 echipe<br>5v5 • Single Elimination',
            'about.card3.title': 'Fond de premii',
            'about.card3.text':  '2 500 MDL<br>+ premiu MVP al turneului',

            // ===== Format =====
            'format.tag':   'Format',
            'format.title': 'Bracket-ul turneului',
            'format.sub':   '16 echipe • Single Elimination',
            'format.rules.title': 'Regulament',
            'format.r1': '<strong>Optimi:</strong> Best of 1 (Bo1)',
            'format.r2': '<strong>Sferturi:</strong> Best of 3 (Bo3)',
            'format.r3': '<strong>Semifinale:</strong> Best of 3 (Bo3)',
            'format.r4': '<strong>Marea finală:</strong> Best of 5 (Bo5)',
            'format.r5': '<strong>Meciul pentru locul 3:</strong> Best of 1 (Bo1)',
            'format.maps.title': 'Map pool',

            // ===== Prizes =====
            'prizes.tag':   'Premii',
            'prizes.title': 'Fond de premii',
            'prizes.sub':   'Fond total de premii — 2 500 MDL',
            'prizes.place1': 'LOCUL 1',
            'prizes.place2': 'LOCUL 2',
            'prizes.place3': 'LOCUL 3',
            'prizes.cur':    'MDL',
            'prizes.mvp':    '<strong>MVP-ul turneului</strong> primește un premiu exclusiv din partea organizatorilor!',

            // ===== Schedule =====
            'sched.tag':    'Program',
            'sched.title':  'Cronologia turneului',
            'sched.sub':    '15 August 2026 • Ora locală (EEST)',
            'sched.e1':     'Înregistrare<br>și check-in',
            'sched.e2':     'Deschiderea<br>turneului',
            'sched.e3':     'Optimi<br>Bo1',
            'sched.e4':     'Sferturi<br>Bo3',
            'sched.e5':     'Semifinale<br>Bo3',
            'sched.e6':     'Meci pentru<br>locul 3 Bo1',
            'sched.e7':     'Marea finală<br>Bo5',
            'sched.e8':     'Premiere',

            // ===== Teams =====
            'teams.tag':       'Echipe',
            'teams.title':     'Echipe înregistrate',
            'teams.counter':   'Înregistrate:',
            'teams.empty.name': 'Loc liber',
            'teams.empty.text': 'Așteptăm o echipă',
            'teams.loading':   'Se încarcă...',
            'teams.error':     'Eroare la încărcare',

            // ===== Register =====
            'reg.tag':         'Înregistrare',
            'reg.title':       'Înregistrează echipa',
            'reg.sub':         'Taxă: 200 MDL per echipă • 16 locuri',
            'reg.step1':       'Echipă',
            'reg.step2':       'Jucători',
            'reg.step3':       'Confirmare',
            'reg.auth.title':  'Conectează-te prin Discord',
            'reg.auth.hint':   'Pentru înregistrarea echipei este necesară autorizarea',
            'reg.auth.btn':    'Conectare prin Discord',
            'reg.f.name':      'Numele echipei',
            'reg.f.name.err':  'Introduceți numele',
            'reg.f.name.ph':   'Night Wolves',
            'reg.f.tag':       'Tag (2-5 caractere)',
            'reg.f.tag.err':   '2-5 caractere',
            'reg.f.tag.ph':    'NW',
            'reg.f.logo':      'Logo (opțional, până la 5 MB, PNG/JPG/WebP)',
            'reg.f.logo.btn':  '📁 Încarcă logo',
            'reg.f.logo.err.size': 'Fișierul este prea mare (maxim 5 MB)',
            'reg.f.logo.err.type': 'Format neacceptat (doar PNG, JPG, WebP)',
            'reg.review.logo': 'Logo:',
            'reg.err.logo':    'Eroare la încărcarea logo-ului. Încearcă un fișier mai mic sau alt format.',
            'reg.f.contact':   'Contact căpitan (Telegram)',
            'reg.f.contact.err': 'Indicați Telegram',
            'reg.f.contact.ph':  '@username',
            'reg.btn.next':    'Mai departe',
            'reg.btn.back':    'Înapoi',
            'reg.btn.submit':  'Trimite cererea',
            'reg.btn.sending': 'Se trimite...',
            'reg.players.ph.nick': 'Nickname jucător',
            'reg.players.ph.steam': 'Steam ID / Link spre profil',
            'reg.players.err':  'Completați ambele câmpuri',
            'reg.sub.ph.nick':  'Nickname rezervă',
            'reg.sub.ph.steam': 'Steam ID / Link (opțional)',
            'reg.review.title': 'Verificați datele',
            'reg.review.team':  'Echipă:',
            'reg.review.captain': 'Căpitan:',
            'reg.review.discord': 'Discord:',
            'reg.review.player':  'Jucător',
            'reg.review.sub':     'Rezervă:',
            'reg.agree':       'Sunt de acord cu',
            'reg.agree.link':  'regulile turneului',
            'reg.agree.err':   'Trebuie să fiți de acord',
            'reg.ok.title':    'Cererea a fost trimisă!',
            'reg.ok.text':     'Vom contacta căpitanul prin Telegram pentru confirmare.<br>Detaliile de plată a taxei (200 MDL) — după confirmare.',
            'reg.exists.title': 'Aveți deja o cerere',
            'reg.exists.team':  'Echipă:',
            'reg.exists.status': 'Status:',
            'reg.exists.s.pending':  'în așteptare',
            'reg.exists.s.approved': 'aprobată ✅',
            'reg.exists.s.rejected': 'respinsă ❌',
            'reg.exists.reason': 'Motivul respingerii:',
            'reg.exists.note':   'Cu un singur cont Discord este permisă o singură cerere.',
            'reg.closed.title':  'Înregistrarea la turneu este închisă deocamdată',
            'reg.closed.hint':   'În curând vom deschide primirea cererilor. Urmărește noutățile pe Discord și Telegram!',
            'reg.closed.discord': 'Server Discord',
            'reg.closed.tg':      'Telegram',
            'reg.err.duplicate': 'Aveți deja o cerere cu acest cont Discord.',
            'reg.err.full':      'Toate cele 16 locuri sunt ocupate.',
            'reg.err.discord':   'Nu s-a putut obține Discord ID. Încercați să vă reconectați.',
            'reg.err.generic':   'Eroare la trimitere:',

            // ===== Rules =====
            'rules.tag':       'Reguli',
            'rules.title':     'Regulamentul turneului',
            'rules.q1.title':  'Reguli generale',
            'rules.q1.text':   'Turneul STX League MD se desfășoară pe disciplina Counter-Strike 2. Format — 5 vs 5. La participare sunt admiși jucători de la 14 ani. Este interzisă utilizarea de coduri de trișare, programe terțe, exploatarea unor erori de sistem, înțelegerile ilegale și comportamentul jignitor.',
            'rules.q2.title':  'Formatul meciurilor',
            'rules.q2.text':   'Optimi — Bo1. Sferturi și semifinale — Bo3. Meciul pentru locul 3 — Bo1. Marea finală — Bo5. Proces de veto înainte de fiecare meci.',
            'rules.q3.title':  'Anti-cheat',
            'rules.q3.text':   'Anti-cheat pe server + verificarea demo. Cheat-uri — descalificare imediată a întregii echipe.',
            'rules.q4.title':  'Întârzieri și neprezentări',
            'rules.q4.text':   'Echipele sunt obligate să fie prezente cu 15 min înainte de meci. Întârziere până la 10 min — înfrângere tehnică pe hartă. Peste 15 min — înfrângere tehnică în meci.',
            'rules.q5.title':  'Situații disputate',
            'rules.q5.text':   'Decizia este luată de arbitru. Căpitanul poate depune protest. Decizia arbitrului este finală.',
            'rules.q6.title':  'Descalificare',
            'rules.q6.text':   'Motive: cheat-uri, bug-uri, înțelegere, neprezentare, jigniri. Taxa nu se returnează.',
            'rules.q7.title':  'Înlocuirea jucătorilor',
            'rules.q7.text':   'Înlocuire — Înlocuirile sunt permise doar înainte de începerea turneului. După începerea play-off-ului, înlocuirile sunt interzise.',

            // ===== FAQ =====
            'faq.tag':        'FAQ',
            'faq.title':      'Întrebări frecvente',
            'faq.q1.title':   'Cât costă participarea?',
            'faq.q1.text':    'Taxa — 200 MDL per echipă. Plata după confirmarea cererii.',
            'faq.q2.title':   'Se poate participa cu un lot incomplet?',
            'faq.q2.text':    'Nu. La începutul meciului — 5 jucători. Mai puțin de 5 — înfrângere tehnică.',
            'faq.q3.title':   'Va fi un alt turneu?',
            'faq.q3.text':    'Da! Acesta este primul dintr-o serie. Cele mai bune echipe vor primi invitații.',
            'faq.q4.title':   'Sunt permise cheat-urile, bug-urile sau programele terțe?',
            'faq.q4.text':    'Nu. Este strict interzis. Sunt interzise: cheat-uri, scripturi, abuz de bug-uri, programe terțe care oferă avantaje, orice formă de joc neloial. Pentru astfel de încălcări, echipa va fi descalificată.',
            'faq.q5.title':   'Unde va fi transmisia?',
            'faq.q5.text':    'Pe Tik-Tok.',
            'faq.q6.title':   'Ce se întâmplă dacă există insulte sau comportament toxic?',
            'faq.q6.text':    'Insultele, amenințările, provocările și comportamentul toxic sunt interzise. În funcție de situație, organizatorii pot emite: avertisment, înfrângere tehnică, descalificare.',
            'faq.q7.title':   'Se poate face stream la meciurile proprii?',
            'faq.q7.text':    'Da, dar organizatorii recomandă să folosiți o întârziere la transmisie pentru a evita posibile încălcări ale jocului corect.',
            'faq.q8.title':  'Ce se întâmplă dacă echipa întârzie?',
            'faq.q8.text':   'Întârzierea poate duce la înfrângere tehnică sau alte consecințe, în funcție de situație.',
            'faq.q9.title':  'Ce hărți vor fi folosite?',
            'faq.q9.text':   'În turneu se folosește următorul pool de hărți: Mirage, Inferno, Anubis, Nuke, Ancient, Dust2, Vertigo, Cache.',
            'faq.q10.title':  'Cum pot contacta organizatorii?',
            'faq.q10.text':   'Telegram: @vecnoyteplo | Email: vecnoyteplo@gmail.com | Discord: discord.gg/vecnoyteplo',
            'faq.q11.title':  'Va fi un alt turneu?',
            'faq.q11.text':   'Da, STX League MD este gândit ca o serie de turnee. Cele mai bune echipe din turneul curent pot primi prioritate sau invitații la evenimente viitoare.',

            // ===== Partners =====
            'partners.tag':   'Parteneri',

            'partners.title': 'Partenerii noștri',
            'partners.cta':   'Doriți să deveniți partener?',
            'partners.cta.link': 'Contactați-ne',

            // ===== Admin =====
            'admin.tag':      'Administrare',
            'admin.title':    'Panou de control',
            'admin.loading':  'Verificare acces...',
            'admin.no_auth.title': 'Este necesară autorizarea',
            'admin.no_auth.text':  'Conectați-vă prin Discord pentru a continua.<br>Acces au doar administratorii turneului.',
            'admin.no_auth.btn':   'Conectare prin Discord',
            'admin.no_admin.title': 'Acces interzis',
            'admin.no_admin.text':  'Contul tău Discord nu are drepturi de administrator.<br>Dacă este o eroare — contactați organizatorii.',
            'admin.no_admin.btn':   'Ieșire',
            'admin.refresh':  '↻ Reîmprospătare',
            'admin.s.total':  'Total',
            'admin.s.pending': 'În așteptare',
            'admin.s.approved': 'Aprobate',
            'admin.s.rejected': 'Respinse',
            'admin.col.team':    'Echipă',
            'admin.col.captain': 'Căpitan',
            'admin.col.discord': 'Discord',
            'admin.col.date':    'Data',
            'admin.col.status':  'Status',
            'admin.col.actions': 'Acțiuni',
            'admin.empty':    'Nu există cereri',
            'admin.btn.approve': 'Aprobă',
            'admin.btn.reject':  'Respinge',
            'admin.btn.players': 'Jucători',
            'admin.btn.delete':  'Șterge',
            'admin.st.pending':  'În așteptare',
            'admin.st.approved': 'Aprobată',
            'admin.st.rejected': 'Respinsă',
            'admin.del.title':   '⚠️ Ștergerea echipei',
            'admin.del.text':    'Sigur doriți să ștergeți această cerere?',
            'admin.del.warn':    'Această acțiune nu poate fi anulată!',
            'admin.del.cancel':  'Anulează',
            'admin.del.confirm': 'Șterge',
            'admin.reject.reason': 'Motivul respingerii (opțional):',
            'admin.modal.close':  'Închide',
            'admin.err.load':    'Eroare la încărcarea cererilor:',
            'admin.err.action':  'Eroare:',
            'admin.settings.title': '⚙️ Setări site',
            'admin.settings.reg.label': 'Înregistrarea echipelor',
            'admin.settings.reg.hint': 'Activează când vrei să începi primirea cererilor',
            'admin.settings.reg.open':  'Înregistrarea este deschisă — jucătorii pot trimite cereri',
            'admin.settings.reg.closed': 'Înregistrarea este închisă — pe pagină se afișează mesaj',
            'admin.settings.saved': '✅ Salvat',
            'admin.settings.save_err': 'Eroare la salvare:',
            // Details modal
            'admin.details.logo.title':   'Logo',
            'admin.details.logo.none':    'Logo nu a fost încărcat',
            'admin.details.logo.broken':  '⚠️ Logo nu se încarcă',
            'admin.details.logo.open':    'Deschide în filă nouă',
            'admin.details.captain.title': 'Căpitan',
            'admin.details.captain.discord': 'Discord:',
            'admin.details.captain.discord_id': 'Discord ID:',
            'admin.details.captain.contact':    'Contact:',
            'admin.details.players.title': 'Componența',
            'admin.details.no_players':   'Nu sunt jucători',
            'admin.details.sub':          'REZERVĂ',
            'admin.details.copy':         'Copiază linkul',
            'admin.details.submitted':    'Cerere din',
            'admin.details.rejection':    'Motivul respingerii',

            // ===== Common =====
            'common.section.tag.about': 'Despre turneu',
            'common.btt': 'Sus',
            'common.sound': 'Sunet',
            'common.menu': 'Meniu',
            'common.loading': 'Se încarcă...',
            'common.lang.label': 'Limbă',

            // ===== Footer =====
            'foot.contact': 'stxleague@gmail.com &nbsp;|&nbsp; @stxleague',
            'foot.copy':    '&copy; 2026 Syntax League. Toate drepturile rezervate.',
            'foot.admin':   'Panou administrator',

            // ===== Easter egg =====
            'egg.text':     'Ai găsit codul secret! Echipa ta este automat în finală. Glumă 😄<br>Succes la turneu, legendă!',
            'egg.close':    'Închide',

            // ===== HTML lang attribute =====
            'html.lang':    'ro'
        }
    };

    var STORAGE_KEY = 'stx_lang';
    var DEFAULT_LANG = 'ru';

    function detectLang() {
        var saved = localStorage.getItem(STORAGE_KEY);
        if (saved && DICT[saved]) return saved;
        return DEFAULT_LANG;
    }

    var I18N = {
        lang: detectLang(),
        DICT: DICT,

        t: function(key, fallback) {
            var v = (DICT[this.lang] && DICT[this.lang][key]);
            if (v != null) return v;
            // fallback: попробовать другой язык
            var alt = (DICT[DEFAULT_LANG] && DICT[DEFAULT_LANG][key]);
            return alt != null ? alt : (fallback != null ? fallback : key);
        },

        setLang: function(lang) {
            if (!DICT[lang]) return;
            this.lang = lang;
            localStorage.setItem(STORAGE_KEY, lang);
            this.applyToDOM();
            document.documentElement.lang = this.t('html.lang') || lang;
            document.dispatchEvent(new CustomEvent('stx:lang', { detail: { lang: lang } }));
        },

        applyToDOM: function(root) {
            root = root || document;

            // data-i18n="key" — заменяет innerHTML
            root.querySelectorAll('[data-i18n]').forEach(function(el) {
                var key = el.getAttribute('data-i18n');
                var val = I18N.t(key, null);
                if (val != null) el.innerHTML = val;
            });

            // data-i18n-text="key" — заменяет textContent (без HTML)
            root.querySelectorAll('[data-i18n-text]').forEach(function(el) {
                var key = el.getAttribute('data-i18n-text');
                var val = I18N.t(key, null);
                if (val != null) el.textContent = val;
            });

            // data-i18n-placeholder="key"
            root.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
                var key = el.getAttribute('data-i18n-placeholder');
                var val = I18N.t(key, null);
                if (val != null) el.placeholder = val;
            });

            // data-i18n-title="key"
            root.querySelectorAll('[data-i18n-title]').forEach(function(el) {
                var key = el.getAttribute('data-i18n-title');
                var val = I18N.t(key, null);
                if (val != null) el.title = val;
            });

            // data-i18n-aria-label="key"
            root.querySelectorAll('[data-i18n-aria-label]').forEach(function(el) {
                var key = el.getAttribute('data-i18n-aria-label');
                var val = I18N.t(key, null);
                if (val != null) el.setAttribute('aria-label', val);
            });
        }
    };

    window.I18N = I18N;

    // Применить переводы как только DOM готов
    function ready() {
        document.documentElement.lang = I18N.t('html.lang') || I18N.lang;
        I18N.applyToDOM();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ready);
    } else {
        ready();
    }
})();
