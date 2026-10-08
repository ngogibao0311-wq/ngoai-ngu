/* Regular Kim Liên: paper kites, dew beads and a jade seal. Independent of the premium lotus scene. */
(() => {
    'use strict';
    if (!document.getElementById('kim-lien-css')) {
        const link = document.createElement('link');
        link.id = 'kim-lien-css'; link.rel = 'stylesheet';
        link.href = 'css/premium-kim-lien.css?v=20261008.3';
        document.head.appendChild(link);
    }
    window.KimLienRegularRuntime = {
        timers: new Set(),
        clear() {
            this.events?.abort(); this.observer?.disconnect();
            this.timers.forEach(clearTimeout); this.timers.clear();
            this.host?.remove(); this.aura?.remove();
            if (this.pet) {
                this.pet.classList.remove('klr-companion');
                for (const [key, value] of Object.entries(this.saved || {})) {
                    value === null ? this.pet.removeAttribute(key) : this.pet.setAttribute(key, value);
                }
            }
            this.pet = null;
        },
        later(fn, ms) {
            const id = setTimeout(() => { this.timers.delete(id); fn(); }, ms);
            this.timers.add(id);
        },
        quiet() {
            return document.hidden || document.body.classList.contains('wfx-low-power') ||
                window.isExamVisualItemsSuspended === true || Boolean(window.currentActiveExamId) ||
                matchMedia('(prefers-reduced-motion: reduce)').matches;
        },
        sync(items = {}) {
            this.clear();
            if (!items.pet && !items.effect) return;
            this.events = new AbortController();
            const options = { signal: this.events.signal };
            this.host = document.createElement('div');
            this.host.id = 'kim-lien-regular-world';
            this.host.setAttribute('aria-hidden', 'true');
            this.host.style.cssText = 'position:fixed;inset:0;pointer-events:none!important;z-index:950;overflow:hidden';
            this.shadow = this.host.attachShadow({ mode: 'open' });
            this.shadow.innerHTML = '<link rel="stylesheet" href="css/premium-kim-lien.css?v=20261008.3">';
            if (items.effect) {
                const sky = document.createElement('div'); sky.className = 'klr-sky';
                sky.innerHTML = Array.from({length:12}, (_, i) => `<i class="klr-kite" style="--x:${(i*37)%100}%;--delay:${-i*2.1}s;--duration:${17+i%5}s"><b></b></i>`).join('');
                this.shadow.appendChild(sky);
                document.addEventListener('pointerdown', event => {
                    if (this.quiet() || performance.now() - (this.lastTap || 0) < 200) return;
                    this.lastTap = performance.now();
                    const stamp = document.createElement('i'); stamp.className = 'klr-stamp';
                    stamp.style.left = event.clientX + 'px'; stamp.style.top = event.clientY + 'px';
                    this.shadow.appendChild(stamp); this.later(() => stamp.remove(), 850);
                }, options);
            }
            document.body.appendChild(this.host);
            if (items.pet) {
                this.pet = document.getElementById('virtual-pet-img');
                if (this.pet) {
                    this.saved = Object.fromEntries(['role','tabindex','title'].map(key => [key,this.pet.getAttribute(key)]));
                    this.pet.classList.add('klr-companion'); this.pet.setAttribute('role','button');
                    this.pet.tabIndex = 0; this.pet.title = 'Kim Liên · Chạm để mở Ngọc Ấn';
                    this.aura = document.createElement('div'); this.aura.className = 'klr-dew';
                    this.aura.setAttribute('aria-hidden','true');
                    this.aura.attachShadow({mode:'open'}).innerHTML = '<link rel="stylesheet" href="css/premium-kim-lien.css?v=20261008.3"><div class="klr-aura-scene"><div class="klr-orbit"></div><div class="klr-pool"></div><i></i><i></i><i></i><i></i><i></i></div>';
                    this.pet.parentElement.appendChild(this.aura);
                    const activate = () => this.ultimate();
                    this.pet.addEventListener('click', activate, options);
                    this.pet.addEventListener('keydown', e => {
                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
                    }, options);
                }
            }
            const update = () => {
                const quiet = this.quiet();
                this.host.hidden = quiet;
                if (this.aura) this.aura.hidden = quiet;
                if (quiet) this.shadow.querySelectorAll('.klr-seal,.klr-stamp').forEach(n => n.remove());
            };
            this.observer = new MutationObserver(update);
            this.observer.observe(document.body,{attributes:true,attributeFilter:['class']});
            document.addEventListener('visibilitychange', update, options);
            matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', update, options);
            update();
        },
        ultimate() {
            if (!this.pet || this.quiet() || this.pet.parentElement?.dataset.petDragged === '1' ||
                performance.now() < (this.readyAt || 0)) return;
            this.readyAt = performance.now() + 8000;
            const seal = document.createElement('div'); seal.className = 'klr-seal';
            seal.innerHTML = '<div class="klr-seal-mark">蓮</div><span>NGỌC ẤN KHAI HOA</span><i></i><i></i><i></i><i></i>';
            this.shadow.appendChild(seal); this.later(() => seal.remove(), 2400);
        }
    };
})();

