/* Versioned, chunked snapshots. Publish the manifest only after all parts exist. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.LingoFirebaseBackup=api;})(globalThis,()=>{
 const CHUNK_BYTES=240000, MAX_BYTES=32000000;
 const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
 async function digest(bytes){return Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');}
 async function upload({sdk,db,ref,data,onProgress=()=>{}}){
  const bytes=encoder.encode(JSON.stringify(data));
  if(bytes.length>MAX_BYTES)throw Error('Bản sao vượt 32 MB. Hãy xuất JSON để sao lưu.');
  const generation=globalThis.crypto.randomUUID(),count=Math.ceil(bytes.length/CHUNK_BYTES);
  const checksum=await digest(bytes);
  for(let i=0;i<count;i++){
   const part=bytes.slice(i*CHUNK_BYTES,(i+1)*CHUNK_BYTES);
   await sdk.setDoc(sdk.doc(ref,'snapshots',generation,'chunks',String(i)),{index:i,payload:sdk.Bytes.fromUint8Array(part)});
   onProgress(i+1,count);
  }
  // A failed upload never changes the previously published backup.
  await sdk.setDoc(ref,{version:2,language:data.language,generation,count,byteLength:bytes.length,checksum,updatedAt:sdk.serverTimestamp()});
  return {byteLength:bytes.length,count};
 }
 async function download({sdk,ref,language,onProgress=()=>{}}){
  const snapshot=await sdk.getDocFromServer(ref);if(!snapshot.exists())return null;
  const manifest=snapshot.data();
  if(manifest.version===1)return manifest;
  if(manifest.version!==2||manifest.language!==language||!/^[-a-zA-Z0-9]{1,80}$/.test(manifest.generation)||!Number.isInteger(manifest.count)||manifest.count<1||manifest.count>Math.ceil(MAX_BYTES/CHUNK_BYTES)||!Number.isInteger(manifest.byteLength)||manifest.byteLength<1||manifest.byteLength>MAX_BYTES||manifest.count!==Math.ceil(manifest.byteLength/CHUNK_BYTES)||!/^[a-f0-9]{64}$/.test(manifest.checksum))throw Error('Bản sao Firebase không đúng định dạng.');
  const bytes=new Uint8Array(manifest.byteLength);let offset=0;
  for(let i=0;i<manifest.count;i++){
   const doc=await sdk.getDocFromServer(sdk.doc(ref,'snapshots',manifest.generation,'chunks',String(i)));
   if(!doc.exists())throw Error('Bản sao thiếu phần '+(i+1)+'. Dữ liệu trên máy chưa bị thay đổi.');
   const data=doc.data(),part=data.payload?.toUint8Array?.();
   const expected=Math.min(CHUNK_BYTES,manifest.byteLength-offset);
   if(data.index!==i||!(part instanceof Uint8Array)||part.length!==expected)throw Error('Một phần bản sao bị lỗi. Dữ liệu trên máy chưa bị thay đổi.');
   bytes.set(part,offset);offset+=part.length;onProgress(i+1,manifest.count);
  }
  if(await digest(bytes)!==manifest.checksum)throw Error('Bản sao không toàn vẹn. Dữ liệu trên máy chưa bị thay đổi.');
  const result=JSON.parse(decoder.decode(bytes));
  if(result.language!==language)throw Error('Bản sao thuộc ngôn ngữ khác.');
  return result;
 }
 return {upload,download,CHUNK_BYTES,MAX_BYTES};
});
