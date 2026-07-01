/* ===== STX League MD — Админ-панель (новая версия) ===== */
(function() {
    'use strict';

    // ═══════ STATE ═══════
    var currentUser = null;
    var isAdmin = false;
    var teamsCache = [];
    var currentFilter = 'all';
    var currentView = 'grid';
    var currentSearch = '';
    var currentTab = 'dashboard';
    var deleteTargetId = null;
    var rejectTargetId = null;

    // ═══════ HELPERS ═══════
    function $(id) { return document.getElementById(id); }
    function qs(sel, root) { return (root || document).querySelector(sel); }
    function qsa(sel, root) { return (root || document).querySelectorAll(sel); }
    function tr(k, fb) { return (window.I18N && window.I18N.t) ? window.I18N.t(k, fb) : (fb || k); }
    function getLocale() { return (window.I18N && window.I18N.lang === 'ro') ? 'ro-RO' : 'ru-RU'; }
    function escapeHtml(s) {
        if (s == null) return '';
        return String(s).replace(/[&<>"']/g, function(c) {
            return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
        });
    }

    function formatDate(iso, short) {
        var d = new Date(iso);
        if (short) {
            return d.toLocaleDateString(getLocale(), {
                day: '2-digit', month: '2-digit', year: '2-digit'
            });
        }
        return d.toLocaleString(getLocale(), {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    function timeAgo(iso) {
        var d = new Date(iso);
        var s = Math.floor((Date.now() - d.getTime()) / 1000);
        if (s < 60) return tr('admin.time.now', 'только что');
        if (s < 3600) return Math.floor(s / 60) + ' ' + tr('admin.time.min', 'мин');
        if (s < 86400) return Math.floor(s / 3600) + ' ' + tr('admin.time.hour', 'ч');
        if (s < 604800) return Math.floor(s / 86400) + ' ' + tr('admin.time.day', 'дн');
        return formatDate(iso, true);
    }

    // ═══════ STATE SCREENS ═══════
    function showState(state) {
        var states = ['loading', 'not_logged', 'not_admin'];
        states.forEach(function(s) {
            var el = $('state_' + s);
            if (el) el.style.display = (s === state) ? 'flex' : 'none';
        });
        var admin = $('state_admin');
        if (admin) admin.style.display = (state === 'admin') ? 'flex' : 'none';
    }

    // ═══════ TABS ═══════
    function switchTab(tab) {
        currentTab = tab;

        qsa('.admin-nav-item').forEach(function(item) {
            item.classList.toggle('active', item.dataset.tab === tab);
        });

        qsa('.admin-tab').forEach(function(section) {
            var isActive = section.dataset.tab === tab;
            section.style.display = isActive ? 'block' : 'none';
            if (isActive) section.classList.add('active');
        });

        // Закрыть мобильное меню
        closeMobileSidebar();

        // Обновить URL hash (без scroll)
        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', '#' + tab);
        }

        // Прокрутить наверх
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ═══════ MOBILE SIDEBAR ═══════
    function toggleMobileSidebar() {
        var sidebar = $('adminSidebar');
        var burger = $('adminMobileBurger');
        if (sidebar) sidebar.classList.toggle('open');
        if (burger) burger.classList.toggle('open');
    }
    function closeMobileSidebar() {
        var sidebar = $('adminSidebar');
        var burger = $('adminMobileBurger');
        if (sidebar) sidebar.classList.remove('open');
        if (burger) burger.classList.remove('open');
    }

    // ═══════ FETCH DATA ═══════
    function fetchTeams() {
        return window.STX.client
            .from('teams')
            .select('id, team_name, team_tag, logo_url, captain_contact, captain_discord_id, captain_username, status, submitted_at, reviewed_at, reviewed_by, rejection_reason')
            .order('submitted_at', { ascending: false });
    }

    function loadTeams() {
        return fetchTeams().then(function(res) {
            if (res.error) {
                console.error(res.error);
                alert(tr('admin.err.load') + ' ' + res.error.message);
                return;
            }
            teamsCache = res.data || [];
            renderAll();
        });
    }

    function renderAll() {
        renderStats();
        renderCharts();
        renderRecent();
        renderTeams();
        updateFilterCounts();
        updateNavBadge();
    }

    // ═══════ STATS ═══════
    function renderStats() {
        var total = teamsCache.length;
        var pending = teamsCache.filter(function(t) { return t.status === 'pending'; }).length;
        var approved = teamsCache.filter(function(t) { return t.status === 'approved'; }).length;
        var rejected = teamsCache.filter(function(t) { return t.status === 'rejected'; }).length;

        var stotal = $('stotal'), spending = $('spending'), sapproved = $('sapproved'), srejected = $('srejected');
        if (stotal) stotal.textContent = total;
        if (spending) spending.textContent = pending;
        if (sapproved) sapproved.textContent = approved;
        if (srejected) srejected.textContent = rejected;

        // Прогресс бары (относительно 16 команд)
        var MAX = 16;
        var pTotal = $('progressTotal'), pPending = $('progressPending'), pApproved = $('progressApproved'), pRejected = $('progressRejected');
        if (pTotal) pTotal.style.width = Math.min(100, (total / MAX) * 100) + '%';
        if (pPending) pPending.style.width = total > 0 ? (pending / total) * 100 + '%' : '0%';
        if (pApproved) pApproved.style.width = total > 0 ? (approved / total) * 100 + '%' : '0%';
        if (pRejected) pRejected.style.width = total > 0 ? (rejected / total) * 100 + '%' : '0%';
    }

    function updateFilterCounts() {
        var total = teamsCache.length;
        var pending = teamsCache.filter(function(t) { return t.status === 'pending'; }).length;
        var approved = teamsCache.filter(function(t) { return t.status === 'approved'; }).length;
        var rejected = teamsCache.filter(function(t) { return t.status === 'rejected'; }).length;

        var fAll = $('filterAllCount');
        var fPend = $('filterPendingCount');
        var fApp = $('filterApprovedCount');
        var fRej = $('filterRejectedCount');
        if (fAll) fAll.textContent = total;
        if (fPend) fPend.textContent = pending;
        if (fApp) fApp.textContent = approved;
        if (fRej) fRej.textContent = rejected;
    }

    function updateNavBadge() {
        var pending = teamsCache.filter(function(t) { return t.status === 'pending'; }).length;
        var badge = $('teamsCountBadge');
        if (badge) {
            if (pending > 0) {
                badge.textContent = pending;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    // ═══════ CHARTS ═══════
    function renderCharts() {
        renderBarChart();
        renderPieChart();
    }

    function renderBarChart() {
        var container = $('barChart');
        if (!container) return;

        if (teamsCache.length === 0) {
            container.innerHTML = '<div class="admin-chart-empty">' + tr('admin.chart.empty', 'Нет данных') + '</div>';
            return;
        }

        // Собираем заявки за последние 14 дней
        var days = 14;
        var now = new Date();
        now.setHours(0, 0, 0, 0);
        var buckets = [];
        for (var i = days - 1; i >= 0; i--) {
            var d = new Date(now);
            d.setDate(now.getDate() - i);
            buckets.push({
                date: d,
                count: 0,
                label: d.getDate() + '.' + String(d.getMonth() + 1).padStart(2, '0')
            });
        }

        teamsCache.forEach(function(t) {
            var td = new Date(t.submitted_at);
            td.setHours(0, 0, 0, 0);
            for (var j = 0; j < buckets.length; j++) {
                if (buckets[j].date.getTime() === td.getTime()) {
                    buckets[j].count++;
                    break;
                }
            }
        });

        var max = Math.max.apply(null, buckets.map(function(b) { return b.count; }));
        if (max === 0) max = 1;

        container.innerHTML = buckets.map(function(b) {
            var height = (b.count / max) * 100;
            return '<div class="admin-bar" style="height:' + Math.max(4, height) + '%" title="' + b.label + ': ' + b.count + '">' +
                '<div class="admin-bar-tooltip">' + b.label + ': ' + b.count + ' ' + tr('admin.chart.applications', 'заявок') + '</div>' +
                '<div class="admin-bar-label">' + b.label + '</div>' +
            '</div>';
        }).join('');
    }

    function renderPieChart() {
        var total = teamsCache.length;
        var pending = teamsCache.filter(function(t) { return t.status === 'pending'; }).length;
        var approved = teamsCache.filter(function(t) { return t.status === 'approved'; }).length;
        var rejected = teamsCache.filter(function(t) { return t.status === 'rejected'; }).length;

        var pieTotal = $('pieTotal');
        if (pieTotal) pieTotal.textContent = total;

        var lPending = $('legendPending');
        var lApproved = $('legendApproved');
        var lRejected = $('legendRejected');
        if (lPending) lPending.textContent = pending;
        if (lApproved) lApproved.textContent = approved;
        if (lRejected) lRejected.textContent = rejected;

        var C = 2 * Math.PI * 42; // circumference ≈ 264

        var pPending = $('piePending');
        var pApproved = $('pieApproved');
        var pRejected = $('pieRejected');

        if (total === 0) {
            if (pPending) pPending.setAttribute('stroke-dasharray', '0 ' + C);
            if (pApproved) pApproved.setAttribute('stroke-dasharray', '0 ' + C);
            if (pRejected) pRejected.setAttribute('stroke-dasharray', '0 ' + C);
            return;
        }

        var pendingLen = (pending / total) * C;
        var approvedLen = (approved / total) * C;
        var rejectedLen = (rejected / total) * C;

        var pendingOffset = 0;
        var approvedOffset = -pendingLen;
        var rejectedOffset = -(pendingLen + approvedLen);

        if (pPending) {
            pPending.setAttribute('stroke-dasharray', pendingLen + ' ' + (C - pendingLen));
            pPending.setAttribute('stroke-dashoffset', pendingOffset);
        }
        if (pApproved) {
            pApproved.setAttribute('stroke-dasharray', approvedLen + ' ' + (C - approvedLen));
            pApproved.setAttribute('stroke-dashoffset', approvedOffset);
        }
        if (pRejected) {
            pRejected.setAttribute('stroke-dasharray', rejectedLen + ' ' + (C - rejectedLen));
            pRejected.setAttribute('stroke-dashoffset', rejectedOffset);
        }
    }

    // ═══════ RECENT LIST (Dashboard) ═══════
    function renderRecent() {
        var container = $('recentList');
        if (!container) return;

        if (teamsCache.length === 0) {
            container.innerHTML = '<div class="admin-empty">' + tr('admin.empty') + '</div>';
            return;
        }

        var recent = teamsCache.slice(0, 5);
        container.innerHTML = recent.map(function(t) {
            return renderRecentItem(t);
        }).join('');

        container.querySelectorAll('.admin-recent-item').forEach(function(item) {
            item.addEventListener('click', function() {
                openDetailsModal(this.dataset.id);
            });
        });
    }

    function renderRecentItem(t) {
        var logoHtml = renderLogo(t, 'admin-recent-logo', 'admin-recent-logo-placeholder', 16);
        var stxt = t.status === 'pending' ? tr('admin.st.pending')
            : t.status === 'approved' ? tr('admin.st.approved') : tr('admin.st.rejected');

        return '<div class="admin-recent-item" data-id="' + t.id + '">' +
            logoHtml +
            '<div class="admin-recent-info">' +
                '<div class="admin-recent-name">' + escapeHtml(t.team_name) +
                    (t.team_tag ? ' <span style="color:var(--mut)">[' + escapeHtml(t.team_tag) + ']</span>' : '') + '</div>' +
                '<div class="admin-recent-meta">' + timeAgo(t.submitted_at) + ' • ' + escapeHtml(t.captain_username || t.captain_contact) + '</div>' +
            '</div>' +
            '<span class="admin-team-status ' + t.status + '"><span class="admin-team-status-dot"></span>' + stxt + '</span>' +
            '<span class="admin-recent-arrow">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>' +
            '</span>' +
        '</div>';
    }

    function renderLogo(t, imgClass, placeholderClass, fontSize) {
        if (t.logo_url) {
            return '<img src="' + escapeHtml(t.logo_url) + '" class="' + imgClass + '" alt="" ' +
                'onerror="this.outerHTML=\'<div class=&quot;' + placeholderClass + '&quot;>' +
                    escapeHtml((t.team_tag || t.team_name.substring(0, 2)).toUpperCase()) + '</div>\'">';
        }
        return '<div class="' + placeholderClass + '"' +
            (fontSize ? ' style="font-size:' + fontSize + 'px"' : '') + '>' +
            escapeHtml((t.team_tag || t.team_name.substring(0, 2)).toUpperCase()) + '</div>';
    }

    // ═══════ TEAMS RENDER ═══════
    function getFilteredTeams() {
        var teams = teamsCache.slice();

        if (currentFilter !== 'all') {
            teams = teams.filter(function(t) { return t.status === currentFilter; });
        }

        if (currentSearch) {
            var q = currentSearch.toLowerCase();
            teams = teams.filter(function(t) {
                return (t.team_name && t.team_name.toLowerCase().indexOf(q) > -1) ||
                       (t.team_tag && t.team_tag.toLowerCase().indexOf(q) > -1) ||
                       (t.captain_username && t.captain_username.toLowerCase().indexOf(q) > -1) ||
                       (t.captain_contact && t.captain_contact.toLowerCase().indexOf(q) > -1);
            });
        }

        return teams;
    }

    function renderTeams() {
        var teams = getFilteredTeams();
        var grid = $('teamsGrid');
        var list = $('teamsList');

        // Показать/скрыть контейнеры
        if (currentView === 'grid') {
            if (grid) grid.style.display = 'grid';
            if (list) list.style.display = 'none';
            renderTeamsGrid(teams);
        } else {
            if (grid) grid.style.display = 'none';
            if (list) list.style.display = 'block';
            renderTeamsTable(teams);
        }
    }

    function renderTeamsGrid(teams) {
        var grid = $('teamsGrid');
        if (!grid) return;

        if (teams.length === 0) {
            grid.innerHTML = '<div class="admin-empty" style="grid-column:1/-1">' +
                (currentSearch ? tr('admin.empty.search', 'Ничего не найдено') : tr('admin.empty')) + '</div>';
            return;
        }

        grid.innerHTML = teams.map(function(t) {
            var logoHtml = renderLogo(t, 'admin-team-logo', 'admin-team-logo-placeholder');
            var stxt = t.status === 'pending' ? tr('admin.st.pending')
                : t.status === 'approved' ? tr('admin.st.approved') : tr('admin.st.rejected');

            var actions = '';
            if (t.status !== 'approved') {
                actions += '<button class="admin-btn admin-btn-mini admin-btn-success" data-action="approve" data-id="' + t.id + '">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>' +
                    tr('admin.btn.approve') + '</button>';
            }
            if (t.status !== 'rejected') {
                actions += '<button class="admin-btn admin-btn-mini admin-btn-warning" data-action="reject" data-id="' + t.id + '">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
                    tr('admin.btn.reject') + '</button>';
            }
            actions += '<button class="admin-btn admin-btn-mini admin-btn-ghost" data-action="delete" data-id="' + t.id + '" data-name="' + escapeHtml(t.team_name) + '">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>' +
                '</button>';

            return '<div class="admin-team-card status-' + t.status + '" data-id="' + t.id + '">' +
                '<div class="admin-team-card-header">' +
                    logoHtml +
                    '<div class="admin-team-info">' +
                        '<div class="admin-team-name">' + escapeHtml(t.team_name) +
                            (t.team_tag ? ' <span class="admin-team-tag">[' + escapeHtml(t.team_tag) + ']</span>' : '') + '</div>' +
                        '<div class="admin-team-meta">' +
                            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
                            timeAgo(t.submitted_at) +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<span class="admin-team-status ' + t.status + '"><span class="admin-team-status-dot"></span>' + stxt + '</span>' +
                '<div class="admin-team-details">' +
                    '<div class="admin-team-detail-row"><span>' + tr('admin.col.captain') + ':</span><span>' + escapeHtml(t.captain_contact) + '</span></div>' +
                    '<div class="admin-team-detail-row"><span>' + tr('admin.col.discord') + ':</span><span>' + escapeHtml(t.captain_username || '—') + '</span></div>' +
                '</div>' +
                '<div class="admin-team-actions">' + actions + '</div>' +
            '</div>';
        }).join('');

        // Клик по карточке (кроме кнопок)
        grid.querySelectorAll('.admin-team-card').forEach(function(card) {
            card.addEventListener('click', function(e) {
                if (e.target.closest('.admin-team-actions')) return;
                openDetailsModal(this.dataset.id);
            });
        });

        bindTeamActions(grid);
    }

    function renderTeamsTable(teams) {
        var tbody = $('teamsTableBody');
        if (!tbody) return;

        if (teams.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--mut);padding:40px">' +
                (currentSearch ? tr('admin.empty.search', 'Ничего не найдено') : tr('admin.empty')) + '</td></tr>';
            return;
        }

        tbody.innerHTML = teams.map(function(t, idx) {
            var logoHtml = renderLogo(t, 'admin-table-logo', 'admin-table-logo-placeholder');
            var stxt = t.status === 'pending' ? tr('admin.st.pending')
                : t.status === 'approved' ? tr('admin.st.approved') : tr('admin.st.rejected');

            var actions = '';
            if (t.status !== 'approved') {
                actions += '<button class="admin-btn admin-btn-mini admin-btn-success" data-action="approve" data-id="' + t.id + '" title="' + tr('admin.btn.approve') + '">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></button>';
            }
            if (t.status !== 'rejected') {
                actions += '<button class="admin-btn admin-btn-mini admin-btn-warning" data-action="reject" data-id="' + t.id + '" title="' + tr('admin.btn.reject') + '">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
            }
            actions += '<button class="admin-btn admin-btn-mini admin-btn-ghost" data-action="delete" data-id="' + t.id + '" data-name="' + escapeHtml(t.team_name) + '" title="' + tr('admin.btn.delete') + '">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>';

            return '<tr data-id="' + t.id + '">' +
                '<td>' + (idx + 1) + '</td>' +
                '<td><div class="admin-table-team-cell">' + logoHtml +
                    '<div><div style="color:#fff;font-family:\'Oswald\',sans-serif;font-size:14px">' + escapeHtml(t.team_name) + '</div>' +
                    (t.team_tag ? '<div style="color:var(--mut);font-size:11px">[' + escapeHtml(t.team_tag) + ']</div>' : '') + '</div>' +
                '</div></td>' +
                '<td>' + escapeHtml(t.captain_contact) + '</td>' +
                '<td>' + escapeHtml(t.captain_username || '—') + '</td>' +
                '<td><span style="font-size:11px;color:var(--mut)">' + formatDate(t.submitted_at) + '</span></td>' +
                '<td><span class="admin-team-status ' + t.status + '"><span class="admin-team-status-dot"></span>' + stxt + '</span></td>' +
                '<td><div class="admin-table-actions">' + actions + '</div></td>' +
            '</tr>';
        }).join('');

        // Клик по строке (кроме кнопок)
        tbody.querySelectorAll('tr[data-id]').forEach(function(row) {
            row.addEventListener('click', function(e) {
                if (e.target.closest('.admin-table-actions')) return;
                openDetailsModal(this.dataset.id);
            });
        });

        bindTeamActions(tbody);
    }

    function bindTeamActions(root) {
        root.querySelectorAll('[data-action="approve"]').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                updateStatus(this.dataset.id, 'approved');
            });
        });
        root.querySelectorAll('[data-action="reject"]').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                openRejectModal(this.dataset.id);
            });
        });
        root.querySelectorAll('[data-action="delete"]').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                openDeleteModal(this.dataset.id, this.dataset.name);
            });
        });
    }

    // ═══════ ACTIONS ═══════
    function updateStatus(teamId, newStatus, reason) {
        var patch = { status: newStatus };
        if (reason !== undefined) patch.rejection_reason = reason || null;
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
                closeDetailsModal();
                loadTeams();
            });
    }

    // ═══════ MODALS ═══════
    function openDeleteModal(teamId, name) {
        deleteTargetId = teamId;
        var modal = $('delModal');
        var nameEl = $('delTeamName');
        if (nameEl) nameEl.textContent = name;
        if (modal) modal.classList.add('on');
    }
    function closeDeleteModal() {
        deleteTargetId = null;
        var modal = $('delModal');
        if (modal) modal.classList.remove('on');
    }

    function openRejectModal(teamId) {
        rejectTargetId = teamId;
        var modal = $('rejectModal');
        var textarea = $('rejectReason');
        if (textarea) textarea.value = '';
        if (modal) modal.classList.add('on');
        setTimeout(function() {
            if (textarea) textarea.focus();
        }, 200);
    }
    function closeRejectModal() {
        rejectTargetId = null;
        var modal = $('rejectModal');
        if (modal) modal.classList.remove('on');
    }

    function openDetailsModal(teamId) {
        var modal = $('detailsModal');
        var team = teamsCache.find(function(t) { return t.id === teamId; });
        if (!modal || !team) return;

        modal.classList.add('on');
        $('detailsModalBody').innerHTML =
            '<div style="text-align:center;padding:60px 20px"><div class="pring" style="margin:0 auto"></div>' +
            '<p style="color:var(--mut);margin-top:14px">' + tr('common.loading') + '</p></div>';

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
    function closeDetailsModal() {
        var modal = $('detailsModal');
        if (modal) modal.classList.remove('on');
    }

    // ═══════ DETAILS MODAL CONTENT ═══════
    function detectSteamLink(steam) {
        if (!steam) return { type: 'text', value: steam, url: null };
        var s = String(steam).trim();
        if (/^https?:\/\//i.test(s)) return { type: 'url', value: s, url: s };
        if (/^steamcommunity\.com/i.test(s)) return { type: 'url', value: s, url: 'https://' + s };
        if (/^7656\d{13}$/.test(s)) return { type: 'steamid64', value: s, url: 'https://steamcommunity.com/profiles/' + s };
        if (/^STEAM_[0-5]:[01]:\d+$/i.test(s)) return { type: 'steam2', value: s, url: null };
        if (/^\[U:\d:\d+\]$/.test(s)) return { type: 'steam3', value: s, url: null };
        if (/^[a-zA-Z0-9_-]{3,32}$/.test(s)) return { type: 'vanity', value: s, url: 'https://steamcommunity.com/id/' + s };
        return { type: 'text', value: s, url: null };
    }

    function renderDetails(team, players) {
        var stxt = team.status === 'pending' ? tr('admin.st.pending')
            : team.status === 'approved' ? tr('admin.st.approved') : tr('admin.st.rejected');

        // Header + Logo
        var logoHtml;
        if (team.logo_url) {
            logoHtml = '<img src="' + escapeHtml(team.logo_url) + '" class="admin-details-logo" alt="" ' +
                'onerror="this.outerHTML=\'<div class=&quot;admin-details-logo-placeholder&quot;>' +
                escapeHtml((team.team_tag || team.team_name.substring(0, 2)).toUpperCase()) + '</div>\'">';
        } else {
            logoHtml = '<div class="admin-details-logo-placeholder">' +
                escapeHtml((team.team_tag || team.team_name.substring(0, 2)).toUpperCase()) + '</div>';
        }

        // Captain contact
        var cc = team.captain_contact || '';
        var contactHtml;
        if (/^@[a-zA-Z0-9_]{3,}$/.test(cc)) {
            contactHtml = '<a href="https://t.me/' + cc.substring(1) + '" target="_blank" rel="noopener">' + escapeHtml(cc) + '</a>';
        } else {
            contactHtml = escapeHtml(cc);
        }

        // Players
        var playersHtml = players.map(function(p) {
            var sl = detectSteamLink(p.steam);
            var steamContent = sl.url
                ? '<a href="' + escapeHtml(sl.url) + '" target="_blank" rel="noopener">' + escapeHtml(sl.value) + '</a>'
                : '<span>' + escapeHtml(sl.value) + '</span>';

            var numHtml = p.is_sub
                ? '<div class="admin-details-player-num sub">SUB</div>'
                : '<div class="admin-details-player-num">' + p.position + '</div>';

            var copyBtn = sl.url
                ? '<button class="admin-details-player-copy" data-copy="' + escapeHtml(sl.url) + '" title="' + tr('admin.details.copy') + '">📋</button>'
                : '';

            return '<div class="admin-details-player">' +
                numHtml +
                '<div class="admin-details-player-info">' +
                    '<div class="admin-details-player-nick">' + escapeHtml(p.nickname) + '</div>' +
                    '<div class="admin-details-player-steam">Steam: ' + steamContent + '</div>' +
                '</div>' +
                copyBtn +
            '</div>';
        }).join('');

        if (!playersHtml) {
            playersHtml = '<div class="admin-empty">' + tr('admin.details.no_players') + '</div>';
        }

        // Logo section (только если есть)
        var logoSection = '';
        if (team.logo_url) {
            logoSection =
                '<div class="admin-details-section">' +
                    '<div class="admin-details-section-title">' +
                        '<span>' + tr('admin.details.logo.title') + '</span>' +
                        '<a href="' + escapeHtml(team.logo_url) + '" download target="_blank" rel="noopener" class="admin-btn admin-btn-mini admin-btn-ghost">' +
                            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
                            tr('admin.details.logo.download', 'Скачать') +
                        '</a>' +
                    '</div>' +
                    '<div class="admin-details-logo-block">' +
                        '<img src="' + escapeHtml(team.logo_url) + '" class="admin-details-logo-img" alt="">' +
                        '<div class="admin-details-logo-actions">' +
                            '<a href="' + escapeHtml(team.logo_url) + '" target="_blank" rel="noopener" class="admin-btn admin-btn-mini admin-btn-ghost">' +
                                tr('admin.details.logo.open') +
                            '</a>' +
                        '</div>' +
                    '</div>' +
                '</div>';
        }

        // Rejection reason
        var rejectionHtml = '';
        if (team.rejection_reason) {
            rejectionHtml =
                '<div class="admin-details-rejection">' +
                    '<div class="admin-details-rejection-label">' + tr('admin.details.rejection') + '</div>' +
                    '<div class="admin-details-rejection-text">' + escapeHtml(team.rejection_reason) + '</div>' +
                '</div>';
        }

        // Footer actions
        var footerActions = '';
        if (team.status !== 'approved') {
            footerActions += '<button class="admin-btn admin-btn-success" id="dmApprove">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>' +
                tr('admin.btn.approve') + '</button>';
        }
        if (team.status !== 'rejected') {
            footerActions += '<button class="admin-btn admin-btn-warning" id="dmReject">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
                tr('admin.btn.reject') + '</button>';
        }
        footerActions += '<button class="admin-btn admin-btn-danger" id="dmDelete">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>' +
            tr('admin.btn.delete') + '</button>';

        // Собираем всё
        $('detailsModalBody').innerHTML =
            '<div class="admin-details-header">' +
                logoHtml +
                '<div class="admin-details-title">' +
                    '<h2>' + escapeHtml(team.team_name) +
                        (team.team_tag ? ' <span class="tag">[' + escapeHtml(team.team_tag) + ']</span>' : '') + '</h2>' +
                    '<div class="admin-details-title-meta">' +
                        '<span class="admin-team-status ' + team.status + '"><span class="admin-team-status-dot"></span>' + stxt + '</span>' +
                        '<span class="divider"></span>' +
                        '<span>' + formatDate(team.submitted_at) + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Captain info
            '<div class="admin-details-section">' +
                '<div class="admin-details-section-title">' + tr('admin.details.captain.title') + '</div>' +
                '<div class="admin-details-info">' +
                    '<div class="admin-details-info-card">' +
                        '<div class="admin-details-info-label">' + tr('admin.details.captain.discord') + '</div>' +
                        '<div class="admin-details-info-value">' + escapeHtml(team.captain_username || '—') + '</div>' +
                    '</div>' +
                    '<div class="admin-details-info-card">' +
                        '<div class="admin-details-info-label">' + tr('admin.details.captain.contact') + '</div>' +
                        '<div class="admin-details-info-value">' + contactHtml + '</div>' +
                    '</div>' +
                    '<div class="admin-details-info-card" style="grid-column:1/-1">' +
                        '<div class="admin-details-info-label">' + tr('admin.details.captain.discord_id') + '</div>' +
                        '<div class="admin-details-info-value"><code>' + escapeHtml(team.captain_discord_id) + '</code></div>' +
                    '</div>' +
                '</div>' +
                rejectionHtml +
            '</div>' +

            // Logo section
            logoSection +

            // Players
            '<div class="admin-details-section">' +
                '<div class="admin-details-section-title">' +
                    '<span>' + tr('admin.details.players.title') + ' (' + players.length + ')</span>' +
                '</div>' +
                '<div class="admin-details-players">' + playersHtml + '</div>' +
            '</div>' +

            // Footer actions
            '<div class="admin-details-footer">' + footerActions + '</div>';

        // Bind footer actions
        var dmApprove = $('dmApprove');
        var dmReject = $('dmReject');
        var dmDelete = $('dmDelete');

        if (dmApprove) dmApprove.addEventListener('click', function() {
            closeDetailsModal();
            updateStatus(team.id, 'approved');
        });
        if (dmReject) dmReject.addEventListener('click', function() {
            closeDetailsModal();
            openRejectModal(team.id);
        });
        if (dmDelete) dmDelete.addEventListener('click', function() {
            closeDetailsModal();
            openDeleteModal(team.id, team.team_name);
        });

        // Copy buttons
        $('detailsModalBody').querySelectorAll('.admin-details-player-copy').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var text = this.dataset.copy;
                var self = this;
                navigator.clipboard.writeText(text).then(function() {
                    var orig = self.textContent;
                    self.textContent = '✓';
                    self.style.background = 'var(--grn)';
                    self.style.color = '#fff';
                    setTimeout(function() {
                        self.textContent = orig;
                        self.style.background = '';
                        self.style.color = '';
                    }, 1200);
                });
            });
        });
    }

    // ═══════ CSV EXPORT ═══════
    function exportCSV() {
        if (!teamsCache.length) {
            alert(tr('admin.export.empty', 'Нет данных для экспорта'));
            return;
        }

        // Загружаем всех игроков
        window.STX.client.from('players').select('*').then(function(res) {
            var players = res.data || [];

            var headers = [
                '#', 'Team Name', 'Tag', 'Status', 'Captain Discord', 'Captain Contact',
                'Discord ID', 'Submitted', 'Rejection Reason',
                'Player 1', 'Steam 1',
                'Player 2', 'Steam 2',
                'Player 3', 'Steam 3',
                'Player 4', 'Steam 4',
                'Player 5', 'Steam 5',
                'Sub Player', 'Sub Steam',
                'Logo URL'
            ];

            var rows = teamsCache.map(function(t, idx) {
                var teamPlayers = players.filter(function(p) { return p.team_id === t.id; });
                var mainPlayers = teamPlayers.filter(function(p) { return !p.is_sub; }).sort(function(a, b) { return a.position - b.position; });
                var subPlayer = teamPlayers.find(function(p) { return p.is_sub; });

                var row = [
                    idx + 1,
                    t.team_name,
                    t.team_tag || '',
                    t.status,
                    t.captain_username || '',
                    t.captain_contact || '',
                    t.captain_discord_id || '',
                    formatDate(t.submitted_at),
                    t.rejection_reason || ''
                ];
                for (var i = 0; i < 5; i++) {
                    row.push(mainPlayers[i] ? mainPlayers[i].nickname : '');
                    row.push(mainPlayers[i] ? mainPlayers[i].steam : '');
                }
                row.push(subPlayer ? subPlayer.nickname : '');
                row.push(subPlayer ? subPlayer.steam : '');
                row.push(t.logo_url || '');
                return row;
            });

            var csv = [headers].concat(rows).map(function(row) {
                return row.map(function(cell) {
                    var s = String(cell == null ? '' : cell);
                    if (s.indexOf(',') > -1 || s.indexOf('"') > -1 || s.indexOf('\n') > -1) {
                        s = '"' + s.replace(/"/g, '""') + '"';
                    }
                    return s;
                }).join(',');
            }).join('\n');

            // BOM для корректного отображения кириллицы в Excel
            var bom = '\uFEFF';
            var blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'stx-teams-' + new Date().toISOString().slice(0, 10) + '.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    // ═══════ SETTINGS TOGGLE ═══════
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
                    toggle.checked = !newValue;
                    refresh();
                    return;
                }
                if (hint) {
                    hint.textContent = tr('admin.settings.saved');
                    hint.style.color = 'var(--grn)';
                    setTimeout(refresh, 1500);
                }
            });
        });
    }

    // ═══════ USER INFO (sidebar) ═══════
    function updateAdminUser(user) {
        if (!user) return;
        var name = $('adminUserName');
        var avatar = $('adminUserAvatar');

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

    // ═══════ AUTH ═══════
    function onAuth(user, isAdm) {
        currentUser = user;
        isAdmin = !!isAdm;

        if (!user) {
            showState('not_logged');
        } else if (!isAdm) {
            showState('not_admin');
        } else {
            showState('admin');
            updateAdminUser(user);
            loadTeams();
            bindRegToggle();

            // Обработать hash в URL (для перехода на нужный таб)
            var hash = window.location.hash.replace('#', '');
            if (hash && ['dashboard', 'teams', 'settings'].indexOf(hash) > -1) {
                switchTab(hash);
            }
        }
    }

    // ═══════ INIT ═══════
    function init() {
        showState('loading');

        // ═══ Login/Logout ═══
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

        var sidebarLogout = $('adminSidebarLogout');
        if (sidebarLogout) sidebarLogout.addEventListener('click', function(e) {
            e.preventDefault();
            window.STX.signOut();
        });

        var mobileLogout = $('adminMobileLogout');
        if (mobileLogout) mobileLogout.addEventListener('click', function(e) {
            e.preventDefault();
            window.STX.signOut();
        });

        // ═══ Tab navigation ═══
        qsa('.admin-nav-item').forEach(function(btn) {
            btn.addEventListener('click', function() {
                switchTab(this.dataset.tab);
            });
        });

        // Кнопка "Все команды" в Dashboard
        qsa('[data-goto-tab]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                switchTab(this.dataset.gotoTab);
            });
        });

        // ═══ Mobile burger ═══
        var burger = $('adminMobileBurger');
        if (burger) burger.addEventListener('click', toggleMobileSidebar);

        // ═══ Refresh buttons ═══
        var dashRefresh = $('dashRefresh');
        if (dashRefresh) dashRefresh.addEventListener('click', loadTeams);
        var teamsRefresh = $('teamsRefreshBtn');
        if (teamsRefresh) teamsRefresh.addEventListener('click', loadTeams);

        // ═══ Export ═══
        var exportBtn = $('teamsExportBtn');
        if (exportBtn) exportBtn.addEventListener('click', exportCSV);

        // ═══ Filters ═══
        qsa('.admin-filter').forEach(function(btn) {
            btn.addEventListener('click', function() {
                currentFilter = this.dataset.filter;
                qsa('.admin-filter').forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
                renderTeams();
            });
        });

        // ═══ View toggle ═══
        qsa('.admin-view-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                currentView = this.dataset.view;
                qsa('.admin-view-btn').forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
                renderTeams();
            });
        });

        // ═══ Search ═══
        var search = $('teamsSearch');
        if (search) {
            var searchTimeout;
            search.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                var val = this.value;
                searchTimeout = setTimeout(function() {
                    currentSearch = val.trim();
                    renderTeams();
                }, 200);
            });
        }

        // ═══ Modals ═══
        var delCancel = $('delCancel');
        if (delCancel) delCancel.addEventListener('click', closeDeleteModal);
        var delConfirm = $('delConfirm');
        if (delConfirm) delConfirm.addEventListener('click', function() {
            if (deleteTargetId) {
                deleteTeam(deleteTargetId);
                closeDeleteModal();
            }
        });

        var rejCancel = $('rejectCancel');
        if (rejCancel) rejCancel.addEventListener('click', closeRejectModal);
        var rejConfirm = $('rejectConfirm');
        if (rejConfirm) rejConfirm.addEventListener('click', function() {
            if (rejectTargetId) {
                var reason = $('rejectReason').value.trim();
                updateStatus(rejectTargetId, 'rejected', reason);
                closeRejectModal();
            }
        });

        var detailsClose = $('detailsModalClose');
        if (detailsClose) detailsClose.addEventListener('click', closeDetailsModal);

        // Клик по фону модалок
        ['delModal', 'rejectModal', 'detailsModal'].forEach(function(id) {
            var m = $(id);
            if (m) m.addEventListener('click', function(e) {
                if (e.target === m) {
                    if (id === 'delModal') closeDeleteModal();
                    if (id === 'rejectModal') closeRejectModal();
                    if (id === 'detailsModal') closeDetailsModal();
                }
            });
        });

        // Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeDeleteModal();
                closeRejectModal();
                closeDetailsModal();
            }
        });

        // ═══ Language change — rerender ═══
        document.addEventListener('stx:lang', function() {
            if (teamsCache.length) renderAll();
        });

        // ═══ Auth binding ═══
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
