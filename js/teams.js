/* ===== Публичная сетка команд (teams.html) =====
   Берёт approved-команды из Supabase. RLS разрешает SELECT всем (даже без логина).
*/
(function() {
    'use strict';

    var MAX = (window.STX_CONFIG && window.STX_CONFIG.MAX_TEAMS) || 16;

    function escapeHtml(s) {
        if (s == null) return '';
        return String(s).replace(/[&<>"']/g, function(c) {
            return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
        });
    }
    function tr(k) { return (window.I18N && window.I18N.t) ? window.I18N.t(k) : k; }

    var lastTeams = null;

    function load() {
        var grid = document.getElementById('tgrid');
        if (!grid) return;
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--mut)">' + tr('teams.loading') + '</div>';

        function tryLoad() {
            if (!window.STX || !window.STX.client) {
                setTimeout(tryLoad, 150);
                return;
            }
            window.STX.client
                .from('teams_with_players')
                .select('id, team_name, team_tag, logo_url, players')
                .eq('status', 'approved')
                .order('submitted_at', { ascending: true })
                .then(render);
        }
        tryLoad();
    }

    function render(res) {
        var grid = document.getElementById('tgrid');
        if (!grid) return;

        if (res.error) {
            console.error('Load teams error:', res.error);
            grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--red)">' + tr('teams.error') + '</div>';
            return;
        }

        var teams = res.data || [];
        lastTeams = teams;
        var count = Math.min(teams.length, MAX);

        var tcnt = document.getElementById('tcnt');
        if (tcnt) tcnt.textContent = count;
        var pbar = document.getElementById('pbar');
        if (pbar) pbar.style.width = (count / MAX * 100) + '%';

        grid.innerHTML = '';
        for (var i = 0; i < MAX; i++) {
            var card = document.createElement('div');
            if (i < teams.length) {
                var t = teams[i];
                card.className = 'team-card filled';
                var av = escapeHtml((t.team_tag || t.team_name.substring(0, 2)).toUpperCase());
                var nicks = (t.players || [])
                    .filter(function(p) { return !p.is_sub; })
                    .map(function(p) { return escapeHtml(p.nickname); })
                    .join(' • ');
                // Если есть лого — показываем картинку, иначе буквы из тега
                var avHtml = t.logo_url
                    ? '<div class="team-av" style="background:#0a0a14;overflow:hidden;padding:0">' +
                        '<img src="' + escapeHtml(t.logo_url) + '" alt="" ' +
                        'style="width:100%;height:100%;object-fit:cover" ' +
                        'onerror="this.parentElement.innerHTML=\'' + av + '\'">' +
                      '</div>'
                    : '<div class="team-av">' + av + '</div>';
                card.innerHTML = avHtml +
                    '<div class="team-name">' + escapeHtml(t.team_name) + '</div>' +
                    '<div class="team-players">' + (nicks || '—') + '</div>';
            } else {
                card.className = 'team-card empty';
                card.innerHTML = '<div class="team-av">?</div>' +
                    '<div class="team-name">' + tr('teams.empty.name') + '</div>' +
                    '<div class="team-players">' + tr('teams.empty.text') + '</div>';
            }
            grid.appendChild(card);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', load);
    } else {
        load();
    }

    // Перерисовать пустые слоты при смене языка
    document.addEventListener('stx:lang', function() {
        if (lastTeams) render({ data: lastTeams });
    });
})();
