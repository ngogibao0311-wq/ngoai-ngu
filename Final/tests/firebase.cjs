const assert=require('node:assert/strict');
const api=require('../../firebase-backup.js');
const docs=new Map();let fail=-1,writes=0;
const sdk={doc:(ref,...parts)=>[ref,...parts].join('/'),Bytes:{fromUint8Array:bytes=>({toUint8Array:()=>bytes.slice()})},serverTimestamp:()=>123,
 async setDoc(ref,value){if(writes++===fail)throw Error('interrupted');docs.set(ref,value);},
 async getDocFromServer(ref){return {exists:()=>docs.has(ref),data:()=>docs.get(ref)};}};
(async()=>{
 const ref='users/test/languages/zh';const original={version:1,language:'zh',values:{vocab:'old'}};docs.set(ref,original);
 assert.deepEqual(await api.download({sdk,ref,language:'zh'}),original);
 const data={version:1,language:'zh',values:{vocab:JSON.stringify(Array.from({length:5078},(_,i)=>({hanzi:'学习'+i,example:'我每天学习中文。 Tiếng Việt có dấu. '.repeat(6)})))}};
 fail=2;await assert.rejects(api.upload({sdk,ref,data}),/interrupted/);assert.equal(docs.get(ref),original);
 fail=-1;const result=await api.upload({sdk,ref,data});assert.ok(result.byteLength>850000);assert.ok(result.count>1);
 assert.deepEqual(await api.download({sdk,ref,language:'zh'}),data);
 await assert.rejects(api.download({sdk,ref,language:'en'}),/định dạng/);
 const m=docs.get(ref),partRef=sdk.doc(ref,'snapshots',m.generation,'chunks','0'),part=docs.get(partRef);docs.delete(partRef);
 await assert.rejects(api.download({sdk,ref,language:'zh'}),/thiếu phần/);docs.set(partRef,part);
 const broken=part.payload.toUint8Array();broken[0]^=1;docs.set(partRef,{index:0,payload:sdk.Bytes.fromUint8Array(broken)});
 await assert.rejects(api.download({sdk,ref,language:'zh'}),/toàn vẹn/);
 await assert.rejects(api.upload({sdk,ref,data:{language:'zh',value:'x'.repeat(api.MAX_BYTES)}}),/32 MB/);
 console.log('PASS Firebase: large Unicode snapshots, legacy read, interrupted upload preserves old backup, missing/corrupt chunks and language/size checks.');
})().catch(e=>{console.error(e);process.exitCode=1;});
