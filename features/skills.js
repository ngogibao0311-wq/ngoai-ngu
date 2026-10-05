/* ------------------------------ KỸ NĂNG: ĐỌC, NGHE, NÓI, VIẾT ------------------------------ */

// --- 1. READING MODE (LUYỆN ĐỌC) ---
let currentReadingIndex = 0;
let currentPacingText = { withPauses: "", clean: "", hsk: 3 };

function initReadingMode() {
    const tabsContainer = $('#reading-tabs');
    if (!tabsContainer.dataset.initialized) {
        tabsContainer.addEventListener('click', (e) => {
            const tabButton = e.target.closest('button[data-tab]');
            if (tabButton) showReadingTab(tabButton.dataset.tab);
        });
        tabsContainer.dataset.initialized = 'true';
    }

    $('#generatePacingBtn').onclick = (e) => handleGeneratePacingText(e.currentTarget);
    $('#togglePausesBtn').onclick = (e) => handleTogglePauses(e.currentTarget);
    $('#savePacingBtn').onclick = (e) => handleSavePacingText(e.currentTarget);
    $('#addReadingBtn').onclick = () => openReadingEdit();
    $('#clipArticleBtn').onclick = () => openClipperModal();

    // AI Buttons for Reading
    $('#aiSummarizeBtn').onclick = (e) => handleReadingAI(e.currentTarget, t => `Tóm tắt ngắn gọn đoạn văn tiếng Trung sau cho người học tiếng Việt: "${t}"`);
    $('#aiExplainBtn').onclick = (e) => handleReadingAI(e.currentTarget, t => `Giải thích các điểm ngữ pháp và từ vựng khó trong đoạn văn tiếng Trung sau: "${t}"`);
    $('#aiQuizBtn').onclick = (e) => handleReadingAI(e.currentTarget, t => `Dựa vào đoạn văn tiếng Trung sau, tạo 3 câu hỏi trắc nghiệm bằng tiếng Việt để kiểm tra đọc hiểu: "${t}"`);

    showReadingTab('saved');
}

function showReadingTab(tabName) {
    const tabsContainer = $('#reading-tabs');
    const contentContainer = $('#reading-content-container');

    $$('button', tabsContainer).forEach(b => {
        const isCurrent = b.dataset.tab === tabName;
        b.classList.toggle('border-[var(--brand)]', isCurrent);
        b.classList.toggle('text-white', isCurrent);
        b.classList.toggle('text-slate-400', !isCurrent);
    });

    $$('[data-tab-content]', contentContainer).forEach(content => {
        content.classList.toggle('hidden', content.dataset.tabContent !== tabName);
    });

    if (tabName === 'saved') renderReadingSavedTab();
}

function renderReadingSavedTab() {
    const listEl = $('#readingList');
    if (!NEW.reading || NEW.reading.length === 0) {
        $('#readingTitle').textContent = "Chưa có bài đọc";
        $('#readingContent').innerHTML = "Hãy thêm bài đọc mới để bắt đầu.";
        listEl.innerHTML = '';
        return;
    }

    listEl.innerHTML = NEW.reading.map((text, index) =>
        `<div class="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--brand-light)] group cursor-pointer" onclick="loadReadingText(${index})">
            <div class="flex-grow text-left">
                <span class="font-bold text-white block truncate w-48">${text.title}</span>
                <span class="text-xs text-slate-400">HSK ${text.level}</span>
            </div>
            <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="text-slate-500 hover:text-white" onclick="event.stopPropagation(); openReadingEdit(${index})"><i data-lucide="edit" class="w-4 h-4"></i></button>
                <button class="text-slate-500 hover:text-rose-400" onclick="event.stopPropagation(); deleteReadingText(${index})"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
         </div>`
    ).join('');
    lucide.createIcons(listEl);
    
    if (NEW.reading.length > 0) loadReadingText(0);
}

