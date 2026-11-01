const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const local=new Map();
const options={aiModel:'openai'};
function boot(){
 const elements=new Map();
 const element=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:'',hidden:false,addEventListener(){},style:{}});return elements.get(id)};
 const box={querySelector:id=>element(id.slice(1)),nextElementSibling:null};
 const select=element('aiModelSelect');select.parentElement={parentElement:{after(){}}};
 const context={document:{getElementById:element,createElement:()=>box,querySelectorAll:()=>[]},NEW:{options},storage:{set(){}},Lingo:{storageGet:k=>local.get(k)||null,storageSet:(k,v)=>local.set(k,v),storageRemove:k=>local.delete(k)},KeyVault:{encrypt:x=>x,decrypt:x=>x},updateSystemStatusUI(){},location:{protocol:'http:'},window:{},fetch:async(url,opts)=>{context.lastRequest={url,data:JSON.parse(opts.body)};return {ok:true,status:200,json:async()=>({text:'OK'})}}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../../ai-providers.js'),'utf8'),context);
 return {context,element};
}
(async()=>{
 let app=boot();app.element('openai-session-key').value='dummy-openai-key';app.element('openai-model').value='gpt-4.1-mini';app.element('openai-session-save').onclick();
 assert.equal(local.get('openai_api_key'),'dummy-openai-key');
 app=boot();assert.equal(app.element('openai-session-key').value,'dummy-openai-key');
 await app.context.window.LingoOpenAI.generate('hello');assert.equal(app.context.lastRequest.data.key,'dummy-openai-key');
 assert.equal(app.context.lastRequest.data.model,'gpt-4.1-mini');
 app.element('openai-model').value='gpt-5.6-Sol';
 app.element('openai-session-save').onclick();
 assert.equal(options.openaiModel,'gpt-5.6-sol');
 await app.context.window.LingoOpenAI.generate('hello');
 assert.equal(app.context.lastRequest.data.model,'gpt-5.6-sol');
 options.openaiModel='gpt-5.6-Sol';
 app=boot();assert.equal(options.openaiModel,'gpt-5.6-sol');
 assert.equal(app.element('openai-model').value,'gpt-5.6-sol');
 const originalFetch=app.context.fetch;
 app.context.fetch=async()=>({ok:false,status:404,json:async()=>({error:'Không tìm thấy model custom-model hoặc khóa không có quyền dùng model này.',code:'model_not_found'})});
 await assert.rejects(()=>app.context.window.LingoOpenAI.generate('hi'),/Không tìm thấy model custom-model/);
 app.context.fetch=async()=>({ok:false,status:404,json:async()=>{throw Error('HTML response');}});
 await assert.rejects(()=>app.context.window.LingoOpenAI.generate('hi'),/Không tìm thấy đường gọi OpenAI/);
 app.context.fetch=originalFetch;
 await app.element('openai-session-clear').onclick();assert.equal(local.has('openai_api_key'),false);
 await assert.rejects(()=>app.context.window.LingoOpenAI.generate('hi'),/Chưa có khóa/);
 console.log('PASS frontend save, reload restoration, request-scoped key/model, provider 404 versus server 404, clear and missing-key guidance (mock DOM/API)');
})().catch(e=>{console.error(e);process.exitCode=1});
