/* ===== STX League MD — Регистрация команды (новая версия) ===== */
(function() {
    'use strict';

    // ═══════ STATE ═══════
    var currentUser = null;
    var isAdmin = false;
    var existingTeam = null;
    var submitting = false;
    var currentStep = 1;

    // ═══════ HELPERS ═══════
    function $(id) { return document.getElementById(id); }
    function qs(sel, root) { return (root || document).querySelector(sel); }
    function qsa(sel, root) { return (root || document).querySelectorAll(sel); }
    function tr(k, fb) { return (window.I18N && window.I18N.t) ? window.I18N.t(k, fb) : (fb || k); }
    function escapeHtml(s) {
        if (s == null) return '';
        return String(s).replace(/[&<>"']/g, function(c) {
            return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
        });
    }

    // ═══════ VALIDATION ═══════
    function setFieldError(inputId, errorId, show) {
        var input = $(inputId);
        var err = $(errorId);
        if (input) {
            input.classList.toggle('error', show);
            input.classList.toggle('success', !show && input.value.trim().length > 0);
        }
        if (err) err.classList.toggle('show', show);
    }

    function validateTeamName() {
        var input = $('teamName');
        if (!input) return false;
        var v = input.value.trim();
        var valid = v.length >= 2 && v.length <= 40;
        setFieldError('teamName', 'teamNameErr', !valid);
        return valid;
    }

    function validateTeamTag() {
        var input = $('teamTag');
        if (!input) return true;
        var v = input.value.trim();
        if (!v) {
            input.classList.remove('error', 'success');
            var err = $('teamTagErr');
            if (err) err.classList.remove('show');
            return true; // необязательно
        }
        var valid = v.length >= 2 && v.length <= 5;
        setFieldError('teamTag', 'teamTagErr', !valid);
        return valid;
    }

    function validateCaptainContact() {
        var input = $('captainContact');
        if (!input) return false;
        var v = input.value.trim();
        var valid = v.length >= 3;
        setFieldError('captainContact', 'captainContactErr', !valid);
        return valid;
    }

    function validateStep1() {
        var v1 = validateTeamName();
        var v2 = validateTeamTag();
        var v3 = validateCaptainContact();
        return v1 && v2 && v3;
    }

    function validatePlayer(i) {
        var nick = $('p' + i + 'Nick');
        var steam = $('p' + i + 'Steam');
        var err = $('p' + i + 'Err');
        var card = $('playerCard' + i);
        if (!nick || !steam) return false;

        var nv = nick.value.trim();
        var sv = steam.value.trim();
        var valid = nv.length > 0 && sv.length > 0;

        nick.classList.toggle('error', !nv);
        steam.classList.toggle('error', !sv);
        nick.classList.toggle('success', nv.length > 0);
        steam.classList.toggle('success', sv.length > 0);

        if (err) err.classList.toggle('show', !valid);
        if (card) {
            card.classList.toggle('filled', valid);
            card.classList.toggle('error', !valid && (nv || sv));
        }
        return valid;
    }

    function validateStep2() {
        var allValid = true;
        for (var i = 1; i <= 5; i++) {
            if (!validatePlayer(i)) allValid = false;
        }
        return allValid;
    }

    // ═══════ PROGRESS BAR ═══════
    function updateProgress(step) {
        currentStep = step;
        var fill = $('progressFill');
        var percent = $('progressPercent');
        var stepNum = $('currentStep');
        var percentVal = Math.round((step / 3) * 100);

        if (fill) fill.style.width = percentVal + '%';
        if (percent) percent.textContent = percentVal + '%';
        if (stepNum) stepNum.textContent = step;

        qsa('.reg-progress-lbl').forEach(function(lbl) {
            var s = parseInt(lbl.dataset.step, 10);
            lbl.classList.remove('active', 'done');
            if (s < step) lbl.classList.add('done');
            if (s === step) lbl.classList.add('active');
        });
    }

    function showStep(n) {
        qsa('.reg-step').forEach(function(s) { s.classList.remove('active'); });
        var target = $('step' + n);
        if (target) {
            target.classList.add('active');
            // Автофокус на первое поле
            setTimeout(function() {
                var firstInput = target.querySelector('input:not([type=hidden]):not([type=file])');
                if (firstInput && window.innerWidth > 768) firstInput.focus();
            }, 300);
        }
        updateProgress(n);

        if (n === 3) updateReview();

        // Прокрутить к верху карточки
        var card = $('regCard');
        if (card) {
            var top = card.getBoundingClientRect().top + window.pageYOffset - 100;
            window.scrollTo({ top: top, behavior: 'smooth' });
        }
    }

    // ═══════ USER INFO ═══════
    function updateUserInfo(user) {
        if (!user) return;
        var avatar = $('userAvatar');
        var name = $('userName');

        var username = window.STX.getDiscordUsername(user);
        var avatarUrl = window.STX.getDiscordAvatar(user);

        if (name) name.textContent = username;
        if (avatar) {
            if (avatarUrl) {
                avatar.src = avatarUrl;
                avatar.style.display = '';
            } else {
                avatar.style.display = 'none';
            }
        }
    }

    // ═══════ PLAYERS BUILDER ═══════
    function buildPlayers() {
        var box = $('playersBox');
        if (!box || box.children.length) return;
        for (var i = 1; i <= 5; i++) {
            var card = document.createElement('div');
            card.className = 'reg-player-card';
            card.id = 'playerCard' + i;
            card.innerHTML =
                '<div class="reg-player-num">' + i + '</div>' +
                '<div class="reg-player-fields">' +
                    '<input type="text" class="reg-input" id="p' + i + 'Nick" placeholder="' + tr('reg.players.ph.nick') + ' ' + i + '" maxlength="30">' +
                    '<input type="text" class="reg-input" id="p' + i + 'Steam" placeholder="' + tr('reg.players.ph.steam') + '" maxlength="100">' +
                    '<div class="reg-player-error" id="p' + i + 'Err">' + tr('reg.players.err') + '</div>' +
                '</div>';
            box.appendChild(card);
        }

        // Live-валидация игроков
        for (var j = 1; j <= 5; j++) {
            (function(idx) {
                var n = $('p' + idx + 'Nick');
                var s = $('p' + idx + 'Steam');
                if (n) n.addEventListener('blur', function() { validatePlayer(idx); });
                if (s) s.addEventListener('blur', function() { validatePlayer(idx); });
            })(j);
        }
    }

    function refreshPlayerPlaceholders() {
        for (var i = 1; i <= 5; i++) {
            var n = $('p' + i + 'Nick');
            var s = $('p' + i + 'Steam');
            var e = $('p' + i + 'Err');
            if (n) n.placeholder = tr('reg.players.ph.nick') + ' ' + i;
            if (s) s.placeholder = tr('reg.players.ph.steam');
            if (e) e.textContent = tr('reg.players.err');
        }
    }

    // ═══════ LOGO UPLOAD (Drag & Drop + Preview) ═══════
    var MAX_LOGO_BYTES = 5 * 1024 * 1024;
    var ALLOWED_LOGO_TYPES = ['image/png','image/jpeg','image/jpg','image/webp'];
    var currentLogoFile = null;

    function handleLogoFile(file) {
        var err = $('teamLogoErr');
        var upload = $('logoUpload');
        var preview = $('logoPreview');
        var removeBtn = $('logoRemoveBtn');
        var browseBtn = $('logoBrowseBtn');
        var title = qs('.reg-logo-title');
        var sub = qs('.reg-logo-sub');

        if (err) err.classList.remove('show');

        if (!file) {
            currentLogoFile = null;
            if (upload) upload.classList.remove('has-file');
            if (preview) preview.innerHTML = '<div class="reg-logo-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>';
            if (removeBtn) removeBtn.style.display = 'none';
            if (browseBtn) browseBtn.style.display = '';
            if (title) title.textContent = tr('reg.f.logo.title', 'Перетащи файл сюда');
            if (sub) sub.textContent = tr('reg.f.logo.sub', 'или нажми для выбора • PNG, JPG, WebP • до 5 MB');
            return;
        }

        // Валидация типа
        if (ALLOWED_LOGO_TYPES.indexOf(file.type) === -1) {
            if (err) {
                err.textContent = tr('reg.f.logo.err.type');
                err.classList.add('show');
            }
            return;
        }

        // Валидация размера
        if (file.size > MAX_LOGO_BYTES) {
            if (err) {
                err.textContent = tr('reg.f.logo.err.size');
                err.classList.add('show');
            }
            return;
        }

        currentLogoFile = file;

        // Preview
        var reader = new FileReader();
        reader.onload = function(e) {
            if (preview) {
                preview.innerHTML = '<img src="' + e.target.result + '" alt="Preview">';
            }
        };
        reader.readAsDataURL(file);

        if (upload) upload.classList.add('has-file');
        if (removeBtn) removeBtn.style.display = 'inline-flex';
        if (browseBtn) browseBtn.style.display = 'none';
        if (title) title.textContent = '✅ ' + file.name;
        if (sub) sub.textContent = (file.size / 1024).toFixed(0) + ' KB • ' + file.type.replace('image/', '').toUpperCase();
    }

    function bindLogoUpload() {
        var upload = $('logoUpload');
        var input = $('teamLogo');
        var browseBtn = $('logoBrowseBtn');
        var removeBtn = $('logoRemoveBtn');
        if (!upload || !input) return;

        // Клик по всей области → открыть диалог
        upload.addEventListener('click', function(e) {
            if (e.target === removeBtn || (removeBtn && removeBtn.contains(e.target))) return;
            input.click();
        });

        // Кнопка "Выбрать файл"
        if (browseBtn) browseBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            input.click();
        });

        // Кнопка "Убрать"
        if (removeBtn) removeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            input.value = '';
            handleLogoFile(null);
        });

        // Выбор файла
        input.addEventListener('change', function() {
            handleLogoFile(this.files[0] || null);
        });

        // Drag & Drop
        ['dragenter', 'dragover'].forEach(function(ev) {
            upload.addEventListener(ev, function(e) {
                e.preventDefault();
                e.stopPropagation();
                upload.classList.add('dragover');
            });
        });
        ['dragleave', 'drop'].forEach(function(ev) {
            upload.addEventListener(ev, function(e) {
                e.preventDefault();
                e.stopPropagation();
                upload.classList.remove('dragover');
            });
        });
        upload.addEventListener('drop', function(e) {
            var files = e.dataTransfer && e.dataTransfer.files;
            if (files && files[0]) {
                input.files = files;
                handleLogoFile(files[0]);
            }
        });
    }

    function uploadLogo(file, discordId) {
        if (!file) return Promise.resolve(null);
        var ext = (file.name.split('.').pop() || 'png').toLowerCase();
        var path = discordId + '/' + Date.now() + '.' + ext;

        return window.STX.client.storage
            .from('team-logos')
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type
            })
            .then(function(res) {
                if (res.error) throw res.error;
                var pub = window.STX.client.storage.from('team-logos').getPublicUrl(path);
                return pub.data.publicUrl;
            });
    }

    // ═══════ REVIEW (шаг 3) ═══════
    function updateReview() {
        var review = $('review');
        if (!review) return;

        var teamName = $('teamName').value.trim();
        var teamTag = $('teamTag').value.trim();
        var captain = $('captainContact').value.trim();
        var subNick = $('subNick').value.trim();
        var subSteam = $('subSteam').value.trim();

        // Логотип превью
        var logoHtml;
        if (currentLogoFile) {
            var url = URL.createObjectURL(currentLogoFile);
            logoHtml = '<img src="' + url + '" class="reg-review-logo" alt="Logo">';
        } else {
            var initials = (teamTag || teamName.substring(0, 2)).toUpperCase();
            logoHtml = '<div class="reg-review-logo-placeholder">' + escapeHtml(initials) + '</div>';
        }

        // Команда
        var teamSection =
            '<div class="reg-review-section">' +
                '<div class="reg-review-title">' + tr('reg.review.team_info', 'Команда') + '</div>' +
                '<div class="reg-review-team">' +
                    logoHtml +
                    '<div class="reg-review-team-info">' +
                        '<h4>' + escapeHtml(teamName) + (teamTag ? ' <span style="color:var(--mut)">[' + escapeHtml(teamTag) + ']</span>' : '') + '</h4>' +
                        '<span>' + tr('reg.review.captain', 'Капитан:') + ' ' + escapeHtml(captain) + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>';

        // Капитан
        var captainSection = '';
        if (currentUser) {
            captainSection =
                '<div class="reg-review-section">' +
                    '<div class="reg-review-title">' + tr('reg.review.discord_account', 'Discord') + '</div>' +
                    '<div class="reg-review-row">' +
                        '<span class="reg-review-row-label">' + tr('reg.review.discord', 'Discord:') + '</span>' +
                        '<span class="reg-review-row-value">' + escapeHtml(window.STX.getDiscordUsername(currentUser)) + '</span>' +
                    '</div>' +
                    '<div class="reg-review-row">' +
                        '<span class="reg-review-row-label">Telegram:</span>' +
                        '<span class="reg-review-row-value">' + escapeHtml(captain) + '</span>' +
                    '</div>' +
                '</div>';
        }

        // Игроки
        var playersHtml = '';
        for (var i = 1; i <= 5; i++) {
            var pn = $('p' + i + 'Nick').value.trim();
            var ps = $('p' + i + 'Steam').value.trim();
            playersHtml +=
                '<div class="reg-review-player">' +
                    '<div class="reg-review-player-num">' + i + '</div>' +
                    '<div class="reg-review-player-info">' +
                        '<div class="reg-review-player-nick">' + escapeHtml(pn) + '</div>' +
                        '<div class="reg-review-player-steam">' + escapeHtml(ps) + '</div>' +
                    '</div>' +
                '</div>';
        }
        if (subNick) {
            playersHtml +=
                '<div class="reg-review-player">' +
                    '<div class="reg-review-player-num sub">S</div>' +
                    '<div class="reg-review-player-info">' +
                        '<div class="reg-review-player-nick">' + escapeHtml(subNick) + '</div>' +
                        '<div class="reg-review-player-steam">' + escapeHtml(subSteam || tr('reg.review.no_steam', 'Steam не указан')) + '</div>' +
                    '</div>' +
                '</div>';
        }
        var playersSection =
            '<div class="reg-review-section">' +
                '<div class="reg-review-title">' + tr('reg.review.players', 'Игроки') + ' (' + (subNick ? '5+1' : '5') + ')</div>' +
                playersHtml +
            '</div>';

        review.innerHTML = teamSection + captainSection + playersSection;
    }

    // ═══════ CHECK EXISTING TEAM ═══════
    function checkExistingTeam() {
        if (!currentUser) return Promise.resolve(null);
        var did = window.STX.getDiscordId(currentUser);
        if (!did) return Promise.resolve(null);
        return window.STX.client
            .from('teams')
            .select('id, team_name, team_tag, status, rejection_reason, logo_url')
            .eq('captain_discord_id', did)
            .limit(1)
            .then(function(res) {
                if (res.error) {
                    console.warn('checkExistingTeam:', res.error);
                    return null;
                }
                return (res.data && res.data[0]) || null;
            });
    }

    // ═══════ SHOW STATES ═══════
    function showAuthMsg(show) {
        var authMsg = $('authMsg');
        var regForm = $('regForm');
        if (authMsg) authMsg.style.display = show ? 'block' : 'none';
        if (regForm) regForm.style.display = show ? 'none' : 'block';
    }

    function hideProgress() {
        var pw = $('progressWrap');
        if (pw) pw.style.display = 'none';
    }

    function showAlreadyRegistered(team) {
        hideProgress();
        var card = $('regCard');
        if (!card) return;

        var statusKey = team.status === 'pending' ? 'reg.exists.s.pending'
            : team.status === 'approved' ? 'reg.exists.s.approved'
            : 'reg.exists.s.rejected';
        var statusColor = team.status === 'pending' ? 'var(--gold)'
            : team.status === 'approved' ? 'var(--grn)'
            : 'var(--red)';

        var logoHtml;
        if (team.logo_url) {
            logoHtml = '<img src="' + escapeHtml(team.logo_url) + '" class="reg-review-logo" alt="" style="width:72px;height:72px;margin:0 auto 16px;display:block">';
        } else {
            var initials = (team.team_tag || team.team_name.substring(0, 2)).toUpperCase();
            logoHtml = '<div class="reg-review-logo-placeholder" style="width:72px;height:72px;margin:0 auto 16px;font-size:26px">' + escapeHtml(initials) + '</div>';
        }

        card.innerHTML =
            '<div class="reg-status-screen">' +
                '<div class="reg-status-icon reg-status-icon-shield">' +
                    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>' +
                '</div>' +
                '<h2 class="reg-status-title ac" data-i18n="reg.exists.title">' + tr('reg.exists.title') + '</h2>' +
                logoHtml +
                '<div class="reg-status-team">' +
                    '<div class="reg-status-team-row">' +
                        '<span data-i18n="reg.exists.team">' + tr('reg.exists.team') + '</span>' +
                        '<span><strong>' + escapeHtml(team.team_name) + '</strong>' + (team.team_tag ? ' [' + escapeHtml(team.team_tag) + ']' : '') + '</span>' +
                    '</div>' +
                    '<div class="reg-status-team-row">' +
                        '<span data-i18n="reg.exists.status">' + tr('reg.exists.status') + '</span>' +
                        '<span style="color:' + statusColor + ';font-weight:700" data-i18n="' + statusKey + '">' + tr(statusKey) + '</span>' +
                    '</div>' +
                    (team.rejection_reason ?
                        '<div class="reg-status-team-row">' +
                            '<span data-i18n="reg.exists.reason">' + tr('reg.exists.reason') + '</span>' +
                            '<span style="color:var(--red)"><em>' + escapeHtml(team.rejection_reason) + '</em></span>' +
                        '</div>' : '') +
                '</div>' +
                '<p class="reg-status-text" data-i18n="reg.exists.note">' + tr('reg.exists.note') + '</p>' +
                '<div class="reg-status-actions">' +
                    '<a href="index.html" class="reg-btn reg-btn-back">' + tr('reg.ok.home', 'На главную') + '</a>' +
                    '<a href="teams.html" class="reg-btn reg-btn-primary">' + tr('reg.ok.teams', 'Все команды') + '</a>' +
                '</div>' +
            '</div>';
    }

    function showRegistrationClosed() {
        hideProgress();
        var card = $('regCard');
        if (!card) return;

        var cfg = window.STX_CONFIG || {};
        var discordUrl = cfg.DISCORD_URL || 'https://discord.gg/stxleague';
        var tgUrl = cfg.TELEGRAM_URL || 'https://t.me/stxleague';

        card.innerHTML =
            '<div class="reg-status-screen">' +
                '<div class="reg-status-icon reg-status-icon-lock">' +
                    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>' +
                '</div>' +
                '<h2 class="reg-status-title gold" data-i18n="reg.closed.title">' + tr('reg.closed.title') + '</h2>' +
                '<p class="reg-status-text" data-i18n="reg.closed.hint">' + tr('reg.closed.hint') + '</p>' +
                '<div class="reg-status-actions">' +
                    '<a href="' + discordUrl + '" target="_blank" rel="noopener" class="reg-btn reg-btn-primary">' +
                        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>' +
                        '<span data-i18n="reg.closed.discord">' + tr('reg.closed.discord') + '</span>' +
                    '</a>' +
                    '<a href="' + tgUrl + '" target="_blank" rel="noopener" class="reg-btn reg-btn-back">' +
                        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.66-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.26-1.47-.4-1.41-.85.03-.23.34-.47 1.01-.72 3.94-1.72 6.56-2.85 7.87-3.39 3.73-1.55 4.5-1.82 5.01-1.83z"/></svg>' +
                        '<span data-i18n="reg.closed.tg">' + tr('reg.closed.tg') + '</span>' +
                    '</a>' +
                '</div>' +
            '</div>';
    }

    function showSuccess() {
        var form = $('regForm');
        var ok = $('formOk');
        hideProgress();
        if (form) form.style.display = 'none';
        if (ok) {
            ok.classList.add('show');
            setTimeout(function() {
                ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }

    // ═══════ SUBMIT ═══════
    function submitForm() {
        if (submitting) return;
        if (!currentUser) {
            window.STX.signInWithDiscord();
            return;
        }

        var rulesAgree = $('rulesAgree');
        var rulesErr = $('rulesAgreeErr');
        if (rulesAgree && !rulesAgree.checked) {
            if (rulesErr) rulesErr.classList.add('show');
            return;
        }
        if (rulesErr) rulesErr.classList.remove('show');

        var did = window.STX.getDiscordId(currentUser);
        if (!did) {
            alert(tr('reg.err.discord'));
            return;
        }

        submitting = true;
        var submitBtn = $('submitForm');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spn 1s linear infinite"><circle cx="12" cy="12" r="10" stroke-dasharray="30 30" stroke-linecap="round"/></svg><span>' + tr('reg.btn.sending') + '</span>';
        }

        var subNick = $('subNick').value.trim();
        var subSteam = $('subSteam').value.trim();

        uploadLogo(currentLogoFile, did)
            .then(function(logoUrl) {
                var teamData = {
                    team_name: $('teamName').value.trim(),
                    team_tag: $('teamTag').value.trim() || null,
                    captain_contact: $('captainContact').value.trim(),
                    captain_discord_id: did,
                    captain_username: window.STX.getDiscordUsername(currentUser),
                    logo_url: logoUrl,
                    status: 'pending'
                };
                return window.STX.client
                    .from('teams')
                    .insert(teamData)
                    .select()
                    .single();
            })
            .then(function(res) {
                if (res.error) throw res.error;
                var teamId = res.data.id;

                var players = [];
                for (var i = 1; i <= 5; i++) {
                    players.push({
                        team_id: teamId,
                        position: i,
                        nickname: $('p' + i + 'Nick').value.trim(),
                        steam: $('p' + i + 'Steam').value.trim(),
                        is_sub: false
                    });
                }
                if (subNick) {
                    players.push({
                        team_id: teamId,
                        position: 6,
                        nickname: subNick,
                        steam: subSteam || 'не указано',
                        is_sub: true
                    });
                }
                return window.STX.client.from('players').insert(players);
            })
            .then(function(res) {
                if (res && res.error) throw res.error;
                showSuccess();
            })
            .catch(function(err) {
                console.error('Submit error:', err);
                submitting = false;
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span>' + tr('reg.btn.submit') + '</span>';
                }
                var msg = err.message || 'Unknown error';
                if (msg.indexOf('one_team_per_captain') > -1 || msg.indexOf('duplicate key') > -1) {
                    alert(tr('reg.err.duplicate'));
                    location.reload();
                } else if (msg.indexOf('16 одобренных') > -1 || msg.indexOf('16 aprobate') > -1) {
                    alert(tr('reg.err.full'));
                } else if (msg.indexOf('exceeded') > -1 || msg.indexOf('size') > -1) {
                    alert(tr('reg.err.logo'));
                } else if (msg.indexOf('mime') > -1 || msg.indexOf('Invalid type') > -1) {
                    alert(tr('reg.err.logo'));
                } else {
                    alert(tr('reg.err.generic') + ' ' + msg);
                }
            });
    }

    // ═══════ AUTH ═══════
    function onAuth(user, isAdm) {
        currentUser = user;
        isAdmin = !!isAdm;

        if (!user) {
            showAuthMsg(true);
            return;
        }

        updateUserInfo(user);

        checkExistingTeam().then(function(team) {
            existingTeam = team;
            if (team) {
                showAlreadyRegistered(team);
            } else {
                showAuthMsg(false);
            }
        });
    }

    // ═══════ INIT ═══════
    function init() {
        if (window.STX_SETTINGS) {
            window.STX_SETTINGS.onReady(function() {
                initAfterSettings();
            });
        } else {
            initAfterSettings();
        }

        document.addEventListener('stx:settings', function() {
            var nowOpen = window.STX_SETTINGS && window.STX_SETTINGS.get('registration_open') === true;
            var wasShownClosed = !!qs('[data-i18n="reg.closed.title"]');
            if (nowOpen && wasShownClosed) location.reload();
            if (!nowOpen && !wasShownClosed) location.reload();
        });
    }

    function initAfterSettings() {
        var isOpen = window.STX_SETTINGS
            ? window.STX_SETTINGS.get('registration_open') === true
            : (window.STX_CONFIG && window.STX_CONFIG.REGISTRATION_OPEN !== false);

        if (!isOpen) {
            showRegistrationClosed();
            return;
        }

        buildPlayers();
        bindLogoUpload();
        updateProgress(1);

        // Live-валидация step 1
        var tn = $('teamName');
        if (tn) tn.addEventListener('blur', validateTeamName);
        var tt = $('teamTag');
        if (tt) tt.addEventListener('blur', validateTeamTag);
        var cc = $('captainContact');
        if (cc) cc.addEventListener('blur', validateCaptainContact);

        // Auth login button
        var authLoginBtn = $('authLoginBtn');
        if (authLoginBtn) authLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.STX.signInWithDiscord();
        });

        // Navigation
        var go2 = $('goStep2');
        if (go2) go2.addEventListener('click', function(e) {
            e.preventDefault();
            if (!currentUser) { window.STX.signInWithDiscord(); return; }
            if (validateStep1()) showStep(2);
        });
        var go3 = $('goStep3');
        if (go3) go3.addEventListener('click', function(e) {
            e.preventDefault();
            if (validateStep2()) showStep(3);
        });
        var b1 = $('backStep1');
        if (b1) b1.addEventListener('click', function(e) { e.preventDefault(); showStep(1); });
        var b2 = $('backStep2');
        if (b2) b2.addEventListener('click', function(e) { e.preventDefault(); showStep(2); });

        // Checkbox — убрать ошибку при клике
        var rulesAgree = $('rulesAgree');
        if (rulesAgree) rulesAgree.addEventListener('change', function() {
            var err = $('rulesAgreeErr');
            if (err && this.checked) err.classList.remove('show');
        });

        // Submit
        var regForm = $('regForm');
        if (regForm) regForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitForm();
        });

        // Auth binding
        function tryBindAuth() {
            if (window.STX && window.STX.onAuth) {
                window.STX.onAuth(onAuth);
            } else {
                setTimeout(tryBindAuth, 100);
            }
        }
        tryBindAuth();

        // При смене языка — обновить плейсхолдеры игроков
        document.addEventListener('stx:lang', function() {
            refreshPlayerPlaceholders();
            var s3 = $('step3');
            if (s3 && s3.classList.contains('active')) updateReview();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();