function loadReadingText(index) {
    currentReadingIndex = index;
    const text = NEW.reading[index];
    const titleEl = $('#readingTitle');
    const contentEl = $('#readingContent');
    const toggleBtn = $('#readingTogglePausesBtn');
    const speakBtn = $('#readingSpeakBtn');
    const aiResultEl = $('#aiReadingResult');

    titleEl.textContent = text.title;
    aiResultEl.innerHTML = '';
    aiResultEl.classList.add('hidden');
    contentEl.classList.remove('hide-pauses');

    if (text.content_with_pauses) {
        let html = '';
        const hanziHTML = text.content_with_pauses.replace(/\n/g, '<br><br>').replace(/\//g, '<span class="pause-mark">/</span>');
        html += `<div class="pacing-line"><p class="pacing-hanzi">${hanziHTML}</p>`;
        
        if (text.pinyin_with_pauses) {
            const pinyinHTML = text.pinyin_with_pauses.replace(/\n/g, '<br><br>').replace(/\//g, '<span class="pause-mark">/</span>');
            html += `<p class="pacing-pinyin">${pinyinHTML}</p>`;
        }
        html += `</div>`;
        contentEl.innerHTML = html;
        contentEl.style.cursor = 'default';

        toggleBtn.classList.remove('hidden');
        toggleBtn.onclick = (e) => {
            e.stopPropagation();
            const isHiding = contentEl.classList.toggle('hide-pauses');
            const icon = isHiding ? 'eye' : 'eye-off';
            const label = isHiding ? 'Hiện nhịp' : 'Ẩn nhịp';
            e.currentTarget.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4"></i><span>${label}</span>`;
            lucide.createIcons(e.currentTarget);
        };
    } else {
        contentEl.innerHTML = segmentText(text.content);
        contentEl.style.cursor = 'text';
        toggleBtn.classList.add('hidden');
    }

    speakBtn.onclick = () => speak(text.content, null, text.level);
}

function segmentText(text) {
    const sortedVocab = [...NEW.vocab].sort((a, b) => b.hanzi.length - a.hanzi.length);
    let resultHTML = '';
    let i = 0;
    while (i < text.length) {
        let matchFound = false;
        for (const vocabItem of sortedVocab) {
            if (text.startsWith(vocabItem.hanzi, i)) {
                resultHTML += `<span class="word">${vocabItem.hanzi}</span>`;
                i += vocabItem.hanzi.length;
                matchFound = true;
                break;
            }
        }
        if (!matchFound) {
            const char = text[i];
            resultHTML += /[\u4e00-\u9fa5]/.test(char) ? `<span class="word">${char}</span>` : (char === ' ' ? '&nbsp;' : char);
            i++;
        }
    }
    return resultHTML;
}

// --- AI Pacing Logic ---
async function handleGeneratePacingText(btn) {
    const hskLevel = Number($('#pacingHskLevel').value) || 3;
    const contentArea = $('#pacing-content-area');
    const toggleBtn = $('#togglePausesBtn');
    const saveBtn = $('#savePacingBtn');
    const wordCount = (hskLevel >= 3) ? 150 : 100;

    const originalText = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 spinner"></i> Đang tạo...`;
    btn.disabled = true; saveBtn.disabled = true; toggleBtn.disabled = true;
    lucide.createIcons(btn);
    contentArea.innerHTML = '<p class="text-slate-500 text-center animate-pulse">AI đang tạo đoạn văn...</p>';

    try {
        const prompt = `Viết đoạn văn tiếng Trung ngắn (~${wordCount} chữ), chủ đề tự do, HSK ${hskLevel}.
        QUAN TRỌNG: Chèn dấu gạch chéo "/" vào vị trí ngắt nhịp tự nhiên trong câu.
        Cung cấp cả Pinyin có dấu cũng với dấu "/" tương ứng.
        Trả về JSON duy nhất: { "text_with_pauses": "...", "pinyin_with_pauses": "..." }`;

        const result = await callGemini(prompt);
        const data = parseAiJson(result);

        const cleanText = data.text_with_pauses.replace(/\s*\/\s*/g, '');
        currentPacingText = { withPauses: data.text_with_pauses, pinyinWithPauses: data.pinyin_with_pauses, clean: cleanText, hsk: hskLevel };

        renderPacedText(data.text_with_pauses, data.pinyin_with_pauses);

        toggleBtn.disabled = false;
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i> Lưu bài đọc`;
        lucide.createIcons(saveBtn);
    } catch (error) {
        contentArea.innerHTML = `<p class="text-rose-400 text-center">Lỗi: ${error.message}</p>`;
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
        lucide.createIcons(btn);
    }
}

function renderPacedText(text, pinyin) {
    const contentArea = $('#pacing-content-area');
    const textLines = text.split('\n');
    const pinyinLines = pinyin.split('\n');
    let html = '';
    for (let i = 0; i < textLines.length; i++) {
        const hanziHTML = (textLines[i] || '').replace(/\//g, '<span class="pause-mark">/</span>');
        const pinyinHTML = (pinyinLines[i] || '').replace(/\//g, '<span class="pause-mark">/</span>');
        html += `<div class="pacing-line"><p class="pacing-hanzi">${hanziHTML}</p><p class="pacing-pinyin">${pinyinHTML}</p></div>`;
    }
    contentArea.innerHTML = html;
}

function handleTogglePauses(btn) {
    const contentArea = $('#pacing-content-area');
    const isHiding = contentArea.classList.toggle('hide-pauses');
    btn.innerHTML = isHiding ? `<i data-lucide="eye" class="w-4 h-4"></i> <span>Hiện nhịp</span>` : `<i data-lucide="eye-off" class="w-4 h-4"></i> <span>Ẩn nhịp</span>`;
    lucide.createIcons(btn);
}

function handleSavePacingText(btn) {
    if (!currentPacingText.clean) return;
    const titlePrefix = `Bài luyện nhịp (HSK ${currentPacingText.hsk})`;
    const newItem = {
        title: `${titlePrefix}: ${currentPacingText.clean.substring(0, 15)}...`,
        content: currentPacingText.clean,
        content_with_pauses: currentPacingText.withPauses,
        pinyin_with_pauses: currentPacingText.pinyinWithPauses,
        level: currentPacingText.hsk
    };
    NEW.reading.unshift(newItem);
    storage.set('hskpro_reading', NEW.reading);
    btn.disabled = true; btn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> Đã lưu`;
    lucide.createIcons(btn);
    renderReadingSavedTab();
    toast('Đã lưu bài đọc.', 'success');
}

function openReadingEdit(index, prefillData = null) {
    const isEditing = index !== undefined && index !== null;
    const text = isEditing ? NEW.reading[index] : null;
    const modal = $('#readingModal');
    modal.innerHTML = `
        <form id="readingForm" method="dialog" class="p-0">
            <div class="card p-0 overflow-hidden">
                <div class="p-5 flex items-center justify-between border-b border-[var(--border)]">
                    <h4 class="text-lg font-bold text-white">${isEditing ? 'Sửa' : 'Thêm'} bài đọc</h4>
                    <button type="button" onclick="this.closest('dialog').close()" class="text-slate-400 hover:text-white"><i data-lucide="x"></i></button>
                </div>
                <div class="p-6 grid gap-4">
                    <input id="readTitle" placeholder="Tiêu đề" class="form-input" value="${text?.title || prefillData?.title || ''}" required/>
                    <input id="readLevel" type="number" min="1" max="6" placeholder="HSK" class="form-input" value="${text?.level || 1}" required/>
                    <textarea id="readContent" rows="6" placeholder="Nội dung Hán tự..." class="form-input" required>${text?.content || prefillData?.content || ''}</textarea>
                    <div class="flex justify-end gap-3"><button type="submit" class="btn btn-primary">Lưu</button></div>
                </div>
            </div>
        </form>`;
    lucide.createIcons(modal);
    modal.showModal();
    $('#readingForm', modal).onsubmit = (e) => {
        e.preventDefault();
        const newText = {
            title: $('#readTitle', modal).value.trim(),
            level: Number($('#readLevel', modal).value) || 1,
            content: $('#readContent', modal).value.trim()
        };
        if (isEditing) NEW.reading[index] = { ...NEW.reading[index], ...newText };
        else NEW.reading.push(newText);
        storage.set('hskpro_reading', NEW.reading);
        modal.close();
        renderReadingSavedTab();
        toast('Đã lưu bài đọc.', 'success');
    };
}

function deleteReadingText(index) {
    showConfirm(`Xóa bài đọc "${NEW.reading[index].title}"?`, () => {
        NEW.reading.splice(index, 1);
        storage.set('hskpro_reading', NEW.reading);
        renderReadingSavedTab();
        toast('Đã xóa.', 'success');
    });
}

function openClipperModal() {
    const modal = $('#clipperModal');
    modal.innerHTML = `
        <form id="clipperForm" method="dialog" class="p-0">
            <div class="card p-0 overflow-hidden">
                <div class="p-5 flex justify-between border-b border-[var(--border)]">
                    <h4 class="text-lg font-bold text-white">Nhập từ URL</h4>
                    <button type="button" onclick="this.closest('dialog').close()" class="text-slate-400"><i data-lucide="x"></i></button>
                </div>
                <div class="p-6 gap-4 grid">
                    <input id="clipUrlInput" type="url" placeholder="https://..." class="form-input" required/>
                    <button id="fetchArticleBtn" type="submit" class="btn btn-primary">Tải và Phân tích</button>
                </div>
            </div>
        </form>`;
    lucide.createIcons(modal);
    modal.showModal();
    $('#clipperForm', modal).onsubmit = (e) => { e.preventDefault(); handleFetchArticle(); };
}

async function handleFetchArticle() {
    const modal = $('#clipperModal');
    const url = $('#clipUrlInput', modal).value.trim();
    const btn = $('#fetchArticleBtn', modal);
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 spinner"></i> Đang tải...`; btn.disabled = true;
    try {
        const response = await fetch(`https://r.jina.ai/${url}`, { headers: { 'X-Return-Format': 'markdown' } });
        if (!response.ok) throw new Error('Lỗi kết nối.');
        const content = await response.text();
        const titleMatch = content.match(/^#\s+(.*)/);
        const title = titleMatch ? titleMatch[1] : 'Bài đọc mới';
        modal.close();
        openReadingEdit(null, { title, content });
        toast('Trích xuất thành công!', 'success');
    } catch (e) {
        toast(e.message, 'error');
    } finally {
        btn.innerHTML = originalText; btn.disabled = false;
    }
}

async function handleReadingAI(button, promptFn) {
    const text = NEW.reading[currentReadingIndex]?.content;
    if (!text) return toast('Không có nội dung.', 'warning');
    const originalText = button.innerHTML;
    button.innerHTML = `<i data-lucide="loader" class="w-4 h-4 spinner"></i>`; button.disabled = true;
    const resultEl = $('#aiReadingResult');
    resultEl.classList.remove('hidden');
    resultEl.innerHTML = 'Đang suy nghĩ...';
    try {
        const result = await callGemini(promptFn(text));
        resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${result.replace(/\n/g, '<br>')}</div>`;
    } catch (e) { resultEl.innerHTML = `Lỗi: ${e.message}`; }
    finally { button.innerHTML = originalText; button.disabled = false; lucide.createIcons(button); }
}

// --- 2. LISTENING MODE ---
let currentListeningExercise = null;
function initListeningView() {
    const tabs = $('#listening-tabs');
    tabs.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-tab]');
        if (!btn) return;
        $$('button', tabs).forEach(b => {
            b.className = (b === btn) ? 'py-3 px-2 border-b-2 border-[var(--brand)] text-white font-bold' : 'py-3 px-2 text-slate-400 hover:text-white';
        });
        $('#listening-tab-content-dialogue').classList.toggle('hidden', btn.dataset.tab !== 'dialogue');
        $('#listening-tab-content-video').classList.toggle('hidden', btn.dataset.tab !== 'video');
    });
    $('#startListeningBtn').onclick = handleStartListening;
    // Video logic is in Resources/Media usually, but if needed here:
    // $('#btnAiFindVideo').onclick = handleAiFindVideos; 
}

async function handleStartListening(e) {
    const btn = e.currentTarget;
    const hskLevel = $('#listeningHskLevel').value;
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 spinner"></i>`; btn.disabled = true;
    $('#listeningContent').classList.add('hidden');
    $('#listeningLoader').classList.remove('hidden');

    try {
        const prompt = `Tạo bài luyện nghe HSK ${hskLevel}. JSON duy nhất:
        {
          "dialogue": [
            { "role": "A", "line": "你好", "pinyin": "Nǐ hǎo" },
            { "role": "B", "line": "你好", "pinyin": "Nǐ hǎo" }
          ],
          "questions": [
            { "question": "Câu hỏi?", "options": {"A":"1","B":"2"}, "answer": "A" }
          ]
        }`;
        const result = await callGemini(prompt);
        currentListeningExercise = parseAiJson(result);
        displayListeningExercise(hskLevel);
    } catch (err) {
        toast(err.message, 'error');
    } finally {
        btn.innerHTML = originalText; btn.disabled = false; lucide.createIcons(btn);
        $('#listeningLoader').classList.add('hidden');
    }
}

function displayListeningExercise(hskLevel) {
    if (!currentListeningExercise) return;
    const fullText = currentListeningExercise.dialogue.map(l => l.line).join('。');
    const content = $('#listeningContent');
    
    $('#listeningDialogueText').innerHTML = currentListeningExercise.dialogue.map(l => 
        `<p><strong class="text-[var(--brand)]">${l.role}:</strong> ${l.line}</p>`
    ).join('');

    $('#listeningQuestionList').innerHTML = currentListeningExercise.questions.map((q, i) => `
        <div class="card p-4 mb-4" data-q-index="${i}">
            <p class="font-bold text-white mb-2">${i+1}. ${q.question}</p>
            <div class="grid grid-cols-2 gap-2">
                ${Object.entries(q.options).map(([k,v]) => `
                    <div>
                        <input type="radio" name="lq_${i}" id="lq_${i}_${k}" value="${k}" class="sr-only peer">
                        <label for="lq_${i}_${k}" class="btn btn-secondary w-full justify-start peer-checked:bg-[var(--brand)] peer-checked:text-white">${k}. ${v}</label>
                    </div>
                `).join('')}
            </div>
            <div class="mt-2 text-sm font-bold h-5" data-feedback-for="${i}"></div>
        </div>
    `).join('');

    $('#listeningAudioBtn').onclick = () => speak(fullText, null, hskLevel);
    $('#listeningPauseBtn').onclick = () => speechSynthesis.cancel();
    $('#checkListeningAnswersBtn').onclick = checkListeningAnswers;
    $('#checkListeningAnswersBtn').disabled = false;
    
    content.classList.remove('hidden');
    speak(fullText);
}

function checkListeningAnswers() {
    let correct = 0;
    currentListeningExercise.questions.forEach((q, i) => {
        const selected = $(`input[name="lq_${i}"]:checked`);
        const feedback = $(`[data-feedback-for="${i}"]`);
        if (selected && selected.value === q.answer) {
            correct++;
            feedback.className = 'text-green-400';
            feedback.textContent = 'Chính xác!';
        } else {
            feedback.className = 'text-rose-400';
            feedback.textContent = `Sai. Đáp án: ${q.answer}`;
        }
        $$(`input[name="lq_${i}"]`).forEach(inp => inp.disabled = true);
    });
    $('#listeningFeedback').innerHTML = `<h4 class="text-xl font-bold text-white">Kết quả: ${correct}/${currentListeningExercise.questions.length}</h4>`;
    $('#checkListeningAnswersBtn').disabled = true;
}

// --- 3. SPEAKING MODE ---

// Biến toàn cục
let recognition = null;
let isRecording = false;
let currentSpeakingExercise = null;

// Biến xử lý âm thanh & Logic
let audioContext = null;
let analyser = null;
let microphoneStream = null;
let audioAnalysisInterval = null;
let silenceStartTimestamp = 0;
let hasDigitalSilenceError = false;

// Biến lưu trữ văn bản nối (quan trọng để không bị mất chữ khi API tự ngắt)
let finalTranscriptAccumulator = ""; 
let tempTranscript = ""; 

// Cấu hình
const SILENCE_LIMIT_MS = 20000;     // 20 giây (Logic 1)
const NOISE_THRESHOLD = 5;          // Ngưỡng âm lượng

function initSpeakingView() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        $('#speaking-practice-area').innerHTML = '<p class="text-rose-400">Trình duyệt không hỗ trợ. Hãy dùng Chrome trên PC/Android.</p>';
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;      
    recognition.interimResults = true;  

    recognition.onstart = () => {
        // Chỉ cập nhật UI nếu đây là lần start đầu tiên (không phải do auto-restart)
        if (isRecording) {
            updateRecUI(true);
            $('#spk-result-area').classList.add('hidden');
        }
    };

    // --- XỬ LÝ QUAN TRỌNG: TỰ ĐỘNG NỐI KHI GOOGLE NGẮT ---
    recognition.onend = () => {
        if (isRecording) {
            // Nếu code vẫn đang trong trạng thái "Ghi âm" mà API bị ngắt (do Google tự tắt)
            // 1. Cộng dồn văn bản vừa đọc được vào biến tổng
            if (tempTranscript) {
                finalTranscriptAccumulator += tempTranscript;
                tempTranscript = ""; // Reset tạm
            }
            
            // 2. Bật lại ngay lập tức (Auto-restart)
            console.log("Google API tự ngắt -> Đang nối lại...");
            try { recognition.start(); } catch (e) { /* Bỏ qua lỗi */ }
        } else {
            // Nếu là do người dùng bấm dừng hoặc hết 20s -> Dừng hẳn
            updateRecUI(false);
            finalizeAndGrade(); // Chấm điểm
        }
    };

    recognition.onresult = (e) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
            if (e.results[i].isFinal) {
                finalTranscriptAccumulator += e.results[i][0].transcript;
            } else {
                interim += e.results[i][0].transcript;
            }
        }
        
        // Cập nhật biến tạm để nếu bị ngắt đột ngột thì còn lưu được
        tempTranscript = interim;

        // Hiển thị: Văn bản đã chốt + Văn bản đang nói
        $('#spk-user-transcript').textContent = finalTranscriptAccumulator + interim;
        
        // Reset bộ đếm im lặng vì người dùng đang nói
        silenceStartTimestamp = Date.now();
    };

    recognition.onerror = (e) => {
        // Bỏ qua lỗi 'no-speech' vì ta đang xử lý im lặng bằng AudioContext riêng
        if (e.error !== 'no-speech') console.warn("Speech Error:", e.error);
    };

    $('#spk-get-sentence').onclick = handleGetSpeakingSentence;
    $('#spk-start-rec').onclick = handleStartRecording;
    $('#spk-stop-rec').onclick = handleStopRecording;
}

function updateRecUI(recording) {
    const startBtn = $('#spk-start-rec');
    const stopBtn = $('#spk-stop-rec');
    startBtn.disabled = recording;
    stopBtn.disabled = !recording;
    
    if (recording) {
        startBtn.innerHTML = '<i data-lucide="mic-off" class="w-4 h-4 animate-pulse text-red-500"></i> Đang ghi (Im lặng 20s sẽ dừng)...';
    } else {
        startBtn.innerHTML = '<i data-lucide="mic" class="w-4 h-4"></i> Bắt đầu ghi';
    }
    lucide.createIcons(startBtn.parentElement);
}

async function handleGetSpeakingSentence(e) {
    const btn = e.currentTarget;
    const hskLevel = $('#speakingHskLevel').value;
    const isParagraph = $('#spk-mode-paragraph').checked;
    
    btn.disabled = true; btn.innerHTML = '...';
    $('#spkContent').classList.add('hidden');
    $('#spkLoader').classList.remove('hidden');

    try {
        const prompt = isParagraph 
            ? `Tạo đoạn văn tiếng Trung HSK ${hskLevel} (~150 chữ). JSON: {"hanzi":"...","pinyin":"..."}`
            : `Tạo câu tiếng Trung HSK ${hskLevel}. JSON: {"hanzi":"...","pinyin":"..."}`;
        const result = await callGemini(prompt);
        currentSpeakingExercise = parseAiJson(result);
        $('#spk-target-hanzi').innerHTML = currentSpeakingExercise.hanzi.replace(/\n/g, '<br>');
        $('#spk-target-pinyin').innerHTML = currentSpeakingExercise.pinyin.replace(/\n/g, '<br>');
        $('#spkContent').classList.remove('hidden');
        $('#spk-user-transcript').textContent = ''; 
    } catch (e) { toast(e.message, 'error'); } 
    finally { 
        btn.disabled = false; btn.innerHTML = 'Lấy bài mới'; 
        $('#spkLoader').classList.add('hidden');
    }
}

async function handleStartRecording() {
    if (!currentSpeakingExercise) return toast('Hãy lấy bài tập trước.', 'warning');
    if (isRecording) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Setup AudioContext (Để đo 20s và chống chỉnh sửa)
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphoneStream = audioContext.createMediaStreamSource(stream);
        microphoneStream.connect(analyser);
        analyser.fftSize = 512;
        
        // Reset toàn bộ biến
        finalTranscriptAccumulator = "";
        tempTranscript = "";
        $('#spk-user-transcript').textContent = "";
        
        silenceStartTimestamp = Date.now();
        hasDigitalSilenceError = false;
        isRecording = true;

        startAudioAnalysis(); // Bắt đầu đếm giờ 20s

        recognition.start();

    } catch (err) {
        console.error(err);
        toast('Lỗi Micro: ' + err.message, 'error');
        isRecording = false;
    }
}

function startAudioAnalysis() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeDomainArray = new Float32Array(analyser.fftSize); 

    audioAnalysisInterval = setInterval(() => {
        if (!isRecording) {
            clearInterval(audioAnalysisInterval);
            return;
        }

        // --- LOGIC 1: Đếm ngược 20s ---
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const averageVolume = sum / bufferLength;

        // Nếu có tiếng động (kể cả tiếng ồn nhỏ) -> Reset đồng hồ
        // Điều này giúp ko bị ngắt khi bạn đang lấy hơi hoặc đọc nhỏ
        if (averageVolume > NOISE_THRESHOLD) {
            silenceStartTimestamp = Date.now();
        } else {
            const silentTime = Date.now() - silenceStartTimestamp;
            // Chỉ dừng khi thực sự im lặng quá 20 giây
            if (silentTime > SILENCE_LIMIT_MS) {
                toast('Đã dừng do im lặng quá 20 giây.', 'info');
                handleStopRecording(); 
                return;
            }
        }

        // --- LOGIC 2: Chống chỉnh sửa (Digital Silence) ---
        analyser.getFloatTimeDomainData(timeDomainArray);
        let zeroCount = 0;
        for (let i = 0; i < timeDomainArray.length; i++) {
            if (timeDomainArray[i] === 0) zeroCount++;
            else zeroCount = 0;
            
            if (zeroCount > 100) { // Phát hiện chuỗi 0 tuyệt đối
                hasDigitalSilenceError = true;
            }
        }
    }, 100);
}

