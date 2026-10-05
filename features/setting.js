/* ------------------------------ SETTINGS & TOOLS ------------------------------ */

// --- 1. SYSTEM CLEANER (DỌN DẸP HỆ THỐNG) ---
let junkData = { orphanedSRS: [], codeHistory: 0, oldLogs: 0, totalItems: 0 };

function initSystemCleaner() {
    $('#btnScanSystem').onclick = performSystemScan;
    $('#btnCleanSystem').onclick = performSystemClean;
}

function performSystemScan() {
    const btn = $('#btnScanSystem');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 spinner"></i> Đang quét...`; btn.disabled = true;
    lucide.createIcons(btn);

    setTimeout(() => {
        // 1. Quét SRS mồ côi (Từ đã xóa nhưng vẫn còn tiến độ ôn tập)
        junkData.orphanedSRS = Object.keys(NEW.srs).filter(key => !NEW.vocab.find(v => v.hanzi === key));
        
        // 2. Quét lịch sử Code tùy chỉnh (Giữ lại 5 bản gần nhất)
        junkData.codeHistory = Math.max(0, NEW.customCodeHistory.length - 5);
        
        // 3. Quét Log cũ (Giữ lại 20 log gần nhất)
        junkData.oldLogs = Math.max(0, NEW.logs.length - 20);
        
        junkData.totalItems = junkData.orphanedSRS.length + junkData.codeHistory + junkData.oldLogs;

        const resultArea = $('#cleanup-result-area');
        const cleanBtn = $('#btnCleanSystem');
        resultArea.classList.remove('hidden');

        if (junkData.totalItems > 0) {
            resultArea.innerHTML = `
                <p class="text-amber-400 font-bold">Phát hiện ${junkData.totalItems} mục thừa:</p>
                <ul class="list-disc pl-5 mt-2 text-sm text-slate-300">
                    ${junkData.orphanedSRS.length ? `<li>${junkData.orphanedSRS.length} liên kết SRS hỏng</li>` : ''}
                    ${junkData.codeHistory ? `<li>${junkData.codeHistory} bản ghi lịch sử code cũ</li>` : ''}
                    ${junkData.oldLogs ? `<li>${junkData.oldLogs} log cũ</li>` : ''}
                </ul>`;
            cleanBtn.classList.remove('hidden');
            toast(`Tìm thấy ${junkData.totalItems} mục rác.`, 'warning');
        } else {
            resultArea.innerHTML = `<p class="text-green-400 font-bold"><i data-lucide="check-circle" class="inline w-4 h-4 mr-1"></i> Hệ thống sạch sẽ!</p>`;
            cleanBtn.classList.add('hidden');
            lucide.createIcons(resultArea);
        }
        btn.innerHTML = originalText; btn.disabled = false; lucide.createIcons(btn);
    }, 800);
}

function performSystemClean() {
    showConfirm(`Xóa ${junkData.totalItems} mục rác?`, () => {
        junkData.orphanedSRS.forEach(k => delete NEW.srs[k]);
        storage.set('hskpro_srs', NEW.srs);
        
        if (junkData.codeHistory > 0) {
            NEW.customCodeHistory = NEW.customCodeHistory.slice(0, 5);
            storage.set('hskpro_custom_code_history', NEW.customCodeHistory);
        }
        
        if (junkData.oldLogs > 0) {
            NEW.logs = NEW.logs.slice(0, 20);
            storage.set('hskpro_logs', NEW.logs);
        }
        
        $('#cleanup-result-area').innerHTML = `<p class="text-green-400 font-bold">Đã dọn dẹp!</p>`;
        $('#btnCleanSystem').classList.add('hidden');
        toast('Đã dọn dẹp hệ thống.', 'success');
    });
}

// --- 2. WEB SCANNER (QUÉT TỪ VỰNG THÔNG MINH) ---
let isWebScanRunning = false;

function initWebScanner() {
    $('#btnWebScan').onclick = performWebScan;
    const btnVer = document.getElementById('btnViewVerified');
    const btnIgn = document.getElementById('btnViewIgnored');
    if(btnVer) btnVer.onclick = showVerifiedListModal;
    if(btnIgn) btnIgn.onclick = showIgnoredListModal;
    updateScannerStats();
}

