/* Listening sessions are local to the active language; rendering never plays audio. */
(() => {
    const storeKey = 'listening_session_v1';
    let session = null, generating = false, playback = 0, playing = false;
    const content = $('#listeningContent');
    const toolbar = document.createElement('div'); toolbar.className = 'flex flex-wrap gap-3 items-center';
    toolbar.innerHTML = `<label>Tốc độ <select id="listenSpeed" class="form-input w-auto"><option value="0.75">0,75×</option><option value="0.9" selected>0,9×</option><option value="1">1×</option><option value="1.15">1,15×</option></select></label>
      <button id="listenStop" type="button" class="btn btn-secondary">Dừng</button>
      <button id="listenRetry" type="button" class="btn btn-secondary">Làm lại bài</button>
      <p id="listenStatus" role="status" class="text-sm w-full">Bấm Nghe để bắt đầu. Bài và câu trả lời được lưu trên máy.</p>`;
    content.prepend(toolbar);
    $('#listeningAudioBtn').textContent = 'Nghe từ đầu';
    const feedback = $('#listeningFeedback');
    const status = text => $('#listenStatus').textContent = text;
    function validate(data) {
        if (!data || !Array.isArray(data.dialogue) || !data.dialogue.length || data.dialogue.length > 60 || !Array.isArray(data.questions) || !data.questions.length || data.questions.length > 20) throw Error('Bài nghe thiếu hội thoại hoặc câu hỏi hợp lệ.');
        const dialogue = data.dialogue.map(line => {
            if (!line || typeof line.line !== 'string' || !line.line.trim()) throw Error('Bài nghe có câu thoại trống.');
            return { role: String(line.role || ''), line: line.line.trim(), pinyin: String(line.pinyin || '') };
        });
        const questions = data.questions.map(q => {
            if (!q || typeof q.question !== 'string' || !q.question.trim() || !q.options || !['A','B','C','D'].every(k => typeof q.options[k] === 'string' && q.options[k].trim()) || new Set(Object.values(q.options).map(v => String(v).trim())).size !== 4 || !['A','B','C','D'].includes(q.answer)) throw Error('Câu hỏi AI thiếu 4 lựa chọn khác nhau hoặc đáp án đúng. Hãy tạo lại bài.');
            return { question: q.question, options: Object.fromEntries(['A','B','C','D'].map(k => [k,q.options[k]])), answer: q.answer };
        });
        return { dialogue, questions };
    }
    function save() {
        try {
            const value = JSON.stringify(session); Lingo.storageSet(storeKey, value);
            if (Lingo.storageGet(storeKey) !== value) status('Chưa lưu được bài trên máy: bộ nhớ đầy. Bài vẫn còn trong tab này.');
        } catch { status('Chưa lưu được bài trên máy.'); }
    }
    function stop() {
        playback++; playing = false; stopSpeech();
        $('#listeningPauseBtn').disabled = true; $('#listeningPauseBtn').textContent = 'Tạm dừng';
        status('Đã dừng. Bấm Nghe từ đầu hoặc loa từng câu để nghe lại.');
    }
    function play(index = 0, single = false) {
        if (!session) return;
        stop(); playing = true; const token = playback;
        $('#listeningPauseBtn').disabled = false;
        function next(i) {
            if (token !== playback || !playing) return;
            if (i >= session.exercise.dialogue.length) { playing = false; $('#listeningPauseBtn').disabled = true; status('Đã nghe hết hội thoại.'); return; }
            status(`Đang nghe câu ${i + 1}/${session.exercise.dialogue.length}`);
            speak(session.exercise.dialogue[i].line, null, session.level, () => {
                if (token !== playback) return;
                if (single) { playing = false; $('#listeningPauseBtn').disabled = true; status('Đã nghe xong câu.'); }
                else next(i + 1);
            }, { rate: Number($('#listenSpeed').value), onError: () => { stop(); status('Không phát được giọng đọc. Kiểm tra giọng đọc của trình duyệt rồi thử lại.'); } });
        }
        next(index);
    }
    function render() {
        if (!session) return;
        stop(); currentListeningExercise = session.exercise;
        const text = $('#listeningDialogueText'); text.replaceChildren();
        session.exercise.dialogue.forEach((line, i) => {
            const row = document.createElement('div'); row.className = 'mb-3';
            const words = document.createElement('p'); words.textContent = `${line.role}: ${line.line}`;
            const phonetic = document.createElement('p'); phonetic.textContent = line.pinyin; phonetic.className = 'text-sm text-slate-400';
            const button = document.createElement('button'); button.type = 'button'; button.className = 'btn btn-secondary text-sm'; button.textContent = `Nghe câu ${i + 1}`; button.onclick = () => play(i, true);
            row.append(words, phonetic, button); text.append(row);
        });
        text.closest('details').open = false;
        const questions = $('#listeningQuestionList'); questions.replaceChildren();
        session.exercise.questions.forEach((q, i) => {
            const card = document.createElement('fieldset'); card.className = 'card p-4';
            const title = document.createElement('legend'); title.textContent = `${i + 1}. ${q.question}`; card.append(title);
            Object.entries(q.options).forEach(([key, value]) => {
                const label = document.createElement('label'); label.className = 'flex gap-3 p-3 cursor-pointer';
                const input = document.createElement('input'); input.type = 'radio'; input.name = `listen_q_${i}`; input.value = key; input.checked = session.answers[i] === key; input.disabled = session.graded;
                input.onchange = () => { session.answers[i] = key; save(); };
                label.append(input, document.createTextNode(`${key}. ${value}`)); card.append(label);
            });
            if (session.graded) { const result = document.createElement('p'); result.textContent = session.answers[i] === q.answer ? 'Đúng.' : `Đáp án đúng: ${q.answer}. ${q.options[q.answer]}`; card.append(result); }
            questions.append(card);
        });
        content.classList.remove('hidden');
        $('#checkListeningAnswersBtn').disabled = session.graded;
        feedback.textContent = session.graded ? `Kết quả: ${session.exercise.questions.filter((q,i) => q.answer === session.answers[i]).length}/${session.exercise.questions.length} câu đúng.` : '';
        status(`Bài ${Lingo.level(session.level)} · ${session.exercise.questions.length} câu hỏi. Bấm Nghe để bắt đầu.`);
    }
    function load(data, level) {
        const exercise = validate(data);
        session = { exercise, level: Number(level) || 3, answers: {}, graded: false, createdAt: new Date().toISOString() };
        render(); save();
    }
    async function generate(button) {
        if (generating) return;
        if (session && !confirm('Tạo bài mới sẽ thay bài nghe đang lưu trên máy. Tiếp tục?')) return;
        generating = true; button.disabled = true; stop(); $('#listeningLoader').classList.remove('hidden');
        try {
            const level = Number($('#listeningHskLevel').value);
            const words = shuffle(NEW.vocab.filter(v => Number(v.hskLevel) >= 1 && Number(v.hskLevel) <= level)).slice(0,3).map(v => v.hanzi).join(', ');
            const result = await callGemini(LingoAI.listening(level, words, Lingo.lang));
            load(parseAiJson(result), level);
            toast('Đã tạo và lưu bài nghe. Bấm Nghe từ đầu để phát.', 'success');
        } catch (e) { toast(`Lỗi khi tạo bài nghe AI: ${e.message}`, 'error'); if (session) render(); }
        finally { generating = false; button.disabled = false; $('#listeningLoader').classList.add('hidden'); }
    }
    function check() {
        if (!session || session.graded) return;
        const missing = session.exercise.questions.map((_, i) => i).filter(i => !session.answers[i]);
        if (missing.length) { feedback.textContent = `Chưa trả lời câu ${missing.map(i => i + 1).join(', ')}. Chọn đủ đáp án rồi kiểm tra.`; return; }
        session.graded = true; save(); render();
        logAction('finish-listening', `${session.exercise.questions.filter((q,i)=>q.answer===session.answers[i]).length}/${session.exercise.questions.length}`);
    }
    $('#listeningAudioBtn').onclick = () => play();
    $('#listeningPauseBtn').onclick = () => {
        if (!playing || typeof speechSynthesis === 'undefined') return;
        if (speechSynthesis.paused) { speechSynthesis.resume(); $('#listeningPauseBtn').textContent = 'Tạm dừng'; status('Đang tiếp tục nghe.'); }
        else { speechSynthesis.pause(); $('#listeningPauseBtn').textContent = 'Tiếp tục'; status('Đã tạm dừng.'); }
    };
    $('#listenStop').onclick = stop;
    $('#listenRetry').onclick = () => { if (!session || !confirm('Xóa câu trả lời để làm lại bài nghe này?')) return; session.answers = {}; session.graded = false; render(); save(); };
    $('#listenSpeed').onchange = () => { stop(); status('Đã đổi tốc độ. Bấm Nghe để phát với tốc độ mới.'); };
    $('#checkListeningAnswersBtn').onclick = check;
    function navigationStop() {
        stop();
        if (typeof dialogueState !== 'undefined') { dialogueState.isStopped = true; clearTimeout(dialogueState.timer); }
        document.querySelectorAll('audio, video').forEach(media => { if (!['bg-video-container','html5MusicPlayer','bgMusic'].includes(media.id)) media.pause(); });
    }
    document.addEventListener('click', event => { if (event.target.closest('[data-section], [data-target], [data-goto], [data-tab], [data-open]')) navigationStop(); }, true);
    window.addEventListener('hashchange', navigationStop);
    window.addEventListener('pagehide', navigationStop);
    window.LingoListening = { generate, load, check, stop, validate };
    try { const saved = JSON.parse(Lingo.storageGet(storeKey) || 'null'); if (saved) { saved.exercise = validate(saved.exercise); if (!saved.answers || typeof saved.answers !== 'object') saved.answers = {}; session = saved; render(); } } catch { /* Preserve malformed saved data for recovery; allow a new exercise. */ }
})();
