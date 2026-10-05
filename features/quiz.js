/* ------------------------------ Quiz ------------------------------ */
const qState = { questions: [], i: 0, score: 0, missed: [], currentSettings: {} };

async function startQuiz() {
    const count = Number($('#qCount').value) || 10;
    const hsk = $('#qHSK').value;
    const pool = NEW.vocab.filter(v => hsk === 'all' || String(v.hskLevel) === hsk);
    
    if (pool.length < 4) return toast('Cần ít nhất 4 từ vựng.', 'error');
    
    // Generate questions logic (Simplified)
    qState.questions = [];
    for(let i=0; i<count; i++) {
        const item = pool[Math.floor(Math.random() * pool.length)];
        qState.questions.push({ type: 'mc_hz_vi', data: item });
    }
    
    $('#quiz-setup-view').classList.add('hidden');
    $('#quiz-active-view').classList.remove('hidden');
    qState.i = 0; qState.score = 0; nextQ();
}

function nextQ() {
    if (qState.i >= qState.questions.length) { showQuizResults(); return; }
    const q = qState.questions[qState.i];
    $('#qBody').innerHTML = `<div class="text-center text-4xl font-bold">${q.data.hanzi}</div>`;
    
    // Options logic...
    const options = shuffle([q.data.vietnamese, ...shuffle(NEW.vocab).slice(0,3).map(v=>v.vietnamese)]);
    $('#qActions').innerHTML = options.map((o, i) => 
        `<button class="btn btn-secondary w-full text-left" onclick="checkQ('${o}')">${o}</button>`
    ).join('');
}

function checkQ(ans) {
    const correct = qState.questions[qState.i].data.vietnamese;
    if(ans === correct) { qState.score += 10; toast('Đúng!', 'success'); }
    else { toast(`Sai! Đáp án: ${correct}`, 'error'); }
    qState.i++; nextQ();
}

function showQuizResults() {
    $('#quiz-active-view').classList.add('hidden');
    $('#quiz-results-view').classList.remove('hidden');
    $('#qResultScore').textContent = qState.score;
}