/* ===== Админ-панель через Supabase (admin.html) =====
   Никаких паролей в коде. Доступ — только если пользователь:
     1) залогинен через Discord
     2) его Discord ID есть в таблице admins
   Все проверки — на стороне БД через RLS. Обход через F12 невозможен.
*/
(function() {
    'use strict';

    var currentUser = null;
    var isAdmin = false;
    var deleteIdx = -1;
    var teamsCache = [];

    function $(id) { return document.getElementById(id); }
    function escapeHtml(s) {
        if (s == null) return '';
        return String(s).replace(/[&<>"']/g, function(c) {
            return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
        });
    }
    function tr(k) { return (window.I18N && window.I18N.t) ? window.I18N.t(k) : k; }
    function getLocale() { return (window.I18N && window.I18N.lang === 'ro') ? 'ro-RO' : 'ru-RU'; }

    function showState(state) {
        // state: 'loading' | 'not_logged' | 'not_admin' | 'admin'
        var states = ['loading', 'not_logged', 'not_admin', 'admin'];
        states.forEach(function(s) {
            var el = $('state_' + s);
            if (el) el.style.display = (s === state) ? 'block' : 'none';
        });
    }

    function fetchTeams() {
        // RLS: админ видит все команды (включая pending и rejected)
        return window.STX.client
            .from('teams')
            .select('id, team_name, team_tag, logo_url, captain_contact, captain_discord_id, captain_username, status, submitted_at, reviewed_at, reviewed_by, rejection_reason')
            .order('submitted_at', { ascending: false });
    }

    function renderTable(teams) {
        teamsCache = teams || [];

        var stotal = $('stotal'), spending = $('spending'), sapproved = $('sapproved'), srejected = $('srejected');
        if (stotal) stotal.textContent = teams.length;
        if (spending) spending.textContent = teams.filter(function(t) { return t.status === 'pending'; }).length;
        if (sapproved) sapproved.textContent = teams.filter(function(t) { return t.status === 'approved'; }).length;
        if (srejected) srejected.textContent = teams.filter(function(t) { return t.status === 'rejected'; }).length;

        var tbody = $('atbody');
        if (!tbody) return;

        if (teams.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--mut);padding:28px">' + tr('admin.empty') + '</td></tr>';
            return;
        }

        tbody.innerHTML = teams.map(function(t, idx) {
            var stxt = t.status === 'pending' ? tr('admin.st.pending')
                : t.status === 'approved' ? tr('admin.st.approved') : tr('admin.st.rejected');
            var date = new Date(t.submitted_at).toLocaleDateString(getLocale(), {
                day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
            });
            var btns = '';
            if (t.status !== 'approved') btns += '<button class="abtn-sm abtn-ok" data-id="' + t.id + '">' + tr('admin.btn.approve') + '</button>';
            if (t.status !== 'rejected') btns += '<button class="abtn-sm abtn-no" data-id="' + t.id + '">' + tr('admin.btn.reject') + '</button>';
            btns += '<button class="abtn-sm abtn-del" data-id="' + t.id + '" data-name="' + escapeHtml(t.team_name) + '">' + tr('admin.btn.delete') + '</button>';

            // Маленькое лого в строке (если есть)
            var logoIcon = t.logo_url
                ? '<img src="' + escapeHtml(t.logo_url) + '" alt="" style="width:28px;height:28px;border-radius:6px;object-fit:cover;vertical-align:middle;margin-right:8px;border:1px solid var(--bor)" onerror="this.style.display=\'none\'">'
                : '<span style="display:inline-block;width:28px;height:28px;border-radius:6px;background:var(--bg2);color:var(--mut);font-size:11px;text-align:center;line-height:28px;vertical-align:middle;margin-right:8px;border:1px solid var(--bor)">' + escapeHtml((t.team_tag || t.team_name.substring(0,2)).toUpperCase()) + '</span>';

            return '<tr class="team-row" data-id="' + t.id + '" style="cursor:pointer">' +
                '<td>' + (idx + 1) + '</td>' +
                '<td>' + logoIcon + '<strong>' + escapeHtml(t.team_name) + '</strong>' +
                    (t.team_tag ? ' <span style="color:var(--mut)">[' + escapeHtml(t.team_tag) + ']</span>' : '') + '</td>' +
                '<td>' + escapeHtml(t.captain_contact) + '</td>' +
                '<td>' + escapeHtml(t.captain_username || '—') + '</td>' +
                '<td><span style="font-size:11px;color:var(--mut)">' + date + '</span></td>' +
                '<td><span class="badge ' + t.status + '">' + stxt + '</span></td>' +
                '<td class="actions-cell"><div class="abtns">' + btns + '</div></td>' +
                '</tr>';
        }).join('');

        // Клик по строке (но не по кнопкам) → открыть детальную модалку
        tbody.querySelectorAll('.team-row').forEach(function(row) {
            row.addEventListener('click', function(e) {
                // Игнорируем клик по кнопкам действий
                if (e.target.closest('.actions-cell')) return;
                openDetailsModal(this.dataset.id);
            });
        });

        // Bind
        tbody.querySelectorAll('.abtn-ok').forEach(function(b) {
            b.addEventListener('click', function() { updateStatus(this.dataset.id, 'approved'); });
        });
        tbody.querySelectorAll('.abtn-no').forEach(function(b) {
            b.addEventListener('click', function() {
                var reason = prompt(tr('admin.reject.reason'));
                if (reason !== null) updateStatus(this.dataset.id, 'rejected', reason);
            });
        });
        tbody.querySelectorAll('[data-action="players"]').forEach(function(b) {
            b.addEventListener('click', function() { showPlayers(this.dataset.id); });
        });
        tbody.querySelectorAll('.abtn-del').forEach(function(b) {
            b.addEventListener('click', function() {
                var name = this.dataset.name || 'Команда';
                var id = this.dataset.id;
                showDeleteModal(id, name);
            });
        });
    }

    function updateStatus(teamId, newStatus, reason) {
        var patch = { status: newStatus };
        if (reason) patch.rejection_reason = reason;
        window.STX.client
            .from('teams')
            .update(patch)
            .eq('id', teamId)
            .then(function(res) {
                if (res.error) {
                    alert(tr('admin.err.action') + ' ' + res.error.message);
                    return;
                }
                loadTeams();
            });
    }

    function deleteTeam(teamId) {
        window.STX.client
            .from('teams')
            .delete()
            .eq('id', teamId)
            .then(function(res) {
                if (res.error) {
                    alert(tr('admin.err.action') + ' ' + res.error.message);
                    return;
                }
                loadTeams();
            });
    }

    // Определяем тип ссылки в поле steam (для красивого отображения)
    function detectSteamLink(steam) {
        if (!steam) return { type: 'text', value: steam, url: null };
        var s = String(steam).trim();
        // Полные URL
        if (/^https?:\/\//i.test(s)) return { type: 'url', value: s, url: s };
        // steamcommunity.com/...
        if (/^steamcommunity\.com/i.test(s)) return { type: 'url', value: s, url: 'https://' + s };
        // SteamID64 (17 цифр)
        if (/^7656\d{13}$/.test(s)) return { type: 'steamid64', value: s, url: 'https://steamcommunity.com/profiles/' + s };
        // STEAM_0:X:Y
        if (/^STEAM_[0-5]:[01]:\d+$/i.test(s)) return { type: 'steam2', value: s, url: null };
        // [U:1:XXXXX]
        if (/^\[U:\d:\d+\]$/.test(s)) return { type: 'steam3', value: s, url: null };
        // Vanity name (просто буквы/цифры) — предположим ссылка на steamcommunity.com/id/
        if (/^[a-zA-Z0-9_-]{3,32}$/.test(s)) return { type: 'vanity', value: s, url: 'https://steamcommunity.com/id/' + s };
        return { type: 'text', value: s, url: null };
    }

    function openDetailsModal(teamId) {
        var m = $('detailsModal');
        if (!m) return;

        var team = teamsCache.find(function(t) { return t.id === teamId; });
        if (!team) return;

        m.classList.add('on');
        $('detailsModalBody').innerHTML =
            '<div style="text-align:center;padding:40px 20px"><div class="pring" style="margin:0 auto"></div>' +
            '<p style="color:var(--mut);margin-top:14px">' + tr('common.loading') + '</p></div>';

        // Загружаем игроков
        window.STX.client
            .from('players')
            .select('*')
            .eq('team_id', teamId)
            .order('position')
            .then(function(res) {
                if (res.error) {
                    $('detailsModalBody').innerHTML = '<p style="color:var(--red);text-align:center;padding:30px">' +
                        tr('admin.err.action') + ' ' + escapeHtml(res.error.message) + '</p>';
                    return;
                }
                renderDetails(team, res.data || []);
            });
    }

    function renderDetails(team, players) {
        var stxt = team.status === 'pending' ? tr('admin.st.pending')
            : team.status === 'approved' ? tr('admin.st.approved') : tr('admin.st.rejected');
        var statusColor = team.status === 'pending' ? 'var(--gold)'
            : team.status === 'approved' ? 'var(--grn)' : 'var(--red)';
        var date = new Date(team.submitted_at).toLocaleString(getLocale(), {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        // Лого
        var logoBlock;
        if (team.logo_url) {
            logoBlock =
                '<div style="text-align:center">' +
                    '<img src="' + escapeHtml(team.logo_url) + '" alt="" ' +
                        'style="max-width:200px;max-height:200px;border-radius:12px;border:2px solid var(--bor);background:var(--bg2)" ' +
                        'onerror="this.parentElement.innerHTML=\'<div style=&quot;color:var(--red);padding:20px&quot;>' + tr('admin.details.logo.broken') + '</div>\'">' +
                    '<div style="margin-top:8px"><a href="' + escapeHtml(team.logo_url) + '" target="_blank" rel="noopener" ' +
                        'style="font-size:11px;color:var(--ac2);text-decoration:underline">' + tr('admin.details.logo.open') + '</a></div>' +
                '</div>';
        } else {
            logoBlock =
                '<div style="text-align:center;padding:40px 20px;background:var(--bg2);border-radius:12px;border:1px dashed var(--bor2);color:var(--mut)">' +
                    '<div style="font-size:48px;font-family:\'Bebas Neue\',sans-serif;color:var(--ac2);margin-bottom:8px">' +
                        escapeHtml((team.team_tag || team.team_name.substring(0,2)).toUpperCase()) + '</div>' +
                    '<div style="font-size:12px">' + tr('admin.details.logo.none') + '</div>' +
                '</div>';
        }

        // Игроки
        var playersHtml = '';
        players.forEach(function(p) {
            var sl = detectSteamLink(p.steam);
            var steamHtml = sl.url
                ? '<a href="' + escapeHtml(sl.url) + '" target="_blank" rel="noopener" style="color:var(--ac2);text-decoration:underline;word-break:break-all">' + escapeHtml(sl.value) + '</a>'
                : '<span style="color:var(--txt2);word-break:break-all">' + escapeHtml(sl.value) + '</span>';

            var badge = p.is_sub
                ? '<span style="background:rgba(148,163,184,.15);color:var(--silv);padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;letter-spacing:.5px">' + tr('admin.details.sub') + '</span>'
                : '<span style="background:linear-gradient(135deg,var(--ac),var(--ac3));color:#fff;width:28px;height:28px;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font-family:\'Oswald\',sans-serif;font-weight:700">' + p.position + '</span>';

            playersHtml +=
                '<div style="display:flex;align-items:center;gap:12px;background:var(--bg2);padding:12px 14px;border-radius:10px;margin-bottom:8px;border:1px solid var(--bor)">' +
                    '<div style="flex-shrink:0">' + badge + '</div>' +
                    '<div style="flex:1;min-width:0">' +
                        '<div style="font-family:\'Oswald\',sans-serif;font-size:15px;color:var(--txt);margin-bottom:2px">' + escapeHtml(p.nickname) + '</div>' +
                        '<div style="font-size:11px;color:var(--mut);margin-bottom:2px">Steam:</div>' +
                        '<div style="font-size:12px">' + steamHtml + '</div>' +
                    '</div>' +
                    (sl.url ? '<button class="copy-btn" data-copy="' + escapeHtml(sl.url) + '" ' +
                        'title="' + tr('admin.details.copy') + '" ' +
                        'style="background:rgba(124,58,237,.15);color:var(--ac2);border:1px solid rgba(124,58,237,.3);padding:6px 10px;border-radius:6px;cursor:pointer;font-size:11px;flex-shrink:0">📋</button>' : '') +
                '</div>';
        });
        if (!playersHtml) {
            playersHtml = '<p style="color:var(--mut);text-align:center;padding:20px">' + tr('admin.details.no_players') + '</p>';
        }

        // Контакт капитана — если это @username Telegram, делаем ссылку
        var cc = team.captain_contact || '';
        var contactHtml;
        if (/^@[a-zA-Z0-9_]{3,}$/.test(cc)) {
            var tgUrl = 'https://t.me/' + cc.substring(1);
            contactHtml = '<a href="' + escapeHtml(tgUrl) + '" target="_blank" rel="noopener" style="color:var(--ac2);text-decoration:underline">' + escapeHtml(cc) + '</a>';
        } else {
            contactHtml = escapeHtml(cc);
        }

        $('detailsModalBody').innerHTML =
            // Header
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:24px;flex-wrap:wrap">' +
                '<div>' +
                    '<h2 style="font-family:\'Bebas Neue\',sans-serif;font-size:32px;letter-spacing:2px;color:var(--ac2);line-height:1">' +
                        escapeHtml(team.team_name) +
                        (team.team_tag ? ' <span style="color:var(--mut)">[' + escapeHtml(team.team_tag) + ']</span>' : '') +
                    '</h2>' +
                    '<div style="font-size:12px;color:var(--mut);margin-top:4px">' + tr('admin.details.submitted') + ' ' + date + '</div>' +
                '</div>' +
                '<span class="badge ' + team.status + '" style="font-size:12px;padding:6px 14px">' + stxt + '</span>' +
            '</div>' +

            // Grid: logo | captain info
            '<div style="display:grid;grid-template-columns:1fr 1.5fr;gap:20px;margin-bottom:24px" class="details-grid">' +
                // Logo
                '<div>' +
                    '<div style="font-family:\'Oswald\',sans-serif;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mut);margin-bottom:10px">' + tr('admin.details.logo.title') + '</div>' +
                    logoBlock +
                '</div>' +
                // Captain
                '<div>' +
                    '<div style="font-family:\'Oswald\',sans-serif;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mut);margin-bottom:10px">' + tr('admin.details.captain.title') + '</div>' +
                    '<div style="background:var(--bg2);padding:16px;border-radius:10px;border:1px solid var(--bor)">' +
                        '<div style="margin-bottom:10px"><span style="color:var(--mut);font-size:11px">' + tr('admin.details.captain.discord') + '</span><br><strong>' + escapeHtml(team.captain_username || '—') + '</strong></div>' +
                        '<div style="margin-bottom:10px"><span style="color:var(--mut);font-size:11px">' + tr('admin.details.captain.discord_id') + '</span><br><code style="font-size:11px;color:var(--txt2);word-break:break-all">' + escapeHtml(team.captain_discord_id) + '</code></div>' +
                        '<div><span style="color:var(--mut);font-size:11px">' + tr('admin.details.captain.contact') + '</span><br>' + contactHtml + '</div>' +
                    '</div>' +
                    (team.rejection_reason ?
                        '<div style="margin-top:12px;padding:12px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.3);border-radius:8px">' +
                            '<div style="font-size:11px;color:var(--red);margin-bottom:4px;text-transform:uppercase;letter-spacing:1px">' + tr('admin.details.rejection') + '</div>' +
                            '<div style="font-size:13px;color:var(--txt2)">' + escapeHtml(team.rejection_reason) + '</div>' +
                        '</div>' : '') +
                '</div>' +
            '</div>' +

            // Players
            '<div style="margin-bottom:24px">' +
                '<div style="font-family:\'Oswald\',sans-serif;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mut);margin-bottom:10px">' +
                    tr('admin.details.players.title') + ' (' + players.length + ')</div>' +
                playersHtml +
            '</div>' +

            // Action buttons
            '<div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;border-top:1px solid var(--bor);padding-top:16px">' +
                (team.status !== 'approved' ? '<button class="abtn-sm abtn-ok" id="dmApprove" style="padding:8px 16px;font-size:12px">' + tr('admin.btn.approve') + '</button>' : '') +
                (team.status !== 'rejected' ? '<button class="abtn-sm abtn-no" id="dmReject" style="padding:8px 16px;font-size:12px">' + tr('admin.btn.reject') + '</button>' : '') +
                '<button class="abtn-sm abtn-del" id="dmDelete" style="padding:8px 16px;font-size:12px">' + tr('admin.btn.delete') + '</button>' +
                '<button class="btn-cancel" id="dmClose" style="padding:8px 16px;font-size:12px">' + tr('admin.modal.close') + '</button>' +
            '</div>';

        // Биндим действия модалки
        var dmApprove = $('dmApprove');
        var dmReject = $('dmReject');
        var dmDelete = $('dmDelete');
        var dmClose = $('dmClose');

        if (dmApprove) dmApprove.addEventListener('click', function() {
            closeDetailsModal();
            updateStatus(team.id, 'approved');
        });
        if (dmReject) dmReject.addEventListener('click', function() {
            var reason = prompt(tr('admin.reject.reason'));
            if (reason !== null) {
                closeDetailsModal();
                updateStatus(team.id, 'rejected', reason);
            }
        });
        if (dmDelete) dmDelete.addEventListener('click', function() {
            closeDetailsModal();
            showDeleteModal(team.id, team.team_name);
        });
        if (dmClose) dmClose.addEventListener('click', closeDetailsModal);

        // Биндим копирование
        $('detailsModalBody').querySelectorAll('.copy-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var text = this.dataset.copy;
                var self = this;
                navigator.clipboard.writeText(text).then(function() {
                    var orig = self.textContent;
                    self.textContent = '✓';
                    self.style.background = 'rgba(34,197,94,.2)';
                    self.style.color = 'var(--grn)';
                    setTimeout(function() {
                        self.textContent = orig;
                        self.style.background = '';
                        self.style.color = '';
                    }, 1200);
                });
            });
        });
    }

    function closeDetailsModal() {
        var m = $('detailsModal');
        if (m) m.classList.remove('on');
    }

    function showDeleteModal(teamId, name) {
        var delModal = $('delModal');
        var delTeamName = $('delTeamName');
        deleteIdx = teamId;
        if (delTeamName) delTeamName.textContent = name;
        if (delModal) delModal.classList.add('on');
    }

    function loadTeams() {
        fetchTeams().then(function(res) {
            if (res.error) {
                console.error(res.error);
                alert(tr('admin.err.load') + ' ' + res.error.message);
                return;
            }
            renderTable(res.data || []);
        });
    }

    // При смене языка — перерисовать таблицу
    document.addEventListener('stx:lang', function() {
        if (teamsCache && teamsCache.length) renderTable(teamsCache);
    });

    function bindDeleteModal() {
        var delModal = $('delModal');
        var delCancel = $('delCancel');
        var delConfirm = $('delConfirm');
        if (delCancel) delCancel.addEventListener('click', function() {
            deleteIdx = -1;
            if (delModal) delModal.classList.remove('on');
        });
        if (delModal) delModal.addEventListener('click', function(e) {
            if (e.target === delModal) {
                deleteIdx = -1;
                delModal.classList.remove('on');
            }
        });
        if (delConfirm) delConfirm.addEventListener('click', function() {
            if (deleteIdx && deleteIdx !== -1) {
                deleteTeam(deleteIdx);
                deleteIdx = -1;
                if (delModal) delModal.classList.remove('on');
            }
        });

        // Details modal — закрытие по клику на фон или Escape
        var detailsModal = $('detailsModal');
        if (detailsModal) {
            detailsModal.addEventListener('click', function(e) {
                if (e.target === detailsModal) closeDetailsModal();
            });
        }
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeDetailsModal();
                if (delModal) delModal.classList.remove('on');
            }
        });
    }

    function bindRegToggle() {
        var toggle = $('regToggle');
        var hint = $('regStatusHint');
        if (!toggle) return;

        function refresh() {
            if (!window.STX_SETTINGS || !window.STX_SETTINGS.isLoaded()) return;
            var open = window.STX_SETTINGS.get('registration_open') === true;
            toggle.checked = open;
            if (hint) {
                hint.textContent = open ? tr('admin.settings.reg.open') : tr('admin.settings.reg.closed');
                hint.style.color = open ? 'var(--grn)' : 'var(--mut)';
            }
        }

        // Загрузить настройки → обновить тумблер
        if (window.STX_SETTINGS) {
            window.STX_SETTINGS.onReady(refresh);
        }
        document.addEventListener('stx:settings', refresh);
        document.addEventListener('stx:lang', refresh);

        toggle.addEventListener('change', function() {
            var newValue = toggle.checked;
            toggle.disabled = true;
            if (hint) hint.textContent = '...';

            window.STX_SETTINGS.set('registration_open', newValue).then(function(res) {
                toggle.disabled = false;
                if (res.error) {
                    alert(tr('admin.settings.save_err') + ' ' + res.error.message);
                    toggle.checked = !newValue; // откатить
                    refresh();
                    return;
                }
                // Маленький фидбек
                if (hint) {
                    var orig = hint.textContent;
                    hint.textContent = tr('admin.settings.saved');
                    hint.style.color = 'var(--grn)';
                    setTimeout(refresh, 1500);
                }
            });
        });
    }

    function onAuth(user, isAdm) {
        currentUser = user;
        isAdmin = !!isAdm;

        if (!user) {
            showState('not_logged');
        } else if (!isAdm) {
            showState('not_admin');
        } else {
            showState('admin');
            loadTeams();
            bindRegToggle();
        }
    }

    function init() {
        showState('loading');
        bindDeleteModal();

        var loginBtn = $('adminLoginBtn');
        if (loginBtn) loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.STX.signInWithDiscord();
        });

        var logoutBtn = $('adminLogoutBtn');
        if (logoutBtn) logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.STX.signOut();
        });

        var refreshBtn = $('adminRefresh');
        if (refreshBtn) refreshBtn.addEventListener('click', function(e) {
            e.preventDefault();
            loadTeams();
        });

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
