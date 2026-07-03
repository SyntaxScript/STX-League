/* ===== STX League MD — общие функции для всех страниц =====
   - Preloader
   - Динамическая шапка (nav) + бургер-меню
   - Динамический футер
   - Discord auth через Supabase (window.STX)
   - Кнопка «наверх», звук
   - Easter egg (Konami code)
   - Подсветка активного пункта меню по pathname
*/
(function() {
    'use strict';

    // ===== Конфиг навигации =====
    var NAV_LINKS = [
        { href: 'about.html',    key: 'nav.about' },
        { href: 'format.html',   key: 'nav.format' },
        { href: 'prizes.html',   key: 'nav.prizes' },
        { href: 'schedule.html', key: 'nav.schedule' },
        { href: 'teams.html',    key: 'nav.teams' },
        { href: 'rules.html',    key: 'nav.rules' },
        { href: 'faq.html',      key: 'nav.faq' },
        { href: 'help.html', key: 'nav.partners' }
    ];

    function t(k, fb) {
        return (window.I18N && window.I18N.t) ? window.I18N.t(k, fb) : (fb || k);
    }

    function langSwitcherHtml() {
    var cur = (window.I18N && window.I18N.lang) || 'ru';
    return '<div class="lang-switch ' + (cur === 'ro' ? 'ro' : '') + '" id="langSwitch">' +
        '<div class="lang-slider"></div>' +
        '<button class="lang-btn ' + (cur === 'ru' ? 'active' : '') + '" data-lang="ru" title="Русский">RU</button>' +
        '<button class="lang-btn ' + (cur === 'ro' ? 'active' : '') + '" data-lang="ro" title="Română">RO</button>' +
    '</div>';
}

    var DISCORD_ICON = '<svg viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>';

    // ===== PRELOADER =====
    function injectPreloader() {
        if (document.getElementById('preloader')) return;
        var p = document.createElement('div');
        p.id = 'preloader';
        p.innerHTML = '<div class="pload">STX</div><div class="pring"></div><div class="pload-text" data-i18n="common.loading">' + t('common.loading', 'Loading...') + '</div>';
        document.body.insertBefore(p, document.body.firstChild);
    }
    function hidePreloader() {
        var p = document.getElementById('preloader');
        if (p) p.classList.add('hide');
    }

    // ===== NAV =====
    function getCurrentPage() {
        var p = window.location.pathname.split('/').pop() || 'index.html';
        if (p === '') p = 'index.html';
        return p;
    }

    function injectNav() {
        var navHost = document.getElementById('nav-host');
        if (!navHost) return;
        var current = getCurrentPage();

        var linksHtml = NAV_LINKS.map(function(l) {
            var act = (l.href === current) ? ' class="act"' : '';
            return '<a href="' + l.href + '"' + act + ' data-i18n="' + l.key + '">' + t(l.key, '') + '</a>';
        }).join('');

        navHost.outerHTML =
            '<nav id="nav">' +
                '<a href="index.html" class="nlogo">STX LEAGUE</a>' +
                '<div class="nlinks" id="nlinks">' + linksHtml + '</div>' +
                '<div class="nright">' +
                    langSwitcherHtml() +
                    '<button class="btn-discord" id="dBtn">' + DISCORD_ICON + ' <span data-i18n="nav.login">' + t('nav.login') + '</span></button>' +
                    '<div class="user-dropdown-wrap" id="userDropdownWrap">' +
                        '<button class="user-btn" id="userBtn">' +
                            '<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>' +
                            '<span id="userBtnName">Player</span>' +
                            '<svg class="arrow-down" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
                        '</button>' +
                        '<div class="user-dropdown" id="userDropdown">' +
                            '<div class="user-dropdown-info">' +
                                '<div class="uname" id="dropdownUname">Player</div>' +
                                '<div class="ustatus" data-i18n="nav.online">' + t('nav.online') + '</div>' +
                            '</div>' +
                            '<a class="user-dropdown-item" id="adminLink" href="admin.html" style="display:none;color:var(--ac2)">' +
                                '<svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>' +
                                '<span data-i18n="nav.admin">' + t('nav.admin') + '</span>' +
                            '</a>' +
                            '<button class="user-dropdown-item" id="logoutBtn">' +
                                '<svg viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg> ' +
                                '<span data-i18n="nav.logout">' + t('nav.logout') + '</span>' +
                            '</button>' +
                        '</div>' +
                    '</div>' +
                    '<a href="register.html" class="btn-reg" id="rBtn" data-i18n="nav.register">' + t('nav.register') + '</a>' +
                '</div>' +
                '<button class="burger" id="burger" data-i18n-aria-label="common.menu" aria-label="' + t('common.menu') + '"><span></span><span></span><span></span></button>' +
            '</nav>' +
            '<div class="mmenu" id="mmenu">' +
                NAV_LINKS.map(function(l) { return '<a href="' + l.href + '" data-i18n="' + l.key + '">' + t(l.key) + '</a>'; }).join('') +
                '<button class="btn-discord" id="dBtnMobile">' + DISCORD_ICON + ' <span data-i18n="nav.login">' + t('nav.login') + '</span></button>' +
                langSwitcherHtml() +
                '<div class="mmenu-user" id="mmenuUser">' +
                    '<div class="muname" id="mmenuUname">Player</div>' +
                    '<a class="btn-logout-mobile" id="adminLinkMobile" href="admin.html" style="display:none;background:rgba(124,58,237,.15);color:var(--ac2);border-color:rgba(124,58,237,.3);margin-bottom:6px" data-i18n="nav.admin">' + t('nav.admin') + '</a>' +
                    '<button class="btn-logout-mobile" id="logoutBtnMobile" data-i18n="nav.logout">' + t('nav.logout') + '</button>' +
                '</div>' +
            '</div>';
    }

    function bindLangSwitch() {
    document.querySelectorAll('.lang-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var lang = btn.getAttribute('data-lang');
            if (!lang || !window.I18N) return;
            window.I18N.setLang(lang);
            // обновить активный класс + положение слайдера у ВСЕХ переключателей (десктоп + мобильный)
            document.querySelectorAll('.lang-btn').forEach(function(b) {
                b.classList.toggle('active', b.getAttribute('data-lang') === lang);
            });
            document.querySelectorAll('.lang-switch').forEach(function(sw) {
                sw.classList.toggle('ro', lang === 'ro');
            });
        });
    });
}

    // ===== FOOTER =====
    function injectFooter() {
        var footerHost = document.getElementById('footer-host');
        if (!footerHost) return;
        footerHost.outerHTML =
            '<footer>' +
                '<div class="flogo">STX LEAGUE</div>' +
                '<div class="fsocial">' +
                    '<a href="https://t.me/stxleague" target="_blank" rel="noopener" title="Telegram"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.66-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.26-1.47-.4-1.41-.85.03-.23.34-.47 1.01-.72 3.94-1.72 6.56-2.85 7.87-3.39 3.73-1.55 4.5-1.82 5.01-1.83.11 0 .36.03.52.17.14.11.18.27.2.38.02.11.04.37.02.47z"/></svg></a>' +
                    '<a href="https://discord.gg/f5bZJFWW2B" target="_blank" rel="noopener" title="Discord">' + DISCORD_ICON + '</a>' +
                    '<a href="https://tiktok.com/@stxleague" target="_blank" rel="noopener" title="TikTok"><svg viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg></a>' +
                '</div>' +
                '<div class="contact" data-i18n="foot.contact">' + t('foot.contact') + '</div>' +
                '<div class="copy" data-i18n="foot.copy">' + t('foot.copy') + '</div>' +
            '</footer>' +
            '<button class="btt" id="btt" data-i18n-title="common.btt" title="' + t('common.btt') + '">&uarr;</button>' +
            '<div class="egg" id="egg">' +
                '<div class="egg-box">' +
                    '<h2>🏆 GOD MODE 🏆</h2>' +
                    '<p data-i18n="egg.text">' + t('egg.text') + '</p>' +
                    '<button class="egg-close" id="eggClose" data-i18n="egg.close">' + t('egg.close') + '</button>' +
                '</div>' +
            '</div>';
    }

    // ===== Auth UI =====
    function updateAuthUI(user, isAdmin) {
        var dBtn = document.getElementById('dBtn');
        var dBtnMobile = document.getElementById('dBtnMobile');
        var rBtn = document.getElementById('rBtn');
        var userDropdownWrap = document.getElementById('userDropdownWrap');
        var userBtnName = document.getElementById('userBtnName');
        var dropdownUname = document.getElementById('dropdownUname');
        var mmenuUser = document.getElementById('mmenuUser');
        var mmenuUname = document.getElementById('mmenuUname');
        var adminLink = document.getElementById('adminLink');
        var adminLinkMobile = document.getElementById('adminLinkMobile');

        if (user) {
            var name = window.STX.getDiscordUsername(user);
            if (dBtn) dBtn.style.display = 'none';
            if (userDropdownWrap) userDropdownWrap.classList.add('show');
            if (userBtnName) userBtnName.textContent = name;
            if (dropdownUname) dropdownUname.textContent = name;
            if (rBtn) rBtn.classList.add('show');
            if (dBtnMobile) dBtnMobile.style.display = 'none';
            if (mmenuUser) mmenuUser.classList.add('show');
            if (mmenuUname) mmenuUname.textContent = name;

            // Показать ссылку на админку только если пользователь — админ
            if (adminLink) adminLink.style.display = isAdmin ? 'flex' : 'none';
            if (adminLinkMobile) adminLinkMobile.style.display = isAdmin ? 'inline-block' : 'none';
        } else {
            if (dBtn) dBtn.style.display = 'flex';
            if (userDropdownWrap) userDropdownWrap.classList.remove('show', 'open');
            if (rBtn) rBtn.classList.remove('show');
            if (dBtnMobile) dBtnMobile.style.display = 'flex';
            if (mmenuUser) mmenuUser.classList.remove('show');
            if (adminLink) adminLink.style.display = 'none';
            if (adminLinkMobile) adminLinkMobile.style.display = 'none';
        }
    }

    function initRevealAnimations() {
        if (!('IntersectionObserver' in window)) return;
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

        document.querySelectorAll('.reveal').forEach(function(el) {
            observer.observe(el);
        });
    }

    function bindAuthHandlers() {
        var dBtn = document.getElementById('dBtn');
        var dBtnMobile = document.getElementById('dBtnMobile');
        var userBtn = document.getElementById('userBtn');
        var userDropdownWrap = document.getElementById('userDropdownWrap');
        var logoutBtn = document.getElementById('logoutBtn');
        var logoutBtnMobile = document.getElementById('logoutBtnMobile');

        function login(e) {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            if (!window.STX || !window.STX.signInWithDiscord) {
                alert('Авторизация ещё загружается, попробуйте через секунду');
                return;
            }
            window.STX.signInWithDiscord();
        }

        if (dBtn) dBtn.addEventListener('click', login);
        if (dBtnMobile) dBtnMobile.addEventListener('click', function(e) {
            login(e);
            closeMobileMenu();
        });
        if (userBtn) userBtn.addEventListener('click', function(e) {
            e.preventDefault(); e.stopPropagation();
            userDropdownWrap.classList.toggle('open');
        });
        document.addEventListener('click', function(e) {
            if (userDropdownWrap && !userDropdownWrap.contains(e.target)) {
                userDropdownWrap.classList.remove('open');
            }
        });
        if (logoutBtn) logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.STX.signOut();
        });
        if (logoutBtnMobile) logoutBtnMobile.addEventListener('click', function(e) {
            e.preventDefault();
            window.STX.signOut();
        });
    }

    // ===== Nav scroll + burger =====
    var burger, mmenu;
    function closeMobileMenu() {
        if (burger) burger.classList.remove('open');
        if (mmenu) mmenu.classList.remove('open');
    }
    function bindNavInteractions() {
        burger = document.getElementById('burger');
        mmenu = document.getElementById('mmenu');
        var nav = document.getElementById('nav');
        var bttEl = document.getElementById('btt');

        window.addEventListener('scroll', function() {
            var y = window.scrollY || window.pageYOffset;
            if (nav) nav.classList.toggle('scrolled', y > 50);
            if (bttEl) bttEl.classList.toggle('show', y > 600);
        });

        if (burger) burger.addEventListener('click', function(e) {
            e.preventDefault();
            burger.classList.toggle('open');
            if (mmenu) mmenu.classList.toggle('open');
        });
        if (mmenu) {
            mmenu.querySelectorAll('a').forEach(function(link) {
                link.addEventListener('click', closeMobileMenu);
            });
        }
        if (bttEl) bttEl.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        document.querySelectorAll('a[href^="#"]').forEach(function(a) {
            a.addEventListener('click', function(e) {
                var href = this.getAttribute('href');
                if (!href || href === '#') return;
                var target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    var top = target.getBoundingClientRect().top + window.pageYOffset - 80;
                    window.scrollTo({ top: top, behavior: 'smooth' });
                }
            });
        });
    }

