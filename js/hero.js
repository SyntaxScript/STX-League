/* ===== HERO: countdown, typewriter, parallax ===== */
(function() {
    'use strict';

    // ===== Countdown =====
    function initCountdown() {
        if (!document.getElementById('cdD')) return;
        var dateStr = (window.STX_CONFIG && window.STX_CONFIG.TOURNAMENT_DATE) || '2026-08-15T10:00:00+03:00';
        var target = new Date(dateStr).getTime();
        function tick() {
            var diff = target - Date.now();
            if (diff <= 0) {
                ['cdD','cdH','cdM','cdS'].forEach(function(id) {
                    var el = document.getElementById(id); if (el) el.textContent = '00';
                });
                return;
            }
            var d = Math.floor(diff / 86400000); diff -= d*86400000;
            var h = Math.floor(diff / 3600000);  diff -= h*3600000;
            var m = Math.floor(diff / 60000);    diff -= m*60000;
            var s = Math.floor(diff / 1000);
            document.getElementById('cdD').textContent = String(d).padStart(2,'0');
            document.getElementById('cdH').textContent = String(h).padStart(2,'0');
            document.getElementById('cdM').textContent = String(m).padStart(2,'0');
            document.getElementById('cdS').textContent = String(s).padStart(2,'0');
        }
        tick();
        setInterval(tick, 1000);
    }

    // ===== Typewriter =====
    function initTypewriter() {
        var el = document.getElementById('tw');
        if (!el) return;
        function getText() {
            return (window.I18N && window.I18N.t) ? window.I18N.t('hero.slogan') : '«Докажи что ты лучший»';
        }
        var text = getText();
        var idx = 0;
        var done = false;
        function type() {
            if (idx < text.length) {
                el.innerHTML = text.substring(0, idx + 1) + '<span class="blnk"></span>';
                idx++;
                setTimeout(type, 70 + Math.random() * 40);
            } else {
                el.innerHTML = text + '<span class="blnk"></span>';
                done = true;
            }
        }
        setTimeout(type, 2000);

        // При смене языка — мгновенно показать новый текст без анимации
        document.addEventListener('stx:lang', function() {
            text = getText();
            if (done) {
                el.innerHTML = text + '<span class="blnk"></span>';
            }
        });
    }

    // ===== Parallax =====
    function initParallax() {
        var heroInner = document.querySelector('.hero-inner');
        if (!heroInner) return;
        window.addEventListener('scroll', function() {
            var y = window.scrollY || window.pageYOffset;
            if (y < window.innerHeight) {
                heroInner.style.transform = 'translateY(' + (y * 0.3) + 'px)';
            }
        });
    }

    function init() {
        initCountdown();
        initTypewriter();
        initParallax();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
