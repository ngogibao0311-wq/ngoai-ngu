/* ------------------------------ IndexedDB ------------------------------ */
let db;
let isDbReady = false;
let isDomReady = false;

function checkAndLaunch() {
    if (isDbReady && isDomReady && typeof mainInit === 'function') mainInit();
}

const dbRequest = indexedDB.open('HSKProDB', 7);

dbRequest.onupgradeneeded = (event) => {
    db = event.target.result;
    console.log("Đang nâng cấp Database...");
    const stores = ['audios', 'videos', 'documents', 'media', 'backgrounds', 'settings_store'];
    stores.forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
            if (storeName === 'videos' || storeName === 'backgrounds') {
                db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
            } else if (storeName === 'settings_store') {
                db.createObjectStore(storeName, { keyPath: 'id' });
            } else {
                db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
            }
        }
    });
};

dbRequest.onsuccess = (event) => {
    db = event.target.result;
    isDbReady = true;
    checkAndLaunch();
};

dbRequest.onerror = (event) => {
    console.error('Database error:', event.target.error);
    toast('Lỗi mở database.', 'error');
};

// DB Functions
function addDocument(title, category, file) { return new Promise((resolve, reject) => { file.arrayBuffer().then(buffer => { const tx = db.transaction(['documents'], 'readwrite'); const store = tx.objectStore('documents'); const req = store.add({ title, category, data: buffer, type: file.type }); req.onsuccess = () => resolve(); req.onerror = (e) => reject(e.target.error); }).catch(reject); }); }
function updateDocument(id, title, category, file) { return new Promise((resolve, reject) => { file.arrayBuffer().then(buffer => { const tx = db.transaction(['documents'], 'readwrite'); const store = tx.objectStore('documents'); const req = store.put({ id, title, category, data: buffer, type: file.type }); req.onsuccess = () => resolve(); req.onerror = (e) => reject(e.target.error); }).catch(reject); }); }
function getDocuments() { return new Promise((resolve, reject) => { const tx = db.transaction(['documents'], 'readonly'); const req = tx.objectStore('documents').getAll(); req.onsuccess = () => resolve(req.result); req.onerror = (e) => reject(e.target.error); }); }
function deleteDocument(id) { return new Promise((resolve, reject) => { const tx = db.transaction(['documents'], 'readwrite'); const req = tx.objectStore('documents').delete(id); req.onsuccess = () => resolve(); req.onerror = (e) => reject(e.target.error); }); }
function getDocumentData(id) { return new Promise((resolve, reject) => { const tx = db.transaction(['documents'], 'readonly'); const req = tx.objectStore('documents').get(id); req.onsuccess = () => resolve(req.result); req.onerror = (e) => reject(e.target.error); }); }

function addAudio(title, desc, hskLevel, file) { return new Promise((resolve, reject) => { file.arrayBuffer().then(buffer => { const tx = db.transaction(['audios'], 'readwrite'); const store = tx.objectStore('audios'); const req = store.add({ title, desc, hskLevel, data: buffer, type: file.type }); req.onsuccess = () => resolve(req.result); req.onerror = (e) => reject(e.target.error); }).catch(reject); }); }
function updateAudio(item) { return new Promise((resolve, reject) => { const tx = db.transaction(['audios'], 'readwrite'); const req = tx.objectStore('audios').put(item); req.onsuccess = () => resolve(req.result); req.onerror = (e) => reject(e.target.error); }); }
function getAudios() { return new Promise((resolve, reject) => { const tx = db.transaction(['audios'], 'readonly'); const req = tx.objectStore('audios').getAll(); req.onsuccess = () => resolve(req.result); req.onerror = (e) => reject(e.target.error); }); }
function deleteAudio(id) { return new Promise((resolve, reject) => { const tx = db.transaction(['audios'], 'readwrite'); const req = tx.objectStore('audios').delete(id); req.onsuccess = () => resolve(); req.onerror = (e) => reject(e.target.error); }); }
function getAudioData(id) { return new Promise((resolve, reject) => { const tx = db.transaction(['audios'], 'readonly'); const req = tx.objectStore('audios').get(id); req.onsuccess = () => resolve(req.result); req.onerror = (e) => reject(e.target.error); }); }

function addVideoItem(item) { return new Promise((resolve, reject) => { const tx = db.transaction(['videos'], 'readwrite'); const store = tx.objectStore('videos'); const req = store.add(item); req.onsuccess = () => resolve(req.result); req.onerror = (e) => reject(e.target.error); }); }
function getVideosFromDB() { return new Promise((resolve, reject) => { const tx = db.transaction(['videos'], 'readonly'); const req = tx.objectStore('videos').getAll(); req.onsuccess = () => resolve(req.result); req.onerror = (e) => reject(e.target.error); }); }
function getVideoDataFromDB(id) { return new Promise((resolve, reject) => { const tx = db.transaction(['videos'], 'readonly'); const req = tx.objectStore('videos').get(id); req.onsuccess = () => resolve(req.result); req.onerror = (e) => reject(e.target.error); }); }
function deleteVideoFromDB(id) { return new Promise((resolve, reject) => { const tx = db.transaction(['videos'], 'readwrite'); const req = tx.objectStore('videos').delete(id); req.onsuccess = () => resolve(); req.onerror = (e) => reject(e.target.error); }); }

function saveCustomBg(file) { return new Promise((resolve, reject) => { file.arrayBuffer().then(buffer => { const tx = db.transaction(['backgrounds'], 'readwrite'); const req = tx.objectStore('backgrounds').add({ name: file.name, type: file.type, data: buffer }); req.onsuccess = () => resolve(req.result); req.onerror = (e) => reject(e.target.error); }).catch(reject); }); }
function getCustomBg(id) { return new Promise((resolve, reject) => { const tx = db.transaction(['backgrounds'], 'readonly'); const req = tx.objectStore('backgrounds').get(id); req.onsuccess = () => resolve(req.result); req.onerror = (e) => reject(e.target.error); }); }
function getAllCustomBgs() { return new Promise((resolve, reject) => { const tx = db.transaction(['backgrounds'], 'readonly'); const req = tx.objectStore('backgrounds').getAll(); req.onsuccess = () => resolve(req.result); req.onerror = (e) => reject(e.target.error); }); }
function deleteCustomBg(id) { return new Promise((resolve, reject) => { const tx = db.transaction(['backgrounds'], 'readwrite'); const req = tx.objectStore('backgrounds').delete(id); req.onsuccess = () => resolve(); req.onerror = (e) => reject(e.target.error); }); }

function saveMusicFile(file) { return new Promise((resolve, reject) => { file.arrayBuffer().then(buffer => { const tx = db.transaction(['settings_store'], 'readwrite'); const req = tx.objectStore('settings_store').put({ id: 'user_music', data: buffer, type: file.type, name: file.name }); req.onsuccess = () => resolve(); req.onerror = (e) => reject(e.target.error); }).catch(reject); }); }
function getMusicFile() { return new Promise((resolve, reject) => { const tx = db.transaction(['settings_store'], 'readonly'); const req = tx.objectStore('settings_store').get('user_music'); req.onsuccess = () => resolve(req.result); req.onerror = (e) => reject(e.target.error); }); }
function deleteMusicFile() { return new Promise((resolve, reject) => { const tx = db.transaction(['settings_store'], 'readwrite'); const req = tx.objectStore('settings_store').delete('user_music'); req.onsuccess = () => resolve(); req.onerror = (e) => reject(e.target.error); }); }