// ===== Sound + Konami =====
var STX_SOUND = {
    enabled: true,
    audio: null,
    initialized: false
};

function initSound() {
    if (STX_SOUND.initialized) return;

    // Сбрасываем старое отключение звука и включаем его по умолчанию
    var saved = localStorage.getItem('stx_sound_enabled');
    STX_SOUND.enabled = saved !== '0';
    if (saved === '0') {
        localStorage.removeItem('stx_sound_enabled');
    }

    // Создаём аудио-элемент
    STX_SOUND.audio = new Audio('sounds/click.mp3');
    STX_SOUND.audio.volume = 0.85;
    STX_SOUND.audio.preload = 'auto';
    STX_SOUND.audio.muted = false;

    // Пул из 5 аудио-элементов для быстрых кликов (без лагов)
    STX_SOUND.pool = [];
    for (var i = 0; i < 5; i++) {
        var a = new Audio('sounds/click.mp3');
        a.volume = 0.85;
        a.preload = 'auto';
        a.muted = false;
        STX_SOUND.pool.push(a);
    }
    STX_SOUND.poolIndex = 0;

    STX_SOUND.initialized = true;
}

function playClickSound() {
    if (!STX_SOUND.enabled || !STX_SOUND.initialized) return;
    try {
        // Берём следующий аудио из пула
        var audio = STX_SOUND.pool[STX_SOUND.poolIndex];
        STX_SOUND.poolIndex = (STX_SOUND.poolIndex + 1) % STX_SOUND.pool.length;
        audio.currentTime = 0;
        audio.muted = false;
        audio.volume = 0.85;
        audio.play().catch(function() {});
    } catch (e) {}
}

