const { chromium } = require('../Chuyen-doi-PDF/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const out = path.join(__dirname, 'vocabulary-results'); fs.mkdirSync(out,{recursive:true});
(async () => {
 const server = require('node:child_process').spawn(process.execPath, [path.join(__dirname,'../../server.cjs')], {env:{...process.env,PORT:'5187'},windowsHide:true,stdio:['ignore','pipe','pipe']});
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(new Error('Test server exited '+code)));});
 const browser = await chromium.launch({channel:'msedge',headless:true});
 const errors=[];
 try {
  const page = await browser.newPage({viewport:{width:1366,height:900}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:5187/?lang=zh');
  await page.locator('#lingo-heading').waitFor();
  await page.evaluate(() => {
    NEW.vocab = Array.from({length:65},(_,i)=>({hanzi:'测试'+i,pinyin:'cè shì',vietnamese:'nghĩa '+i,hskLevel:1,example:'测试。\nCè shì.\nKiểm tra.',sourcePage:i}));
    NEW.vocab.push({hanzi:'适',vietnamese:'phù hợp',pinyin:'',hskLevel:null});
    NEW.srs={}; NEW.options.autoTTS=false;
    storage.set('hskpro_vocab',NEW.vocab); storage.set('hskpro_srs',NEW.srs);
    renderVocab();
  });
  await page.locator('#filterHSK').selectOption('1');
  assert.equal(await page.locator('#vocabGrid [data-hanzi]').count(),24);
  await page.locator('[data-more-vocab]').click();
  assert.equal(await page.locator('#vocabGrid [data-hanzi]').count(),48);
  await page.locator('#searchV').fill('nghia 64');
  await page.waitForFunction(()=>document.querySelectorAll('#vocabGrid [data-hanzi]').length===1);
  await page.locator('[data-act="learn-new"]').click();
  await page.locator('#srsShowAnswerBtn').click();
  await page.locator('#rate-hard').click();
  assert.equal(await page.evaluate(()=>srsQueue.length),2);
  await page.locator('#srsShowAnswerBtn').click();
  await page.locator('#rate-good').click();
  assert.equal(await page.evaluate(()=>NEW.srs['测试64'].reviewed),1);
  assert.equal(await page.locator('#srsEmpty').isVisible(),true);
  assert.equal(await page.evaluate(()=>Vocabulary.fresh(NEW.srs['测试64'])),false);
  await page.locator('[data-target="learn"]').click();
  await page.locator('#searchV').fill('');
  await page.locator('#vocabStatus').selectOption('learning');
  assert.equal(await page.locator('#vocabGrid [data-hanzi]').count(),1);
  const before=await page.evaluate(()=>JSON.stringify(NEW.srs));
  await page.locator('[data-act="cram"]').click();
  await page.locator('#srsShowAnswerBtn').click(); await page.locator('#rate-easy').click();
  assert.equal(await page.evaluate(()=>JSON.stringify(NEW.srs)),before);
  await page.locator('[data-target="learn"]').click();
  await page.locator('#vocabStatus').selectOption('all');
  const file=Buffer.from(JSON.stringify({textData:{vocab:[{hanzi:'测试0',example:'different',vietnamese:'overwrite?'},{hanzi:'新词',pinyin:'xīn cí',vietnamese:'từ mới',hskLevel:null}]}}));
  await page.locator('#vocabFile').setInputFiles({name:'words.json',mimeType:'application/json',buffer:file});
  await page.getByRole('button',{name:'Nhập vào kho',exact:true}).click();
  assert.equal(await page.evaluate(()=>NEW.vocab.length),67);
  assert.equal(await page.evaluate(()=>NEW.vocab[0].vietnamese),'nghĩa 0');
  await page.reload(); await page.locator('#lingo-heading').waitFor();
  assert.equal(await page.evaluate(()=>NEW.vocab.length),67);
  assert.equal(await page.evaluate(()=>NEW.srs['测试64'].reviewed),1);
  await page.locator('#filterHSK').selectOption('unknown');
  assert.equal(await page.locator('#vocabGrid [data-hanzi]').count(),2);
  // Edit renaming preserves progress and source metadata.
  await page.evaluate(()=>{NEW.vocab[0].hanzi='测试';NEW.srs['测试']={box:3,reviewed:4,next:'2026-12-01'};openEdit(NEW.vocab[0]);});
  await page.locator('#fHanzi').fill('试验'); await page.locator('#btnSave').click();
  assert.equal(await page.evaluate(()=>NEW.srs['试验'].reviewed),4);
  assert.equal(await page.evaluate(()=>NEW.vocab[0].sourcePage),0);
  // A listening question must never display the word or its transcription.
  await page.locator('[data-target="quiz"]').click();
  await page.locator('#qHSK').selectOption('1');
  await page.locator('#qVocab').uncheck(); await page.locator('#qTyping').uncheck();
  await page.locator('#qGrammar').uncheck(); await page.locator('#qClassifier').uncheck();
  await page.locator('#qAudio').check(); await page.locator('#qCount').fill('5');
  await page.locator('#startQuiz').click();
  assert.equal(await page.locator('#qAudioBtn').isVisible(),true);
  assert.ok(!(await page.locator('#qBody').innerText()).includes('测试'));
  await page.locator('label[for="opt0"]').click(); await page.locator('#qCheckBtn').click();
  const score=await page.evaluate(()=>qState.score);
  await page.evaluate(()=>checkAnswer());
  assert.equal(await page.evaluate(()=>qState.score),score);
  // Finish quiz and retry mistakes without requesting AI.
  await page.evaluate(() => { qState.i=qState.questions.length; showQuizResults(); });
  if (await page.evaluate(()=>qState.missed.length)) {
    await page.locator('#vocabRetryMissed').click();
    assert.equal(await page.evaluate(()=>qState.questions.some(q=>q.answered)),false);
  }
  await page.locator('[data-target="stats"]').click();
  assert.equal(await page.locator('#statV').innerText(),'67');
  assert.ok((await page.locator('#logList').innerText()).includes('Ôn từ'));
  // Due queue excludes untouched words and practice never creates progress.
  await page.evaluate(()=>{NEW.srs['试验'].next='2020-01-01';buildSRSQueue();});
  assert.equal(await page.evaluate(()=>srsQueue.length),1);
  // Local dictionary search supports unaccented input and multiple matches.
  await page.evaluate(()=>{$('#libInput').value='nghia';handleCheckVocabLibrary();});
  assert.ok((await page.locator('#libResultArea').innerText()).includes('kết quả'));
  // Missing pronunciation must not prevent editing source vocabulary.
  await page.evaluate(()=>openEdit(NEW.vocab.find(v=>v.hanzi==='适')));
  await page.locator('#fVN').fill('phù hợp "với" & thích hợp');
  await page.locator('#btnSave').click();
  await page.evaluate(()=>openEdit(NEW.vocab.find(v=>v.hanzi==='适')));
  assert.equal(await page.locator('#fVN').inputValue(),'phù hợp "với" & thích hợp');
  await page.locator('#btnDelete').click(); await page.locator('#confirm-ok').click();
  assert.equal(await page.evaluate(()=>NEW.vocab.some(v=>v.hanzi==='适')),false);
  // Storage failure must keep the old in-memory data and display an error.
  assert.equal(await page.evaluate(()=>{
    const before=JSON.stringify(NEW.vocab), original=Lingo.storageSet;
    Lingo.storageSet=()=>{};
    const ok=persistVocabulary([...NEW.vocab,{hanzi:'不保存'}],NEW.srs);
    Lingo.storageSet=original;
    return !ok && JSON.stringify(NEW.vocab)===before;
  }),true);
  await page.locator('[data-target="learn"]').click();
  await page.screenshot({path:path.join(out,'desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:path.join(out,'mobile.png'),fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
  await page.setViewportSize({width:1366,height:900});
  // The Data Store defaults to updating existing words, including examples.
  await page.locator('[data-section="settings"]').click();
  await page.locator('[data-target="settings:data"]').click();
  assert.equal(await page.locator('#dataImportMode').inputValue(),'merge');
  const importBefore = await page.evaluate(()=>({count:NEW.vocab.length,srs:JSON.stringify(NEW.srs),word:NEW.vocab.find(v=>v.hanzi==='试验')}));
  const updatedFile = {name:'updated.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({textData:{vocab:[{...importBefore.word,example:'新的例子。'}],srs:{}}}))};
  await page.locator('#excelInput').setInputFiles(updatedFile); await page.locator('#btnImport').click();
  await page.getByRole('button',{name:'Nhập vào kho',exact:true}).click();
  assert.equal(await page.evaluate(()=>NEW.vocab.length),importBefore.count);
  assert.equal(await page.evaluate(()=>NEW.vocab.find(v=>v.hanzi==='试验').example),'新的例子。');
  assert.equal(await page.evaluate(()=>JSON.stringify(NEW.srs)),importBefore.srs);
  await page.locator('#btnImport').click();
  assert.equal(await page.getByRole('button',{name:'Nhập vào kho',exact:true}).isDisabled(),true);
  await page.getByRole('button',{name:'Hủy',exact:true}).click();
  const xlsxBase64 = await page.evaluate(()=>{
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet([{hanzi:'试验',example:'Ví dụ Excel mới'}]),'TuVung');
    return XLSX.write(wb,{bookType:'xlsx',type:'base64'});
  });
  await page.locator('#excelInput').setInputFiles({name:'examples.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from(xlsxBase64,'base64')});
  await page.locator('#btnImport').click();await page.getByRole('button',{name:'Nhập vào kho',exact:true}).click();
  assert.equal(await page.evaluate(()=>NEW.vocab.length),importBefore.count);
  assert.equal(await page.evaluate(()=>NEW.vocab.find(v=>v.hanzi==='试验').example),'Ví dụ Excel mới');
  assert.equal(await page.evaluate(()=>JSON.stringify(NEW.srs)),importBefore.srs);
  // Separate English profile exercises quoted words and IPA.
  await page.goto('http://localhost:5187/?lang=en'); await page.locator('#lingo-heading').waitFor();
  await page.evaluate(()=>openEdit());
  await page.locator('#fHanzi').fill("don't"); await page.locator('#fPinyin').fill('/dəʊnt/');
  await page.locator('#fVN').fill('đừng'); await page.locator('#btnSave').click();
  await page.evaluate(()=>openLibDetail("don't"));
  assert.ok((await page.locator('#libDetailContent').innerText()).includes("don't"));
  await page.reload(); await page.locator('#lingo-heading').waitFor();
  assert.equal(await page.evaluate(()=>NEW.vocab.some(v=>v.hanzi==="don't")),true);
  assert.equal(await page.evaluate(()=>NEW.vocab.some(v=>v.hanzi==='试验')),false);
  assert.deepEqual(errors,[]);
  console.log('PASS browser: paging/search, learn/retry/end, independent practice, additive import/reload, rename/progress, audio quiz, double grading, mobile overflow');
 } finally { await browser.close(); server.kill(); fs.writeFileSync(path.join(out,'errors.json'),JSON.stringify(errors,null,2)); }
})().catch(e=>{console.error(e);process.exitCode=1;});