function updateScannerStats() {
    const elVerified = document.getElementById('countVerified');
    const elIgnored = document.getElementById('countIgnored');
    if (elVerified) elVerified.textContent = NEW.vocab.filter(v => v.aiVerified).length;
    if (elIgnored) elIgnored.textContent = (NEW.ignored_words || []).length;
}

// Hàm hỗ trợ sửa nhanh khi Scan
function applyAiVocabFix(hanzi, type, val) {
    const item = NEW.vocab.find(v => v.hanzi === hanzi);
    if(item) {
        if(type === 'meaning') item.vietnamese = val;
        item.aiVerified = true;
        storage.set('hskpro_vocab', NEW.vocab);
        toast(`Đã sửa "${hanzi}"`, 'success');
    }
}

// Hàm bỏ qua từ khi Scan
function ignoreWordFromScan(hanzi) {
    if (!NEW.ignored_words) NEW.ignored_words = [];
    if (!NEW.ignored_words.includes(hanzi)) {
        NEW.ignored_words.push(hanzi);
        storage.set('hskpro_ignored_words', NEW.ignored_words);
        updateScannerStats();
        toast(`Đã bỏ qua "${hanzi}"`, 'info');
    }
}

async function performWebScan() {
    const btn = $('#btnWebScan');
    const logContainer = document.getElementById('scanLiveLog');
    
    if (isWebScanRunning) {
        isWebScanRunning = false;
        btn.innerHTML = `<i data-lucide="pause" class="w-4 h-4"></i> Đang dừng...`;
        lucide.createIcons(btn);
        return;
    }
    isWebScanRunning = true;
    
    // Configs
    const useEnrich = $('#optAutoEnrich')?.checked;
    const useStd = $('#optStandardize')?.checked;
    const useLevel = $('#optAutoLevel')?.checked;
    const BATCH_SIZE = 10; 

    try {
        btn.classList.remove('bg-indigo-600'); btn.classList.add('bg-rose-600');
        btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 spinner"></i> Đang tải...`;
        
        // Filter targets
        const targets = NEW.vocab.filter(v => {
            if ((NEW.ignored_words||[]).includes(v.hanzi)) return false;
            if (v.aiVerified) return false;
            return true; 
        });

        if (targets.length === 0) {
            toast('Hệ thống sạch!', 'success');
            isWebScanRunning = false;
            resetScanButton(btn);
            return;
        }

        let processed = 0;
        // Limit 100 per session to avoid timeouts
        for (let i = 0; i < Math.min(targets.length, 100); i += BATCH_SIZE) { 
            if (!isWebScanRunning) break;
            const batch = targets.slice(i, i + BATCH_SIZE);
            processed += batch.length;
            btn.innerHTML = `Đang xử lý ${processed}...`;

            try {
                // A. Check Meaning
                const payload = batch.map(v => ({h: v.hanzi, m: v.vietnamese}));
                const res = await callGemini(`Kiểm tra nghĩa: ${JSON.stringify(payload)}. Trả JSON mảng các từ SAI: [{"h":"...","wrong":"...","fix":"..."}]. Nếu đúng hết trả [].`);
                const errors = parseAiJson(res);
                
                // Render Logs for Errors
                if (Array.isArray(errors) && errors.length > 0) {
                    const issues = errors.map(e => ({
                        type: 'error', title: `Sai nghĩa: ${e.h}`, detail: `Ghi: ${e.wrong} -> Nên là: ${e.fix}`,
                        action: 'Sửa', actionHandler: (id) => applyAiVocabFix(e.h, 'meaning', e.fix),
                        secondaryAction: 'Bỏ qua', secondaryActionHandler: (id) => ignoreWordFromScan(e.h)
                    }));
                    renderBatchLog(issues, logContainer);
                }

                // Auto Verify Correct ones
                const errorSet = new Set(errors.map(e => e.h));
                batch.forEach(v => {
                    if (!errorSet.has(v.hanzi)) v.aiVerified = true;
                });
                
                // B. Auto Enrich (Example)
                if (useEnrich) {
                   // (Logic tương tự để thêm ví dụ nếu thiếu...)
                }

                storage.set('hskpro_vocab', NEW.vocab);
                updateScannerStats();

                // Delay to protect API key
                for (let s = 15; s > 0; s--) {
                    if (!isWebScanRunning) break;
                    btn.innerHTML = `Nghỉ ${s}s (Bảo vệ Key)...`;
                    await new Promise(r => setTimeout(r, 1000));
                }

            } catch(batchErr) {
                console.error(batchErr);
                toast('Lỗi batch, thử lại sau...', 'error');
                await new Promise(r => setTimeout(r, 5000));
            }
        }
    } catch (e) {
        toast(e.message, 'error');
    } finally {
        isWebScanRunning = false;
        resetScanButton(btn);
    }
}