function bindGlobalClickSounds() {
    // Селекторы элементов, на которые вешаем звук
    var CLICKABLE = [
        'button',
        '.btn-primary',
        '.btn-secondary',
        '.btn-discord',
        '.btn-reg',
        '.btn-back',
        '.reg-btn',
        '.reg-btn-primary',
        '.reg-btn-back',
        '.reg-btn-submit',
        '.reg-btn-discord',
        '.reg-logo-btn',
        '.reg-logo-remove',
        '.admin-btn',
        '.admin-nav-item',
        '.admin-filter',
        '.admin-view-btn',
        '.lang-btn',
        '.acc-head',
        '.file-up-label',
        '.reg-checkbox',
        '.welcome-btn',
        '.welcome-skip',
        '.welcome-close-x',
        '.reg-closed-btn-discord',
        '.reg-closed-btn-tg',
        '.reg-closed-btn-close',
        '.egg-close',
        '.abtn-sm',
        '.btt',
        '.burger'
    ];

    document.addEventListener('click', function(e) {
        for (var i = 0; i < CLICKABLE.length; i++) {
            if (e.target.closest(CLICKABLE[i])) {
                playClickSound();
                return;
            }
        }
    }, true); // capture phase — работает раньше других
}

function bindExtras() {
    // === Sound ===
    initSound();
    bindGlobalClickSounds();

    // === Konami code ===
    var konami = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA'];
    var ki = 0;
    document.addEventListener('keydown', function(e) {
        if (e.code === konami[ki]) {
            ki++;
            if (ki === konami.length) {
                var egg = document.getElementById('egg');
                if (egg) egg.classList.add('on');
                ki = 0;
            }
        } else { ki = 0; }
    });
    var eggClose = document.getElementById('eggClose');
    var egg = document.getElementById('egg');
    if (eggClose) eggClose.addEventListener('click', function() { egg.classList.remove('on'); });
    if (egg) egg.addEventListener('click', function(e) { if (e.target === egg) egg.classList.remove('on'); });
}

    // ===== Красивая модалка "Регистрация закрыта" =====
    function showRegClosedModal() {
        var m = document.getElementById('regClosedModal');
        if (!m) {
            var cfg = window.STX_CONFIG || {};
            var discordUrl = cfg.DISCORD_URL || 'https://discord.gg/f5bZJFWW2B';
            var tgUrl = cfg.TELEGRAM_URL || 'https://t.me/stxleague';

            m = document.createElement('div');
            m.id = 'regClosedModal';
            m.className = 'reg-closed-modal';
            m.setAttribute('role', 'dialog');
            m.setAttribute('aria-modal', 'true');
            m.setAttribute('aria-labelledby', 'regClosedTitle');
            m.innerHTML =
                '<div class="reg-closed-box">' +
                    '<div class="reg-closed-icon">' +
                        '<svg viewBox="0 0 24 24" width="44" height="44" fill="currentColor">' +
                            '<path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>' +
                        '</svg>' +
                    '</div>' +
                    '<h3 class="reg-closed-title" id="regClosedTitle" data-i18n="reg.closed.title">' + t('reg.closed.title') + '</h3>' +
                    '<p class="reg-closed-hint" data-i18n="reg.closed.hint">' + t('reg.closed.hint') + '</p>' +
                    '<div class="reg-closed-actions">' +
                        '<a href="' + discordUrl + '" target="_blank" rel="noopener" class="reg-closed-btn-discord">' +
                            '<svg viewBox="0 0 24 24" width="16" height="16" style="fill:currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>' +
                            '<span data-i18n="reg.closed.discord">' + t('reg.closed.discord') + '</span>' +
                        '</a>' +
                        '<a href="' + tgUrl + '" target="_blank" rel="noopener" class="reg-closed-btn-tg">' +
                            '<svg viewBox="0 0 24 24" width="16" height="16" style="fill:currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.66-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.26-1.47-.4-1.41-.85.03-.23.34-.47 1.01-.72 3.94-1.72 6.56-2.85 7.87-3.39 3.73-1.55 4.5-1.82 5.01-1.83z"/></svg>' +
                            '<span data-i18n="reg.closed.tg">' + t('reg.closed.tg') + '</span>' +
                        '</a>' +
                        '<button class="reg-closed-btn-close" id="regClosedClose" data-i18n="admin.modal.close">' + t('admin.modal.close') + '</button>' +
                    '</div>' +
                '</div>';
            document.body.appendChild(m);

            // Закрытие по клику вне окна / по Escape / по кнопке
            m.addEventListener('click', function(e) {
                if (e.target === m) m.classList.remove('on');
            });
            var closeBtn = m.querySelector('#regClosedClose');
            if (closeBtn) closeBtn.addEventListener('click', function() {
                m.classList.remove('on');
            });
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && m.classList.contains('on')) {
                    m.classList.remove('on');
                }
            });
        }
        // Обновим тексты на текущий язык
        if (window.I18N) window.I18N.applyToDOM(m);
        m.classList.add('on');
    }

    // ===== Применить статус регистрации (открыта/закрыта) =====
    var regClickHandler = null;
    function applyRegistrationStatus() {
        // Берём из настроек БД (если загружены), иначе из config (на случай если БД не доступна)
        var isOpen;
        if (window.STX_SETTINGS && window.STX_SETTINGS.isLoaded()) {
            isOpen = window.STX_SETTINGS.get('registration_open') === true;
        } else {
            var cfg = window.STX_CONFIG || {};
            isOpen = cfg.REGISTRATION_OPEN !== false;
        }

        var heroRegBtn = document.querySelector('.hero-btns a[href="register.html"]');

        if (isOpen) {
            // ===== Регистрация ОТКРЫТА — снять все блокировки =====
            if (heroRegBtn && heroRegBtn.dataset.regClosed) {
                delete heroRegBtn.dataset.regClosed;
                heroRegBtn.setAttribute('data-i18n', 'hero.btn.register');
                heroRegBtn.textContent = t('hero.btn.register');
                heroRegBtn.style.opacity = '';
                heroRegBtn.style.cursor = '';
            }
            // Снять глобальный перехватчик
            if (regClickHandler) {
                document.removeEventListener('click', regClickHandler, true);
                regClickHandler = null;
            }
            return;
        }

        // ===== Регистрация ЗАКРЫТА =====
        // 1. Обновить вид кнопки в hero
        if (heroRegBtn && !heroRegBtn.dataset.regClosed) {
            heroRegBtn.dataset.regClosed = '1';
            heroRegBtn.setAttribute('data-i18n', 'hero.btn.reg_closed');
            heroRegBtn.textContent = t('hero.btn.reg_closed');
            heroRegBtn.style.opacity = '0.7';
            heroRegBtn.style.cursor = 'not-allowed';
        }

        // 2. Глобальный перехватчик ВСЕХ кликов на ссылки регистрации.
        //    Перехватываем в capture-фазе → срабатывает раньше любых других обработчиков.
        //    Покрывает: hero-кнопку, кнопку в шапке, мобильное меню, любые ссылки внутри страниц.
        if (!regClickHandler) {
            regClickHandler = function(e) {
                var el = e.target.closest('a[href="register.html"], a[href$="/register.html"]');
                if (!el) return;
                e.preventDefault();
                e.stopPropagation();
                showRegClosedModal();
            };
            document.addEventListener('click', regClickHandler, true);
        }
    }