function handleStopRecording() {
    if (!isRecording) return;
    isRecording = false; // Cờ này = false sẽ chặn recognition.onend tự restart

    // Dừng các luồng âm thanh
    try { recognition.stop(); } catch(e){}
    if (microphoneStream) {
        microphoneStream.mediaStream.getTracks().forEach(track => track.stop());
        microphoneStream.disconnect();
    }
    if (audioContext) audioContext.close();
    if (audioAnalysisInterval) clearInterval(audioAnalysisInterval);

    // Lưu nốt phần text đang đọc dở (nếu có)
    if (tempTranscript) {
        finalTranscriptAccumulator += tempTranscript;
    }
}

// Tách hàm chấm điểm ra để gọi khi dừng hẳn
async function finalizeAndGrade() {
    const fullText = finalTranscriptAccumulator.trim();
    if (!fullText) {
        toast('Chưa nghe thấy gì cả.', 'warning');
        return;
    }

    $('#spk-result-area').classList.remove('hidden');
    $('#spk-result-feedback').innerHTML = '<span class="animate-pulse">Đang chấm điểm toàn bộ bài...</span>';
    
    let systemNote = "";
    if (hasDigitalSilenceError) {
        systemNote = `LƯU Ý: Có tín hiệu im lặng tuyệt đối (Digital Silence). Có thể người dùng đã cắt ghép file. Hãy trừ điểm nhẹ độ trôi chảy.`;
    }

    try {
        const prompt = `Bạn là giám khảo chấm thi nói tiếng Trung.
        - Bài gốc: "${currentSpeakingExercise.hanzi}"
        - Học sinh đọc: "${fullText}"
        ${systemNote}
        
        Yêu cầu: Chấm điểm (0-10) và nhận xét tiếng Việt. Chấp nhận việc học sinh đọc vấp tự nhiên, nhưng nếu thiếu quá nhiều chữ so với bài gốc thì trừ điểm nặng.
        JSON: {"score": number, "feedback": "string"}`;
        
        const result = await callGemini(prompt);
        const data = parseAiJson(result);
        
        const color = data.score >= 8 ? 'text-green-400' : 'text-amber-400';
        let cheatBadge = hasDigitalSilenceError ? '<div class="text-xs text-rose-400 mt-1">⚠️ Cảnh báo: Có dấu hiệu can thiệp âm thanh</div>' : '';

        $('#spk-result-feedback').innerHTML = `
            <div class="mb-2"><strong class="${color} text-3xl">${data.score}/10</strong></div>
            <p class="text-slate-300">${data.feedback}</p>
            ${cheatBadge}
        `;
    } catch (e) {
        $('#spk-result-feedback').textContent = 'Lỗi chấm điểm: ' + e.message;
    }
}