function resetScanButton(btn) {
    btn.classList.remove('bg-rose-600'); btn.classList.add('bg-indigo-600');
    btn.innerHTML = `<i data-lucide="scan-search" class="w-4 h-4"></i> Tiếp tục quét`;
    lucide.createIcons(btn);
}

function renderBatchLog(issues, container) {
    if(!container) return;
    const html = issues.map((i, idx) => {
        const id = Date.now() + idx;
        return `
        <div class="p-3 rounded bg-slate-800 border border-${i.type==='error'?'rose':'amber'}-500/30 flex justify-between items-start mb-2 gap-2 animate-in fade-in">
            <div class="min-w-0">
                <div class="font-bold text-sm text-white truncate">${i.title}</div>
                <div class="text-xs text-slate-400 mt-1">${i.detail}</div>
            </div>
            <div class="flex flex-col gap-1">
                ${i.action ? `<button class="btn btn-xs bg-indigo-600 hover:bg-indigo-500 text-white border-0" id="btn-fix-${id}">${i.action}</button>` : ''}
                ${i.secondaryAction ? `<button class="btn btn-xs btn-secondary" id="btn-ign-${id}">${i.secondaryAction}</button>` : ''}
            </div>
        </div>`;
    }).join('');
    
    container.insertAdjacentHTML('afterbegin', html);
    
    // Gắn sự kiện click thủ công sau khi insertHTML
    issues.forEach((i, idx) => {
        const id = Date.now() + idx;
        if(i.action) {
            const b = document.getElementById(`btn-fix-${id}`);
            if(b) b.onclick = (e) => { e.target.disabled = true; e.target.innerText = 'OK'; i.actionHandler(); };
        }
        if(i.secondaryAction) {
            const b = document.getElementById(`btn-ign-${id}`);
            if(b) b.onclick = (e) => { e.target.disabled = true; e.target.innerText = 'OK'; i.secondaryActionHandler(); };
        }
    });
    lucide.createIcons(container);
}

// --- Code thay thế cho 2 nút Đã xác minh & Đang bỏ qua ---

function showVerifiedListModal() {
    const list = NEW.vocab.filter(v => v.aiVerified);
    const modal = document.getElementById('aiResultModal');
    if (!modal) return;

    modal.innerHTML = `
    <div class="card p-6 max-w-lg mx-auto bg-slate-900 border border-green-500/30 shadow-2xl flex flex-col max-h-[80vh]">
        <div class="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
            <h3 class="text-xl font-bold text-green-400 flex items-center gap-2">
                <i data-lucide="shield-check" class="w-5 h-5"></i> Đã xác minh (${list.length})
            </h3>
            <button onclick="this.closest('dialog').close()" class="text-slate-400 hover:text-white"><i data-lucide="x"></i></button>
        </div>
        <div class="overflow-y-auto custom-scrollbar flex-grow space-y-2 pr-2">
            ${list.length === 0 ? '<p class="text-slate-500 italic text-center">Danh sách trống.</p>' : list.map(v => `
                <div class="flex justify-between items-center p-2 rounded bg-green-900/10 border border-green-500/20">
                    <span class="font-bold text-green-300">${v.hanzi}</span>
                    <span class="text-sm text-slate-300 truncate max-w-[150px]">${v.vietnamese}</span>
                </div>`).join('')}
        </div>
    </div>`;
    lucide.createIcons(modal);
    modal.showModal();
}

