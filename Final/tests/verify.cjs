const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const languageSource = fs.readFileSync(path.join(root, 'language.js'), 'utf8');
const legacySource = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const local = {};
Object.defineProperties(local, {
  getItem: { value(key) { return this[key] ?? null; } },
  setItem: { value(key, value) { this[key] = String(value); } },
  removeItem: { value(key) { delete this[key]; } }
});
function languageContext(lang) {
  const context = { URLSearchParams, URL, localStorage: local, location: { search: '?lang=' + lang, href: 'http://localhost/?lang=' + lang }, document: { documentElement: { dataset: {} } }, CustomEvent: class {}, window: { dispatchEvent() {}, confirm() { return false; } } };
  vm.createContext(context);
  vm.runInContext(languageSource, context);
  return context.window.Lingo;
}
(async () => {
  const en = languageContext('en'), zh = languageContext('zh');
  assert.notEqual(en.dbName, zh.dbName);
  assert.equal(JSON.parse(en.storageGet('hskpro_vocab'))[0].hanzi, 'hello');
  assert.equal(JSON.parse(zh.storageGet('hskpro_vocab'))[0].hanzi, '你好');
  en.storageSet('test_progress', 'saved English');
  assert.equal(zh.storageGet('test_progress'), null);
  languageContext('en');
  assert.equal(en.storageGet('test_progress'), 'saved English');
  const changed = JSON.parse(en.storageGet('hskpro_vocab'));
  changed.push({hanzi:'test',pinyin:'',vietnamese:'thử',hskLevel:1});
  en.storageSet('hskpro_vocab',JSON.stringify(changed));
  languageContext('en');
  assert.equal(JSON.parse(en.storageGet('hskpro_vocab')).length,21);
  for(const item of JSON.parse(en.storageGet('hskpro_classifiers'))) {
    assert.equal(typeof item.title,'string');assert.equal(typeof item.content,'string');
  }
  const prompt = en.adaptPrompt('Bài tiếng Trung HSK 1. JSON {"hanzi":"", "pinyin":""}');
  assert.ok(prompt.includes('"pinyin"'));
  assert.ok(prompt.includes('CEFR A1'));
  assert.ok(prompt.includes('TIẾNG ANH'));
  assert.equal(zh.adaptPrompt('中文'), '中文');
  en.clearProfile();
  assert.equal(en.storageGet('test_progress'), null);
  assert.equal(JSON.parse(zh.storageGet('hskpro_vocab'))[0].hanzi, '你好');
  console.log('PASS language seeding, profile isolation, reload persistence, classifier schema, AI output keys, scoped reset');

  const rateSource = legacySource.slice(legacySource.indexOf('function rate(v) {'), legacySource.indexOf('function updateProgress()'));
  const srs = { Vocabulary:require('../../vocabulary-core.js'), $:()=>({classList:{contains:()=>false,add(){}}}), persistVocabulary(vocab, scheduled){srs.NEW.srs=scheduled;return true;}, srsSessionMode:'review', srsRetryWords:new Set(), srsQueue:[], NEW: {srs: {hello: {box:1,reviewed:0}}}, cur: {hanzi:'hello'}, boxIntervals: {1:0,2:1,3:3,4:7,5:14}, srsIdx:0, storage:{set(){}}, updateProgress(){}, showCard(){srs.cur={hanzi:'NEXT_WORD'};}, bumpStreak(){}, logAction(type, word){srs.logged=word;}, checkAllBadges(){}, Date, Math };
  vm.createContext(srs);
  vm.runInContext(rateSource + '\nrate("easy");',srs);
  assert.equal(srs.NEW.srs.hello.box,3);
  assert.equal(srs.NEW.srs.hello.reviewed,1);
  assert.equal(srs.logged,'hello');
  assert.equal(srs.srsIdx,1);
  console.log('PASS SRS interval update and logging of the reviewed card');

  const exportSource = legacySource.slice(legacySource.indexOf('const doExportJSON = async'), legacySource.indexOf('// --- HÀM HIỂN THỊ BÁO CÁO LỖI ---'));
  let exported;
  const link={click(){},remove(){}};
  const ex={NEW:{vocab:[{hanzi:'hello'}],options:{apiKeys:['DUMMY_TEST_KEY'],apiKeysPro:['DUMMY_OTHER_KEY'],apiKey:'DUMMY_OLD_KEY',autoTTS:true}},Lingo:{lang:'en'},getAudios:async()=>[],getDocuments:async()=>[],getVideosFromDB:async()=>[],bufferToBase64:async()=>'',toast(){},Blob,URL:{createObjectURL(blob){exported=blob;return 'blob:test';}},document:{createElement(){return link;},body:{appendChild(){},removeChild(){}}},todayStr:()=> '2026-10-04',console,Date};
  vm.createContext(ex);
  await vm.runInContext(exportSource+'\ndoExportJSON();',ex);
  const json=JSON.parse(await exported.text());
  assert.deepEqual(json.textData.options.apiKeys,[]);
  assert.deepEqual(json.textData.options.apiKeysPro,[]);
  assert.equal(json.textData.options.apiKey,null);
  assert.equal(json.meta.language,'en');
  assert.equal(ex.NEW.options.apiKeys[0],'DUMMY_TEST_KEY');
  console.log('PASS backup excludes API keys, retains source settings, and includes language metadata');

  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
    const ref=match[1];if(/^(https?:|data:|#|mailto:)/.test(ref))continue;
    assert.ok(fs.existsSync(path.join(root,ref)), 'Missing local asset '+ref);
  }
  for(const filename of ['language.js','workspace.js','script.js'])new vm.Script(fs.readFileSync(path.join(root,filename),'utf8'),{filename});
  console.log('PASS local asset links and JavaScript syntax');
  console.log('Note: these checks do not verify browser UI, microphone, external APIs, or cloud sync.');
})().catch(error=>{console.error(error);process.exitCode=1;});
