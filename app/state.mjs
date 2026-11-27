export const initial=()=>({version:1,revision:0,cluster:'Cụm shop',shops:[],defaultShop:'*',dict:{PSDP:'pin sạc dự phòng'},sessions:[]});
const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('topzone-price-desk',1);r.onupgradeneeded=()=>r.result.createObjectStore('data');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
export async function read(){return await new Promise((resolve,reject)=>{const q=db.transaction('data').objectStore('data').get('state');q.onsuccess=()=>resolve(q.result||initial());q.onerror=()=>reject(q.error)})}
export async function write(state){await new Promise((resolve,reject)=>{const tx=db.transaction('data','readwrite'),os=tx.objectStore('data'),r=os.get('state');r.onsuccess=()=>{if((r.result?.revision||0)!==state.revision){tx.abort();return}os.put({...state,revision:state.revision+1},'state')};tx.oncomplete=resolve;tx.onabort=()=>reject(Error('Chưa lưu được. Tải lại trang để đọc bản mới nhất và thử lại.'))});state.revision++}

