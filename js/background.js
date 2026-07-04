/* ===== STX League MD — Анимированная паутина на фоне всех страниц =====
   - Canvas на весь экран (position: fixed, z-index: 0)
   - Точки медленно летают, между близкими — линии (паутина)
   - При наведении курсора — точки отталкиваются, линии тянутся к курсору
   - Фиолетовые цвета (#a855f7 точки, #7c3aed линии)
   - Оптимизация: FPS throttling, меньше точек на мобильных,
     пауза когда вкладка неактивна, поддержка prefers-reduced-motion
*/
(function() {
    'use strict';

    /* ── Настройки ── */
    var DESKTOP_COUNT    = 110;                   // Количество точек на десктопе
    var MOBILE_COUNT     = 70;                    // Количество точек на мобильных
    var MAX_DIST         = 150;                   // Макс. дистанция для линий между точками (px)
    var SPEED            = 0.55;                  // Скорость движения точек
    var MOUSE_REPEL_R    = 100;                   // Радиус отталкивания от курсора (px)
    var MOUSE_LINE_R     = 220;                   // Радиус линий к курсору (px)
    var DOT_COLOR        = '168, 85, 247';        // rgba для точек (#a855f7)
    var LINE_COLOR       = '124, 58, 237';        // rgba для линий (#7c3aed)
    var DOT_GLOW_ALPHA   = 0.16;                  // Прозрачность свечения точки
    var LINE_MAX_ALPHA   = 0.11;                  // Макс. прозрачность линий между точками
    var MOUSE_LINE_ALPHA = 0.16;                  // Макс. прозрачность линий к курсору
    var FPS_LIMIT        = 60;                    // Лимит FPS
    var FRAME_TIME       = 1000 / FPS_LIMIT;      // Мин. время между кадрами (мс)

    /* ── Проверяем prefers-reduced-motion ── */
    var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    var reduceMotion = motionQuery.matches;
    var isHomePage = window.location.pathname === '/' || window.location.pathname.endsWith('/index.html');

    /* ── Определяем количество точек ── */
    var isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent)
                   || window.innerWidth < 768;
    var particleCount = isMobile ? MOBILE_COUNT : DESKTOP_COUNT;

    /* ── Переменные (объявляем заранее для совместимости) ── */
    var canvas, ctx;
    var particles = [];
    var mouse = { x: null, y: null };
    var lastTime = 0;
    var isRunning = true;
    var animId = null;
    var resizeTimer = null;

    /* ── Конструктор частицы ── */
    function Particle() {
        this.x       = Math.random() * canvas.width;
        this.y       = Math.random() * canvas.height;
        this.size    = Math.random() * 2 + 1.1;
        this.vx      = (Math.random() - 0.5) * SPEED;
        this.vy      = (Math.random() - 0.5) * SPEED;
        this.opacity = Math.random() * 0.2 + 0.1;
        this.wobble  = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 0.008 + Math.random() * 0.015;
    }

    /* Обновление позиции частицы */
    Particle.prototype.update = function() {
        this.wobble += this.wobbleSpeed;
        var driftX = Math.sin(this.wobble) * 0.45;
        var driftY = Math.cos(this.wobble * 1.35) * 0.3;

        this.x += this.vx + driftX;
        this.y += this.vy + driftY;

        /* Перенос через границы экрана */
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;

        /* Отталкивание от курсора */
        if (mouse.x !== null && mouse.y !== null) {
            var dx   = this.x - mouse.x;
            var dy   = this.y - mouse.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MOUSE_REPEL_R && dist > 0) {
                var force = (MOUSE_REPEL_R - dist) / MOUSE_REPEL_R;
                this.x += (dx / dist) * force * 2.2;
                this.y += (dy / dist) * force * 2.2;
            }
        }
    };

    /* Отрисовка частицы */
    Particle.prototype.draw = function() {
        ctx.save();
        ctx.shadowBlur = isHomePage ? 14 : 8;
        ctx.shadowColor = isHomePage ? 'rgba(168, 85, 247, 0.8)' : 'rgba(168, 85, 247, 0.45)';

        /* Точка */
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + DOT_COLOR + ', ' + this.opacity + ')';
        ctx.fill();

        /* Свечение вокруг точки */
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 3.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + LINE_COLOR + ', ' + (this.opacity * DOT_GLOW_ALPHA) + ')';
        ctx.fill();
        ctx.restore();
    };

    /* ── Установка размера canvas ── */
    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function drawConnections() {
        var i, j, dx, dy, dist, alpha;
        for (i = 0; i < particles.length; i++) {
            for (j = i + 1; j < particles.length; j++) {
                dx   = particles[i].x - particles[j].x;
                dy   = particles[i].y - particles[j].y;
                dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MAX_DIST) {
                    alpha = LINE_MAX_ALPHA * (1 - dist / MAX_DIST);
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = 'rgba(' + LINE_COLOR + ', ' + alpha + ')';
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }

            if (mouse.x !== null && mouse.y !== null) {
                dx   = particles[i].x - mouse.x;
                dy   = particles[i].y - mouse.y;
                dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MOUSE_LINE_R) {
                    alpha = MOUSE_LINE_ALPHA * (1 - dist / MOUSE_LINE_R);
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = 'rgba(' + DOT_COLOR + ', ' + alpha + ')';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
    }

    /* ── Основной цикл анимации ── */
    function animate(timestamp) {
        animId = requestAnimationFrame(animate);

        /* Пауза если вкладка неактивна */
        if (!isRunning) return;

        /* FPS throttling — пропускаем кадр если слишком рано */
        if (timestamp - lastTime < FRAME_TIME) return;
        lastTime = timestamp;

        /* Очищаем canvas */
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        /* Обновляем и рисуем все точки */
        var i;
        for (i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }

        drawConnections();
    }

    /* ── Инициализация ── */
    function init() {
        /* Создаём canvas и вставляем ПЕРВЫМ элементом в body */
        canvas = document.createElement('canvas');
        canvas.id = 'bg-web';
        canvas.setAttribute('aria-hidden', 'true');
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;';
        document.body.insertBefore(canvas, document.body.firstChild);

        ctx = canvas.getContext('2d');

        /* Устанавливаем размер */
        resize();

        /* Создаём частицы */
        for (var i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        /* ── Throttled resize ── */
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                resize();
                /* Перемещаем точки, которые оказались за пределами */
                for (var k = 0; k < particles.length; k++) {
                    if (particles[k].x > canvas.width)  particles[k].x = Math.random() * canvas.width;
                    if (particles[k].y > canvas.height) particles[k].y = Math.random() * canvas.height;
                }
            }, 150);
        });

        /* ── Отслеживание мыши ── */
        document.addEventListener('mousemove', function(e) {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });
        document.addEventListener('mouseleave', function() {
            mouse.x = null;
            mouse.y = null;
        });

        /* ── Поддержка тач-устройств ── */
        document.addEventListener('touchmove', function(e) {
            if (e.touches.length > 0) {
                mouse.x = e.touches[0].clientX;
                mouse.y = e.touches[0].clientY;
            }
        }, { passive: true });
        document.addEventListener('touchend', function() {
            mouse.x = null;
            mouse.y = null;
        });

        /* ── Запускаем анимацию ── */
        animId = requestAnimationFrame(animate);

        /* ── Пауза при неактивной вкладке ── */
        document.addEventListener('visibilitychange', function() {
            isRunning = !document.hidden;
        });

        /* ── Слушатель изменения prefers-reduced-motion ── */
        if (typeof motionQuery.addEventListener === 'function') {
            motionQuery.addEventListener('change', onMotionChange);
        } else if (typeof motionQuery.addListener === 'function') {
            /* Старые браузеры (Safari < 14) */
            motionQuery.addListener(onMotionChange);
        }
    }

    /* Обработчик изменения prefers-reduced-motion */
    function onMotionChange() {
        reduceMotion = motionQuery.matches;
        reduceMotion = motionQuery.matches;
        isRunning = true;
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (var i = 0; i < particles.length; i++) {
                particles[i].draw();
            }
            drawConnections();
        }
    }

    /* ── Запуск ── */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
