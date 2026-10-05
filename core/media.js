/* ------------------------------ Media Player ------------------------------ */
let ytPlayer = null;
let html5Player = null;
let isMusicPausedByApp = false;

function speak(text, pinyin, hskLevel = 3, onEndCallback = null) {
    if (!text || typeof text !== 'string') {
        if (onEndCallback) onEndCallback();
        return;
    }
    pauseMusic();
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const chineseVoice = speechSynthesis.getVoices().find(v => v.lang === 'zh-CN' || v.lang === 'zh-TW');
    if (chineseVoice) utterance.voice = chineseVoice;
    else utterance.lang = 'zh-CN';

    let rate = 0.9;
    hskLevel = Number(hskLevel) || 3;
    if (hskLevel <= 1) rate = 0.75;
    else if (hskLevel === 2) rate = 0.85;
    else if (hskLevel === 3) rate = 0.9;
    else rate = 1.0;
    utterance.rate = rate;

    utterance.onend = () => { resumeMusic(); if (onEndCallback) onEndCallback(); };
    utterance.onerror = () => { resumeMusic(); if (onEndCallback) onEndCallback(); };

    setTimeout(() => { speechSynthesis.speak(utterance); }, 50);
}

// Youtube API Ready
window.onYouTubeIframeAPIReady = function () {
    const opts = storage.get('hskpro_opts', {});
    if (opts.musicSource === 'youtube' && opts.musicVideoId) loadMusic(opts.musicVideoId, false);
    else if (opts.musicSource === 'local') loadLocalMusic(false);
}

async function loadLocalMusic(autoplay = true, file = null) {
    try {
        let fileBlob, fileName;
        if (file) {
            fileBlob = file; fileName = file.name;
        } else {
            const fileData = await getMusicFile();
            if (!fileData) return;
            fileBlob = new Blob([fileData.data], { type: fileData.type });
            fileName = fileData.name;
        }
        closeMusicPlayer(true);
        if (!html5Player) {
            html5Player = $('#html5MusicPlayer');
            html5Player.onplay = () => { isMusicPausedByApp = false; };
            html5Player.onpause = () => { if (html5Player.currentTime > 0 && !isMusicPausedByApp) isMusicPausedByApp = false; };
        }
        html5Player.src = URL.createObjectURL(fileBlob);
        html5Player.volume = 0.5;
        html5Player.style.display = 'block';
        $('#youtubePlayer').style.display = 'none';
        $('#musicTitle').textContent = fileName;
        $('#miniMusicPlayer').style.display = 'block';
        if (autoplay) await html5Player.play().catch(e => console.error(e));
    } catch (e) { toast('Lỗi tải nhạc cục bộ.', 'error'); }
}

function loadMusic(videoId, autoplay = true) {
    if (html5Player) { html5Player.pause(); html5Player.style.display = 'none'; }
    $('#miniMusicPlayer').style.display = 'block';
    $('#youtubePlayer').style.display = 'block';
    $('#musicTitle').textContent = 'Đang tải YouTube...';
    if (!window.YT) return;
    if (ytPlayer) {
        ytPlayer.loadVideoById(videoId);
        if (!autoplay) ytPlayer.pauseVideo();
    } else {
        ytPlayer = new YT.Player('youtubePlayer', {
            height: '64', width: '100%', videoId: videoId,
            playerVars: { 'playsinline': 1, 'controls': 1, 'autoplay': autoplay ? 1 : 0 },
            events: {
                'onReady': (e) => { if (autoplay) e.target.playVideo(); try { $('#musicTitle').textContent = e.target.getVideoData().title; } catch (e){} },
                'onStateChange': (e) => { if (e.data === YT.PlayerState.PAUSED) isMusicPausedByApp = false; }
            }
        });
    }
}

function pauseMusic() {
    isMusicPausedByApp = true;
    if (ytPlayer && ytPlayer.getPlayerState && ytPlayer.getPlayerState() === YT.PlayerState.PLAYING) ytPlayer.pauseVideo();
    if (html5Player && !html5Player.paused) html5Player.pause();
    const bg = $('#bg-video-container'); if (bg) bg.muted = true;
}

function resumeMusic() {
    if (!isMusicPausedByApp) return;
    isMusicPausedByApp = false;
    if (NEW.options.musicSource === 'youtube' && ytPlayer) ytPlayer.playVideo();
    else if (NEW.options.musicSource === 'local' && html5Player) html5Player.play();
    const bg = $('#bg-video-container'); if (bg) bg.muted = false;
}

async function closeMusicPlayer(internalCall = false) {
    if (ytPlayer) { ytPlayer.stopVideo(); ytPlayer.destroy(); ytPlayer = null; }
    if (html5Player) { html5Player.pause(); html5Player.src = ''; html5Player.style.display = 'none'; }
    $('#miniMusicPlayer').style.display = 'none';
    if (!internalCall) {
        $('#musicUrlInput').value = ''; $('#musicFileInput').value = '';
        NEW.options.musicVideoId = null; NEW.options.musicSource = null;
        storage.set('hskpro_opts', NEW.options);
        await deleteMusicFile();
        toast('Đã tắt nhạc nền.', 'info');
    }
}