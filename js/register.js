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

        var statusText = team.status === 'pending' ? 'на рассмотрении'
            : team.status === 'approved' ? 'одобрена ✅'
            : 'отклонена ❌';
        var statusColor = team.status === 'pending' ? 'var(--gold)'
            : team.status === 'approved' ? 'var(--grn)'
            : 'var(--red)';

        fc.innerHTML =
            '<div class="form-ok" style="display:block">' +
                '<div class="ok-icon" style="background:rgba(168,85,247,.1)">' +
                    '<svg viewBox="0 0 24 24" width="32" height="32" fill="var(--ac2)"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>' +
                '</div>' +
                '<h3 style="color:var(--ac2)">У вас уже есть заявка</h3>' +
                '<p>Команда: <strong>' + escapeHtml(team.team_name) + '</strong>' +
                (team.team_tag ? ' [' + escapeHtml(team.team_tag) + ']' : '') + '<br>' +
                'Статус: <strong style="color:' + statusColor + '">' + statusText + '</strong><br>' +
                (team.rejection_reason ? '<br>Причина отклонения: <em>' + escapeHtml(team.rejection_reason) + '</em><br>' : '') +
                '<br>С каждого Discord-аккаунта разрешена одна заявка.</p>' +
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
        lines.push('<strong>Команда:</strong> ' + escapeHtml($('teamName').value.trim()) +
                   ($('teamTag').value.trim() ? ' [' + escapeHtml($('teamTag').value.trim()) + ']' : ''));
        lines.push('<strong>Капитан:</strong> ' + escapeHtml($('captainContact').value.trim()));
        if (currentUser) {
            lines.push('<strong>Discord:</strong> ' + escapeHtml(window.STX.getDiscordUsername(currentUser)));
        }
        for (var i = 1; i <= 5; i++) {
            var pn = $('p' + i + 'Nick'), ps = $('p' + i + 'Steam');
            lines.push('<strong>Игрок ' + i + ':</strong> ' +
                escapeHtml(pn.value.trim()) + ' | ' + escapeHtml(ps.value.trim()));
        }
        var sn = $('subNick'), ss = $('subSteam');
        if (sn && sn.value.trim()) {
            lines.push('<strong>Запасной:</strong> ' + escapeHtml(sn.value.trim()) +
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
                '<input type="text" id="p' + i + 'Nick" placeholder="Никнейм игрока ' + i + '" maxlength="30">' +
                '<input type="text" id="p' + i + 'Steam" placeholder="Steam ID / Ссылка на профиль" maxlength="100">' +
                '<div class="perr" id="p' + i + 'Err">Заполните оба поля</div>' +
                '</div>';
            box.appendChild(row);
        }
    }

    function bindFileUpload() {
        var input = $('teamLogo');
        if (!input) return;
        input.addEventListener('change', function() {
            var label = document.querySelector('.file-up-label');
            if (label && this.files.length > 0) {
                label.textContent = '✅ ' + this.files[0].name;
                label.style.color = '#22c55e';
                label.style.borderColor = '#22c55e';
            }
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
            alert('Не удалось получить Discord ID. Попробуйте перелогиниться.');
            return;
        }

        submitting = true;
        var submitBtn = $('submitForm');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Отправка...';
        }

        var teamData = {
            team_name: $('teamName').value.trim(),
            team_tag: $('teamTag').value.trim() || null,
            captain_contact: $('captainContact').value.trim(),
            captain_discord_id: did,
            captain_username: window.STX.getDiscordUsername(currentUser),
            status: 'pending'
        };

        var subNick = $('subNick').value.trim();
        var subSteam = $('subSteam').value.trim();

        // 1. INSERT team
        window.STX.client
            .from('teams')
            .insert(teamData)
            .select()
            .single()
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
                    submitBtn.textContent = 'Отправить заявку';
                }
                var msg = err.message || 'Неизвестная ошибка';
                if (msg.indexOf('one_team_per_captain') > -1 || msg.indexOf('duplicate key') > -1) {
                    alert('У вас уже есть заявка с этого Discord-аккаунта.');
                    location.reload();
                } else if (msg.indexOf('16 одобренных') > -1) {
                    alert('Все 16 слотов уже заняты.');
                } else {
                    alert('Ошибка отправки: ' + msg);
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

    function init() {
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
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
