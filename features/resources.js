/* ------------------------------ RESOURCES ------------------------------ */

// --- 1. GRAMMAR (NGỮ PHÁP) ---
const grammarPracticeState = { currentGrammar: null, currentStage: 0, conversationHistory: [], isLoading: false, currentExplanation: '', maxTurns: 5, conversationTurns: 0 };

function renderGrammar() {
    const list = $('#grammarList');
    const q = $('#searchG').value.trim().toLowerCase();
    const items = NEW.grammar.filter(g => !q || g.title.toLowerCase().includes(q) || g.content.toLowerCase().includes(q));
    list.innerHTML = items.map((g, i) => `
        <div class="card p-4 flex flex-col h-full">
            <div class="flex justify-between items-start"><h4 class="font-bold text-white text-lg">${g.title}</h4><span class="chip hsk-${g.hskLevel}">HSK ${g.hskLevel}</span></div>
            <p class="text-sm text-slate-400 mt-2 line-clamp-3">${g.content}</p>
            <div class="mt-4 grid grid-cols-2 gap-2">
                <button class="btn btn-primary col-span-2 py-1 text-xs" onclick="startPracticeFromSaved(${i})">Luyện tập (AI)</button>
                <button class="btn btn-secondary py-1 text-xs" onclick="openGrammarEdit(${i})">Sửa</button>
                <button class="btn bg-rose-900/50 text-rose-300 py-1 text-xs" onclick="deleteGrammar(${i})">Xóa</button>
            </div>
        </div>
    `).join('');
}

function openGrammarEdit(index) {
    const item = index !== null ? NEW.grammar[index] : null;
    const modal = $('#grammarModal');
    modal.innerHTML = `<form method="dialog" class="p-0"><div class="card p-6 gap-4 grid"><h4 class="font-bold text-white">${item?'Sửa':'Thêm'} Ngữ pháp</h4>
    <input id="gTitle" class="form-input" placeholder="Tiêu đề" value="${item?.title||''}" required>
    <textarea id="gContent" class="form-input" rows="4" placeholder="Nội dung" required>${item?.content||''}</textarea>
    <textarea id="gExample" class="form-input" placeholder="Ví dụ">${item?.example||''}</textarea>
    <input id="gHSK" type="number" class="form-input" placeholder="HSK" value="${item?.hskLevel||3}">
    <button class="btn btn-primary">Lưu</button></div></form>`;
    modal.showModal();
    modal.querySelector('form').onsubmit = () => {
        const data = { title: $('#gTitle', modal).value, content: $('#gContent', modal).value, example: $('#gExample', modal).value, hskLevel: $('#gHSK', modal).value };
        if(index !== null) NEW.grammar[index] = data; else NEW.grammar.push(data);
        storage.set('hskpro_grammar', NEW.grammar); modal.close(); renderGrammar();
    };
}
function deleteGrammar(index) { if(confirm('Xóa?')) { NEW.grammar.splice(index,1); storage.set('hskpro_grammar', NEW.grammar); renderGrammar(); } }

function startPracticeFromSaved(index) {
    const item = NEW.grammar[index];
    grammarPracticeState.currentGrammar = item.title;
    grammarPracticeState.currentStage = 1;
    resetGrammarLearningProcess();
    updateGrammarUI();
}

// AI Grammar Logic
async function handleCheckSentence() {
    const sent = $('#sentence-input').value.trim();
    if(!sent) return;
    grammarPracticeState.isLoading = true; updateGrammarUI();
    try {
        const res = await callGemini(`Ngữ pháp: "${grammarPracticeState.currentGrammar}". Câu của trò: "${sent}". Check đúng sai? Giải thích ngắn gọn.`);
        $('#stage1-feedback').innerHTML = `<div class="p-3 bg-slate-800 rounded">${res}</div>`;
        if(res.toLowerCase().includes('đúng') || res.toLowerCase().includes('chính xác')) $('#next-stage-2-btn').classList.remove('hidden');
    } catch(e) { toast('Lỗi AI', 'error'); }
    finally { grammarPracticeState.isLoading = false; updateGrammarUI(); }
}

