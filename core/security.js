/* --- BẢO MẬT: MODULE MÃ HÓA ĐƠN GIẢN --- */
const KeyVault = {
    _salt: 'HSK_PRO_SECURE_V3_',
    encrypt: function (text) {
        if (!text) return '';
        try { return btoa(this._salt + encodeURIComponent(text)); } catch (e) { return text; }
    },
    decrypt: function (text) {
        if (!text) return '';
        try {
            if (text.length < 20 || !text.endsWith('=')) return text;
            const step1 = atob(text);
            if (step1.startsWith(this._salt)) {
                return decodeURIComponent(step1.replace(this._salt, ''));
            }
            return text;
        } catch (e) { return text; }
    }
};

// --- MINI FIREWALL 2.0 ---
function cleanAiText(text) {
    if (!text) return '';
    return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '').replace(/#/g, '').replace(/\n/g, '<br>');
}

const MiniFirewall = {
    isEnabled: true,
    patterns: {
        script: /<script\b[^>]*>([\s\S]*?)<\/script>/gim,
        dangerousAttrs: /on\w+=/gim,
        sqlInjection: /UNION SELECT|INSERT INTO|DROP TABLE/gim,
        htmlTags: /<\/?[^>]+(>|$)/g,
        pinyin: /^[a-zA-Z0-9\s\u00C0-\u024F\u1E00-\u1EFF:,.?!]+$/
    },
    hasThreat: function (input) {
        if (!this.isEnabled || typeof input !== 'string') return false;
        if (this.patterns.script.test(input) || this.patterns.dangerousAttrs.test(input) || this.patterns.sqlInjection.test(input)) return true;
        return false;
    },
    sanitize: function (input) {
        if (typeof input !== 'string') return input;
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
        return input.replace(/[&<>"']/ig, (match) => (map[match]));
    },
    validate: function (type, value) {
        if (!this.isEnabled || !value || value.trim() === '') return { valid: true };
        value = value.trim();
        switch (type) {
            case 'hanzi':
                if (!/[\u4e00-\u9fa5]/.test(value)) return { valid: false, msg: 'Phải chứa ký tự Hán.' };
                if (/[@#$^*]/.test(value)) return { valid: false, msg: 'Chứa ký tự đặc biệt cấm.' };
                return { valid: true };
            case 'pinyin':
                if (!this.patterns.pinyin.test(value)) return { valid: false, msg: 'Pinyin không hợp lệ.' };
                return { valid: true };
            case 'length':
                if (value.length > 500) return { valid: false, msg: 'Quá dài (max 500).' };
                return { valid: true };
            default: return { valid: true };
        }
    }
};