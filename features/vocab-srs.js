/* ------------------------------ Vocab & SRS ------------------------------ */
function cardHTML(x) {
    const s = NEW.srs[x.hanzi] || { box: 1, mastered: false };
    const imgHTML = x.image ? `<img src="${x.image}" class="vocab-image ml-3 bg-slate-800" loading="lazy">` : '';
    return `<div class="card p-4 flex flex-col h-full" data-hanzi="${MiniFirewall.sanitize(x.hanzi)}">
        <div class="flex-grow">
            <div class="flex justify-between">
                <div>
                    <div class="text-2xl font-bold text-white cursor-pointer" data-zoom-target="true">${x.hanzi}</div>
                    <div class="text-sm text-slate-400">${x.pinyin}</div>
                </div>
                ${imgHTML}
            </div>
            <div class="mt-2 text-slate-300">${x.vietnamese}</div>
            <div class="mt-2 chip hsk-${x.hskLevel} text-xs">HSK ${x.hskLevel}</div>
        </div>
        <div class="mt-4 flex justify-between text-xs text-slate-500">
            <span>Box: ${s.box}</span>
            <div class="flex gap-2">
                <button class="btn btn-secondary p-2" data-act="speak"><i data-lucide="volume-2"></i></button>
                <button class="btn btn-secondary p-2" data-act="edit"><i data-lucide="edit"></i></button>
            </div>
        </div>
    </div>`;
}

function renderVocab() {
    renderVocabStats();
    const grid = $('#vocabGrid');
    const hskFilter = $('#filterHSK').value;
    const qRaw = $('#searchV').value.trim().toLowerCase();
    const qClean = removeTones(qRaw);
    let html = '';

    for (let level = 1; level <= 6; level++) {
        const itemsInLevel = NEW.vocab.filter(v => String(v.hskLevel) === String(level));
        const items = itemsInLevel.filter(v => {
            if (!qClean) return true;
            return v.hanzi.includes(qRaw) || removeTones(v.pinyin).includes(qClean) || removeTones(v.vietnamese).includes(qClean);
        });
        if (items.length === 0 && qClean && hskFilter !== 'all') continue;
        
        const isOpen = (hskFilter === String(level)) || (qClean && items.length > 0);
        html += `<details class="card p-0 mb-5" ${isOpen ? 'open' : ''}><summary class="p-4 cursor-pointer font-bold text-white">HSK ${level} (${items.length})</summary><div class="p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">${items.map(cardHTML).join('')}</div></details>`;
    }
    grid.innerHTML = html;
    lucide.createIcons(grid);
}

function renderVocabStats() {
    $('#statV_total').textContent = NEW.vocab.length;
    $('#statV_mastered').textContent = Object.values(NEW.srs).filter(s => s.mastered).length;
}

// SRS Logic
let srsQueue = [], srsIdx = 0, cur = null;
const boxIntervals = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 };

function buildSRSQueue() {
    const today = todayStr();
    const due = NEW.vocab.filter(v => (NEW.srs[v.hanzi]?.next || today) <= today);
    if (due.length === 0) { $('#srsEmpty').classList.remove('hidden'); $('#srsWrap').classList.add('hidden'); return; }
    $('#srsEmpty').classList.add('hidden'); $('#srsWrap').classList.remove('hidden');
    startSRS(shuffle(due));
}

function startSRS(list) { srsQueue = list; srsIdx = 0; showCard(); }
function showCard() {
    if (srsIdx >= srsQueue.length) { toast('Hoàn thành ôn tập!', 'success'); buildSRSQueue(); return; }
    cur = srsQueue[srsIdx];
    $('#srsHanzi').textContent = cur.hanzi;
    $('#srsPinyin').textContent = NEW.options.showPinyin ? cur.pinyin : '';
    $('#srsCardBack').classList.add('hidden');
    $('#srsShowAnswerBtn').classList.remove('hidden');
    if(NEW.options.autoTTS) speak(cur.hanzi);
}
function rate(v) {
    const s = NEW.srs[cur.hanzi];
    if (v === 'hard') s.box = Math.max(1, s.box - 1);
    else s.box = Math.min(5, s.box + (v === 'easy' ? 2 : 1));
    const next = new Date(); next.setDate(next.getDate() + boxIntervals[s.box]);
    s.next = next.toISOString().slice(0, 10);
    storage.set('hskpro_srs', NEW.srs);
    srsIdx++; showCard();
}