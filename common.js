/* ===== Аккордеон для страниц rules.html и faq.html ===== */
(function() {
    function init() {
        document.querySelectorAll('.acc-head').forEach(function(head) {
            head.addEventListener('click', function(e) {
                e.preventDefault();
                var item = head.parentElement;
                if (!item) return;
                var wasOpen = item.classList.contains('open');
                var acc = item.parentElement;
                if (acc) acc.querySelectorAll('.acc-item').forEach(function(i) { i.classList.remove('open'); });
                if (!wasOpen) item.classList.add('open');
            });
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
