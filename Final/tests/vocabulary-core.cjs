const assert = require('node:assert/strict');
const V = require('../../vocabulary-core.js');
const now = new Date(2026, 9, 7, 0, 5);
assert.equal(V.date(now), '2026-10-07');
assert.equal(V.fresh({box:1,reviewed:5}), false);
assert.equal(V.fresh({box:1,reviewed:0}), true);
assert.equal(V.fresh({box:3}), false); // Legacy progress is not reset.
const hard = V.schedule({box:5, reviewed:10,mastered:true}, 'hard', now);
assert.equal(hard.box,1); assert.equal(hard.mastered,false); assert.equal(hard.next,'2026-10-08');
assert.equal(V.status(hard,'2026-10-07'),'learning');
assert.equal(V.status(hard,'2026-10-08'),'due');
assert.equal(V.schedule({box:4,reviewed:6},'good',now).mastered,true);
assert.equal(V.schedule({box:1,reviewed:0},'easy',now).next,'2026-10-10');
const old = [{hanzi:'你好',pinyin:'nǐ hǎo',vietnamese:'xin chào',hskLevel:null,sourcePage:2}];
const before = JSON.stringify(old);
const result = V.merge(old,[{hanzi:'你好',vietnamese:'khác',example:'你好！',hskLevel:1},{hanzi:'书',vietnamese:'sách'},{hanzi:'书',vietnamese:'sách'}, {},{hanzi:'__proto__'}]);
assert.equal(JSON.stringify(old), before);
assert.equal(result.rows.length,2); assert.equal(result.rows[0].vietnamese,'xin chào');
assert.equal(result.rows[0].sourcePage,2); assert.equal(result.rows[0].example,'你好！');
assert.equal(result.rows[1].hskLevel,null); assert.equal(result.report.invalid.length,2);
assert.equal(result.report.added,1); assert.equal(result.report.enriched,1); assert.equal(result.report.skipped,1);
assert.equal(V.merge(result.rows,result.rows).report.added,0);
assert.equal(V.normalize({tu_vung:'适',nghia:'hợp',hsk:null,tu_loai:['tính từ']}).partOfSpeech,'tính từ');
assert.equal(V.answer(' Nǐ   Hǎo ', 'nǐ hǎo'),true);
assert.equal(V.answer('ni hao', 'nǐ hǎo'),false); // Tones remain meaningful.
assert.equal(V.answer('học', 'học; học tập',true),true);
assert.equal(V.answer('h', 'học; học tập',true),false);
assert.equal(V.unique([{hanzi:'书'},{hanzi:'书'},{hanzi:'你好'}]).length,2);
assert.deepEqual(V.choices([{vietnamese:'a'},{vietnamese:'a'},{vietnamese:'b'}],{vietnamese:'a'},'vietnamese',a=>a),['a','b']);
console.log('PASS vocabulary: local dates, legacy progress, bounded intervals, additive imports, metadata, duplicate handling and answer checking');

const update = V.merge([{hanzi:'学习',vietnamese:'học',example:'Cũ',sourcePage:9}], [{hanzi:' 学习\u200b ',vietnamese:'khác',example:'Ví dụ mới'}], {updateExamples:true});
assert.equal(update.rows.length,1); assert.equal(update.report.added,0); assert.equal(update.report.enriched,1);
assert.equal(update.rows[0].example,'Ví dụ mới'); assert.equal(update.rows[0].vietnamese,'học'); assert.equal(update.rows[0].sourcePage,9);
assert.equal(V.merge(update.rows,[{hanzi:'学习',example:''}],{updateExamples:true}).rows[0].example,'Ví dụ mới');
assert.equal(V.merge(update.rows,[{hanzi:'学习',example:'Ví dụ mới'}],{updateExamples:true}).report.enriched,0);
console.log('PASS data store merge: example changes never create another word; repeated imports and empty examples preserve data');