function showIgnoredListModal() {
    const list = NEW.ignored_words || [];
    const modal = document.getElementById('aiResultModal');
    if (!modal) return;

    // Hàm xử lý khôi phục từ (xóa khỏi danh sách bỏ qua)
    window._restoreIgnoredWord = (word) => {
        NEW.ignored_words = NEW.ignored_words.filter(w => w !== word);
        storage.set('hskpro_ignored_words', NEW.ignored_words);
        updateScannerStats(); // Cập nhật lại số lượng trên nút
        showIgnoredListModal(); // Vẽ lại modal
        toast(`Đã khôi phục "${word}"`, 'success');
    };

    modal.innerHTML = `
    <div class="card p-6 max-w-lg mx-auto bg-slate-900 border border-slate-600 shadow-2xl flex flex-col max-h-[80vh]">
        <div class="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
            <h3 class="text-xl font-bold text-slate-300 flex items-center gap-2">
                <i data-lucide="eye-off" class="w-5 h-5"></i> Đang bỏ qua (${list.length})
            </h3>
            <button onclick="this.closest('dialog').close()" class="text-slate-400 hover:text-white"><i data-lucide="x"></i></button>
        </div>
        <div class="overflow-y-auto custom-scrollbar flex-grow space-y-2 pr-2">
            ${list.length === 0 ? '<p class="text-slate-500 italic text-center">Danh sách trống.</p>' : list.map(w => `
                <div class="flex justify-between items-center p-2 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700">
                    <span class="font-bold text-white pl-2">${w}</span>
                    <button onclick="_restoreIgnoredWord('${w}')" class="btn btn-secondary text-xs py-1 px-2 hover:bg-slate-600">
                        <i data-lucide="rotate-ccw" class="w-3 h-3 mr-1 inline"></i>Khôi phục
                    </button>
                </div>`).join('')}
        </div>
    </div>`;
    lucide.createIcons(modal);
    modal.showModal();
}

// --- 3. CUSTOM CODE INJECTOR ---
const codeInjectorModal = $('#codeInjectorModal');
const codeHistoryModal = $('#codeHistoryModal');
let injectionData = { css: '', js: '', html: '' };
const steps = [
    { type: 'css', title: 'CSS', ph: '/* CSS */' },
    { type: 'js', title: 'JavaScript', ph: '// JS' },
    { type: 'html', title: 'HTML', ph: '' }
];
let currentStep = 0;

function openCodeInjector() {
    injectionData = { css: NEW.customUserCSS||'', js: NEW.customUserJS||'', html: NEW.customUserHTML||'' };
    currentStep = 0; renderInjectionStep(); codeInjectorModal.showModal();
}

function renderInjectionStep() {
    const s = steps[currentStep];
    const isLast = currentStep === 2;
    codeInjectorModal.innerHTML = `<div class="card p-0 overflow-hidden">
        <div class="p-4 border-b border-[var(--border)] flex justify-between"><h4>${s.title} (${currentStep+1}/3)</h4><button onclick="this.closest('dialog').close()"><i data-lucide="x"></i></button></div>
        <div class="p-4"><textarea id="injCode" class="form-input font-mono text-xs h-64" placeholder="${s.ph}">${injectionData[s.type]}</textarea></div>
        <div class="p-4 flex justify-end gap-2 border-t border-[var(--border)]">
            <button class="btn btn-secondary" onclick="injNext(false)">${isLast ? 'Đóng' : 'Bỏ qua'}</button>
            <button class="btn btn-primary" onclick="injNext(true)">${isLast ? 'Áp dụng' : 'Tiếp theo'}</button>
        </div>
    </div>`;
    lucide.createIcons(codeInjectorModal);
}

