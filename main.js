/* ------------------------------ Main & Router & Init ------------------------------ */

// 1. Router Definitions
const views = {
    dashboard: $('#view-dashboard'),
    learn: $('#view-learn'),
    review: $('#view-review'),
    quiz: $('#view-quiz'),
    reading: $('#view-reading'),
    speaking: $('#view-speaking'),
    dialogue: $('#view-dialogue'),
    stats: $('#view-stats'),
    settings: $('#view-settings'),
    resources: $('#view-resources'),
    writing: $('#view-writing'),
    listening: $('#view-listening')
};

let currentView = null;

// 2. Navigation Function
function show(view) {
    if (currentView && views[currentView]) views[currentView].classList.add('hidden');
    if (!views[view]) return console.error("View not found:", view);

    views[view].classList.remove('hidden');
    currentView = view;

    // Update Sidebar & Header UI
    $$('.sidebar .nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.goto === view);
    });
    $$('header nav button[data-goto], #mobileNav button[data-goto]').forEach(btn => {
        const active = btn.dataset.goto === view;
        btn.classList.toggle('bg-[var(--brand)]', active);
        btn.classList.toggle('text-white', active);
        btn.classList.toggle('text-slate-300', !active);
    });

    // Mobile Sidebar Auto-close
    if (window.innerWidth <= 768) {
        $('#appSidebar')?.classList.remove('open');
        $('#mobileNav')?.classList.add('hidden');
    }

    // Lazy Init per View
    const inits = {
        dashboard: updateDashboardData,
        review: buildSRSQueue,
        stats: renderStats,
        learn: renderVocab,
        reading: initReadingMode,
        speaking: initSpeakingView,
        dialogue: renderDialogues,
        resources: initResourcesView,
        writing: initWritingView,
        listening: initListeningView,
        settings: initSettingsView
    };
    inits[view]?.();
}

// 3. Dashboard Data Update
function updateDashboardData() {
    const today = todayStr();
    const dueCount = NEW.vocab ? NEW.vocab.filter(v => (NEW.srs[v.hanzi]?.next || today) <= today).length : 0;
    
    const elDashDue = $('#dashDue'); if (elDashDue) elDashDue.textContent = dueCount;
    const elDashTotal = $('#dashTotal'); if (elDashTotal) elDashTotal.textContent = NEW.vocab.length;
    const elDashStreak = $('#dashStreak'); if (elDashStreak) elDashStreak.textContent = NEW.streak.count;

    const sidebarBadge = $('#sidebarDueCount');
    if (sidebarBadge) {
        sidebarBadge.textContent = dueCount;
        sidebarBadge.classList.toggle('hidden', dueCount === 0);
    }
}

// 4. Global Event Listeners
$$('[data-goto]').forEach(b => b.addEventListener('click', () => show(b.dataset.goto)));
$('#mobileMenu').addEventListener('click', () => $('#mobileNav').classList.toggle('hidden'));
$('#sidebarToggle')?.addEventListener('click', () => $('#appSidebar').classList.toggle('open'));

// Background Upload Listener
$('#bgUpload')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) return toast('File quá lớn (>50MB).', 'error');
    toast('Đang xử lý hình nền...', 'info');
    try {
        const id = await saveCustomBg(file);
        const item = await getCustomBg(id);
        applyCustomBackground(item);
        storage.set('hskpro_active_custom_bg_id', id);
        storage.del('hskpro_bg'); // Remove default theme bg
        renderBgHistory(); // Update settings list
        toast('Đã áp dụng hình nền!', 'success');
    } catch(err) { toast(err.message, 'error'); }
});

// Privacy Mode Listener (Visibility API)
document.addEventListener('visibilitychange', () => {
    if (!NEW.options.privacyMode) return;
    const overlay = document.getElementById('privacy-overlay');
    if (document.hidden) {
        overlay.style.display = 'flex';
        setTimeout(() => { overlay.style.opacity = '1'; overlay.style.backdropFilter = 'blur(20px)'; }, 10);
    } 
    // Unlock logic is in the overlay click handler (init in settings.js)
});

// 5. Main Initialization
function mainInit() {
    console.log("🚀 HSK Pro Starting...");
    loadAppearance(); // Load theme & BG
    applyUserCodeOnLoad(); // Load custom CSS/JS
    
    // Default view
    show('dashboard');
    updateDashboardData();
    checkAllBadges();
    
    // Init Settings UI
    if (typeof checkAndRenderKeyStatus === 'function') checkAndRenderKeyStatus();
    if (typeof updateSystemStatusUI === 'function') updateSystemStatusUI();
    if (typeof initPrivacyMode === 'function') initPrivacyMode();
    if (typeof initSystemCleaner === 'function') initSystemCleaner();
    if (typeof initWebScanner === 'function') initWebScanner();
    if (typeof initViZhLookup === 'function') initViZhLookup();
    
    console.log("✅ Ready.");
}

// 6. Bootstrap
document.addEventListener('DOMContentLoaded', () => {
    isDomReady = true;
    checkAndLaunch(); // Calls mainInit when DB is ready
});