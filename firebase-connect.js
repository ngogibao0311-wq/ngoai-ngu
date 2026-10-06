/* Firebase is loaded only after the user supplies their own web configuration. */
(() => {
  // Firebase Authentication requires an http(s) origin. index.html blocks file:// before this script loads.
  // Keep local access consistent with the single Authorized domain: localhost.
  if (location.hostname === '127.0.0.1') {
    const localUrl = new URL(location.href);
    localUrl.hostname = 'localhost';
    location.replace(localUrl.href);
    return;
  }

  const keys = ['vocab','ignored_words','srs','grammar','rules','classifiers','idioms','dialogues','reading','logs','badges','streak'].map(x=>'hskpro_'+x).concat('writing_draft');
  const configKey = 'lingo_firebase_web_config';
  let auth, db, sdk, busy = false;
  const panel = document.createElement('section');
  panel.className = 'lingo-feature-note';
  panel.innerHTML = `<h3>Kết nối Firebase</h3>
    <p>Đăng nhập Google rồi chủ động lưu hoặc tải bản sao của ngôn ngữ đang học. Dữ liệu trên trình duyệt vẫn dùng chung khi đổi tài khoản. Không tự động gửi dữ liệu.</p>
    <details><summary>Nhập cấu hình Firebase của bạn</summary>
    <p>Dán toàn bộ đoạn const firebaseConfig = { ... }; từ Firebase vào ô dưới. Cấu hình được lưu trong trình duyệt này.</p>
    <textarea id="fb-config" class="form-input" rows="8" placeholder="const firebaseConfig = { ... };"></textarea>
    <button id="fb-config-save" class="btn btn-secondary" type="button">Lưu cấu hình và tải lại</button></details>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0">
    <button id="fb-login" class="btn btn-primary" disabled>Đăng nhập Google</button>
    <button id="fb-logout" class="btn btn-secondary" disabled>Đăng xuất</button>
    <button id="fb-push" class="btn btn-primary" disabled>Lưu lên Firebase</button>
    <button id="fb-pull" class="btn btn-secondary" disabled>Tải từ Firebase</button></div>
    <p id="fb-status" role="status">Chưa có cấu hình Firebase.</p>
    <p>Bản sao gồm từ vựng, ôn tập, bài đọc, ngữ pháp, hội thoại, thống kê và bản nháp viết. Không gồm khóa AI, cài đặt, mã tùy chỉnh, tệp nghe/nói, ảnh và video. Hỗ trợ bản sao đến 32 MB mỗi ngôn ngữ, tự chia phần khi tải lên. Giữ bản sao trước nếu tải lên bị lỗi.</p>`;
  const el = id => panel.querySelector('#fb-'+id);
  const status = text => { el('status').textContent = text; };
  function controls() {
    el('login').disabled = busy || !auth || !!auth.currentUser;
    ['logout','push','pull'].forEach(id=>el(id).disabled=busy || !auth?.currentUser);
    el('config-save').disabled=busy;
  }
  function snapshot() {
    return Object.fromEntries(keys.map(k=>[k,localStorage.getItem(Lingo.prefix+k)]));
  }
  function validate(data) {
    if (!data || data.version!==1 || data.language!==Lingo.lang || !data.values || typeof data.values!=='object' || Array.isArray(data.values)) throw Error('Bản sao không đúng định dạng hoặc ngôn ngữ.');
    for(const key of keys) {
      const value=data.values[key];
      if(value!==null && typeof value!=='string') throw Error('Bản sao thiếu hoặc sai dữ liệu.');
      if(value!==null && key!=='writing_draft') JSON.parse(value);
    }
    return data.values;
  }
  function backup(values) {
    const textData=Object.fromEntries(keys.filter(k=>k.startsWith('hskpro_') && values[k]!==null).map(k=>[k.slice(7),JSON.parse(values[k])]));
    const url=URL.createObjectURL(new Blob([JSON.stringify({meta:{language:Lingo.lang},textData,version:1,language:Lingo.lang,values})],{type:'application/json'}));
    const a=document.createElement('a'); a.href=url; a.download='lingo-before-restore-'+Lingo.lang+'-'+Date.now()+'.json'; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),10000);
  }
  function parseConfig(text) {
    // Extract only known string fields, never execute pasted JavaScript.
    const out={};
    for(const key of ['apiKey','authDomain','projectId','storageBucket','messagingSenderId','appId']) {
      const match=text.match(new RegExp('["\x27]?'+key+'["\x27]?\\s*:\\s*["\x27]([^"\x27]+)["\x27]'));
      if(match) out[key]=match[1];
    }
    if(!out.apiKey || !out.authDomain || !out.projectId || !out.appId) throw Error('Hãy dán đủ đoạn firebaseConfig gồm apiKey, authDomain, projectId và appId.');
    return out;
  }
  async function run(action) {
    if(busy)return; busy=true; controls();
    try{await action();}catch(e){
      console.error('[Firebase]', e);
      const messages={
        'auth/unauthorized-domain':'Firebase chưa cho phép địa chỉ '+location.origin+'. Vào Authentication → Settings → Authorized domains và thêm đúng: '+location.hostname+' (không thêm http:// và không thêm cổng).',
        'auth/popup-blocked':'Trình duyệt chặn cửa sổ đăng nhập. Web sẽ thử đăng nhập bằng chuyển trang; nếu vẫn lỗi hãy cho phép popup.',
        'auth/popup-closed-by-user':'Bạn đã đóng cửa sổ đăng nhập.',
        'auth/cancelled-popup-request':'Yêu cầu đăng nhập trước đó đã bị hủy. Hãy bấm Đăng nhập Google lại một lần.',
        'auth/operation-not-allowed':'Google Sign-in chưa được bật. Vào Authentication → Sign-in method → Google → Enable.',
        'auth/invalid-api-key':'Firebase apiKey không hợp lệ. Hãy dán lại firebaseConfig đúng dự án.',
        'auth/invalid-credential':'Cấu hình hoặc thông tin xác thực Firebase không hợp lệ. Hãy kiểm tra lại firebaseConfig.',
        'auth/web-storage-unsupported':'Trình duyệt đang chặn bộ nhớ cần cho đăng nhập. Hãy tắt chế độ chặn nghiêm ngặt/ẩn danh rồi thử lại.',
        'permission-denied':'Firestore từ chối truy cập. Kiểm tra Rules và tài khoản Google.',
        'unavailable':'Không kết nối được Firestore. Kiểm tra mạng và thử lại.',
        'resource-exhausted':'Firebase đã hết hạn mức. Kiểm tra mục Usage của dự án rồi thử lại sau.'
      };
      status(messages[e.code] || 'Không hoàn tất: '+(e.message || e.code));
    }finally{busy=false;controls();}
  }
  el('config-save').onclick=()=>{try{localStorage.setItem(configKey,JSON.stringify(parseConfig(el('config').value)));location.reload();}catch(e){status(e.message);}};
  async function init() {
    document.querySelector('#settings-content > [data-tab-content="integrations"]').append(panel);
    const openFirebase = action => {
      document.querySelector('[data-target="settings:integrations"]')?.click?.();
      panel.scrollIntoView?.({behavior:'smooth',block:'center'});
      if (busy) { status('Firebase đang xử lý. Vui lòng đợi.'); return; }
      if (!auth) { status('Dán cấu hình Firebase của bạn ở trên, bấm Lưu cấu hình và tải lại, rồi đăng nhập Google.'); panel.querySelector('details')?.setAttribute?.('open',''); return; }
      if (!auth.currentUser) { status('Hãy bấm Đăng nhập Google trước khi lưu hoặc tải bản sao.'); return; }
      return el(action).onclick?.();
    };
    const pushButton=document.getElementById('btnPushCloud'),pullButton=document.getElementById('btnPullCloud');
    if(pushButton)pushButton.onclick=()=>openFirebase('push');
    if(pullButton)pullButton.onclick=()=>openFirebase('pull');
    const saved=localStorage.getItem(configKey); if(!saved)return;
    el('config').value=JSON.stringify(JSON.parse(saved),null,2);
    await run(async()=>{
      status('Đang kết nối Firebase…');
      const base='https://www.gstatic.com/firebasejs/12.19.0/';
      const [app,A,F]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js')]);
      const instance=app.initializeApp(JSON.parse(saved)); auth=A.getAuth(instance); db=F.getFirestore(instance); sdk=F;
      A.onAuthStateChanged(auth,user=>{status(user?'Đã đăng nhập: '+user.email+' · '+Lingo.name:'Sẵn sàng. Hãy đăng nhập Google.');controls();});

      // Complete a redirect login (used automatically when popup login is blocked).
      await A.getRedirectResult(auth);

      el('login').onclick=()=>run(async()=>{
        const provider=new A.GoogleAuthProvider();
        provider.setCustomParameters({prompt:'select_account'});
        try{
          await A.signInWithPopup(auth,provider);
        }catch(error){
          if(['auth/popup-blocked','auth/cancelled-popup-request','auth/web-storage-unsupported'].includes(error?.code)){
            status('Popup đăng nhập không dùng được. Đang chuyển sang đăng nhập Google toàn trang…');
            await A.signInWithRedirect(auth,provider);
            return;
          }
          throw error;
        }
      });
      el('logout').onclick=()=>run(()=>A.signOut(auth));
      const ref=()=>sdk.doc(db,'users',auth.currentUser.uid,'languages',Lingo.lang);
      el('push').onclick=()=>run(async()=>{
        if(!confirm('Lưu dữ liệu '+Lingo.name+' trên máy này vào tài khoản '+auth.currentUser.email+'? Bản sao trên Firebase sẽ bị thay thế.'))return;
        const data={version:1,language:Lingo.lang,values:snapshot()}; validate(data);
        if(navigator.onLine===false)throw Error('Đang ngoại tuyến. Hãy kết nối mạng rồi lưu lại.');
        status('Đang chuẩn bị bản sao…');
        const saved=await LingoFirebaseBackup.upload({sdk,db,ref:ref(),data,onProgress:(done,total)=>status('Đang lưu lên Firebase: '+done+'/'+total+' phần…')});
        status('Đã lưu '+Lingo.name+' lên Firebase ('+(saved.byteLength/1024/1024).toFixed(2)+' MB).');
      });
      el('pull').onclick=()=>run(async()=>{
        if(navigator.onLine===false)throw Error('Đang ngoại tuyến. Hãy kết nối mạng rồi tải lại.');
        status('Đang tải…'); const data=await LingoFirebaseBackup.download({sdk,ref:ref(),language:Lingo.lang,onProgress:(done,total)=>status('Đang tải từ Firebase: '+done+'/'+total+' phần…')});
        if(!data){status('Tài khoản này chưa có bản sao '+Lingo.name+'.');return;}
        const values=validate(data);
        if(!confirm('Thay dữ liệu '+Lingo.name+' trên máy bằng bản sao từ '+auth.currentUser.email+'? Hãy lưu biểu mẫu đang nhập trước. Một bản sao dữ liệu hiện tại sẽ được tải xuống.')){status('Đã hủy khôi phục.');return;}
        const old=snapshot(); backup(old);
        try{for(const k of keys){const v=values[k]; if(v===null)localStorage.removeItem(Lingo.prefix+k);else localStorage.setItem(Lingo.prefix+k,v);}}
        catch(error){for(const k of keys){if(old[k]===null)localStorage.removeItem(Lingo.prefix+k);else localStorage.setItem(Lingo.prefix+k,old[k]);}throw error;}
        location.reload();
      });
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init().catch(e=>status(e.message)));else init().catch(e=>status(e.message));
})();
