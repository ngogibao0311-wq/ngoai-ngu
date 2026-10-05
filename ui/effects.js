/* --- UI Effects & Animation --- */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let width, height;
let particles = { dark: { stars: [], bubbles: [] }, light: { petals: [], orbs: [] } };
let activeTheme = 'dark';
let animationFrameId;
let specialParticles = [];

// Particle Classes
class NatureParticle {
    constructor(type) {
        this.type = type; this.x = Math.random() * width; this.y = Math.random() * height;
        this.size = Math.random() * 5 + 3; this.speedX = Math.random() * 1.5 - 0.5; this.speedY = Math.random() * 1 + 0.5;
        this.rotation = Math.random() * 6.28; this.color = type === 'sakura' ? 'pink' : (type === 'autumn' ? 'orange' : 'green');
    }
    update() { this.x += this.speedX; this.y += this.speedY; if (this.y > height) this.y = -10; }
    draw() { ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, this.size, this.size); } // Simplified draw
}
class Star { constructor() { this.x = Math.random() * width; this.y = Math.random() * height; this.r = Math.random() * 1.2; this.a = Math.random(); } update() { this.a += 0.01; } draw() { ctx.fillStyle = `rgba(255,255,255,${Math.abs(Math.sin(this.a))})`; ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, 6.28); ctx.fill(); } }
class Bubble { constructor() { this.x = Math.random() * width; this.y = Math.random() * height; this.r = Math.random() * 5 + 2; this.s = Math.random() + 0.5; } update() { this.y -= this.s; if (this.y < -10) this.y = height + 10; } draw() { ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, 6.28); ctx.stroke(); } }

function initCanvas() {
    if (!canvas) return;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight;
    particles.dark.stars = []; particles.dark.bubbles = []; specialParticles = [];

    if (['dark', 'deep-ocean', 'cyber-neon'].includes(activeTheme)) for (let i = 0; i < 100; i++) particles.dark.stars.push(new Star());
    if (['ocean-sky', 'deep-ocean'].includes(activeTheme)) for (let i = 0; i < 20; i++) particles.dark.bubbles.push(new Bubble());
    if (activeTheme === 'sakura-spring') for (let i = 0; i < 40; i++) specialParticles.push(new NatureParticle('sakura'));
    
    animate();
}

function animate() {
    if (!canvas) return;
    ctx.clearRect(0, 0, width, height);
    [...particles.dark.stars, ...particles.dark.bubbles, ...specialParticles].forEach(p => { p.update(); p.draw(); });
    animationFrameId = requestAnimationFrame(animate);
}

window.addEventListener('resize', () => { clearTimeout(window.resizeTimeout); window.resizeTimeout = setTimeout(initCanvas, 200); });

function createGlobalSnowflakes() {
    let container = document.createElement('div'); container.id = 'global-snow-container'; document.body.appendChild(container);
    for (let i = 0; i < 25; i++) {
        let flake = document.createElement('span'); flake.className = 'global-snow-flake'; flake.textContent = '❄️';
        flake.style.left = `${Math.random() * 100}vw`; flake.style.animationDelay = `${Math.random() * -20}s`;
        flake.style.animationDuration = `${10 + Math.random() * 10}s`;
        container.appendChild(flake);
    }
}

// Background Controls
function updateBgControlValues(settings) {
    if (!$('#bgSet-posX')) return;
    $('#bgSet-posX').value = settings.posX; $('#bgSet-posY').value = settings.posY;
    $('#bgSet-opacity').value = settings.opacity;
    // ... update other UI inputs
}
function applyBgSettings(settings) {
    const bg = $('#bg-image-container'); const vid = $('#bg-video-container');
    const filter = `opacity(${settings.opacity}%) brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturate}%) hue-rotate(${settings.hue}deg)`;
    bg.style.filter = filter; vid.style.filter = filter;
    bg.style.backgroundPosition = `${settings.posX}% ${settings.posY}%`;
    bg.style.backgroundSize = settings.size;
}
/* --- MOUSE TRAIL EFFECT (Hiệu ứng vệt sao theo chuột) --- */
(function() {
    const colors = ["#0ea5e9", "#22d3ee", "#818cf8"]; // Màu xanh dương/tím hiện đại
    
    document.addEventListener("mousemove", function(e) {
        // Giới hạn số lượng hạt để không lag
        if (Math.random() > 0.3) return; 

        const star = document.createElement("div");
        star.classList.add("star-trail");
        
        // Random vị trí quanh trỏ chuột
        const x = e.clientX + (Math.random() * 10 - 5);
        const y = e.clientY + (Math.random() * 10 - 5);
        
        star.style.left = `${x}px`;
        star.style.top = `${y}px`;
        
        // Random màu & kích thước
        const size = Math.random() * 4 + 2; // 2px - 6px
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        // CSS Style trực tiếp
        star.style.position = "fixed";
        star.style.borderRadius = "50%";
        star.style.pointerEvents = "none";
        star.style.zIndex = "9999";
        star.style.boxShadow = `0 0 ${size * 2}px ${star.style.background}`;
        star.style.transition = "transform 0.8s ease-out, opacity 0.8s ease-out";
        star.style.opacity = "0.8";

        document.body.appendChild(star);

        // Animation bay đi & biến mất
        setTimeout(() => {
            star.style.transform = `translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 + 20}px) scale(0)`;
            star.style.opacity = "0";
        }, 50);

        // Xóa khỏi DOM
        setTimeout(() => {
            star.remove();
        }, 850);
    });
})();

