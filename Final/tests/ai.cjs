const assert=require('node:assert/strict');
const {Readable}=require('node:stream');
const create=require('../../openai-local.cjs');
let calls=0;
const handler=create(5174,async(url,opts)=>{
 calls++; assert.equal(url,'https://api.openai.com/v1/responses');
 assert.equal(opts.headers.Authorization,'Bearer test-secret');
 const body=JSON.parse(opts.body);assert.equal(body.model,'gpt-4.1-mini');assert.equal(body.store,false);
 return {ok:true,json:async()=>({output:[{type:'reasoning'},{type:'message',content:[{type:'output_text',text:'hello'}]}]})};
});
async function run(url,body,origin='http://localhost:5174',target=handler) {
 const req=Readable.from([JSON.stringify(body)]);Object.assign(req,{url,method:'POST',headers:{host:'localhost:5174',origin,'content-type':'application/json'}});
 let code,data;await target(req,{writeHead(c){code=c},end(s){data=JSON.parse(s)}});return {code,data};
}
(async()=>{
 assert.equal((await run('/api/openai/generate',{prompt:'Hi'})).code,400);
 assert.equal((await run('/api/openai/generate',{prompt:'Hi',key:'test-secret'})).data.text,'hello');
 assert.equal((await run('/api/openai/generate',{prompt:'Hi',key:'test-secret',model:'bad model'})).code,400);
 assert.equal((await run('/api/openai/generate',{prompt:'Hi',key:'test-secret'},'https://foreign.example')).code,403);
 for(const [code,status,message] of [['insufficient_quota',429,'không đủ hạn mức'],['model_not_found',404,'Không tìm thấy model'],['invalid_api_key',401,'không hợp lệ']]) {
  const failing=create(5174,async()=>({ok:false,status,json:async()=>({error:{code}})}));
  const result=await run('/api/openai/generate',{prompt:'Hi',key:'test-secret'},undefined,failing);
  assert.equal(result.code,status);assert.ok(result.data.error.includes(message));
 }
 for(const code of ['credit_balance_exhausted','organization_spend_limit_exceeded','project_spend_limit_exceeded','organization_usage_limit_exceeded']){
  const failing=create(5174,async()=>({ok:false,status:429,headers:{get:()=> '20'},json:async()=>({error:{code,type:'insufficient_quota'}})}));
  const result=await run('/api/openai/generate',{prompt:'Hi',key:'test-secret'},undefined,failing);
  assert.ok(result.data.error.includes('Chờ rồi thử lại không khắc phục'));
  assert.equal(result.data.retryAfterSeconds,undefined);
  assert.equal(result.data.code,code);
 }
 for(const [error,expected] of [[{code:'rate_limit_exceeded'},'Đợi ít nhất 12 giây'],[{type:'insufficient_quota'},'không đủ hạn mức'],[{},'chưa xác định']]){
  const failing=create(5174,async()=>({ok:false,status:429,headers:{get:()=> '12'},json:async()=>({error})}));
  const result=await run('/api/openai/generate',{prompt:'Hi',key:'test-secret'},undefined,failing);
  assert.ok(result.data.error.includes(expected));
 }
 const restarted=create(5174,async(url,options)=>{
  assert.equal(options.headers.Authorization,'Bearer restored-key');
  assert.equal(JSON.parse(options.body).model,'custom-model');
  return {ok:true,json:async()=>({output:[{type:'message',content:[{type:'output_text',text:'restored'}]}]})};
 });
 assert.equal((await run('/api/openai/generate',{prompt:'Hi',key:'restored-key',model:'custom-model'},undefined,restarted)).data.text,'restored');
 assert.equal((await run('/api/openai/key',{key:'test-secret'},'https://foreign.example')).code,403);
 assert.equal((await run('/api/openai/key',{key:'test-secret'})).data.configured,true);
 assert.equal((await run('/api/openai/generate',{prompt:''})).code,400);
 assert.equal((await run('/api/openai/generate',{prompt:'Hi'})).data.text,'hello');
 assert.equal(calls,2);
 await run('/api/openai/key',{key:''});
 assert.equal((await run('/api/openai/generate',{prompt:'Hi'})).code,400);
 console.log('PASS OpenAI routing, key clearing, origin rejection, missing key, empty prompt and response extraction (mock API).');
})().catch(e=>{console.error(e);process.exitCode=1;});