/* Kim Liên: independent vector lotus/lantern scene, isolated from equipped themes. */
(() => {
    'use strict';
    const css = 'css/premium-kim-lien.css?v=20261008.3';
    const runtime = window.KimLienRuntime = {
        timers:new Set(),
        later(fn,ms) { const id=setTimeout(()=>{this.timers.delete(id);fn();},ms);this.timers.add(id); },
        astrolabe() {
            return `<svg viewBox="0 0 600 600" fill="none" stroke="currentColor"><circle cx="300" cy="300" r="275" stroke-width="2"/><circle cx="300" cy="300" r="256" stroke-dasharray="1 9" stroke-width="8"/><circle cx="300" cy="300" r="230"/>${Array.from({length:16},(_,i)=>`<g transform="rotate(${i*22.5} 300 300)"><path d="M300 24 L310 44 L300 64 L290 44Z" fill="currentColor" fill-opacity=".5"/><path d="M300 72 L300 110 M286 92 L314 92"/><path d="M300 120 Q360 180 300 300 Q240 180 300 120Z" stroke-opacity=".5"/></g>`).join('')}</svg>`;
        },
        palace() {
            return `<div class="kl-palace"><div class="kl-celestial-clock">${this.astrolabe()}</div>${[-1,1].map(side=>`<div class="kl-pavilion" style="--side:${side}"><svg viewBox="0 0 260 700" fill="none" stroke="currentColor"><path d="M25 680 V260 Q130 30 235 260 V680 M52 680 V280 Q130 100 208 280 V680 M20 265 Q130 235 240 265 M15 290 H245 M40 630 H220 M60 652 H200" stroke-width="2"/><path d="M130 95 V25 M108 62 L130 25 L152 62 M80 175 L130 100 L180 175 M80 175 Q130 150 180 175"/><path d="M70 600 V350 Q130 220 190 350 V600"/><circle cx="130" cy="390" r="43"/><path d="M130 330 L155 390 L130 450 L105 390Z"/><path d="M25 680 Q130 640 235 680 M10 692 H250"/></svg></div>`).join('')}<div class="kl-river"></div>${Array.from({length:14},(_,i)=>`<i class="kl-starfall" style="--x:${i*7}%;--delay:${-i*1.3}s"></i>`).join('')}</div>`;
        },
        lotus() {
            return `<svg viewBox="0 0 600 600" fill="none" aria-hidden="true"><defs><linearGradient id="klGold"><stop stop-color="#fff9d5"/><stop offset=".5" stop-color="#dfac48"/><stop offset="1" stop-color="#856022"/></linearGradient></defs>${[0,1,2].map(layer=>`<g class="kl-corolla" style="--layer:${layer};transform-origin:300px 300px">${Array.from({length:12},(_,i)=>`<path transform="rotate(${i*30+layer*15} 300 300) scale(${1-layer*.18}) translate(${layer*66} ${layer*66})" d="M300 300 Q170 150 300 40 Q430 150 300 300Z" fill="url(#klGold)" fill-opacity=".12" stroke="url(#klGold)" stroke-width="1.5"/>`).join('')}</g>`).join('')}<circle cx="300" cy="300" r="28" fill="#fff0b3"/><circle cx="300" cy="300" r="44" stroke="#f5d28a" stroke-dasharray="2 8"/></svg>`;
        },
        clear() {
            this.events?.abort();this.observer?.disconnect();this.motion?.removeEventListener('change',this.sync);
            this.timers.forEach(clearTimeout);this.timers.clear();this.host?.remove();this.realm?.remove();
            if(this.pet){this.pet.classList.remove('kl-pet');for(const [k,v]of Object.entries(this.saved||{}))v===null?this.pet.removeAttribute(k):this.pet.setAttribute(k,v);}
            document.documentElement.classList.remove('kl-equipped');
            this.pet=this.host=this.realm=this.shadow=null;this.nextCast=0;
        },
        mount() {
            this.clear();const pet=document.getElementById('virtual-pet-img');if(!pet)return;
            this.pet=pet;this.saved=Object.fromEntries(['title','tabindex','role','aria-label'].map(k=>[k,pet.getAttribute(k)]));
            pet.classList.add('kl-pet');pet.title='Vạn Đăng Khai Liên · nhấn để kích hoạt · hồi chiêu 12 giây';
            pet.tabIndex=0;pet.setAttribute('role','button');pet.setAttribute('aria-label','Kim Liên: kích hoạt Vạn Đăng Khai Liên');
            if(!document.getElementById('kim-lien-css')){const link=document.createElement('link');link.id='kim-lien-css';link.rel='stylesheet';link.href=css;document.head.appendChild(link);}
            document.documentElement.classList.add('kl-equipped');
            const host=this.host=document.createElement('div');host.id='kim-lien-world';host.setAttribute('aria-hidden','true');
            host.style.cssText='all:initial!important;position:fixed!important;inset:0!important;pointer-events:none!important;z-index:950!important;overflow:hidden!important;contain:strict!important;';
            const shadow=this.shadow=host.attachShadow({mode:'open'});
            const count=window.EffectQualityManager?.getRecommendedCount?.(18)||18;
            shadow.innerHTML=`<link rel="stylesheet" href="${css}"><div class="kl-atmosphere">${this.palace()}<div class="kl-silk"></div><div class="kl-reflection"></div><div class="kl-edge kl-left">${this.lotus()}</div><div class="kl-edge kl-right">${this.lotus()}</div>${Array.from({length:Math.min(22,Math.max(5,count))},(_,i)=>`<i class="kl-lantern" style="--x:${(i*61)%100}%;--delay:${-i*1.7}s;--duration:${18+i%7}s;--scale:${.4+(i%5)*.15}"><b></b></i>`).join('')}</div>`;
            document.body.appendChild(host);
            this.realm=document.createElement('div');this.realm.className='kl-pet-realm';this.realm.setAttribute('aria-hidden','true');this.realm.attachShadow({mode:'open'}).innerHTML=`<link rel="stylesheet" href="${css}"><div class="kl-aura-scene"><div class="kl-aura-halo">${this.astrolabe()}</div><div class="kl-aura-throne">${this.lotus()}</div><div class="kl-aura-mist"></div>${Array.from({length:8},(_,i)=>`<i class="kl-aura-jewel" style="--i:${i}"></i>`).join('')}</div>`;pet.parentElement.appendChild(this.realm);
            this.events=new AbortController();const {signal}=this.events;
            const cast=e=>{if(e.type==='keydown'&&!['Enter',' '].includes(e.key))return;e.preventDefault();this.ultimate();};
            pet.addEventListener('click',cast,{signal});pet.addEventListener('keydown',cast,{signal});
            document.addEventListener('pointerdown',e=>{if(e.target===pet||this.paused)return;this.bloom(e.clientX,e.clientY);},{signal,passive:true});
            this.motion=matchMedia('(prefers-reduced-motion: reduce)');
            this.sync=()=>{
                if(!pet.isConnected){this.clear();return;}
                this.paused=document.hidden||this.motion.matches||document.body.classList.contains('wfx-low-power');
                host.classList.toggle('kl-paused',this.paused);
                if(this.realm)this.realm.hidden=this.paused;
                if(this.paused)shadow.querySelectorAll('.kl-ultimate,.kl-bloom').forEach(n=>n.remove());
            };
            document.addEventListener('visibilitychange',this.sync,{signal});this.motion.addEventListener('change',this.sync);
            this.observer=new MutationObserver(this.sync);this.observer.observe(document.body,{attributes:true,attributeFilter:['class'],childList:true});this.sync();
        },
        bloom(x,y) {
            if(!this.shadow||performance.now()-(this.lastTap||0)<180)return;this.lastTap=performance.now();
            const bloom=document.createElement('div');bloom.className='kl-bloom';bloom.style.cssText=`left:${x}px;top:${y}px`;bloom.innerHTML=this.lotus();this.shadow.appendChild(bloom);this.later(()=>bloom.remove(),1500);
        },
        ultimate() {
            if(!this.shadow||this.paused||Date.now()<this.nextCast)return;
            this.nextCast=Date.now()+12000;
            const scene=document.createElement('div');scene.className='kl-ultimate';
            scene.innerHTML=`<div class="kl-eclipse"></div><div class="kl-crown">${this.astrolabe()}</div><div class="kl-gate kl-gate-left"></div><div class="kl-gate kl-gate-right"></div>${Array.from({length:24},(_,i)=>`<i class="kl-ray" style="--angle:${i*15}deg;--delay:${i*.035}s"></i>`).join('')}<div class="kl-sanctum">${this.lotus()}</div><div class="kl-tide"></div><div class="kl-title">VẠN ĐĂNG KHAI LIÊN<small>Kim Liên · Vạn Đăng Tiên Quân</small></div>${Array.from({length:9},(_,i)=>`<div class="kl-offering" style="--i:${i};--x:${10+i*10}%">${this.lotus()}</div>`).join('')}`;
            this.shadow.appendChild(scene);this.later(()=>scene.remove(),6200);
        }
    };
})();
