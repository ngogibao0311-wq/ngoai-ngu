(() => {
 const select=document.getElementById('aiModelSelect');
 const keyName='openai_api_key';
 // Canonicalize this documented model ID only; preserve custom model IDs.
 const normalizeModel=value=>/^gpt-5\.6-sol$/i.test(value.trim())?'gpt-5.6-sol':value.trim();
 if(NEW.options.openaiModel && normalizeModel(NEW.options.openaiModel)!==NEW.options.openaiModel){
  NEW.options.openaiModel=normalizeModel(NEW.options.openaiModel);
  storage.set('hskpro_opts',NEW.options);
 }
 const box=document.createElement('div'); box.className='lingo-feature-note';
 box.innerHTML='<strong>ChatGPT qua OpenAI API</strong><p>Khóa được lưu trên trình duyệt của thiết bị này, riêng cho ngôn ngữ đang học. Không đưa vào bản sao lưu JSON hoặc Firebase. Chỉ lưu trên thiết bị bạn tin cậy.</p><label for="openai-session-key">Khóa OpenAI API</label><input type="password" autocomplete="off" id="openai-session-key" class="form-input" placeholder="Dán khóa OpenAI API"><label for="openai-model">Mã model OpenAI</label><input id="openai-model" class="form-input" value="gpt-4.1-mini" placeholder="gpt-4.1-mini"><button type="button" id="openai-session-save" class="btn btn-primary">Lưu khóa & model</button><button type="button" id="openai-test" class="btn btn-secondary">Kiểm tra kết nối</button><button type="button" id="openai-session-clear" class="btn btn-secondary">Xóa khóa</button><p id="openai-session-status" role="status"></p>';
 select.parentElement.parentElement.after(box);
 const input=box.querySelector('#openai-session-key'), model=box.querySelector('#openai-model'), status=box.querySelector('#openai-session-status');
 input.value=KeyVault.decrypt(Lingo.storageGet(keyName)||'');
 model.value=NEW.options.openaiModel||'gpt-4.1-mini';
 model.setAttribute?.('aria-description','Nhập đúng mã API, ví dụ gpt-5.6-sol (chữ thường).');
 const modelHelp=document.createElement('p');
 modelHelp.textContent='Nhập đúng mã API, ví dụ gpt-5.6-sol (chữ thường). Khóa cần có quyền truy cập model đã chọn.';
 model.after?.(modelHelp);
 const savedStatus=()=>{status.textContent=input.value?'Đã có khóa lưu trên thiết bị. Nhấn Kiểm tra kết nối để xác minh.':'Chưa lưu khóa OpenAI.';};
 savedStatus();
 function update(){
  const openai=NEW.options.aiModel==='openai';box.hidden=!openai;
  document.querySelectorAll('.api-slot').forEach(x=>x.hidden=openai);
  document.getElementById('btnSaveApiKeys').hidden=openai;
  const details=box.nextElementSibling;if(details?.tagName==='DETAILS')details.hidden=openai;
 }
 select.addEventListener('change',e=>{
  e.stopImmediatePropagation();
  if(NEW.options.aiModel!=='openai') {
   NEW.options.apiKeys=Array.from({length:6},(_,i)=>KeyVault.encrypt(document.getElementById('apiKeyInput_'+(i+1)).value.trim()));
  }
  NEW.options.aiModel=select.value;storage.set('hskpro_opts',NEW.options);
  for(let i=1;i<=6;i++)document.getElementById('apiKeyInput_'+i).value=KeyVault.decrypt(NEW.options.apiKeys?.[i-1]||'');
  updateSystemStatusUI();update();
 },true);
 function save(){
  model.value=normalizeModel(model.value);
  if(!input.value.trim())throw Error('Hãy nhập khóa OpenAI API.');
  if(!/^[a-zA-Z0-9._:-]{1,100}$/.test(model.value.trim()))throw Error('Mã model không hợp lệ.');
  const encoded=KeyVault.encrypt(input.value.trim());
  Lingo.storageSet(keyName,encoded);
  if(Lingo.storageGet(keyName)!==encoded)throw Error('Trình duyệt không lưu được khóa. Kiểm tra quyền lưu trữ.');
  NEW.options.openaiModel=model.value.trim();storage.set('hskpro_opts',NEW.options);
  status.textContent='Đã lưu khóa & model trên thiết bị. Có thể tải lại trang; chưa xác minh kết nối.';
  updateSystemStatusUI();
 }
 window.LingoOpenAI={async generate(prompt){
  if(location.protocol==='file:')throw Error('ChatGPT cần máy chủ: chạy npm start rồi mở http://127.0.0.1:5174.');
  const key=KeyVault.decrypt(Lingo.storageGet(keyName)||'');
  if(!key)throw Error('Chưa có khóa OpenAI. Vào Cài đặt → AI & kết nối để lưu khóa riêng cho ChatGPT.');
  let response;
  try{response=await fetch('/api/openai/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,key,model:NEW.options.openaiModel||'gpt-4.1-mini'})});}
  catch{throw Error('Không kết nối được máy chủ localhost. Hãy chạy npm start.');}
  let data;
  try{data=await response.json();}
  catch{
   if(response.status===404)throw Error('Không tìm thấy đường gọi OpenAI trên máy chủ này. Mở KHOI-DONG-WEB.cmd rồi truy cập http://127.0.0.1:5174.');
   throw Error('Máy chủ trả về dữ liệu không hợp lệ. Hãy chạy bằng node server.cjs.');
  }
  if(response.status===404 && !data?.error)throw Error('Không tìm thấy đường gọi OpenAI trên máy chủ này. Hãy chạy node server.cjs và mở http://127.0.0.1:5174.');
  if(!response.ok)throw Error(data.error||'Không gọi được OpenAI.');
  return data.text;
 }};
 box.querySelector('#openai-session-save').onclick=()=>{try{save();}catch(e){status.textContent=e.message;}};
 box.querySelector('#openai-test').onclick=async e=>{
  const button=e.currentTarget;button.disabled=true;
  try{save();status.textContent='Đang kiểm tra kết nối (gửi một yêu cầu API ngắn)…';await LingoOpenAI.generate('Reply with OK only.');status.textContent='Kết nối thành công · '+NEW.options.openaiModel;}
  catch(e){status.textContent=e.message;}finally{button.disabled=false;}
 };
 box.querySelector('#openai-session-clear').onclick=async()=>{
  try{Lingo.storageRemove(keyName);input.value='';status.textContent='Đã xóa khóa lưu trên thiết bị.';updateSystemStatusUI();
   const response=await fetch('/api/openai/key',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"key":""}'});
   if(!response.ok)throw Error();
  }catch{status.textContent='Đã xóa khóa trên trình duyệt. Nếu từng dùng khóa phiên cũ, hãy khởi động lại server để xóa phiên đó.';}
 };
 update();
})();
