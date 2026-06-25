/* ===== HERO: particles canvas, countdown, typewriter ===== */
(function() {
    'use strict';

    // ===== Particles =====
    function initParticles() {
        var canvas = document.getElementById('bg');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        var particles = [];
        var particleCount = 100;
        var maxDist = 150;
        var mouse = { x: null, y: null };

        function resize() {
            canvas.width = canvas.parentElement.offsetWidth || window.innerWidth;
            canvas.height = canvas.parentElement.offsetHeight || window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        canvas.addEventListener('mousemove', function(e) {
            var rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });
        canvas.addEventListener('mouseleave', function() { mouse.x = null; mouse.y = null; });

        function Particle() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.vx = (Math.random() - 0.5) * 0.8;
            this.vy = (Math.random() - 0.5) * 0.8;
            this.opacity = Math.random() * 0.5 + 0.2;
        }
        Particle.prototype.update = function() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
            if (this.y < 0) this.y = canvas.height;
            if (this.y > canvas.height) this.y = 0;
            if (mouse.x !== null && mouse.y !== null) {
                var dx = this.x - mouse.x;
                var dy = this.y - mouse.y;
                var dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 100) {
                    var force = (100 - dist) / 100;
                    this.x += (dx / dist) * force * 2;
                    this.y += (dy / dist) * force * 2;
                }
            }
        };
        Particle.prototype.draw = function() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(168, 85, 247, ' + this.opacity + ')';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(124, 58, 237, ' + (this.opacity * 0.1) + ')';
            ctx.fill();
        };
        for (var i = 0; i < particleCount; i++) particles.push(new Particle());

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (var i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
            }
            for (var i = 0; i < particles.length; i++) {
                for (var j = i + 1; j < particles.length; j++) {
                    var dx = particles[i].x - particles[j].x;
                    var dy = particles[i].y - particles[j].y;
                    var dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist < maxDist) {
                        var alpha = 0.15 * (1 - dist / maxDist);
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = 'rgba(124, 58, 237, ' + alpha + ')';
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
                if (mouse.x !== null && mouse.y !== null) {
                    var dx2 = particles[i].x - mouse.x;
                    var dy2 = particles[i].y - mouse.y;
                    var dist2 = Math.sqrt(dx2*dx2 + dy2*dy2);
                    if (dist2 < 200) {
                        var alpha2 = 0.3 * (1 - dist2 / 200);
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.strokeStyle = 'rgba(168, 85, 247, ' + alpha2 + ')';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animate);
        }
        animate();
    }

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
        var text = '«Докажи что ты лучший»';
        var idx = 0;
        function type() {
            if (idx < text.length) {
                el.innerHTML = text.substring(0, idx + 1) + '<span class="blnk"></span>';
                idx++;
                setTimeout(type, 70 + Math.random() * 40);
            } else {
                el.innerHTML = text + '<span class="blnk"></span>';
            }
        }
        setTimeout(type, 2000);
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
        initParticles();
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
