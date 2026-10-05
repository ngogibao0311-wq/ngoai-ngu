/* ------------------------------ Utilities ------------------------------ */
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => Array.from(p.querySelectorAll(s));

const storage = {
    get: (key, def = null) => { try { const val = localStorage.getItem(key); return val ? JSON.parse(val) : def; } catch (e) { return def; } },
    set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { console.error("Storage Error:", e); } },
    del: (key) => localStorage.removeItem(key)
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const shuffle = (arr) => [...arr].sort(() => 0.5 - Math.random());

const toast = (msg, type = 'info') => {
    const el = document.createElement('div');
    const colors = { info: 'bg-slate-800 border-slate-600', success: 'bg-green-800/80 border-green-600', error: 'bg-rose-800/80 border-rose-600', warning: 'bg-amber-800/80 border-amber-600' };
    el.className = `fixed bottom-5 left-1/2 -translate-x-1/2 z-[2147483647] px-4 py-3 rounded-lg text-white text-sm shadow-lg border ${colors[type] || colors.info}`;
    el.style.animation = 'slideUp 0.3s ease-out forwards';
    el.textContent = msg; document.body.appendChild(el);
    setTimeout(() => {
        el.style.animation = 'slideUp 0.3s ease-out reverse forwards';
        el.addEventListener('animationend', () => el.remove());
    }, 3000);
};

// Hàm Ripple Effect
document.addEventListener('click', function (e) {
    const button = e.target.closest('.btn');
    if (button && !button.disabled) {
        const circle = document.createElement("span");
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;
        const existingRipple = button.querySelector(".ripple");
        if (existingRipple) existingRipple.remove();
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${e.clientX - button.getBoundingClientRect().left - radius}px`;
        circle.style.top = `${e.clientY - button.getBoundingClientRect().top - radius}px`;
        circle.classList.add("ripple");
        button.appendChild(circle);
        circle.addEventListener('animationend', () => circle.remove());
    }
});

// PDFJS Worker
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// Helpers
function isYouTubeUrl(url) {
    const p = /^(?:https?:\/\/)?(?:[A-z]+\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w\-]+)(?:&.*)?$/;
    return (url.match(p)) ? RegExp.$1 : false;
}
function getYouTubeEmbedUrl(url) {
    const videoId = isYouTubeUrl(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null;
}
function parseDialogueLinesToString(lines) {
    if (!Array.isArray(lines)) return '';
    return lines.map(l => `${l.zh || ''}|${l.pinyin || ''}|${l.vi || ''}|${l.role || 'A'}`).join('\n');
}
function parseStringToDialogueLines(text) {
    if (typeof text !== 'string' || !text) return [];
    return text.split('\n').map(line => {
        const parts = line.split('|');
        const [zh, pinyin, vi, role] = parts.map(s => s ? s.trim() : '');
        return { zh, pinyin, vi, role: role || 'A' };
    }).filter(l => l.zh);
}
// Chuyển đổi định dạng AI JSON
function parseAiJson(text) {
    if (!text) throw new Error("AI trả về dữ liệu rỗng.");
    let clean = text;
    const jsonMatch = text.match(/```json([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) clean = jsonMatch[1];
    else clean = text.replace(/```/g, '').trim();

    const firstBracket = clean.search(/[\[\{]/);
    const lastBracket = clean.search(/[\]\}][^\]\}]*$/);
    if (firstBracket === -1 || lastBracket === -1) throw new Error("AI không trả về đúng định dạng JSON.");

    clean = clean.substring(firstBracket, lastBracket + 1);
    try { return JSON.parse(clean); }
    catch (e) {
        try { return JSON.parse(clean.replace(/,(\s*[\]}])/g, '$1')); } // Fix trailing comma
        catch (e2) { throw new Error("Dữ liệu AI bị lỗi cú pháp."); }
    }
}

// Modals
function showAiResultModal(title, content) {
    const modal = $('#aiResultModal');
    modal.innerHTML = `<div class="card p-0 overflow-hidden"><div class="p-5 flex items-center justify-between border-b border-[var(--border)]"><h4 class="text-lg font-bold text-white">${title}</h4><button onclick="this.closest('dialog').close()" class="text-slate-400 hover:text-white"><i data-lucide="x"></i></button></div><div class="p-6 max-h-[70vh] overflow-y-auto"><div class="prose prose-invert prose-sm max-w-none content-wrap">${content.replace(/\n/g, '<br>')}</div></div></div>`;
    lucide.createIcons(modal);
    modal.showModal();
}
function showConfirm(question, onConfirm) {
    const modal = $('#confirmModal');
    modal.innerHTML = `<div class="card p-6 text-center"><h4 class="text-lg font-bold text-white mb-4">${question}</h4><div class="flex gap-4 justify-center"><button id="confirm-cancel" class="btn btn-secondary">Hủy</button><button id="confirm-ok" class="btn bg-rose-600 text-white hover:bg-rose-700">Xác nhận</button></div></div>`;
    modal.showModal();
    $('#confirm-ok', modal).onclick = () => { modal.close(); onConfirm(); };
    $('#confirm-cancel', modal).onclick = () => { modal.close(); };
}
