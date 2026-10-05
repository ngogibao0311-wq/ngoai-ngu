/* ------------------------------ Constants ------------------------------ */
const sandboxComponents = [
    { char: '一', pinyin: 'yī', meaning: 'nhất (số một)' },
    { char: '丨', pinyin: 'gǔn', meaning: 'cổn (nét sổ)' },
    // ... (COPY TOÀN BỘ DANH SÁCH 214 BỘ THỦ VÀO ĐÂY) ...
    { char: '龠', pinyin: 'yuè', meaning: 'thước (sáo)' }
];

const sandboxCombinations = {
    '口马': { char: '吗', pinyin: 'ma', meaning: 'hạt trợ từ nghi vấn' },
    '木木': { char: '林', pinyin: 'lín', meaning: 'rừng cây' },
    // ...
};

const allBadges = {
    'reviews-10': { icon: 'star', title: 'Khởi đầu', desc: 'Hoàn thành 10 thẻ ôn tập.' },
    'streak-7': { icon: 'flame', title: 'Ngọn lửa', desc: 'Chuỗi 7 ngày học.' },
    'master-hsk1': { icon: 'shield', title: 'Chinh phục HSK 1', desc: 'Nắm vững tất cả từ HSK 1.' },
    // ... (Thêm các badge khác)
};

const themes = [
    { name: 'dark', displayName: 'Không gian tối', bg: '...' },
    { name: 'light', displayName: 'Anime nhẹ nhàng', bg: '...' },
    // ...
];