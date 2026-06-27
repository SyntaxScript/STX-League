/* ===== Регистрация команды через Supabase (register.html) ===== */
(function() {
    'use strict';

    var currentUser = null;
    var isAdmin = false;
    var existingTeam = null;  // если у юзера уже есть заявка
    var submitting = false;

    function $(id) { return document.getElementById(id); }

    function showAuthMsg(show) {
        var authMsg = $('authMsg');
        var regForm = $('regForm');
        if (authMsg) authMsg.style.display = show ? 'block' : 'none';
        if (regForm) regForm.style.display = show ? 'none' : 'block';
    }

    function showAlreadyRegistered(team) {
        var rsteps = $('rsteps');
        var fc = $('fcard');
        if (rsteps) rsteps.style.display = 'none';
        if (!fc) return;

        var statusKey = team.status === 'pending' ? 'reg.exists.s.pending'
            : team.status === 'approved' ? 'reg.exists.s.approved'
            : 'reg.exists.s.rejected';
        var statusColor = team.status === 'pending' ? 'var(--gold)'
            : team.status === 'approved' ? 'var(--grn)'
            : 'var(--red)';

        fc.innerHTML =
            '<div class="form-ok" style="display:block">' +
                '<div class="ok-icon" style="background:rgba(168,85,247,.1)">' +
                    '<svg viewBox="0 0 24 24" width="32" height="32" fill="var(--ac2)"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>' +
                '</div>' +
                '<h3 data-i18n="reg.exists.title" style="color:var(--ac2)">' + tr('reg.exists.title') + '</h3>' +
                '<p><span data-i18n="reg.exists.team">' + tr('reg.exists.team') + '</span> <strong>' + escapeHtml(team.team_name) + '</strong>' +
                (team.team_tag ? ' [' + escapeHtml(team.team_tag) + ']' : '') + '<br>' +
                '<span data-i18n="reg.exists.status">' + tr('reg.exists.status') + '</span> <strong style="color:' + statusColor + '" data-i18n="' + statusKey + '">' + tr(statusKey) + '</strong><br>' +
                (team.rejection_reason ? '<br><span data-i18n="reg.exists.reason">' + tr('reg.exists.reason') + '</span> <em>' + escapeHtml(team.rejection_reason) + '</em><br>' : '') +
                '<br><span data-i18n="reg.exists.note">' + tr('reg.exists.note') + '</span></p>' +
            '</div>';
    }

    function showFormError(id, show) {
        var el = $(id);
        if (!el) return;
        el.style.display = show ? 'block' : 'none';
        var parent = el.parentElement;
        if (parent) parent.querySelectorAll('input').forEach(function(inp) {
            if (show) inp.classList.add('bad');
            else inp.classList.remove('bad');
        });
    }

    function escapeHtml(s) {
        if (!s) return '';
        return String(s).replace(/[&<>"']/g, function(c) {
            return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
        });
    }

    function showStep(n) {
        document.querySelectorAll('.form-step').forEach(function(s) { s.classList.remove('on'); });
        var t = $('step' + n);
        if (t) t.classList.add('on');
        document.querySelectorAll('.rstep').forEach(function(rs, i) {
            rs.classList.remove('cur', 'done');
            if (i < n - 1) rs.classList.add('done');
            if (i === n - 1) rs.classList.add('cur');
        });
        if (n === 3) updateReview();
    }

    function validateStep1() {
        var valid = true;
        var tn = $('teamName');
        if (!tn || !tn.value.trim() || tn.value.trim().length < 2) {
            showFormError('teamNameErr', true); valid = false;
        } else showFormError('teamNameErr', false);

        var tt = $('teamTag');
        var tv = tt ? tt.value.trim() : '';
        if (tv && (tv.length < 2 || tv.length > 5)) {
            showFormError('teamTagErr', true); valid = false;
        } else showFormError('teamTagErr', false);

        var cc = $('captainContact');
        if (!cc || !cc.value.trim() || cc.value.trim().length < 3) {
            showFormError('captainContactErr', true); valid = false;
        } else showFormError('captainContactErr', false);

        return valid;
    }

    function validateStep2() {
        var valid = true;
        for (var i = 1; i <= 5; i++) {
            var n = $('p' + i + 'Nick');
            var s = $('p' + i + 'Steam');
            var er = $('p' + i + 'Err');
            if (!n || !s || !n.value.trim() || !s.value.trim()) {
                if (er) er.style.display = 'block';
                if (n && !n.value.trim()) n.classList.add('bad');
                if (s && !s.value.trim()) s.classList.add('bad');
                valid = false;
            } else {
                if (er) er.style.display = 'none';
                n.classList.remove('bad');
                s.classList.remove('bad');
            }
        }
        return valid;
    }

    function updateReview() {
        var lines = [];
        lines.push('<strong>' + tr('reg.review.team') + '</strong> ' + escapeHtml($('teamName').value.trim()) +
                   ($('teamTag').value.trim() ? ' [' + escapeHtml($('teamTag').value.trim()) + ']' : ''));
        lines.push('<strong>' + tr('reg.review.captain') + '</strong> ' + escapeHtml($('captainContact').value.trim()));
        if (currentUser) {
            lines.push('<strong>' + tr('reg.review.discord') + '</strong> ' + escapeHtml(window.STX.getDiscordUsername(currentUser)));
        }
        // Превью лого если есть
        var logoInput = $('teamLogo');
        if (logoInput && logoInput.files && logoInput.files[0]) {
            var file = logoInput.files[0];
            lines.push('<strong>' + tr('reg.review.logo') + '</strong> ' + escapeHtml(file.name) +
                       ' (' + (file.size / 1024).toFixed(0) + ' KB)');
        }
        for (var i = 1; i <= 5; i++) {
            var pn = $('p' + i + 'Nick'), ps = $('p' + i + 'Steam');
            lines.push('<strong>' + tr('reg.review.player') + ' ' + i + ':</strong> ' +
                escapeHtml(pn.value.trim()) + ' | ' + escapeHtml(ps.value.trim()));
        }
        var sn = $('subNick'), ss = $('subSteam');
        if (sn && sn.value.trim()) {
            lines.push('<strong>' + tr('reg.review.sub') + '</strong> ' + escapeHtml(sn.value.trim()) +
                       (ss && ss.value.trim() ? ' | ' + escapeHtml(ss.value.trim()) : ''));
        }
        var r = $('review');
        if (r) r.innerHTML = lines.join('<br>');
    }

    function buildPlayers() {
        var box = $('playersBox');
        if (!box || box.children.length) return;
        for (var i = 1; i <= 5; i++) {
            var row = document.createElement('div');
            row.className = 'player-row';
            row.innerHTML = '<div class="pnum">' + i + '</div>' +
                '<div class="pfields">' +
                '<input type="text" id="p' + i + 'Nick" placeholder="' + tr('reg.players.ph.nick') + ' ' + i + '" maxlength="30">' +
                '<input type="text" id="p' + i + 'Steam" placeholder="' + tr('reg.players.ph.steam') + '" maxlength="100">' +
                '<div class="perr" id="p' + i + 'Err">' + tr('reg.players.err') + '</div>' +
                '</div>';
            box.appendChild(row);
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

    var MAX_LOGO_BYTES = 5 * 1024 * 1024; // 5 MB
    var ALLOWED_LOGO_TYPES = ['image/png','image/jpeg','image/jpg','image/webp'];

    function bindFileUpload() {
        var input = $('teamLogo');
        if (!input) return;
        input.addEventListener('change', function() {
            var label = document.querySelector('.file-up-label');
            var err = $('teamLogoErr');
            if (err) err.style.display = 'none';

            if (!this.files.length) {
                if (label) {
                    label.textContent = tr('reg.f.logo.btn');
                    label.style.color = '';
                    label.style.borderColor = '';
                }
                return;
            }

            var file = this.files[0];

            // Валидация размера
            if (file.size > MAX_LOGO_BYTES) {
                this.value = '';
                if (err) {
                    err.textContent = tr('reg.f.logo.err.size');
                    err.style.display = 'block';
                }
                if (label) {
                    label.textContent = tr('reg.f.logo.btn');
                    label.style.color = 'var(--red)';
                    label.style.borderColor = 'var(--red)';
                }
                return;
            }

            // Валидация типа
            if (ALLOWED_LOGO_TYPES.indexOf(file.type) === -1) {
                this.value = '';
                if (err) {
                    err.textContent = tr('reg.f.logo.err.type');
                    err.style.display = 'block';
                }
                if (label) {
                    label.textContent = tr('reg.f.logo.btn');
                    label.style.color = 'var(--red)';
                    label.style.borderColor = 'var(--red)';
                }
                return;
            }

            if (label) {
                label.textContent = '✅ ' + file.name + ' (' + (file.size / 1024).toFixed(0) + ' KB)';
                label.style.color = '#22c55e';
                label.style.borderColor = '#22c55e';
            }
        });
    }

    // Загрузка лого в Supabase Storage. Возвращает Promise с public URL или null.
    function uploadLogo(file, discordId) {
        if (!file) return Promise.resolve(null);
        var ext = (file.name.split('.').pop() || 'png').toLowerCase();
        // путь: <discord_id>/<timestamp>.<ext>
        // (RLS-политика требует чтобы первая папка = discord_id юзера)
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
                // Получить публичный URL
                var pub = window.STX.client.storage.from('team-logos').getPublicUrl(path);
                return pub.data.publicUrl;
            });
    }

    // === Проверить, есть ли уже заявка от этого Discord ID ===
    function checkExistingTeam() {
        if (!currentUser) return Promise.resolve(null);
        var did = window.STX.getDiscordId(currentUser);
        if (!did) return Promise.resolve(null);
        return window.STX.client
            .from('teams')
            .select('id, team_name, team_tag, status, rejection_reason')
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

    // === Отправка заявки в Supabase ===
    function submitForm() {
        if (submitting) return;
        if (!currentUser) {
            window.STX.signInWithDiscord();
            return;
        }

        var rulesAgree = $('rulesAgree');
        if (rulesAgree && !rulesAgree.checked) {
            showFormError('rulesAgreeErr', true);
            return;
        }
        showFormError('rulesAgreeErr', false);

        var did = window.STX.getDiscordId(currentUser);
        if (!did) {
            alert(tr('reg.err.discord'));
            return;
        }

        submitting = true;
        var submitBtn = $('submitForm');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = tr('reg.btn.sending');
        }

        var subNick = $('subNick').value.trim();
        var subSteam = $('subSteam').value.trim();
        var logoInput = $('teamLogo');
        var logoFile = (logoInput && logoInput.files && logoInput.files[0]) || null;

        // 1. (опционально) загрузить лого в Storage
        uploadLogo(logoFile, did)
            .then(function(logoUrl) {
                // 2. INSERT team
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

                // 2. INSERT 5 игроков + опц. запасной
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
                // Успех
                $('regForm').style.display = 'none';
                $('rsteps').style.display = 'none';
                var fo = $('formOk');
                if (fo) {
                    fo.style.display = 'block';
                    fo.scrollIntoView({ behavior: 'smooth' });
                }
            })
            .catch(function(err) {
                console.error('Submit error:', err);
                submitting = false;
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = tr('reg.btn.submit');
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

    // === Авторизация изменилась ===
    function onAuth(user, isAdm) {
        currentUser = user;
        isAdmin = !!isAdm;

        if (!user) {
            showAuthMsg(true);
            return;
        }

        // Юзер залогинен — проверим, есть ли уже заявка
        checkExistingTeam().then(function(team) {
            existingTeam = team;
            if (team) {
                showAlreadyRegistered(team);
            } else {
                showAuthMsg(false);
            }
        });
    }

    function tr(k) { return (window.I18N && window.I18N.t) ? window.I18N.t(k) : k; }

    function showRegistrationClosed() {
        var rsteps = $('rsteps');
        var fc = $('fcard');
        if (rsteps) rsteps.style.display = 'none';
        if (!fc) return;

        fc.innerHTML =
            '<div style="text-align:center;padding:40px 20px">' +
                '<div style="width:80px;height:80px;margin:0 auto 20px;background:rgba(245,158,11,.1);border:2px solid var(--gold);border-radius:50%;display:flex;align-items:center;justify-content:center">' +
                    '<svg viewBox="0 0 24 24" width="40" height="40" fill="var(--gold)"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>' +
                '</div>' +
                '<h3 data-i18n="reg.closed.title" style="font-family:\'Bebas Neue\',sans-serif;font-size:32px;color:var(--gold);letter-spacing:2px;margin-bottom:12px">' +
                    tr('reg.closed.title') +
                '</h3>' +
                '<p data-i18n="reg.closed.hint" style="color:var(--txt2);font-size:14px;max-width:420px;margin:0 auto 24px;line-height:1.6">' + tr('reg.closed.hint') + '</p>' +
                '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px">' +
                    '<a href="https://discord.gg/stxleague" target="_blank" rel="noopener" class="btn-primary" style="display:inline-flex;align-items:center;gap:8px;font-size:14px;padding:12px 24px">' +
                        '<svg viewBox="0 0 24 24" width="18" height="18" style="fill:currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>' +
                        '<span data-i18n="reg.closed.discord">' + tr('reg.closed.discord') + '</span>' +
                    '</a>' +
                    '<a href="https://t.me/stxleague" target="_blank" rel="noopener" class="btn-secondary" style="display:inline-flex;align-items:center;gap:8px;font-size:14px;padding:12px 24px">' +
                        '<svg viewBox="0 0 24 24" width="18" height="18" style="fill:currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.66-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.26-1.47-.4-1.41-.85.03-.23.34-.47 1.01-.72 3.94-1.72 6.56-2.85 7.87-3.39 3.73-1.55 4.5-1.82 5.01-1.83z"/></svg>' +
                        '<span data-i18n="reg.closed.tg">' + tr('reg.closed.tg') + '</span>' +
                    '</a>' +
                '</div>' +
            '</div>';
    }

    function init() {
        // Ждём загрузки настроек из БД
        if (window.STX_SETTINGS) {
            window.STX_SETTINGS.onReady(function() {
                initAfterSettings();
            });
        } else {
            initAfterSettings();
        }

        // При смене настроек (например админ открыл/закрыл регистрацию) — перезагрузить страницу
        document.addEventListener('stx:settings', function() {
            // Только если состояние реально изменилось — иначе будет цикл
            var nowOpen = window.STX_SETTINGS && window.STX_SETTINGS.get('registration_open') === true;
            var wasShownClosed = !!document.querySelector('[data-i18n="reg.closed.title"]');
            if (nowOpen && wasShownClosed) location.reload();
            if (!nowOpen && !wasShownClosed) location.reload();
        });
    }

    function initAfterSettings() {
        // === Если регистрация закрыта — показываем заглушку и выходим ===
        var isOpen = window.STX_SETTINGS
            ? window.STX_SETTINGS.get('registration_open') === true
            : (window.STX_CONFIG && window.STX_CONFIG.REGISTRATION_OPEN !== false);

        if (!isOpen) {
            showRegistrationClosed();
            return;
        }

        buildPlayers();
        bindFileUpload();

        var authLoginBtn = $('authLoginBtn');
        if (authLoginBtn) authLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.STX.signInWithDiscord();
        });

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

        var regForm = $('regForm');
        if (regForm) regForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitForm();
        });

        // Подписка на изменения авторизации
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
            // Если показывается review — пересобрать
            var s3 = $('step3');
            if (s3 && s3.classList.contains('on')) updateReview();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
