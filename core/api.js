/* ------------------------------ Gemini AI Integration ------------------------------ */
async function _callGeminiWithKey(prompt, apiKey, retries = 3, delay = 1000) {
    if (!apiKey) throw new Error('API Key không được cung cấp.');
    const selectedModel = NEW.options.aiModel || 'gemini-2.5-flash';
    const API_URL = `https://generativelanguage.googleapis.com/v1/models/${selectedModel}:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, topK: 1, topP: 1, maxOutputTokens: 8192 }
            })
        });

        if (!response.ok) {
            if (response.status === 429) {
                const errorData = await response.json();
                throw new Error(`(429) Hết hạn ngạch: ${errorData.error?.message}`);
            }
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `Lỗi API: ${response.status}`);
        }

        const data = await response.json();
        if (data.promptFeedback?.blockReason) throw new Error(`AI chặn yêu cầu: ${data.promptFeedback.blockReason}`);
        if (!data.candidates || data.candidates.length === 0) throw new Error("AI trả về phản hồi trống.");
        
        return data.candidates[0].content.parts[0].text;

    } catch (error) {
        if (error.message.includes("(429)")) throw error;
        if (retries > 0) {
            await new Promise(res => setTimeout(res, delay));
            return _callGeminiWithKey(prompt, apiKey, retries - 1, delay * 2);
        }
        throw error;
    }
}

async function callGemini(prompt) {
    const currentModel = NEW.options.aiModel || 'gemini-2.5-flash';
    const encryptedKeys = currentModel.includes('flash') ? (NEW.options.apiKeys || []) : (NEW.options.apiKeysPro || []);
    const keys = encryptedKeys.filter(Boolean).map(k => KeyVault.decrypt(k));

    if (keys.length === 0) {
        toast('Vui lòng thêm API Key trong Cài đặt.', 'error');
        throw new Error('API Key not found');
    }

    let startIndex = NEW.options.currentApiKeyIndex || 0;
    const currentKeyString = encryptedKeys[startIndex]; // Check against encrypted original
    let validStartIndex = keys.findIndex(k => k === KeyVault.decrypt(currentKeyString));
    if (validStartIndex === -1) validStartIndex = 0;

    for (let i = 0; i < keys.length; i++) {
        let keyIndexInValidList = (validStartIndex + i) % keys.length;
        const currentKey = keys[keyIndexInValidList];
        const originalKeyIndex = i; // Logic đơn giản hóa

        try {
            const result = await _callGeminiWithKey(prompt, currentKey);
            if (NEW.options.currentApiKeyIndex !== originalKeyIndex) {
                NEW.options.currentApiKeyIndex = originalKeyIndex;
                storage.set('hskpro_opts', NEW.options);
            }
            return result;
        } catch (error) {
            if (error.message.includes("(429)")) {
                console.warn(`Key ${originalKeyIndex + 1} hết hạn.`);
                if (!NEW.options.keyStatus) NEW.options.keyStatus = [null, null, null, null, null, null];
                NEW.options.keyStatus[originalKeyIndex] = todayStr();
                storage.set('hskpro_opts', NEW.options);
                if (typeof checkAndRenderKeyStatus === 'function') checkAndRenderKeyStatus();
                toast(`Key số ${originalKeyIndex + 1} hết hạn. Đổi key...`, 'warning');
            } else {
                throw error;
            }
        }
    }
    NEW.options.currentApiKeyIndex = 0;
    storage.set('hskpro_opts', NEW.options);
    throw new Error('All API Keys exhausted (429).');
}