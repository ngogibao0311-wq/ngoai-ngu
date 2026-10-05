// Local-only bridge. The key remains in this process and is never written to disk.
module.exports = function createOpenAIHandler(port, request = fetch) {
 let key = '', active = false;
 return async function(req,res) {
  const reply=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  const hosts=[`localhost:${port}`,`127.0.0.1:${port}`];
  if(!hosts.includes(req.headers.host)||!hosts.map(h=>'http://'+h).includes(req.headers.origin))return reply(403,{error:'Yêu cầu không đến từ website trên máy này.'});
  if(req.method!=='POST'||req.headers['content-type']!=='application/json')return reply(405,{error:'Yêu cầu không hợp lệ.'});
  try {
   let body=''; for await(const chunk of req){body+=chunk; if(Buffer.byteLength(body)>250000)return reply(413,{error:'Nội dung quá dài.'});}
   const data=JSON.parse(body);
   if(req.url==='/api/openai/key') {
    if(typeof data.key!=='string'||data.key.length>1024)return reply(400,{error:'Khóa không hợp lệ.'});
    key=data.key.trim();return reply(200,{configured:!!key});
   }
   if(req.url!=='/api/openai/generate')return reply(404,{error:'Không tìm thấy.'});
   const requestKey=typeof data.key==='string'?data.key.trim():key;
   if(!requestKey || requestKey.length>1024)return reply(400,{error:'Hãy lưu khóa OpenAI trong Cài đặt → AI & kết nối.'});
   const model=data.model||'gpt-4.1-mini';
   if(typeof model!=='string'||!/^[a-zA-Z0-9._:-]{1,100}$/.test(model))return reply(400,{error:'Mã model OpenAI không hợp lệ.'});
   if(typeof data.prompt!=='string'||!data.prompt.trim())return reply(400,{error:'Nội dung trống.'});
   if(active)return reply(429,{error:'Đang xử lý một yêu cầu khác. Hãy đợi rồi thử lại.'});
   active=true;
   try {
    const result=await request('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+requestKey},body:JSON.stringify({model,input:data.prompt,max_output_tokens:8192,store:false}),signal:AbortSignal.timeout(90000)});
    const json=await result.json();
    if(!result.ok){
     const rawCode=json.error?.code;
     const code=typeof rawCode==='string'&&/^[a-z_0-9-]{1,100}$/i.test(rawCode)?rawCode:undefined;
     const quotaMessages={
      insufficient_quota:'Tài khoản OpenAI API không đủ hạn mức. Kiểm tra billing và ngân sách dự án API.',
      credit_balance_exhausted:'Tài khoản OpenAI API đã hết số dư trả trước. Kiểm tra số dư trong Billing.',
      organization_spend_limit_exceeded:'Tổ chức OpenAI API đã chạm giới hạn chi tiêu. Kiểm tra giới hạn của tổ chức.',
      project_spend_limit_exceeded:'Dự án OpenAI API đã chạm giới hạn chi tiêu. Kiểm tra giới hạn của dự án.',
      organization_usage_limit_exceeded:'Tổ chức đã chạm hạn mức sử dụng OpenAI API được cấp. Kiểm tra Usage và Limits.'
     };
     const quota=quotaMessages[code]||(json.error?.type==='insufficient_quota'?quotaMessages.insufficient_quota:null);
     const retryHeader=result.headers?.get?.('retry-after');
     const delay=retryHeader?(Number.isFinite(Number(retryHeader))?Number(retryHeader):(Date.parse(retryHeader)-Date.now())/1000):NaN;
     const retryAfterSeconds=Number.isFinite(delay)&&delay>=0?Math.ceil(delay):undefined;
     const temporary=result.status===429&&!quota&&(code==='rate_limit_exceeded'||code==='slow_down'||json.error?.type==='rate_limit_error');
     let message;
     if(quota)message=quota+' Chờ rồi thử lại không khắc phục được lỗi này.';
     else if(temporary)message='OpenAI đang giới hạn số yêu cầu hoặc token cho model '+model+'. '+(retryAfterSeconds!==undefined?'Đợi ít nhất '+retryAfterSeconds+' giây trước khi thử lại.':'Hãy giãn thời gian giữa các yêu cầu và giảm độ dài bài.');
     else if(result.status===429)message='OpenAI trả về lỗi 429 nhưng chưa xác định được loại giới hạn. Kiểm tra Usage, Billing và Limits của dự án API.';
     else message=result.status===401?'Khóa OpenAI không hợp lệ hoặc đã bị thu hồi.':result.status===404?'Không tìm thấy model '+model+' hoặc khóa không có quyền dùng model này.':result.status===403?'Khóa hoặc dự án không có quyền thực hiện yêu cầu.':'OpenAI không xử lý được yêu cầu ('+result.status+').';
     if(code)message+=' [Mã: '+code+']';
     return reply(result.status,{error:message,code,retryAfterSeconds:temporary?retryAfterSeconds:undefined});
    }
    if(json.status==='incomplete')return reply(502,{error:'Câu trả lời vượt giới hạn. Hãy giảm số từ hoặc độ dài bài.'});
    const text=(json.output||[]).filter(x=>x.type==='message').flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('\n');
    if(!text)return reply(502,{error:'OpenAI không trả về nội dung văn bản.'});
    return reply(200,{text});
   } finally {active=false;}
  }catch(e){return reply(400,{error:e.name==='TimeoutError'?'Yêu cầu quá thời gian. Hãy thử lại.':'Không kết nối được hoặc dữ liệu không hợp lệ.'});}
 };
};