async function startStage2() {
    grammarPracticeState.currentStage = 2; updateGrammarUI();
    const res = await callGemini(`Bắt đầu hội thoại tiếng Trung dùng ngữ pháp "${grammarPracticeState.currentGrammar}". Bạn nói câu đầu tiên.`);
    addMessageToChat('AI', res);
}

async function handleSendChatMessage() {
    const msg = $('#chat-input').value.trim();
    if(!msg) return;
    addMessageToChat('User', msg); $('#chat-input').value='';
    grammarPracticeState.conversationTurns++;
    if(grammarPracticeState.conversationTurns >= 5) { $('#next-stage-3-btn').classList.remove('hidden'); return; }
    
    const res = await callGemini(`Hội thoại ngữ pháp "${grammarPracticeState.currentGrammar}". User nói: "${msg}". Trả lời tự nhiên.`);
    addMessageToChat('AI', res);
}

function addMessageToChat(role, text) {
    $('#chat-box').innerHTML += `<div class="mb-2 ${role==='User'?'text-right':'text-left'}"><span class="inline-block p-2 rounded ${role==='User'?'bg-[var(--brand)]':'bg-slate-700'}">${text}</span></div>`;
    $('#chat-box').scrollTop = $('#chat-box').scrollHeight;
}

function updateGrammarUI() {
    const { currentStage, isLoading } = grammarPracticeState;
    $('#grammar-loading-view').classList.toggle('hidden', !isLoading);
    $('#grammar-start-view').classList.toggle('hidden', currentStage !== 0 || isLoading);
    $('#grammar-learning-view').classList.toggle('hidden', currentStage === 0 || isLoading);
    $('#stage-1').classList.toggle('hidden', currentStage !== 1);
    $('#stage-2').classList.toggle('hidden', currentStage !== 2);
    $('#stage-3').classList.toggle('hidden', currentStage !== 3);
}

function resetGrammarLearningProcess() {
    grammarPracticeState.conversationTurns = 0;
    $('#chat-box').innerHTML = '';
    $('#stage1-feedback').innerHTML = '';
    $('#next-stage-2-btn').classList.add('hidden');
}

// --- 2. RULES (QUY TẮC) ---
function renderRules() {
    const list = $('#ruleList');
    list.innerHTML = NEW.rules.map((r, i) => `
        <div class="card p-4">
            <h4 class="font-bold text-white">${r.title}</h4>
            <p class="text-sm text-slate-400 mt-2 line-clamp-3">${r.content}</p>
            <div class="mt-4 flex gap-2">
                <button class="btn btn-secondary text-xs flex-1" onclick="openRuleEdit(${i})">Sửa</button>
                <button class="btn bg-rose-900/50 text-rose-300 text-xs flex-1" onclick="deleteRule(${i})">Xóa</button>
            </div>
        </div>`).join('');
}
function openRuleEdit(index) { /* Tương tự Grammar, rút gọn */ openGrammarEdit.call(null, index); /* Hack tái sử dụng form nếu cấu trúc giống hệt, hoặc copy logic */ } 
// Thực tế nên copy logic openGrammarEdit nhưng trỏ vào NEW.rules và #ruleModal
function deleteRule(index) { if(confirm('Xóa?')) { NEW.rules.splice(index,1); storage.set('hskpro_rules', NEW.rules); renderRules(); } }

// --- 3. IDIOMS (THÀNH NGỮ) ---
function renderIdioms() {
    const list = $('#idiomList');
    list.innerHTML = NEW.idioms.map((i, idx) => `
        <div class="card p-4">
            <h4 class="font-bold text-white">${i.title}</h4>
            <p class="text-sm text-slate-400">${i.content}</p>
            <div class="mt-2 text-xs italic text-slate-500">${i.example}</div>
            <button class="btn btn-secondary text-xs mt-3 w-full" onclick="deleteIdiom(${idx})">Xóa</button>
        </div>`).join('');
}
async function handleAiScanVocabForIdioms(btn) {
    btn.disabled = true; btn.innerHTML = '...';
    try {
        const res = await callGemini('Liệt kê 5 thành ngữ tiếng Trung thông dụng (kèm pinyin, nghĩa). JSON: [{"title":"...","content":"...","example":"..."}]');
        const data = parseAiJson(res);
        NEW.idioms.push(...data); storage.set('hskpro_idioms', NEW.idioms); renderIdioms();
    } catch(e){ toast('Lỗi AI','error'); } finally { btn.disabled = false; btn.innerHTML = 'Quét AI'; }
}
function deleteIdiom(i) { NEW.idioms.splice(i,1); storage.set('hskpro_idioms', NEW.idioms); renderIdioms(); }

