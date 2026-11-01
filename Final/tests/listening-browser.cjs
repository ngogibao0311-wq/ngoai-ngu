const {chromium}=require('../Chuyen-doi-PDF/node_modules/playwright');
const assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
 const server=require('node:child_process').spawn(process.execPath,[path.join(__dirname,'../../server.cjs')],{env:{...process.env,PORT:'5188'},windowsHide:true,stdio:['ignore','pipe','pipe']});
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.addInitScript(()=>{
   window.spoken=[];window.lastUtterance=null;
   Object.defineProperty(window,'speechSynthesis',{value:{paused:false,getVoices:()=>[],cancel(){this.paused=false;if(window.lastUtterance?.onend)window.lastUtterance.onend();},speak(u){window.spoken.push(u.text);window.lastUtterance=u;},pause(){this.paused=true;},resume(){this.paused=false;}}});
  });
  await page.goto('http://localhost:5188/?lang=zh');await page.locator('#lingo-heading').waitFor();
  // Even an old enabled autoplay preference must not read words on navigation.
  await page.evaluate(()=>{NEW.options.autoTTS=true;});
  for (const group of ['vocabulary','listening','speaking','reading','writing','settings']) {
   await page.locator(`[data-section="${group}"]`).click();
   const targets=await page.locator('[data-target]').evaluateAll(nodes=>nodes.map(n=>n.dataset.target));
   for(const target of targets) {await page.locator(`[data-target="${target}"]`).click();await page.waitForTimeout(150);}
  }
  assert.equal(await page.evaluate(()=>spoken.length),0,'Navigation must never speak');
  await page.locator('[data-section="listening"]').click();
  const exercise={dialogue:[{role:'A',line:'你好。',pinyin:'Nǐ hǎo.'},{role:'B',line:'你好！',pinyin:'Nǐ hǎo!'}],questions:[{question:'Lời chào là gì?',options:{A:'Xin chào',B:'Tạm biệt',C:'Cảm ơn',D:'Xin lỗi'},answer:'A'},{question:'Có mấy người?',options:{A:'Một',B:'Hai',C:'Ba',D:'Bốn'},answer:'B'}]};
  await page.evaluate(exercise=>{window.testExercise=exercise;callGemini=async()=>JSON.stringify(exercise);},exercise);
  await page.locator('#startListeningBtn').click();await page.locator('#listeningContent').waitFor();
  assert.equal(await page.evaluate(()=>spoken.length),0);
  await page.locator('#checkListeningAnswersBtn').click();
  assert.match(await page.locator('#listeningFeedback').innerText(),/Chưa trả lời/);
  assert.equal(await page.locator('input[name="listen_q_0"]').first().isDisabled(),false);
  await page.locator('input[name="listen_q_0"][value="A"]').check();
  await page.reload();await page.locator('#lingo-heading').waitFor();
  await page.locator('[data-section="listening"]').click();
  assert.equal(await page.locator('input[name="listen_q_0"][value="A"]').isChecked(),true);
  await page.locator('input[name="listen_q_1"][value="B"]').check();
  await page.locator('#checkListeningAnswersBtn').click();
  assert.match(await page.locator('#listeningFeedback').innerText(),/2\/2/);
  await page.locator('#listenRetry').click();
  assert.equal(await page.locator('input[name="listen_q_0"]:checked').count(),0);
  await page.locator('#listeningAudioBtn').click();await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>spoken.length),1);
  await page.locator('#listeningPauseBtn').click();assert.equal(await page.evaluate(()=>speechSynthesis.paused),true);
  await page.locator('#listeningPauseBtn').click();assert.equal(await page.evaluate(()=>speechSynthesis.paused),false);
  await page.locator('#listening-tabs [data-tab="video"]').click();await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>spoken.length),1,'Canceled utterance must not chain to the next sentence');
  await page.locator('#listening-tabs [data-tab="dialogue"]').click();
  await page.evaluate(()=>{callGemini=async()=>JSON.stringify({dialogue:[],questions:[]});});
  await page.locator('#startListeningBtn').click();await page.waitForFunction(()=>!document.getElementById('startListeningBtn').disabled);
  assert.equal(await page.locator('#listeningQuestionList fieldset').count(),2,'Invalid AI response must preserve old exercise');
  await page.locator('#listeningAudioBtn').click();
  await page.locator('[data-target="resources:audio"]').click();await page.waitForTimeout(150);
  const count=await page.evaluate(()=>spoken.length);await page.waitForTimeout(200);
  assert.equal(await page.evaluate(()=>spoken.length),count);
  assert.deepEqual(errors,[]);
  console.log('PASS browser: all top/subtab navigation silent, canceled speech cannot chain, listening validation, pause/resume, retry, answers persist, incomplete grading, failed AI preserves old lesson');
 } finally {await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
