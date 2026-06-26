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
            .select('id, team_name, team_tag, captain_contact, captain_discord_id, captain_username, status, submitted_at, reviewed_at, reviewed_by, rejection_reason')
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
            btns += '<button class="abtn-sm" data-action="players" data-id="' + t.id + '" style="background:rgba(124,58,237,.18);color:var(--ac2)">' + tr('admin.btn.players') + '</button>';
            btns += '<button class="abtn-sm abtn-del" data-id="' + t.id + '" data-name="' + escapeHtml(t.team_name) + '">' + tr('admin.btn.delete') + '</button>';
            return '<tr>' +
                '<td>' + (idx + 1) + '</td>' +
                '<td><strong>' + escapeHtml(t.team_name) + '</strong>' +
                    (t.team_tag ? ' [' + escapeHtml(t.team_tag) + ']' : '') + '</td>' +
                '<td>' + escapeHtml(t.captain_contact) + '</td>' +
                '<td>' + escapeHtml(t.captain_username || '—') + '</td>' +
                '<td><span style="font-size:11px;color:var(--mut)">' + date + '</span></td>' +
                '<td><span class="badge ' + t.status + '">' + stxt + '</span></td>' +
                '<td><div class="abtns">' + btns + '</div></td>' +
                '</tr>';
        }).join('');

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

    function showPlayers(teamId) {
        window.STX.client
            .from('players')
            .select('*')
            .eq('team_id', teamId)
            .order('position')
            .then(function(res) {
                if (res.error) {
                    alert(tr('admin.err.action') + ' ' + res.error.message);
                    return;
                }
                var team = teamsCache.find(function(t) { return t.id === teamId; });
                var html = '<div style="text-align:left"><h3 style="color:var(--ac2);margin-bottom:14px">' +
                    escapeHtml(team ? team.team_name : tr('admin.col.team')) + '</h3>';
                res.data.forEach(function(p) {
                    html += '<div style="background:var(--bg2);padding:10px 14px;border-radius:8px;margin-bottom:6px;font-size:13px">' +
                        '<strong style="color:var(--ac2)">' + (p.is_sub ? 'S' : p.position) + '.</strong> ' +
                        escapeHtml(p.nickname) +
                        '<br><span style="font-size:11px;color:var(--mut)">' + escapeHtml(p.steam) + '</span>' +
                        '</div>';
                });
                html += '</div>';
                showInfoModal(html);
            });
    }

    function showInfoModal(html) {
        var m = $('infoModal');
        if (!m) {
            m = document.createElement('div');
            m.id = 'infoModal';
            m.className = 'del-modal';
            m.innerHTML = '<div class="del-modal-box" style="max-width:520px;border-color:var(--ac)" id="infoModalBox"></div>';
            document.body.appendChild(m);
            m.addEventListener('click', function(e) { if (e.target === m) m.classList.remove('on'); });
        }
        var box = $('infoModalBox');
        box.innerHTML = html + '<div style="margin-top:18px;text-align:center"><button class="btn-cancel" id="infoModalClose">' + tr('admin.modal.close') + '</button></div>';
        m.classList.add('on');
        $('infoModalClose').addEventListener('click', function() { m.classList.remove('on'); });
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
