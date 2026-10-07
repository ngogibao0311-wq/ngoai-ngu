/* Importing a vocabulary file is additive. Full backup restore stays in Settings. */
(() => {
    if (Lingo.lang === 'en') {
        for (const id of ['filterHSK', 'qHSK']) document.querySelectorAll('#' + id + ' option').forEach(option => { if (Number(option.value) > 6) option.remove(); });
    }
    const fileInput = document.getElementById('vocabFile');
    const retryMissed = document.createElement('button');
    retryMissed.className = 'btn btn-secondary mt-4'; retryMissed.id = 'vocabRetryMissed';
    retryMissed.textContent = 'Làm lại các câu sai';
    document.getElementById('qMissedList').before(retryMissed);
    retryMissed.onclick = () => {
        if (!qState.missed.length) return toast('Không có câu sai cần làm lại.', 'info');
        qState.questions = shuffle(qState.missed.map(q => ({ ...q, answered: false })));
        qState.missed = []; qState.i = 0; qState.score = 0; qState.isLoading = false;
        $('#qTotal').textContent = qState.questions.length; $('#qScore').textContent = '0';
        $('#quiz-results-view').classList.add('hidden'); $('#quiz-active-view').classList.remove('hidden');
        nextQ();
    };
    document.getElementById('vocabImportBtn').onclick = () => fileInput.click();
    for (const id of ['vocabStatus', 'vocabSort']) document.getElementById(id).onchange = renderVocab;
    document.getElementById('vocabGrid').addEventListener('click', event => {
        const button = event.target.closest('[data-more-vocab]');
        if (!button) return;
        const detail = button.closest('details');
        const words = filteredVocabulary().filter(v => vocabLevelGroup(v.hskLevel) === detail.dataset.level);
        const limit = Number(button.dataset.limit || 24) + 24;
        detail.querySelector('[data-grid-placeholder]').innerHTML = vocabPageHTML(words, limit);
        lucide.createIcons();
    });
    const download = (data, name) => {
        const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
        const a = document.createElement('a'); a.href = url; a.download = name; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    document.getElementById('vocabExportBtn').onclick = () => download({
        meta: { language: Lingo.lang, type: 'vocabulary', exportedAt: new Date().toISOString() },
        textData: { vocab: NEW.vocab, srs: NEW.srs }
    }, `tu-vung-${Lingo.lang}-${todayStr()}.json`);

    async function importVocabularyFile(file, button, updateExamples = false) {
        if (!file) return toast('Vui lòng chọn file trước!', 'warning');
        button.disabled = true;
        try {
            let rows;
            if (/\.json$/i.test(file.name)) {
                const data = JSON.parse(await file.text());
                if (data.meta?.language && data.meta.language !== Lingo.lang) throw new Error('Tệp thuộc ngôn ngữ khác. Hãy chuyển ngôn ngữ trước khi nhập.');
                rows = Array.isArray(data) ? data : data.textData?.vocab || data.vocab || data.tu_vung;
            } else if (/\.xlsx?$/i.test(file.name)) {
                if (typeof XLSX === 'undefined') throw new Error('Chưa tải được bộ đọc Excel. Hãy kiểm tra kết nối hoặc dùng JSON.');
                const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
                rows = XLSX.utils.sheet_to_json(workbook.Sheets.TuVung || workbook.Sheets[workbook.SheetNames[0]]);
            } else throw new Error('Chọn tệp JSON hoặc Excel.');
            if (!Array.isArray(rows) || !rows.length) throw new Error('Không tìm thấy danh sách từ vựng trong tệp.');
            const { report } = Vocabulary.merge(NEW.vocab, rows, { updateExamples });
            const modal = document.createElement('dialog');
            modal.className = 'card p-6'; modal.style.maxWidth = 'min(560px, 94vw)';
            const title = document.createElement('h3'); title.textContent = 'Xem trước nhập từ'; title.className = 'text-xl font-bold';
            const summary = document.createElement('p'); summary.className = 'my-4';
            summary.textContent = `Thêm ${report.added} từ mới; cập nhật ${report.enriched} dòng đã có; bỏ qua ${report.skipped} dòng trùng và ${report.invalid.length} dòng lỗi. ${report.conflicts} dòng có nội dung khác: giữ nội dung đang có.`;
            const note = document.createElement('p'); note.className = 'text-sm text-slate-400 mb-4';
            note.textContent = (updateExamples ? 'Nhận diện trùng theo từ, không dựa vào ví dụ. Ví dụ mới sẽ cập nhật vào từ cũ; ô ví dụ trống không xóa ví dụ đang có. ' : 'Chỉ bổ sung ô trống. ') + 'Giữ nguyên nghĩa, thông tin đang có và tiến độ học. Không nhập các mục khác trong tệp ở chế độ này.';
            const errors = document.createElement('p'); errors.textContent = report.invalid.slice(0, 5).map(e => `Dòng ${e.row}: ${e.reason}`).join('\n'); errors.style.whiteSpace = 'pre-line';
            const cancel = document.createElement('button'); cancel.className = 'btn btn-secondary'; cancel.textContent = 'Hủy'; cancel.onclick = () => modal.close();
            const apply = document.createElement('button'); apply.className = 'btn btn-primary'; apply.textContent = 'Nhập vào kho'; apply.disabled = !(report.added || report.enriched);
            apply.onclick = () => {
                try {
                    // Recompute against current state in case edits happened while preview was open.
                    const result = Vocabulary.merge(NEW.vocab, rows, { updateExamples });
                    const encoded = JSON.stringify(result.rows);
                    Lingo.storageSet('hskpro_vocab', encoded);
                    if (Lingo.storageGet('hskpro_vocab') !== encoded) throw new Error('Bộ nhớ máy không đủ. Hãy xuất bản sao lưu trước khi giải phóng dung lượng.');
                    NEW.vocab = result.rows;
                    renderVocab(); updateDashboardData();
                    modal.close(); toast(`Đã thêm ${result.report.added} từ, bổ sung ${result.report.enriched} dòng.`, 'success');
                } catch (error) { toast(error.message, 'error'); }
            };
            modal.append(title, summary, note, errors, cancel, apply);
            modal.addEventListener('close', () => modal.remove(), { once: true });
            document.body.append(modal); modal.showModal();
        } catch (error) { toast(error.message, 'error'); }
        finally { button.disabled = false; fileInput.value = ''; }
    }
    fileInput.onchange = () => importVocabularyFile(fileInput.files[0], document.getElementById('vocabImportBtn'));
    document.getElementById('btnImport').onclick = () => {
        if (document.getElementById('dataImportMode').value === 'restore') return handleImport();
        return importVocabularyFile(document.getElementById('excelInput').files[0], document.getElementById('btnImport'), true);
    };
})();
