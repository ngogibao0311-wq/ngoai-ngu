/* Shared vocabulary rules. No writes or migrations run when this module loads. */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.Vocabulary = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const key = value => String(value ?? '').normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').trim().replace(/\s+/g, ' ').toLowerCase();
    const text = value => String(value ?? '').trim();
    const date = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    function fresh(s) { return !s || (!(Number(s.reviewed) > 0) && !(Number(s.box) > 1) && !s.mastered); }
    function status(s, today = date()) {
        if (fresh(s)) return 'new';
        if (!s.next || s.next <= today) return 'due';
        return s.mastered ? 'mastered' : 'learning';
    }
    function unique(rows) {
        const seen = new Set();
        return rows.filter(v => { const k = key(v.hanzi); if (!k || seen.has(k)) return false; seen.add(k); return true; });
    }
    function schedule(previous, rating, now = new Date()) {
        if (!['hard', 'good', 'easy'].includes(rating)) throw new Error('Invalid rating');
        const s = { box: 1, reviewed: 0, ...previous };
        const oldBox = Math.max(1, Math.min(5, Number(s.box) || 1));
        s.box = rating === 'hard' ? 1 : Math.min(5, oldBox + (rating === 'easy' ? 2 : 1));
        const days = { 1: 1, 2: 1, 3: 3, 4: 7, 5: 14 }[s.box];
        const next = new Date(now); next.setDate(next.getDate() + days);
        s.next = date(next); s.lastReviewed = date(now);
        s.reviewed = (Number(s.reviewed) || 0) + 1;
        s.lapses = (Number(s.lapses) || 0) + (rating === 'hard' ? 1 : 0);
        s.mastered = s.box >= 5 && s.reviewed >= 7;
        return s;
    }
    function normalize(row) {
        if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('Dòng không phải một từ vựng.');
        const hanzi = text(row.hanzi ?? row.tu_vung);
        if (!hanzi || ['__proto__', 'constructor', 'prototype'].includes(key(hanzi))) throw new Error('Thiếu từ hoặc tên từ không hợp lệ.');
        if (/<\/?[a-z][^>]*>/i.test(hanzi)) throw new Error('Từ chứa thẻ HTML.');
        const rawLevel = row.hskLevel ?? row.hsk;
        const hskLevel = rawLevel == null || rawLevel === '' ? null : Number(rawLevel);
        if (hskLevel !== null && (!Number.isInteger(hskLevel) || hskLevel < 1 || hskLevel > 9)) throw new Error('HSK phải là 1–9 hoặc để trống.');
        const tags = Array.isArray(row.tags) ? row.tags : text(row.tags).split(',');
        return { ...row, hanzi, pinyin: text(row.pinyin), vietnamese: text(row.vietnamese ?? row.nghia),
            hskLevel, example: text(row.example), partOfSpeech: Array.isArray(row.tu_loai) ? row.tu_loai.join(', ') : text(row.partOfSpeech),
            tags: [...new Set(tags.map(text).filter(Boolean))] };
    }
    // Preserve existing rows and nonempty values, including alternate readings and source metadata.
    function merge(existing, incoming, { updateExamples = false } = {}) {
        const rows = existing.map(v => ({ ...v }));
        const byKey = new Map(rows.map((v, i) => [key(v.hanzi), i]));
        const report = { added: 0, enriched: 0, skipped: 0, invalid: [], conflicts: 0 };
        incoming.forEach((raw, index) => {
            let v; try { v = normalize(raw); } catch (e) { report.invalid.push({ row: index + 1, reason: e.message }); return; }
            const k = key(v.hanzi);
            if (!byKey.has(k)) { byKey.set(k, rows.length); rows.push(v); report.added++; return; }
            const current = rows[byKey.get(k)]; let changed = false, conflict = false;
            for (const field of ['pinyin', 'vietnamese', 'example', 'partOfSpeech', 'image', 'hskLevel']) {
                if (field === 'example' && updateExamples && text(v.example) && text(current.example) !== text(v.example)) { current.example = v.example; changed = true; continue; }
                if ((current[field] == null || current[field] === '') && v[field] != null && v[field] !== '') { current[field] = v[field]; changed = true; }
                else if (v[field] && current[field] && text(current[field]) !== text(v[field])) conflict = true;
            }
            if (conflict) report.conflicts++;
            if (changed) report.enriched++; else report.skipped++;
        });
        return { rows, report };
    }
    function answer(input, expected, meaning = false) {
        const clean = s => key(s).replace(/\s+/g, ' ').replace(/[.!。！]+$/g, '');
        const value = clean(input);
        if (!value) return false;
        return (meaning ? text(expected).split(/[;；\n]/) : [expected]).some(s => clean(s) === value) || clean(expected) === value;
    }
    function choices(pool, row, field, shuffle) {
        const correct = text(row[field]);
        const wrong = [...new Set(pool.map(v => text(v[field])).filter(v => v && v !== correct))];
        return shuffle([correct, ...shuffle(wrong).slice(0, 3)]);
    }
    return { key, date, fresh, status, unique, schedule, normalize, merge, answer, choices };
});