// --- 4. WRITING MODE ---
let currentWritingDraft = { vietnamese: "" };

function initWritingView() {
    showWritingTab('paragraph');
    const tabs = $('#writing-tabs');
    tabs.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-tab]');
        if (btn) showWritingTab(btn.dataset.tab);
    });

    $('#randomTopicBtn').onclick = () => {
        if (NEW.vocab.length > 0) {
            const w = shuffle(NEW.vocab)[0];
            $('#writingTopic').textContent = `Chủ đề: ${w.hanzi} (${w.vietnamese})`;
            currentWritingDraft.vietnamese = "";
            $('#writingInput').value = '';
        }
    };

    $('#aiGradeWritingBtn').onclick = (e) => handleAiGradeWriting(e.currentTarget);
    $('#aiGetTopicBtn').onclick = (e) => handleAiGetTopic(e.currentTarget);
    $('#aiBrainstormBtn').onclick = (e) => handleAiBrainstorm(e.currentTarget, 3);
    $('#saveTranslationBtn').onclick = (e) => handleSaveTranslation(e.currentTarget);
}

function showWritingTab(tabName) {
    $$('#writing-tabs button').forEach(b => {
        const active = b.dataset.tab === tabName;
        b.className = active ? 'px-4 py-2 rounded-lg bg-[var(--brand)] text-white font-bold' : 'px-4 py-2 rounded-lg hover:bg-slate-800 text-slate-400';
    });
    $$('#writing-content > div').forEach(d => d.classList.add('hidden'));
    $(`[data-tab-content="${tabName}"]`).classList.remove('hidden');
    
    if (tabName === 'archive') renderTranslationArchive();
}

