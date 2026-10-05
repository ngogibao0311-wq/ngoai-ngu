/* ------------------------------ MASCOTS (LINH VẬT) ------------------------------ */

// Helper: Khi click vào nhân vật
function handleCharacterClick(stateObj) {
    if (!NEW.vocab || NEW.vocab.length === 0) {
        stateObj.bubble.innerText = "Chưa có từ!"; stateObj.bubble.style.opacity = 1; return;
    }
    if (stateObj.timer) clearTimeout(stateObj.timer);
    const word = NEW.vocab[Math.floor(Math.random() * NEW.vocab.length)];
    
    stateObj.bubble.innerHTML = `<div class="text-center leading-tight">
        <div class="text-[var(--brand)] font-bold text-lg">${word.hanzi}</div>
        <div class="text-[10px] text-slate-600">${word.pinyin}</div>
        <div class="text-[10px] text-slate-500 italic truncate max-w-[80px]">${word.vietnamese}</div>
    </div>`;
    stateObj.bubble.style.opacity = 1;
    speak(word.hanzi, word.pinyin);

    const loopFunc = (stateObj.el.id === 'menu-snowman') ? snowmanLoop : pandaLoop;
    stateObj.timer = setTimeout(loopFunc, 4000);
}

// --- 1. SNOWMAN ---
const snowmanState = { el: document.getElementById('menu-snowman'), body: document.getElementById('snowman-body'), bubble: document.getElementById('snowman-bubble'), timer: null };

function initSnowmanAI() {
    if (!snowmanState.el) return;
    snowmanState.body.onclick = (e) => { e.stopPropagation(); handleCharacterClick(snowmanState); };
    snowmanLoop();
}

function snowmanLoop() {
    if (document.body.dataset.theme !== 'winter-street') {
        clearTimeout(snowmanState.timer); snowmanState.timer = setTimeout(snowmanLoop, 2000); return;
    }
    const rand = Math.random() * 100;
    snowmanState.body.className = ''; snowmanState.bubble.style.opacity = 0;
    const maxMove = Math.min(window.innerWidth - 50, 800);

    if (rand < 30) { // Walk
        const newPos = Math.random() * maxMove;
        const curPos = parseFloat(snowmanState.el.style.left) || 50;
        snowmanState.el.style.transform = `scaleX(${newPos < curPos ? -1 : 1})`;
        snowmanState.body.classList.add('snowman-walk');
        snowmanState.el.style.left = `${newPos}px`;
    } else if (rand < 50) { // Sleep
        snowmanState.body.classList.add('snowman-sleep');
        snowmanState.bubble.innerText = 'Zzz...'; snowmanState.bubble.style.opacity = 1;
    } else if (rand < 80) { // Jump
        snowmanState.body.classList.add('snowman-jump');
    }
    snowmanState.timer = setTimeout(snowmanLoop, Math.random() * 3000 + 2000);
}

// --- 2. PANDA ---
const pandaState = { el: document.getElementById('menu-panda'), body: document.getElementById('panda-body'), bubble: document.getElementById('panda-bubble'), timer: null };

function initPandaAI() {
    if (!pandaState.el) return;
    pandaState.body.onclick = (e) => { e.stopPropagation(); handleCharacterClick(pandaState); };
    pandaLoop();
}

function pandaLoop() {
    if (document.body.dataset.theme !== 'forest-ruins') {
        clearTimeout(pandaState.timer); pandaState.timer = setTimeout(pandaLoop, 2000); return;
    }
    const rand = Math.random() * 100;
    pandaState.body.className = ''; pandaState.bubble.style.opacity = 0;
    const maxMove = Math.min(window.innerWidth - 60, 900);

    if (rand < 35) { // Walk
        const newPos = Math.random() * maxMove;
        const curPos = parseFloat(pandaState.el.style.left) || 20;
        pandaState.el.style.transform = `scaleX(${newPos < curPos ? -1 : 1})`;
        pandaState.body.classList.add('panda-walk');
        pandaState.el.style.left = `${newPos}px`;
    } else if (rand < 60) { // Eat
        pandaState.body.classList.add('panda-eat');
        pandaState.bubble.innerText = '🎋'; pandaState.bubble.style.opacity = 1;
    } else if (rand < 75) { // Roll
        pandaState.body.classList.add('panda-roll');
        pandaState.el.style.left = `${Math.max(0, (parseFloat(pandaState.el.style.left)||0) + (Math.random()>0.5?100:-100))}px`;
    }
    pandaState.timer = setTimeout(pandaLoop, Math.random() * 3000 + 3000);
}

document.addEventListener('DOMContentLoaded', () => { initSnowmanAI(); initPandaAI(); });