// --- 4. CLASSIFIERS (LƯỢNG TỪ) ---
function initClassifiersView() { renderClassifiers(); $('#aiAnalyzeClassifierBtn').onclick = handleAiAnalyzeClassifier; }
function renderClassifiers() {
    $('#classifierList').innerHTML = NEW.classifiers.map((c, i) => `
        <div class="card p-4"><h4 class="font-bold text-white">${c.title}</h4><p class="text-sm text-slate-400">${c.content}</p></div>
    `).join('');
}
async function handleAiAnalyzeClassifier() {
    const word = $('#classifierInput').value;
    if(!word) return;
    try {
        const res = await callGemini(`Phân tích lượng từ "${word}". JSON: {"title":"${word}","content":"...","example":"..."}`);
        const data = parseAiJson(res);
        NEW.classifiers.push(data); storage.set('hskpro_classifiers', NEW.classifiers); renderClassifiers();
    } catch(e) { toast('Lỗi AI','error'); }
}

// --- 5. DIFFERENTIATE (PHÂN BIỆT TỪ) ---
function initDifferentiateView() { $('#aiDiffBtn').onclick = handleAiDifferentiate; }
async function handleAiDifferentiate() {
    const w = $('#diffInput').value;
    try {
        const res = await callGemini(`Phân biệt từ gần nghĩa với "${w}". JSON: {"title":"...","words":[{"term":"...","pinyin":"...","explanation":"..."}],"quiz":{"question":"...","options":["..."],"answer":"..."}}`);
        const data = parseAiJson(res);
        renderAiDiffResult(data);
    } catch(e) { toast('Lỗi AI', 'error'); }
}
function renderAiDiffResult(data) {
    let html = `<h4 class="font-bold text-lg mb-2">${data.title}</h4>`;
    data.words.forEach(w => html += `<div class="mb-2"><strong class="text-[var(--brand)]">${w.term}</strong> (${w.pinyin}): ${w.explanation}</div>`);
    if(data.quiz) html += `<div class="mt-4 pt-4 border-t border-slate-700"><strong>Câu hỏi:</strong> ${data.quiz.question}<br>${data.quiz.options.map(o=>`<button class="btn btn-secondary text-xs mr-2 mt-2" onclick="checkDiffAnswer('${o}','${data.quiz.answer}')">${o}</button>`).join('')}</div><div id="diffFeedback" class="mt-2 font-bold"></div>`;
    $('#aiDiffResult').innerHTML = html;
}
function checkDiffAnswer(sel, ans) {
    const fb = $('#diffFeedback');
    if(sel.startsWith(ans) || sel === ans) { fb.className='text-green-400'; fb.textContent='Chính xác!'; }
    else { fb.className='text-rose-400'; fb.textContent='Sai rồi.'; }
}

// --- 6. SANDBOX (GHÉP CHỮ) ---
function initSandboxView() { renderSandboxBank(); setupSandboxDropzone(); $('#sandbox-check-btn').onclick = handleSandboxCheck; }
function renderSandboxBank() {
    $('#sandbox-bank').innerHTML = sandboxComponents.map(c => `<div class="sandbox-component" draggable="true" data-char="${c.char}">${c.char}</div>`).join('');
    $$('.sandbox-component').forEach(el => {
        el.addEventListener('dragstart', e => { e.dataTransfer.setData('text', el.dataset.char); });
    });
}
function setupSandboxDropzone() {
    const frame = $('#sandbox-frame');
    frame.addEventListener('dragover', e => e.preventDefault());
    frame.addEventListener('drop', e => {
        e.preventDefault();
        const char = e.dataTransfer.getData('text');
        frame.innerHTML += `<div class="sandbox-component">${char}</div>`;
    });
}
async function handleSandboxCheck() {
    const chars = Array.from($$('#sandbox-frame .sandbox-component')).map(e => e.textContent).sort().join('');
    const res = sandboxCombinations[chars];
    if(res) {
        $('#sandbox-result').classList.remove('hidden');
        $('#sandbox-result-char').textContent = res.char;
        await saveSelectionAsVocab(res.char); // Auto save
    } else { toast('Không ghép được.', 'warning'); }
}