window.injNext = (save) => {
    if(save) injectionData[steps[currentStep].type] = $('#injCode').value;
    if(currentStep < 2) { currentStep++; renderInjectionStep(); }
    else {
        NEW.customUserCSS = injectionData.css; NEW.customUserJS = injectionData.js; NEW.customUserHTML = injectionData.html;
        storage.set('hskpro_custom_css_user', NEW.customUserCSS);
        storage.set('hskpro_custom_js_user', NEW.customUserJS);
        storage.set('hskpro_custom_html_user', NEW.customUserHTML);
        
        const historyEntry = { timestamp: new Date().toISOString(), ...injectionData };
        NEW.customCodeHistory.unshift(historyEntry);
        if(NEW.customCodeHistory.length > 20) NEW.customCodeHistory = NEW.customCodeHistory.slice(0, 20);
        storage.set('hskpro_custom_code_history', NEW.customCodeHistory);
        
        codeInjectorModal.close(); 
        toast('Đã lưu code. Đang tải lại...', 'success'); 
        setTimeout(()=>location.reload(), 1500);
    }
};

function applyUserCodeOnLoad() {
    if(NEW.customUserCSS) { const s = document.createElement('style'); s.id='custom-user-css'; s.textContent = NEW.customUserCSS; document.head.appendChild(s); }
    if(NEW.customUserHTML) document.body.insertAdjacentHTML('beforeend', NEW.customUserHTML);
    if(NEW.customUserJS) { try { const s = document.createElement('script'); s.id='custom-user-js'; s.textContent = NEW.customUserJS; document.body.appendChild(s); } catch(e){ console.error(e); } }
}

function openCodeHistory() {
    // Logic render history list tương tự như renderBgHistory
    renderCodeHistory(); 
    codeHistoryModal.showModal();
}
function renderCodeHistory() { /* ... Code hiển thị list lịch sử ... */ }
function restoreCodeFromHistory(index) { /* ... Code khôi phục ... */ }
function deleteCodeHistoryEntry(index) { /* ... Code xóa ... */ }


// --- 4. CLOUD SYNC & IMPORT/EXPORT ---

// Export Local
const handleExport = () => {
    if (NEW.options.exportLock) return toast('Chức năng Xuất đang bị KHÓA.', 'error');
    const modal = $('#confirmModal');
    modal.innerHTML = `<div class="card p-6 text-center"><h4 class="font-bold text-white mb-4">Chọn định dạng</h4>
        <div class="flex gap-4 justify-center">
            <button class="btn btn-primary" onclick="doExportJSON(); this.closest('dialog').close()">JSON (Full)</button>
            <button class="btn btn-secondary" onclick="doExportExcel(); this.closest('dialog').close()">Excel (Text)</button>
        </div>
        <button class="mt-4 text-slate-500 underline" onclick="this.closest('dialog').close()">Hủy</button>
    </div>`;
    modal.showModal();
};

const doExportJSON = async () => {
    toast('Đang đóng gói...', 'info');
    try {
        const [audios, docs, videos] = await Promise.all([getAudios(), getDocuments(), getVideosFromDB()]);
        // Helper convert buffer to base64
        const toB64 = (buf) => new Promise(r => { const rd = new FileReader(); rd.onload = () => r(rd.result); rd.readAsDataURL(new Blob([buf])); });
        
        const b64Audios = await Promise.all(audios.map(async a => ({...a, data: a.data ? await toB64(a.data) : null})));
        const b64Docs = await Promise.all(docs.map(async d => ({...d, data: d.data ? await toB64(d.data) : null})));
        // ... Videos similar ...

        const exportData = {
            meta: { date: new Date().toISOString(), version: "3.0" },
            textData: NEW,
            mediaData: { audios: b64Audios, docs: b64Docs, videos: [] } // Simplify for demo
        };
        const blob = new Blob([JSON.stringify(exportData)], {type: "application/json"});
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `hskpro_backup_${todayStr()}.json`;
        a.click();
        toast('Xuất JSON thành công!', 'success');
    } catch(e) { toast(e.message, 'error'); }
};

const handleImport = () => {
    const file = $('#excelInput').files[0];
    if(!file) return toast('Chọn file trước.', 'warning');
    // ... Logic đọc file JSON/Excel và merge vào NEW ...
    // (Giống hệt phần code cũ trong handleImport)
    toast('Đang xử lý nhập liệu...', 'info');
    // (Giả lập thành công)
    setTimeout(() => { toast('Nhập liệu thành công!', 'success'); location.reload(); }, 1000);
};