// ===== ПРИВЕТСТВЕННОЕ МОДАЛЬНОЕ ОКНО =====
function showWelcomeModal() {
    // Проверяем, показывали ли уже
    if (localStorage.getItem('stx_welcome_shown') === '1') return;

    var cfg = window.STX_CONFIG || {};
    var discordUrl = cfg.DISCORD_URL || 'https://discord.gg/f5bZJFWW2B';
    var tgUrl      = cfg.TELEGRAM_URL || 'https://t.me/stxleague';
    var ttUrl      = cfg.TIKTOK_URL || 'https://tiktok.com/@stxleague';

    // SVG иконки (вынесены в переменные для читаемости)
    var TG_ICON = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.66-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.26-1.47-.4-1.41-.85.03-.23.34-.47 1.01-.72 3.94-1.72 6.56-2.85 7.87-3.39 3.73-1.55 4.5-1.82 5.01-1.83z"/></svg>';
    var TT_ICON = '<svg viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>';
    var ARROW_ICON = '<svg class="welcome-btn-arrow" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 5l5 5-5 5"/></svg>';
    var CLOSE_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';

    // Создаём модалку
    var m = document.createElement('div');
    m.id = 'welcomeModal';
    m.className = 'welcome-modal';
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.innerHTML =
        '<div class="welcome-box">' +
            '<button class="welcome-close-x" id="welcomeCloseX" data-i18n-aria-label="admin.modal.close">' + CLOSE_ICON + '</button>' +
            '<div class="welcome-logo">STX LEAGUE</div>' +
            '<div class="welcome-badge" data-i18n="welcome.badge"></div>' +
            '<h2 class="welcome-title" data-i18n="welcome.title"></h2>' +
            '<p class="welcome-text" data-i18n="welcome.text"></p>' +
            '<div class="welcome-socials">' +
                '<a href="' + discordUrl + '" target="_blank" rel="noopener" class="welcome-btn welcome-btn-discord">' +
                    DISCORD_ICON +
                    '<div class="welcome-btn-text">' +
                        '<span class="welcome-btn-title">Discord</span>' +
                        '<span class="welcome-btn-sub" data-i18n="welcome.discord.sub"></span>' +
                    '</div>' +
                    ARROW_ICON +
                '</a>' +
                '<a href="' + tgUrl + '" target="_blank" rel="noopener" class="welcome-btn welcome-btn-tg">' +
                    TG_ICON +
                    '<div class="welcome-btn-text">' +
                        '<span class="welcome-btn-title">Telegram</span>' +
                        '<span class="welcome-btn-sub" data-i18n="welcome.tg.sub"></span>' +
                    '</div>' +
                    ARROW_ICON +
                '</a>' +
                '<a href="' + ttUrl + '" target="_blank" rel="noopener" class="welcome-btn welcome-btn-tt">' +
                    TT_ICON +
                    '<div class="welcome-btn-text">' +
                        '<span class="welcome-btn-title">TikTok</span>' +
                        '<span class="welcome-btn-sub" data-i18n="welcome.tt.sub"></span>' +
                    '</div>' +
                    ARROW_ICON +
                '</a>' +
            '</div>' +
            '<button class="welcome-skip" id="welcomeSkip" data-i18n="welcome.skip"></button>' +
        '</div>';

    document.body.appendChild(m);

    // Применить переводы сразу
    if (window.I18N) window.I18N.applyToDOM(m);

    // Блокировка скролла body
    var scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + scrollY + 'px';
    document.body.style.width = '100%';

// Даём браузеру время отрисовать элемент, потом запускаем анимацию
setTimeout(function() {
    m.classList.add('on');
}, 50);

    // Функция закрытия
    var isClosing = false;
    function closeModal() {
        if (isClosing) return;
        isClosing = true;

        m.classList.remove('on');
        localStorage.setItem('stx_welcome_shown', '1');

        // Восстановить скролл
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);

        // Удалить после анимации
        setTimeout(function() {
            if (m && m.parentNode) m.parentNode.removeChild(m);
            document.removeEventListener('keydown', escHandler);
        }, 500);
    }

    // Обработчики
    document.getElementById('welcomeCloseX').addEventListener('click', closeModal);
    document.getElementById('welcomeSkip').addEventListener('click', closeModal);
    m.addEventListener('click', function(e) {
        if (e.target === m) closeModal();
    });

    var escHandler = function(e) {
        if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', escHandler);
}

    // ===== INIT =====
    function init() {
        injectPreloader();
        injectNav();
        injectFooter();
        bindAuthHandlers();
        bindNavInteractions();
        bindExtras();
        bindLangSwitch();
        initRevealAnimations();

        // Применить i18n ко всем data-i18n атрибутам (включая только что вставленные шапку/футер и прелоадер)
        if (window.I18N) window.I18N.applyToDOM();
        applyRegistrationStatus();

        // При смене языка — переприменить (но НЕ пересоздавать шапку, чтобы не сбрасывать состояние)
        document.addEventListener('stx:lang', function() {
            if (window.I18N) window.I18N.applyToDOM();
            applyRegistrationStatus();
        });

        // При загрузке/изменении настроек из БД — переприменить статус регистрации
        document.addEventListener('stx:settings', function() {
            applyRegistrationStatus();
        });

        // Подписка на изменения авторизации
        function tryBindAuth() {
            if (window.STX && window.STX.onAuth) {
                window.STX.onAuth(updateAuthUI);
            } else {
                setTimeout(tryBindAuth, 100);
            }
        }
        tryBindAuth();

        window.addEventListener('load', function() {
            setTimeout(hidePreloader, 1200);
        });
        setTimeout(hidePreloader, 4000);
    }

    // Показать приветственное окно только на главной странице
    if (getCurrentPage() === 'index.html') {
        window.addEventListener('load', function() {
            setTimeout(showWelcomeModal, 1800); // после прелоадера
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