// --- 7. GRAPH (MẠNG TỪ VỰNG) ---
let networkInstance = null;
function initVocabGraph() { $('#btnDrawGraph').onclick = () => drawVocabGraph($('#graphInput').value); }
function drawVocabGraph(centerWord) {
    if (typeof vis === 'undefined') return toast('Lỗi thư viện Vis.', 'error');
    if (!centerWord) return;
    const nodes = [{id:0, label: centerWord, color:'#f43f5e', size: 30}];
    const edges = [];
    const related = NEW.vocab.filter(v => v.hanzi.includes(centerWord) && v.hanzi !== centerWord).slice(0, 10);
    related.forEach((v, i) => {
        nodes.push({id: i+1, label: v.hanzi + '\n' + v.vietnamese, shape: 'box'});
        edges.push({from: 0, to: i+1});
    });
    const container = document.getElementById('mynetwork');
    if(networkInstance) networkInstance.destroy();
    networkInstance = new vis.Network(container, {nodes, edges}, {physics: {stabilization: true}});
}

// --- 8. MEDIA (AUDIO/VIDEO) & DOCS ---
// Video
async function renderVideos() {
    const list = $('#videoList');
    const videos = await getVideosFromDB();
    list.innerHTML = videos.map(v => `
        <div class="card p-4">
            <h4 class="font-bold text-white truncate">${v.title}</h4>
            <div class="mt-2 flex gap-2">
                <button class="btn btn-secondary text-xs" onclick="playVideoInModal(${v.id})">Xem</button>
                <button class="btn btn-secondary text-xs hover:text-rose-400" onclick="deleteVideoItem(${v.id})">Xóa</button>
            </div>
        </div>
    `).join('');
    $('#addVideoBtn').onclick = () => openVideoEdit();
}
function openVideoEdit(item=null) {
    const modal = $('#videoModal');
    modal.innerHTML = `<form method="dialog" class="p-0"><div class="card p-6 gap-4 grid">
        <input id="vdTitle" class="form-input" placeholder="Tiêu đề" required>
        <input id="vdUrl" class="form-input" placeholder="Link YouTube/OneDrive">
        <div class="text-xs text-slate-400">Hoặc tải file (chưa hỗ trợ UI upload trong demo này)</div>
        <button class="btn btn-primary">Lưu</button>
    </div></form>`;
    modal.showModal();
    modal.querySelector('form').onsubmit = async (e) => {
        e.preventDefault();
        const data = { title: $('#vdTitle', modal).value, url: $('#vdUrl', modal).value, type: 'url' };
        await addVideoItem(data);
        modal.close(); renderVideos();
    };
}
async function deleteVideoItem(id) { if(confirm('Xóa?')) { await deleteVideoFromDB(id); renderVideos(); } }
async function playVideoInModal(idOrObj) {
    const v = typeof idOrObj === 'number' ? await getVideoDataFromDB(idOrObj) : idOrObj;
    const modal = $('#videoPlayerModal');
    let content = '';
    if(v.type === 'url') {
        const embed = getYouTubeEmbedUrl(v.url) || v.url;
        content = `<iframe src="${embed}" class="w-full h-full border-0" allowfullscreen></iframe>`;
    }
    modal.innerHTML = `<div class="card p-0 h-[80vh] flex flex-col"><div class="p-2 flex justify-end"><button onclick="this.closest('dialog').close()"><i data-lucide="x"></i></button></div><div class="flex-grow bg-black">${content}</div></div>`;
    lucide.createIcons(modal);
    modal.showModal();
}

