/* ------------------------------ Data Model ------------------------------ */
const defaultOptions = {
    autoTTS: true, showPinyin: true, plainFont: false, dialogueDelay: 5000,
    apiKeys: ['', '', '', '', '', ''], currentApiKeyIndex: 0,
    keyStatus: [null, null, null, null, null, null], musicSource: null,
    bgSettings: { posX: 50, posY: 50, size: 'cover', opacity: 100, contrast: 100, brightness: 100, saturate: 100, hue: 0, animation: 'none' }
};

let loadedOptions = storage.get('hskpro_opts', defaultOptions);
if (loadedOptions.apiKey !== undefined && loadedOptions.apiKeys === undefined) {
    const oldKey = loadedOptions.apiKey;
    loadedOptions = { ...defaultOptions, ...loadedOptions, apiKeys: [oldKey, '', '', '', '', ''] };
    delete loadedOptions.apiKey;
    storage.set('hskpro_opts', loadedOptions);
}

const NEW = {
    vocab: storage.get('hskpro_vocab', []),
    ignored_words: storage.get('hskpro_ignored_words', []),
    srs: storage.get('hskpro_srs', {}),
    grammar: storage.get('hskpro_grammar', []),
    rules: storage.get('hskpro_rules', []),
    classifiers: storage.get('hskpro_classifiers', []),
    idioms: storage.get('hskpro_idioms', []),
    dialogues: storage.get('hskpro_dialogues', []),
    reading: storage.get('hskpro_reading', []),
    translations: storage.get('hskpro_translations', []),
    logs: storage.get('hskpro_logs', []),
    badges: storage.get('hskpro_badges', []),
    streak: storage.get('hskpro_streak', { count: 0, last: null }),
    options: loadedOptions,
    customCodeHistory: storage.get('hskpro_custom_code_history', []),
    customUserCSS: storage.get('hskpro_custom_css_user', ''),
    customUserJS: storage.get('hskpro_custom_js_user', ''),
    customUserHTML: storage.get('hskpro_custom_html_user', '')
};

// Default Data Init
if (NEW.vocab.length === 0) {
    NEW.vocab = [{ hanzi: '你好', pinyin: 'nǐ hǎo', vietnamese: 'xin chào', hskLevel: 1 }];
    storage.set('hskpro_vocab', NEW.vocab);
}