async function handleAiGetTopic(btn) {
    const original = btn.innerHTML;
    btn.innerHTML = '...'; btn.disabled = true;
    try {
        const topic = await callGemini('Cho 1 chủ đề viết tiếng Trung HSK 3-4 thú vị. Chỉ trả về chủ đề.');
        $('#writingTopic').textContent = `Chủ đề: ${topic.replace(/["']/g, '')}`;
        $('#writingInput').value = '';
        currentWritingDraft.vietnamese = '';
    } catch (e) { toast('Lỗi AI.', 'error'); }
    finally { btn.innerHTML = original; btn.disabled = false; }
}

async function handleAiBrainstorm(btn, level) {
    const topic = $('#writingTopic').textContent.replace('Chủ đề: ', '');
    const original = btn.innerHTML;
    btn.innerHTML = '...'; btn.disabled = true;
    try {
        const vnText = await callGemini(`Viết đoạn văn mẫu Tiếng Việt về "${topic}" cho trình độ HSK ${level}. Chỉ trả về nội dung tiếng Việt.`);
        currentWritingDraft.vietnamese = vnText.trim();
        restoreVietnameseTextUI();
    } catch (e) { toast('Lỗi AI.', 'error'); }
    finally { btn.innerHTML = original; btn.disabled = false; }
}

