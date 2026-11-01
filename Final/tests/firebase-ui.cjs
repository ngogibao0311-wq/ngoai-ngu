const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const elements=new Map(),element=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:'',disabled:false});return elements.get(id);};
const local=new Map([['lingo_firebase_web_config',JSON.stringify({apiKey:'test',authDomain:'test',projectId:'test',appId:'test'})]]);
let uploaded,restored=false,downloads=0,done,uploads=0,cloudReads=0;
const ready=new Promise(r=>done=r);
class MockURL extends URL {static createObjectURL(){return '';} static revokeObjectURL(){}}
const context={TextEncoder,JSON,URL:MockURL,Blob,setTimeout:()=>{},console:{error(){}},navigator:{onLine:true},confirm:()=>true,
 document:{readyState:'complete',getElementById:element,querySelector:()=>({append(){},click(){}}),createElement:tag=>tag==='a'?{click(){downloads++;}}:{querySelector:s=>element(s.slice(4))}},
 localStorage:{getItem:k=>local.get(k)??null,setItem:(k,v)=>local.set(k,v),removeItem:k=>local.delete(k)},
 Lingo:{prefix:'zh_',lang:'zh',name:'Tiếng Trung'},location:{hostname:'localhost',href:'http://localhost:5174/',origin:'http://localhost:5174',reload(){restored=true;}},
 LingoFirebaseBackup:{async upload(args){uploads++;uploaded=args;args.onProgress(1,3);return {byteLength:2000000};},async download(){cloudReads++;return {version:1,language:'zh',values:uploaded.data.values};}},
 loadSdk:async url=>url.includes('firebase-app')?{initializeApp:x=>x}:url.includes('firebase-auth')?{getAuth:()=>({currentUser:{uid:'test',email:'test@example.test'}}),onAuthStateChanged(auth,fn){fn(auth.currentUser);setImmediate(done);},getRedirectResult:async()=>null,GoogleAuthProvider:class{setCustomParameters(){}},signInWithPopup:async()=>{},signInWithRedirect:async()=>{},signOut:async()=>{}}:{getFirestore:()=>({}),doc:(...a)=>a.join('/')},
};
vm.createContext(context);
// Only replace the SDK loader; exercise the actual event handlers unchanged.
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../../firebase-connect.js'),'utf8').replaceAll('import(base+','loadSdk(base+'),context);
(async()=>{
 await ready;local.set('zh_hskpro_vocab',JSON.stringify([{hanzi:'学习',example:'中文'.repeat(500000)}]));
 await element('btnPushCloud').onclick();assert.ok(uploaded);assert.equal(uploaded.data.language,'zh');assert.ok(element('status').textContent.includes('Đã cập nhật Firebase'));
 assert.equal(downloads,0);assert.equal(cloudReads,0);
 context.NEW={vocab:[{hanzi:'新',vietnamese:'mới'}],srs:{'新':{box:2}},translations:[{text:'bản dịch mới'}],options:{apiKey:'DO_NOT_UPLOAD'}};
 await element('push').onclick();
 assert.equal(JSON.parse(uploaded.data.values.hskpro_vocab)[0].hanzi,'新');
 assert.equal(JSON.parse(uploaded.data.values.hskpro_srs)['新'].box,2);
 assert.equal(JSON.parse(uploaded.data.values.hskpro_translations)[0].text,'bản dịch mới');
 context.NEW.vocab.push({hanzi:'更新',vietnamese:'cập nhật'});
 await element('btnPushCloud').onclick();
 assert.equal(JSON.parse(uploaded.data.values.hskpro_vocab).length,2);
 assert.equal(downloads,0);assert.equal(cloudReads,0);assert.equal(restored,false);
 assert.match(element('status').textContent,/2 từ vựng/);
 const beforeCancel=uploads;context.confirm=()=>false;await element('push').onclick();assert.equal(uploads,beforeCancel);context.confirm=()=>true;
 context.navigator.onLine=false;uploaded=null;await element('push').onclick();assert.equal(uploaded,null);assert.match(element('status').textContent,/ngoại tuyến/);
 context.navigator.onLine=true;await element('btnPushCloud').onclick();await element('btnPullCloud').onclick();assert.equal(restored,true);assert.equal(downloads,1);
 assert.ok(!Object.keys(uploaded.data.values).some(k=>/key|opts|config/i.test(k)));
 console.log('PASS Firebase UI: repeated upload uses latest app data, upload never downloads/restores, cancel/offline handling, explicit restore backup, translations and secret exclusion.');
})().catch(e=>{console.error(e);process.exitCode=1});