// Audio
async function renderAudios() {
    const list = $('#audioList');
    const audios = await getAudios();
    list.innerHTML = audios.map(a => `
        <div class="card p-4">
            <h4 class="font-bold text-white">${a.title}</h4>
            <div class="mt-2 flex gap-2">
                <button class="btn btn-primary text-xs" onclick="playAudioInModal(${a.id})">Nghe</button>
                <button class="btn btn-secondary text-xs hover:text-rose-400" onclick="deleteAudioItem(${a.id})">Xóa</button>
            </div>
        </div>
    `).join('');
    $('#addAudioBtn').onclick = () => openAudioEdit();
}
function openAudioEdit() {
    const modal = $('#audioModal');
    modal.innerHTML = `<form method="dialog" class="p-0"><div class="card p-6 gap-4 grid">
        <input id="auTitle" class="form-input" placeholder="Tiêu đề">
        <input id="auUrl" class="form-input" placeholder="URL Audio">
        <button class="btn btn-primary">Lưu</button>
    </div></form>`;
    modal.showModal();
    modal.querySelector('form').onsubmit = async (e) => {
        e.preventDefault();
        await addAudio($('#auTitle', modal).value, '', 3, new Blob()); // Demo mock
        modal.close(); renderAudios();
    };
}
async function deleteAudioItem(id) { if(confirm('Xóa?')) { await deleteAudio(id); renderAudios(); } }
async function playAudioInModal(id) {
    const a = await getAudioData(id);
    const modal = $('#audioPlayerModal');
    // Demo mock play
    modal.innerHTML = `<div class="card p-6 text-center"><h4>${a.title}</h4><audio controls class="w-full mt-4" src="${a.url||''}"></audio><button class="btn btn-secondary mt-4" onclick="this.closest('dialog').close()">Đóng</button></div>`;
    modal.showModal();
}

// Docs
async function renderDocuments() {
    const list = $('#docList');
    const docs = await getDocuments();
    list.innerHTML = docs.map(d => `<div class="card p-4"><h4>${d.title}</h4><button class="btn btn-secondary text-xs mt-2" onclick="handleDocView(${d.id})">Xem</button></div>`).join('');
    $('#addDocBtn').onclick = () => openDocEdit();
}
async function handleDocView(id) {
    const doc = await getDocumentData(id);
    if(doc.type.includes('html')) loadDocInEditor(doc);
    else toast('Chưa hỗ trợ xem file này.', 'info');
}
function openDocEdit() {
    const title = prompt('Tiêu đề tài liệu:');
    if(title) {
        initEditorTab();
        showResourceTab('editor');
        // Logic tạo mới doc trong editor...
    }
}
async function loadDocInEditor(doc) {
    if(!quillEditorInstance) initEditorTab();
    const blob = new Blob([doc.data], {type: doc.type});
    quillEditorInstance.root.innerHTML = await blob.text();
    showResourceTab('editor');
    $('#saveEditorContent').onclick = async () => {
        const newBlob = new Blob([quillEditorInstance.root.innerHTML], {type: 'application/hskpro-editor-html'});
        await updateDocument(doc.id, doc.title, doc.category, newBlob);
        toast('Đã lưu.', 'success');
    };
}

// --- 9. HANZI WRITER HELPERS ---
let hanziWriter = null;
function setupHanziWriter(char) {
    $('#hanziWriterMount').innerHTML = '';
    if(hanziWriter) hanziWriter = null;
    hanziWriter = HanziWriter.create('hanziWriterMount', char, {
        width: 300, height: 300, padding: 5, showOutline: true, strokeColor: '#14b8a6'
    });
    $('#hanziControls').classList.remove('hidden');
    $('#hanzi-play').onclick = () => hanziWriter.animateCharacter();
    $('#hanzi-quiz').onclick = () => hanziWriter.quiz();
}
async function getHanziAnalysis(text) {
    $('#hanziAnalysisResult').innerHTML = 'Đang phân tích...';
    try {
        const res = await callGemini(`Phân tích Hán tự "${text}". JSON: {"radicals":[{"char":"...","meaning":"..."}],"mnemonic":"..."}`);
        const data = parseAiJson(res);
        $('#hanziAnalysisResult').innerHTML = `<div><strong>Bộ thủ:</strong> ${data.radicals.map(r=>r.char).join(', ')}</div><div class="italic">${data.mnemonic}</div>`;
    } catch(e){ $('#hanziAnalysisResult').textContent = 'Lỗi AI'; }
}