function restoreVietnameseTextUI() {
    const el = $('#aiWritingFeedback');
    el.innerHTML = `
        <h5 class="font-bold text-white mb-2">Bài dịch (Việt -> Trung):</h5>
        <textarea id="vietnameseBrainstormArea" class="form-input w-full text-sm" rows="6">${currentWritingDraft.vietnamese}</textarea>
        <button id="aiRefineVietnameseBtn" class="btn btn-secondary w-full mt-2"><i data-lucide="wand-2" class="w-4 h-4"></i> AI Chỉn chu</button>
    `;
    lucide.createIcons(el);
    $('#vietnameseBrainstormArea', el).oninput = (e) => currentWritingDraft.vietnamese = e.target.value;
    $('#aiRefineVietnameseBtn', el).onclick = (e) => handleAiRefineVietnamese(e.currentTarget);
}

async function handleAiRefineVietnamese(btn) {
    const area = $('#vietnameseBrainstormArea');
    const text = area.value.trim();
    if(!text) return;
    btn.disabled = true;
    try {
        const refined = await callGemini(`Chau chuốt lại đoạn tiếng Việt này cho hay hơn nhưng giữ nguyên ý: "${text}"`);
        area.value = refined.trim();
        currentWritingDraft.vietnamese = area.value;
    } catch(e) { toast('Lỗi AI.', 'error'); }
    finally { btn.disabled = false; }
}

