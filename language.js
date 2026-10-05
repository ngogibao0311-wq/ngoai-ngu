/* Shared language profile. Storage is local and isolated by learning language. */
(() => {
  const params = new URLSearchParams(location.search);
  let remembered = 'zh';
  try { remembered = localStorage.getItem('lingo_active_language') || 'zh'; } catch {}
  const requested = params.get('lang');
  const lang = ['en', 'zh'].includes(requested) ? requested : (['en', 'zh'].includes(remembered) ? remembered : 'zh');
  const prefix = 'lingo_full_' + lang + '_';
  const read = key => { try { return localStorage.getItem(prefix + key); } catch { return null; } };
  const write = (key, value) => {
    try { localStorage.setItem(prefix + key, value); }
    catch { window.dispatchEvent(new CustomEvent('lingo-storage-error')); }
  };
  window.Lingo = {
    lang, prefix, locale: lang === 'en' ? 'en-US' : 'zh-CN',
    name: lang === 'en' ? 'Tiếng Anh' : 'Tiếng Trung',
    dbName: 'LingoFullDB_' + lang,
    storageGet: read, storageSet: write,
    storageRemove: key => localStorage.removeItem(prefix + key),
    clearProfile() { Object.keys(localStorage).filter(k => k.startsWith(prefix)).forEach(k => localStorage.removeItem(k)); },
    changeLanguage(next) {
      if (!['en', 'zh'].includes(next) || next === lang) return;
      if (!window.confirm('Chuyển sang ' + (next === 'en' ? 'tiếng Anh' : 'tiếng Trung') + '? Hãy lưu biểu mẫu đang nhập trước khi chuyển. Dữ liệu đã lưu của mỗi ngôn ngữ được giữ riêng.')) return;
      localStorage.setItem('lingo_active_language', next);
      const url = new URL(location.href); url.searchParams.set('lang', next); location.href = url.href;
    },
    level(n) { return lang === 'en' ? ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'][Number(n) - 1] || 'CEFR' : 'HSK ' + n; },
    adaptPrompt(prompt) {
      if (lang !== 'en') return prompt;
      const task = String(prompt).replace(/tiếng Trung/gi, 'tiếng Anh').replace(/Trung Quốc/gi, 'Anh ngữ').replace(/Hán tự/gi, 'từ tiếng Anh').replace(/chữ Hán/gi, 'từ tiếng Anh').replace(/HSK\s*(?:Cấp độ\s*)?([1-6])/gi, (_, n) => 'CEFR ' + this.level(n));
      return 'BẠN ĐANG HỖ TRỢ HỌC TIẾNG ANH CHO NGƯỜI VIỆT. Từ, ví dụ, bài đọc và hội thoại ngôn ngữ đích phải bằng tiếng Anh; giải thích bằng tiếng Việt. Ngoại lệ: nhiệm vụ yêu cầu viết/sửa đoạn tiếng Việt, dịch sang tiếng Việt hoặc từ khóa hình ảnh phải giữ đúng ngôn ngữ được yêu cầu. Giữ nguyên tên khóa JSON mà yêu cầu gốc quy định (hanzi, zh, chinese, pinyin, hskLevel nếu có): hanzi/zh/chinese chứa tiếng Anh, pinyin chứa IPA, hskLevel là số 1–6 tương ứng A1–C2. Không dịch tên khóa JSON sang tên khác. Các ví dụ tiếng Trung trong khuôn mẫu chỉ minh họa cấu trúc; hãy thay nội dung bằng tiếng Anh.\n\n' + task + '\n\nGiữ đúng cấu trúc đầu ra và ngôn ngữ của từng trường.';
    }
  };
  document.documentElement.dataset.learnLang = lang;
  function seed(key, value) { if (read(key) === null) write(key, JSON.stringify(value)); }
  const english = [
    ['hello','/həˈləʊ/','xin chào','Hello, my name is Anna.',1,'Thán từ'],
    ['friend','/frend/','người bạn','She is my best friend.',1,'Danh từ'],
    ['learn','/lɜːrn/','học','I learn English every day.',1,'Động từ'],
    ['book','/bʊk/','quyển sách','This book is interesting.',1,'Danh từ'],
    ['water','/ˈwɔːtər/','nước','I drink water every morning.',1,'Danh từ'],
    ['family','/ˈfæməli/','gia đình','I live with my family.',1,'Danh từ'],
    ['happy','/ˈhæpi/','vui vẻ','I am happy to meet you.',1,'Tính từ'],
    ['school','/skuːl/','trường học','My school is near my house.',1,'Danh từ'],
    ['breakfast','/ˈbrekfəst/','bữa sáng','I have breakfast at seven.',1,'Danh từ'],
    ['travel','/ˈtrævəl/','du lịch','We travel by train.',2,'Động từ'],
    ['weather','/ˈweðər/','thời tiết','The weather is nice today.',2,'Danh từ'],
    ['practice','/ˈpræktɪs/','luyện tập','You need to practice every day.',2,'Động từ'],
    ['improve','/ɪmˈpruːv/','cải thiện','I want to improve my English.',2,'Động từ'],
    ['experience','/ɪkˈspɪəriəns/','trải nghiệm','It was a wonderful experience.',3,'Danh từ'],
    ['opportunity','/ˌɑːpərˈtuːnəti/','cơ hội','This is a great opportunity to learn.',3,'Danh từ'],
    ['confident','/ˈkɑːnfɪdənt/','tự tin','I feel confident when I speak.',3,'Tính từ'],
    ['perspective','/pərˈspektɪv/','góc nhìn','Travel can change your perspective.',4,'Danh từ'],
    ['sustainable','/səˈsteɪnəbl/','bền vững','We need a sustainable solution.',4,'Tính từ'],
    ['nuance','/ˈnuːɑːns/','sắc thái','Notice the nuance in her response.',5,'Danh từ'],
    ['meticulous','/məˈtɪkjələs/','tỉ mỉ','She is meticulous about her work.',6,'Tính từ']
  ];
  const chinese = [
    ['你好','nǐ hǎo','xin chào','你好，我叫小林。',1,'Thán từ'],
    ['谢谢','xièxie','cảm ơn','谢谢你的帮助。',1,'Động từ'],
    ['朋友','péngyou','bạn bè','他是我的好朋友。',1,'Danh từ'],
    ['学习','xuéxí','học tập','我每天学习中文。',1,'Động từ'],
    ['水','shuǐ','nước','我想喝水。',1,'Danh từ'],
    ['书','shū','quyển sách','我喜欢看书。',1,'Danh từ'],
    ['学校','xuéxiào','trường học','我去学校。',1,'Danh từ'],
    ['高兴','gāoxìng','vui vẻ','很高兴认识你。',1,'Tính từ'],
    ['银行','yínháng','ngân hàng','我去银行换钱。',3,'Danh từ'],
    ['旅行','lǚxíng','du lịch','我喜欢旅行。',3,'Động từ']
  ];
  const words = (lang === 'en' ? english : chinese).map(([hanzi,pinyin,vietnamese,example,hskLevel,partOfSpeech])=>({hanzi,pinyin,vietnamese,example,hskLevel,partOfSpeech,tags:[]}));
  seed('hskpro_vocab', words);
  seed('hskpro_srs', {});
  seed('hskpro_grammar', lang === 'en'
    ? [{title:'Hiện tại đơn',content:'Dùng để nói về thói quen, sự thật hoặc việc lặp lại. Với he/she/it, thêm -s hoặc -es vào động từ.',example:'She reads a book every evening.',hskLevel:1}]
    : [{title:'Câu với 是',content:'是 dùng để nối chủ ngữ với danh từ hoặc cụm danh từ.',example:'我是学生。',hskLevel:1}]);
  seed('hskpro_rules',lang==='en'?[{title:'A và an',content:'Dùng an trước âm nguyên âm, a trước âm phụ âm.',example:'an apple; a university',hskLevel:1,tags:['mạo từ']}]:[]);
  seed('hskpro_idioms',lang==='en'?[{title:'a piece of cake',content:'Rất dễ, dễ như ăn bánh.',example:'The test was a piece of cake.',hskLevel:3,tags:['thành ngữ']}]:[]);
  if(lang==='en')seed('hskpro_classifiers',[
    {title:'a cup of',content:'Một tách, dùng với đồ uống.',example:'a cup of tea',hskLevel:1},
    {title:'a piece of',content:'Một miếng hoặc một mẩu của vật không đếm được.',example:'a piece of paper',hskLevel:1},
    {title:'a bottle of',content:'Một chai, dùng với chất lỏng.',example:'a bottle of water',hskLevel:1},
    {title:'a pair of',content:'Một đôi, dùng với vật đi theo cặp.',example:'a pair of shoes',hskLevel:1}
  ]);
  seed('hskpro_reading',lang==='en'?[
    {title:'A morning routine',level:1,content:'My name is Anna. Every morning, I get up at seven. I drink a glass of water and have breakfast with my family. Then I walk to school. In the evening, I read a book and practice English for fifteen minutes.'},
    {title:'Learning something new',level:2,content:'Learning a new language takes time and practice. You do not need to study for hours every day. Start with a small goal. Read a short story, learn five new words, or talk to a friend. Small habits can make a big difference.'}
  ]:[
    {title:'我的一天 · Một ngày của tôi',level:1,content:'我叫小林。我住在河内。我每天早上七点起床，八点去学校。我喜欢学习中文，也喜欢看书。我的朋友叫小明。我们星期天一起去图书馆。'},
    {title:'学习中文 · Học tiếng Trung',level:2,content:'我喜欢学习中文。我每天学习五个新词，听一个小故事。我和朋友一起练习说中文。学习语言需要时间，也需要每天练习。'}
  ]);
  seed('hskpro_dialogues',lang==='en'?[{title:'Meeting a new friend',lines:[{role:'A',zh:'Hello! What is your name?',pinyin:'',vi:'Xin chào! Bạn tên là gì?'},{role:'B',zh:'My name is Linh. Nice to meet you.',pinyin:'',vi:'Tôi tên là Linh. Rất vui được gặp bạn.'},{role:'A',zh:'Nice to meet you too.',pinyin:'',vi:'Tôi cũng rất vui được gặp bạn.'}]}]:[{title:'Làm quen',lines:[{role:'A',zh:'你好！你叫什么名字？',pinyin:'Nǐ hǎo! Nǐ jiào shénme míngzi?',vi:'Xin chào! Bạn tên là gì?'},{role:'B',zh:'我叫小林。很高兴认识你。',pinyin:'Wǒ jiào Xiǎolín. Hěn gāoxìng rènshi nǐ.',vi:'Tôi tên là Tiểu Lâm. Rất vui được làm quen với bạn.'}]}]);
  seed('hskpro_opts',{autoTTS:true,showPinyin:true,plainFont:false,dialogueDelay:5000,apiKeys:['','','','','',''],apiKeysPro:['','','','','',''],keyStatus:[],currentApiKeyIndex:0,bgSettings:{posX:50,posY:50,size:'cover',opacity:100,contrast:100,brightness:100,saturate:100,hue:0,animation:'none'}});
})();