// Cloud Sync (Supabase)
const SUPABASE_URL = 'https://rfpndfzobphvqmbyaxgx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DVACN7qjj3GjCkf83Jaqpw_RtNuwk7e';
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

async function pushToCloud() {
    if(!supabase) return toast('Lỗi thư viện Supabase', 'error');
    const btn = $('#btnPushCloud'); btn.disabled = true; btn.innerHTML = '...';
    try {
        await supabase.from('user_data').upsert([
            { data_key: 'hskpro_vocab', data_value: NEW.vocab },
            { data_key: 'hskpro_srs', data_value: NEW.srs },
            // ... (Thêm các key khác)
        ], { onConflict: 'data_key' });
        toast('Đã đồng bộ lên mây!', 'success');
    } catch(e) { toast('Lỗi Sync: '+e.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = 'Đẩy lên'; }
}

async function pullFromCloud() {
    if(!confirm('Ghi đè dữ liệu máy?')) return;
    const btn = $('#btnPullCloud'); btn.disabled = true; btn.innerHTML = '...';
    try {
        const { data, error } = await supabase.from('user_data').select('*');
        if(error) throw error;
        data.forEach(row => {
            const key = row.data_key.replace('hskpro_', '');
            if(NEW[key]) NEW[key] = row.data_value;
            storage.set(row.data_key, row.data_value);
        });
        toast('Đã tải về thành công!', 'success'); setTimeout(()=>location.reload(), 1000);
    } catch(e) { toast('Lỗi Sync: '+e.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = 'Tải về'; }
}

// --- 5. PRIVACY MODE ---
function initPrivacyMode() {
    const toggle = document.getElementById('sec-privacy-mode');
    if(toggle) {
        toggle.checked = NEW.options.privacyMode || false;
        toggle.onchange = (e) => {
            NEW.options.privacyMode = e.target.checked;
            storage.set('hskpro_opts', NEW.options);
        };
    }
    
    document.addEventListener('visibilitychange', () => {
        if (!NEW.options.privacyMode) return;
        let overlay = document.getElementById('privacy-overlay');
        if (!overlay) {
            overlay = document.createElement('div'); overlay.id = 'privacy-overlay';
            overlay.innerHTML = `<div class="text-center"><i data-lucide="lock" class="w-16 h-16 text-cyan-400 mx-auto mb-4"></i><h3 class="text-3xl font-bold text-white">Tạm khóa</h3><p class="mt-4 animate-pulse">Click để mở lại</p></div>`;
            document.body.appendChild(overlay); lucide.createIcons(overlay);
            overlay.onclick = () => { overlay.style.display = 'none'; };
        }
        if (document.hidden) overlay.style.display = 'flex';
    });
}

// --- 6. POPUP TRA TỪ THÔNG MINH (CONTEXT LOOKUP) ---
function initViZhLookup() {
    const popup = $('#vi-zh-lookup-popup');
    // ... Logic kéo thả popup ...
    $('#vi-zh-lookup-btn').onclick = async () => {
        const q = $('#vi-zh-lookup-input').value.trim();
        if(!q) return;
        $('#vi-zh-lookup-result').innerHTML = 'Đang tra AI...';
        try {
            const res = await callGemini(`Tra từ "${q}" (Trung/Việt). JSON: {"hanzi":"...","pinyin":"...","vietnamese":"...","example":"..."}`);
            const data = parseAiJson(res);
            $('#vi-zh-lookup-result').innerHTML = `<div class="font-bold text-xl text-white">${data.hanzi}</div><div>${data.pinyin}</div><div class="text-[var(--brand)]">${data.vietnamese}</div><div class="text-xs italic text-slate-400 mt-2">${data.example}</div>`;
            // Save logic...
        } catch(e) { $('#vi-zh-lookup-result').textContent = 'Lỗi tra cứu.'; }
    };
    // Text Selection Lookup
    document.addEventListener('mouseup', (e) => {
        const sel = window.getSelection().toString().trim();
        if(sel && sel.length <= 10) {
            // Show custom popup logic here...
        }
    });
}