async function handleAiGradeWriting(btn) {
    const text = $('#writingInput').value.trim();
    if (!text) return toast('Chưa có nội dung.', 'warning');
    const topic = $('#writingTopic').textContent;
    btn.disabled = true;
    $('#aiWritingFeedback').innerHTML = 'Đang chấm...';
    try {
        const prompt = `Chấm bài viết tiếng Trung chủ đề "${topic}". Bài làm: "${text}". JSON: {"score": 0-10, "positive_feedback": "...", "errors": [{"original":"...","correction":"...","explanation":"..."}], "suggestions": "..."}`;
        const result = await callGemini(prompt);
        const data = parseAiJson(result);
        
        let html = `<div><strong>Điểm: ${data.score}</strong></div>`;
        if (data.errors) {
            html += '<ul class="list-disc pl-5 mt-2">';
            data.errors.forEach(e => html += `<li><s class="text-rose-400">${e.original}</s> -> <span class="text-green-400">${e.correction}</span>: ${e.explanation}</li>`);
            html += '</ul>';
        }
        html += `<p class="mt-2 italic">${data.suggestions}</p>`;
        $('#aiWritingFeedback').innerHTML = html;
    } catch (e) { $('#aiWritingFeedback').textContent = 'Lỗi chấm bài.'; }
    finally { btn.disabled = false; }
}

function handleSaveTranslation(btn) {
    const title = $('#writingTopic').textContent.replace('Chủ đề: ', '').trim();
    const zh = $('#writingInput').value.trim();
    const vn = currentWritingDraft.vietnamese;
    if (!title || (!zh && !vn)) return toast('Thiếu nội dung.', 'error');

    const newItem = { title, chinese: zh, vietnamese: vn };
    const idx = NEW.translations.findIndex(t => t.title === title);
    if (idx > -1) NEW.translations[idx] = newItem;
    else NEW.translations.push(newItem);
    
    storage.set('hskpro_translations', NEW.translations);
    toast('Đã lưu bài dịch.', 'success');
    renderTranslationArchive();
}

function renderTranslationArchive() {
    const list = $('#translationArchiveList');
    if (NEW.translations.length === 0) return list.innerHTML = '<p class="text-slate-500 text-center">Chưa có bài lưu.</p>';
    
    list.innerHTML = [...NEW.translations].reverse().map((t, i) => `
        <div class="card p-4">
            <h5 class="font-bold text-white">${t.title}</h5>
            <p class="text-xs text-slate-400 mt-1">VN: ${t.vietnamese ? 'Có' : 'Không'} | ZH: ${t.chinese ? 'Có' : 'Không'}</p>
            <div class="mt-3 flex gap-2">
                <button class="btn btn-secondary text-xs flex-1" onclick="loadTranslationForEdit(${NEW.translations.length - 1 - i})">Sửa/Tiếp tục</button>
                <button class="btn btn-secondary text-xs hover:text-rose-400" onclick="deleteTranslation(${NEW.translations.length - 1 - i})">Xóa</button>
            </div>
        </div>
    `).join('');
}

function loadTranslationForEdit(index) {
    const t = NEW.translations[index];
    showWritingTab('paragraph');
    $('#writingTopic').textContent = `Chủ đề: ${t.title}`;
    $('#writingInput').value = t.chinese || '';
    currentWritingDraft.vietnamese = t.vietnamese || '';
    if (t.vietnamese) restoreVietnameseTextUI();
}

function deleteTranslation(index) {
    if (confirm('Xóa bài này?')) {
        NEW.translations.splice(index, 1);
        storage.set('hskpro_translations', NEW.translations);
        renderTranslationArchive();
    }
}

// --- 5. DIALOGUES ---
let dialogueState = { timer: null, currentIndex: 0, dialogue: null, userRole: null, isStopped: false };

function renderDialogues() {
    const list = $('#diaList');
    list.innerHTML = NEW.dialogues.map((d, i) => `
        <div class="card p-4">
            <h4 class="font-bold text-white">${d.title}</h4>
            <p class="text-xs text-slate-400">${d.lines.length} dòng</p>
            <div class="mt-4 flex gap-2">
                <button class="btn btn-primary flex-1 text-xs" onclick="handleDiaAction(this)" data-act="playDia" data-index="${i}">Luyện tập</button>
                <button class="btn btn-secondary text-xs" onclick="handleDiaAction(this)" data-act="viewDia" data-index="${i}">Xem</button>
                <button class="btn btn-secondary text-xs" onclick="handleDiaAction(this)" data-act="editDia" data-index="${i}">Sửa</button>
                <button class="btn btn-secondary text-xs hover:text-rose-400" onclick="handleDiaAction(this)" data-act="delDia" data-index="${i}">Xóa</button>
            </div>
        </div>
    `).join('');
}

