/* Navigation and UI adapter for the preserved HSK Pro feature engine. */
(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const groups = {
    vocabulary:{label:'Từ vựng',icon:'▤',view:'learn',tabs:[['learn','Kho từ vựng'],['review','Ôn tập SRS'],['quiz','Bài tập'],['stats','Thống kê']]},
    listening:{label:'Nghe',icon:'♫',view:'listening',tabs:[['listening','Luyện nghe'],['resources:audio','Thư viện âm thanh'],['resources:videos','Thư viện video']]},
    speaking:{label:'Nói',icon:'♬',view:'speaking',tabs:[['speaking','Luyện nói'],['dialogue','Đối thoại']]},
    reading:{label:'Đọc',icon:'▥',view:'reading',tabs:[['reading','Bài đọc'],['resources:grammar','Ngữ pháp'],['resources:rules','Quy tắc'],['resources:idioms','Thành ngữ'],['resources:differentiate','Phân biệt từ'],['resources:classifiers','Lượng từ'],['resources:coverage','Độ bao phủ'],['resources:documents','Tài liệu'],['resources:graph','Sơ đồ từ']]},
    writing:{label:'Viết',icon:'✎',view:'writing',tabs:[['writing:paragraph','Viết đoạn văn'],['writing:hanzi','Viết Hán tự'],['writing:archive','Bài đã lưu'],['resources:sandbox','Ghép chữ'],['resources:tones','Thanh điệu'],['resources:editor','Soạn thảo']]},
    settings:{label:'Cài đặt',icon:'⚙',view:'settings',tabs:[['settings:general','Tùy chọn học'],['settings:data','Nhập & xuất dữ liệu'],['settings:integrations','AI & kết nối'],['settings:advanced','Nâng cao']]}
  };
  let activeGroup='vocabulary', currentTarget='learn';
  const shell=document.getElementById('lingo-shell');
  const paths={vocabulary:'M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4z M13 7a3 3 0 0 1 3-3h5v15h-5a3 3 0 0 0-3 2',listening:'M4 14v-3a8 8 0 0 1 16 0v3 M4 12H2v7h5v-7z M20 12h2v7h-5v-7z',speaking:'M9 4a3 3 0 0 1 6 0v8a3 3 0 0 1-6 0z M5 11v1a7 7 0 0 0 14 0v-1 M12 19v3 M8 22h8',reading:'M5 3h11l4 4v14H5z M15 3v5h5 M9 12h7 M9 16h7',writing:'m4 16-1 5 5-1L20 8l-4-4z M14 6l4 4',settings:'M12 3v3 M12 18v3 M3 12h3 M18 12h3 M6 6l2 2 M16 16l2 2 M6 18l2-2 M16 8l2-2 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0'};
  const icon=id=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+paths[id]+'"/></svg>';
  shell.innerHTML=`<a class="lingo-skip" href="#study-main">Đến nội dung học</a><aside class="lingo-sidebar"><a href="#learn" class="lingo-brand"><b>l.</b><span>lingo<small>KHÔNG GIAN NGOẠI NGỮ</small></span></a><p class="lingo-kicker">HỌC MỖI NGÀY</p><nav aria-label="Mục học chính">${Object.entries(groups).map(([id,g])=>`<button type="button" data-section="${id}">${icon(id)}<span>${g.label}</span><span class="lingo-nav-arrow" aria-hidden="true">›</span></button>`).join('')}</nav><div class="lingo-side-note"><span class="lingo-sprout" aria-hidden="true">✦</span><strong>Mỗi ngày một chút.<br>Mỗi ngày tiến xa hơn.</strong><p>Dành một khoảng nhỏ hôm nay<br>cho một thế giới rộng hơn.</p><button type="button" data-open="review">Bắt đầu ôn tập <span aria-hidden="true">↗</span></button></div><div class="lingo-storage"><i></i> Lưu trữ trên thiết bị<small>Sao lưu tại Cài đặt → Dữ liệu</small></div></aside><div class="lingo-topbar"><div class="lingo-breadcrumb">Không gian học <span>/</span> <strong id="lingo-current-section">Từ vựng</strong></div><div class="lingo-top-actions"><span class="lingo-date">${new Intl.DateTimeFormat('vi-VN',{day:'numeric',month:'long'}).format(new Date())}</span><label class="lingo-language"><span class="sr-only">Ngôn ngữ học</span><select id="lingo-language"><option value="zh">中文 · Tiếng Trung</option><option value="en">EN · Tiếng Anh</option></select></label><span class="lingo-avatar" title="Không gian cá nhân" aria-hidden="true">L</span></div></div><nav id="lingo-subnav" aria-label="Chức năng trong mục học"></nav>`;
  const main=document.querySelector('main');main.id='study-main';main.tabIndex=-1;
  if(location.protocol==='file:'){
    const localWarning=document.createElement('div');
    localWarning.className='lingo-feature-note';localWarning.setAttribute('role','alert');
    localWarning.innerHTML='<strong>Bạn đang mở tệp HTML trực tiếp</strong><p>Để dùng ChatGPT, hãy chạy <b>KHOI-DONG-WEB.cmd</b> trong thư mục web, rồi mở <a href="http://127.0.0.1:5174" style="color:var(--brand);text-decoration:underline">http://127.0.0.1:5174</a>. Giữ cửa sổ máy chủ mở khi học.</p><p>Dữ liệu ở địa chỉ file và localhost được lưu riêng. Nếu đã có dữ liệu học ở bản này, hãy xuất JSON tại Cài đặt → Dữ liệu trước khi chuyển; khóa API cần nhập lại ở localhost.</p>';
    main.prepend(localWarning);
  }
  const welcome=document.createElement('section');welcome.className='lingo-welcome';
  welcome.innerHTML='<div class="lingo-welcome-copy"><span class="lingo-eyebrow" id="lingo-eyebrow"></span><h1 id="lingo-heading"></h1><p id="lingo-description"></p><button type="button" class="btn btn-primary" id="lingo-hero-action">Ôn tập ngay <span aria-hidden="true">↗</span></button></div><div class="lingo-illustration" aria-hidden="true"><span class="lingo-orbit orbit-one"></span><span class="lingo-orbit orbit-two"></span><span class="lingo-spark spark-one">✦</span><span class="lingo-spark spark-two">+</span><div class="lingo-mini-card mini-back"><small>HELLO, WORLD</small><b>Aa</b><span>Mở ra một thế giới mới</span></div><div class="lingo-mini-card mini-front"><small>HỌC · HIỂU · KẾT NỐI</small><b>你好</b><span>nǐ hǎo <i>xin chào</i></span></div><span class="lingo-float-pill">✓ Tốt hơn mỗi ngày</span></div>';
  main.prepend(welcome);
  const descriptions={vocabulary:['Tích lũy từ nhỏ, mở lối đi xa.','Kho từ của riêng bạn. Học từ mới, ôn đúng lúc và ghi nhớ lâu hơn.'],listening:['Lắng nghe để hiểu nhiều hơn.','Luyện đôi tai với hội thoại, âm thanh và video theo nhịp của bạn.'],speaking:['Tự tin cất lời, mỗi ngày.','Luyện phát âm và thực hành hội thoại trong những tình huống quen thuộc.'],reading:['Mỗi trang đọc, một khám phá.','Đọc hiểu, mở rộng ngữ pháp và kết nối những điều đã học.'],writing:['Biến ý tưởng thành câu chữ.','Bắt đầu từ một câu, luyện viết và lưu lại hành trình tiến bộ.'],settings:['Một không gian theo cách của bạn.','Điều chỉnh việc học, quản lý dữ liệu và kết nối công cụ yêu thích.']};
  document.getElementById('lingo-language').value=Lingo.lang;
  document.getElementById('lingo-language').onchange=e=>{Lingo.changeLanguage(e.target.value);e.target.value=Lingo.lang;};
  const originalShow=show;
  function chooseGroup(view){
    const matched=Object.entries(groups).find(([,group])=>group.tabs.some(([target])=>target===view));
    if(matched)return matched[0];
    if(['learn','review','quiz','stats'].includes(view))return 'vocabulary';
    if(view==='dialogue')return 'speaking';
    if(view==='resources')return 'reading';
    return Object.hasOwn(groups,view)?view:'vocabulary';
  }
  function paintNav(){
    shell.querySelectorAll('[data-section]').forEach(b=>{const active=b.dataset.section===activeGroup;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false');});
    document.getElementById('lingo-current-section').textContent=groups[activeGroup].label;
    document.getElementById('lingo-eyebrow').textContent=Lingo.name+' / '+groups[activeGroup].label;
    document.getElementById('lingo-heading').textContent=descriptions[activeGroup][0];
    document.getElementById('lingo-description').textContent=descriptions[activeGroup][1];
    welcome.dataset.section=activeGroup;
    document.getElementById('lingo-hero-action').hidden=activeGroup!=='vocabulary';
    const tabs=groups[activeGroup].tabs.filter(([id])=>Lingo.lang==='zh'||!['writing:hanzi','resources:sandbox','resources:tones'].includes(id));
    document.getElementById('lingo-subnav').innerHTML=tabs.map(([id,label])=>'<button type="button" data-target="'+id+'" aria-current="'+(currentTarget===id?'page':'false')+'" class="'+(currentTarget===id?'active':'')+'">'+(Lingo.lang==='en'&&label==='Lượng từ'?'Cụm chỉ lượng':label)+'</button>').join('');
    shell.querySelectorAll('[data-target]').forEach(b=>b.onclick=()=>openTarget(b.dataset.target));
  }
  show=function(view){openTarget(view==='writing'?'writing:paragraph':view==='settings'?'settings:general':view==='resources'?'resources:grammar':view);};
  function openTarget(target){
    target=({writing:'writing:paragraph',settings:'settings:general',resources:'resources:grammar'})[target]||target;
    if(!Object.values(groups).some(g=>g.tabs.some(([id])=>id===target)))target='learn';
    if(Lingo.lang==='en'&&['writing:hanzi','resources:sandbox','resources:tones'].includes(target))target='writing:paragraph';
    const [view,tab]=target.split(':');if(!views[view])return;
    activeGroup=chooseGroup(target);
    originalShow(view);
    if(tab&&view==='resources')showResourceTab(tab);
    if(tab&&view==='writing')showWritingTab(tab);
    if(tab&&view==='settings')showSettingsTab(tab);
    currentTarget=target;paintNav();adaptLabels();
    const resourceHeading=document.querySelector('#view-resources > h3');
    if(view==='resources'&&resourceHeading)resourceHeading.textContent=groups[activeGroup].tabs.find(([id])=>id===target)?.[1]||'Tài nguyên';
    history.replaceState(null,'','#'+target);
    window.scrollTo({top:0,behavior:'instant'});
  }
  document.getElementById('lingo-hero-action').onclick=()=>openTarget('review');
  shell.querySelector('[data-open]').onclick=()=>openTarget('review');
  window.addEventListener('hashchange',()=>openTarget(location.hash.slice(1)));
  shell.querySelector('.lingo-brand').onclick=e=>{e.preventDefault();activeGroup='vocabulary';openTarget('learn');};
  shell.querySelectorAll('[data-section]').forEach(b=>b.onclick=()=>{activeGroup=b.dataset.section;openTarget(groups[activeGroup].view+(activeGroup==='writing'?':paragraph':''));});
  const originalSegment=segmentText;
  segmentText=function(text){
    if(Lingo.lang==='zh')return originalSegment(text);
    return String(text).split(/([a-zA-Z]+(?:['’-][a-zA-Z]+)*)/g).map((part,i)=>i%2?'<span class="word">'+esc(part)+'</span>':esc(part).replaceAll('\n','<br>')).join('');
  };
  function localize(text){
    if(Lingo.lang!=='en')return text;
    return text.replace(/HSK\s*(?:Cấp độ\s*)?([1-6])/g,(_,n)=>Lingo.level(n))
      .replace(/HSK/g,'CEFR').replace(/Hán tự/g,'Từ tiếng Anh').replace(/hán tự/g,'từ tiếng Anh')
      .replace(/chữ Hán/g,'từ tiếng Anh').replace(/Chữ Hán/g,'Từ tiếng Anh')
      .replace(/Pinyin/g,'Phiên âm IPA').replace(/pinyin/g,'phiên âm IPA')
      .replace(/tiếng Trung/g,'tiếng Anh').replace(/Tiếng Trung/g,'Tiếng Anh')
      .replace(/\(Trung\)/g,'(Anh)').replace(/Việt\s*→\s*Trung/g,'Việt → Anh');
  }
  function adaptLabels(){
    if(Lingo.lang!=='en')return;
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){
      if(node.parentElement?.closest('#lingo-shell,script,style,textarea,input,pre,code,[contenteditable="true"],.word'))continue;
      const next=localize(node.nodeValue);if(next!==node.nodeValue)node.nodeValue=next;
    }
    document.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(el=>{const next=localize(el.placeholder);if(el.placeholder!==next)el.placeholder=next;});
  }
  let pending=false;
  const observer=new MutationObserver(()=>{if(!pending){pending=true;requestAnimationFrame(()=>{pending=false;adaptLabels();});}});
  observer.observe(document.body,{childList:true,subtree:true});
  function installExtras(){
    document.getElementById('searchV').setAttribute('aria-label','Tìm từ vựng, phiên âm hoặc nghĩa tiếng Việt');
    document.getElementById('searchV').placeholder='Tìm từ, phiên âm, nghĩa…';
    document.getElementById('filterHSK').setAttribute('aria-label','Lọc theo cấp độ');
    const writing=document.getElementById('writingInput');
    if(writing){
      const saveBar=document.createElement('div');saveBar.className='lingo-savebar';
      saveBar.innerHTML='<span id="lingo-draft-status" role="status">Bản nháp lưu trên trình duyệt này</span><button type="button" class="btn btn-secondary" id="lingo-save-draft">Lưu bản nháp</button>';
      writing.after(saveBar);writing.value=Lingo.storageGet('writing_draft')||'';
      let timer;
      const save=()=>{Lingo.storageSet('writing_draft',writing.value);document.getElementById('lingo-draft-status').textContent='Đã lưu bản nháp · '+new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});};
      writing.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(save,500);});
      document.getElementById('lingo-save-draft').onclick=save;
    }
    const settings=document.getElementById('view-settings');
    const notice=document.createElement('div');notice.className='lingo-feature-note';
    notice.innerHTML='<strong>Dữ liệu của bạn trên máy này</strong><p>Nhập file JSON hoặc Excel của bản cũ trong thẻ Dữ liệu. Chọn đúng ngôn ngữ trước khi nhập. Các tính năng tạo bài, chấm bài và phân tích AI cần khóa API tại thẻ Tích hợp. Khóa được lưu trên trình duyệt này; bản sao lưu JSON không chứa khóa.</p>';
    document.querySelector('#settings-content > [data-tab-content="data"]').prepend(notice);
    const cloud=document.createElement('details');cloud.className='lingo-feature-note';cloud.innerHTML='<summary>Kết nối đồng bộ Supabase (tùy chọn)</summary><p>Chỉ cấu hình dự án của bạn với các bảng tương thích bản cũ. Dùng Nhập/Xuất JSON nếu bạn chưa có máy chủ. Không dùng chung máy chủ giữa hai ngôn ngữ vì cấu trúc bảng cũ chưa phân tách ngôn ngữ.</p><label>Địa chỉ dự án Supabase<input id="lingo-cloud-url" type="url" class="form-input" placeholder="https://your-project.supabase.co"></label><label>Publishable / anon key<input id="lingo-cloud-key" type="password" class="form-input" autocomplete="off"></label><button type="button" class="btn btn-secondary" id="lingo-cloud-save">Lưu cấu hình kết nối</button><p id="lingo-cloud-status" role="status"></p>';
    document.querySelector('#settings-content > [data-tab-content="integrations"]').append(cloud);
    document.getElementById('lingo-cloud-url').value=Lingo.storageGet('cloud_url')||'';
    document.getElementById('lingo-cloud-key').value=Lingo.storageGet('cloud_public_key')||'';
    document.getElementById('lingo-cloud-save').onclick=()=>{
      const url=document.getElementById('lingo-cloud-url').value.trim(),key=document.getElementById('lingo-cloud-key').value.trim();
      if(url&&!/^https:\/\/[^/]+\.supabase\.co\/?$/.test(url)){document.getElementById('lingo-cloud-status').textContent='Hãy nhập đúng địa chỉ HTTPS của dự án Supabase.';return;}
      Lingo.storageSet('cloud_url',url);Lingo.storageSet('cloud_public_key',key);document.getElementById('lingo-cloud-status').textContent='Đã lưu. Tải lại trang để áp dụng; chưa gửi dữ liệu nào lên máy chủ.';
    };
    if(Lingo.lang==='en'){
      document.querySelector('#srsReviewMode option[value="write"]')?.remove();
      document.getElementById('qHSK').value = 'all';
      const library=document.querySelector('[onclick*="vocabLibraryModal"]');
      if(library){library.removeAttribute('onclick');library.onclick=()=>{
        const modal=document.getElementById('confirmModal');modal.innerHTML='<div class="card p-6"><h3 class="text-xl font-bold mb-4">Thư viện tiếng Anh</h3><p class="mb-4">Bộ nhập môn có 20 từ từ A1 đến C2. Bạn có thể thêm từ riêng hoặc nhập bảng Excel/JSON qua Cài đặt.</p><button class="btn btn-primary" id="english-import">Mở Nhập dữ liệu</button><button class="btn btn-secondary ml-3" id="english-close">Đóng</button></div>';modal.showModal();
        document.getElementById('english-close').onclick=()=>modal.close();document.getElementById('english-import').onclick=()=>{modal.close();activeGroup='settings';openTarget('settings');showSettingsTab('data');};
      };}
    }
    window.addEventListener('lingo-storage-error',()=>toast('Không lưu được dữ liệu. Hãy xuất bản sao lưu và kiểm tra dung lượng trình duyệt.','error'));
    const requested=location.hash.slice(1);
    if(requested&&views[requested.split(':')[0]]){openTarget(requested);}
    else{activeGroup='vocabulary';openTarget('learn');}
    adaptLabels();
  }
  const oldInit=mainInit;let enhanced=false;
  mainInit=function(){oldInit();if(!enhanced){enhanced=true;installExtras();}};
  paintNav();
})();