function handleDiaAction(btn) {
    const { act, index } = btn.dataset;
    const item = NEW.dialogues[index];
    if (act === 'playDia') {
        $('#diaPracticeArea').classList.remove('hidden');
        $('#diaPracticeTitle').textContent = item.title;
        showRoleSelection(item);
    }
    if (act === 'viewDia') openDialogueViewer(item);
    if (act === 'editDia') openDiaEdit(item, index);
    if (act === 'delDia') {
        if(confirm('Xóa?')) {
            NEW.dialogues.splice(index, 1);
            storage.set('hskpro_dialogues', NEW.dialogues);
            renderDialogues();
        }
    }
}

function openDiaEdit(item, index, aiContent = '') {
    const modal = $('#diaModal');
    modal.innerHTML = `
        <form id="diaForm" method="dialog" class="p-0"><div class="card p-0 overflow-hidden">
            <div class="p-5 border-b border-[var(--border)] flex justify-between"><h4 class="font-bold text-white">Đối thoại</h4><button type="button" onclick="this.closest('dialog').close()"><i data-lucide="x"></i></button></div>
            <div class="p-6 gap-4 grid">
                <input id="diaTitle" class="form-input" placeholder="Tiêu đề" value="${item?.title||''}" required>
                <textarea id="diaLines" rows="8" class="form-input font-mono text-sm" placeholder="zh|pinyin|vi|Role" required>${aiContent || (item ? parseDialogueLinesToString(item.lines) : '')}</textarea>
                <button type="submit" class="btn btn-primary justify-end">Lưu</button>
            </div>
        </div></form>`;
    lucide.createIcons(modal);
    modal.showModal();
    $('#diaForm', modal).onsubmit = (e) => {
        e.preventDefault();
        const lines = parseStringToDialogueLines($('#diaLines', modal).value);
        const data = { title: $('#diaTitle', modal).value, lines };
        if (index !== null) NEW.dialogues[index] = data; else NEW.dialogues.push(data);
        storage.set('hskpro_dialogues', NEW.dialogues);
        modal.close(); renderDialogues();
    };
}

function openDialogueViewer(item) {
    const modal = $('#dialogueViewModal');
    
    // Mã SVG của cái loa (Dùng trực tiếp để đảm bảo 100% hiển thị)
    const speakerIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`;

    modal.innerHTML = `
        <div class="card p-0 overflow-hidden max-h-[80vh] flex flex-col">
            <div class="p-4 border-b border-[var(--border)] flex justify-between">
                <h4 class="font-bold text-white">${item.title}</h4>
                <button onclick="this.closest('dialog').close()"><i data-lucide="x"></i></button>
            </div>
            <div class="p-4 overflow-y-auto space-y-4">
                ${item.lines.map(l => `
                    <div class="text-center">
                        <strong class="text-[var(--brand)]">${l.role}</strong>
                        
                        <div class="flex items-center justify-center gap-2 mt-1 mb-1">
                            <span class="text-2xl text-white font-bold">${l.zh}</span>
                            <button class="text-slate-400 hover:text-[var(--brand)] transition-colors p-1 rounded-full hover:bg-white/10" 
                                    onclick="speak('${l.zh.replace(/'/g, "\\'")}', '${l.pinyin ? l.pinyin.replace(/'/g, "\\'") : ''}')" 
                                    title="Nghe">
                                ${speakerIcon}
                            </button>
                        </div>

                        <div class="text-sm text-slate-400">${l.pinyin}</div>
                        <div class="text-sm text-slate-500 italic">${l.vi}</div>
                    </div>
                `).join('<hr class="border-slate-800 my-2">')}
            </div>
        </div>`;
    
    lucide.createIcons(modal);
    modal.showModal();
}

function showRoleSelection(d) {
    const modal = $('#roleModal');
    const roles = [...new Set(d.lines.map(l => l.role))];
    modal.innerHTML = `<div class="card p-6 text-center"><h4 class="font-bold text-white mb-4">Chọn vai</h4><div class="flex justify-center gap-3">${roles.map(r => `<button class="btn btn-secondary role-btn" data-role="${r}">${r}</button>`).join('')}</div></div>`;
    modal.showModal();
    modal.querySelectorAll('.role-btn').forEach(b => b.onclick = () => {
        modal.close(); startDialoguePractice(d, b.dataset.role);
    });
}

function startDialoguePractice(d, role) {
    if (dialogueState.timer) clearTimeout(dialogueState.timer);
    dialogueState = { timer: null, currentIndex: 0, dialogue: d, userRole: role, isStopped: false };
    dialogueNextLine();
}

function dialogueNextLine() {
    if (dialogueState.isStopped || dialogueState.currentIndex >= dialogueState.dialogue.lines.length) {
        if (!dialogueState.isStopped) toast('Hoàn thành!');
        return;
    }
    const line = dialogueState.dialogue.lines[dialogueState.currentIndex];
    const isUser = line.role === dialogueState.userRole;
    
    $('#diaLineDisplay').innerHTML = `
        <p class="text-sm font-bold ${isUser ? 'text-[var(--brand)]' : 'text-slate-400'}">${isUser ? 'Bạn' : line.role}:</p>
        <p class="text-3xl font-bold text-white my-2">${line.zh}</p>
        <p class="text-lg text-slate-400">${line.pinyin}</p>
        <p class="text-sm text-slate-500 italic">${line.vi}</p>
    `;

    if (!isUser) {
        speak(line.zh, line.pinyin, 3, () => {
            if (!dialogueState.isStopped) {
                dialogueState.currentIndex++;
                dialogueState.timer = setTimeout(dialogueNextLine, 500);
            }
        });
    } else {
        dialogueState.timer = setTimeout(() => {
            if (!dialogueState.isStopped) {
                dialogueState.currentIndex++;
                dialogueNextLine();
            }
        }, NEW.options.dialogueDelay);
    }
}