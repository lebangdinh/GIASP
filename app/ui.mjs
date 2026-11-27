import {advanced} from './advanced.mjs';
import {mapping,group,fold,normalize,category,categories,lines,money,fmt,offers,installments,confirmPrice,quote,hasFinal,message,trial,needs,duplicate,compare,value} from './core.mjs';
import {readWorkbook,exportExcel} from './excel.mjs';
import {renderReport} from './report.mjs';
import {initial,read,write} from './state.mjs';
import {overview} from './overview.mjs';
const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
const esc=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const paths={report:'M3 20h18M5 17v-5h3v5zm6 0V7h3v10zm6 0V3h3v14z',search:'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',import:'M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5',history:'M3 12a9 9 0 1 0 2-6L2 9m0-6v6h6m4-3v6l4 2',news:'M4 3h16v18H4z M7 7h10M7 11h10M7 15h6',print:'M7 8V3h10v5M7 17H3V9h18v8h-4M7 14h10v7H7z',shops:'M3 10l2-6h14l2 6M4 11v9h16v-9M9 20v-6h6v6',file:'M5 2h9l5 5v15H5z M14 2v6h5M8 13h8m-8 4h6'};
const icon=(id,size=19)=>'<svg aria-hidden="true" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="'+paths[id]+'"/></svg>';
paths.overview='M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z';
let workMode='';
paths.advanced=paths.overview;
const nav={overview:'Tổng quan',advanced:'Nghiệp vụ nâng cao',search:'Tra giá tại quầy',import:'Nhập bảng giá',history:'Lịch sử phiên',report:'Phân tích giá',news:'Bản tin cho shop',print:'In tem sản phẩm',shops:'Quản lý cụm'};
const names={name:'Tên sản phẩm',badge1:'Đặc',badge2:'Quyền',ref:'Mã tham chiếu',time:'Giá trị F gốc',code:'Mã sản phẩm',promo:'Khuyến mãi',spec:'Thông số',labels:'Chỉ tiêu trả chậm',values1:'Số liệu đối tác 1',partner1:'Đối tác 1',partner2:'Đối tác 2',values2:'Số liệu đối tác 2',partner3:'Đối tác 3',values3:'Số liệu đối tác 3',s:'Giá đối chiếu',u:'Giá trên tem'};
let state=await read(),shop=localStorage.shop||state.defaultShop, sid=localStorage.sid||'',tab=state.sessions.length?'search':'import',draft=null,selected=new Set(),q='',filters={},detailCode='',page=0,oldId='',mode='source',width=100,height=120,lookup='',seed=null;
const scopeName=k=>k==='*'?state.cluster+' · Toàn cụm':state.shops.find(x=>x.id===k)?.name+' ('+k+')';
const bundled=document.querySelector('#bundled-session');
if(bundled && !state.sessions.length && !state.revision){
 const first=JSON.parse(bundled.textContent);
 state.sessions.push(first);
 await write(state);
}
if(state.sessions.length)tab='overview';
const available=()=>state.sessions.filter(s=>s.scope===shop||s.scope==='*').sort((a,b)=>b.date.localeCompare(a.date)||b.at.localeCompare(a.at));
const current=()=>available().find(s=>s.id===sid);
const scopeText=s=>scopeName(shop)+' · '+(s.scope==='*'?'Bảng toàn cụm':'Bảng riêng');
const opt=(val,label,sel)=>'<option value="'+esc(val)+'" '+(String(val)===String(sel)?'selected':'')+'>'+esc(label)+'</option>';
const scopeOpts=k=>opt('*',state.cluster+' · Toàn cụm',k)+state.shops.map(x=>opt(x.id,x.name+' · '+x.id,k)).join('');
const title=(h,p='')=>'<div class="title"><div><h1>'+esc(h)+'</h1>'+(p?'<p class="muted">'+esc(p)+'</p>':'')+'</div></div>';
const pill=(s,w=false)=>'<span class="pill '+(w?'warn':'')+'">'+esc(s)+'</span>';
const button=(id,label,primary=false)=>'<button id="'+id+'" class="'+(primary?'primary':'')+'">'+label+'</button>';
const input=(id,label,type='text',v='')=>'<label>'+label+'<input id="'+id+'" type="'+type+'" value="'+esc(v)+'"></label>';
const stats=entries=>'<div class="stats">'+entries.map(([k,v])=>'<div class="stat"><small>'+esc(k)+'</small><strong>'+esc(v.toLocaleString('vi-VN'))+'</strong></div>').join('')+'</div>';
const when=x=>new Date(x).toLocaleString('vi-VN');
const date=()=>new Date().toLocaleDateString('sv-SE');
const toast=s=>{const t=$('#toast');t.textContent=s;setTimeout(()=>{if(t.textContent===s)t.textContent=''},4200)};
const guarded=fn=>async e=>{try{await fn(e)}catch(err){alert(err.message||err)}};
const on=(id,event,fn)=>{const el=$('#'+id);if(el)el.addEventListener(event,guarded(fn))};
const click=(id,fn)=>on(id,'click',fn);
const save=async()=>{try{await write(state)}catch(e){state=await read();render();throw e}};
const download=(blob,name)=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)};
const copy=async text=>{if(!text.trim())throw Error('Chưa có nội dung để sao chép.');await navigator.clipboard.writeText(text);toast('Đã sao chép')};
let reportFilter={};
const clear=()=>{reportFilter={};selected.clear();detailCode='';page=0;q='';filters={};lookup='';oldId='';$('#dialog').close()};
const priorTo=s=>available().find(x=>x.scope===s.scope && (x.date<s.date || x.date===s.date && x.at<s.at));
function openWork(mode){workMode=mode;tab='advanced';render()}
function render(){
 document.getElementById('advancedMount').hidden=true;
 $('#view').setAttribute('aria-busy','false');
 $('#view').onclick=null;
 if(!state.shops.some(s=>s.id===shop)&&shop!=='*')shop=state.defaultShop;
 if(!current()){const arr=available();sid=(arr.find(s=>s.scope===shop)||arr[0])?.id||''}
 localStorage.shop=shop;localStorage.sid=sid;
 $('#nav').innerHTML=Object.entries(nav).map(([id,s])=>'<button data-tab="'+id+'" class="'+(id===tab?'active':'')+'">'+icon(id)+s+'</button>').join('');
 all('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;workMode='';render()});
 $('#scope').innerHTML='<div class="scope">'+icon('shops')+'<select id="shop" aria-label="Shop đang xem">'+scopeOpts(shop)+'</select><select id="session" aria-label="Phiên bảng giá">'+(available().map(s=>opt(s.id,s.date+' · '+s.name+' · '+(s.scope==='*'?'Toàn cụm':'Riêng shop'),sid)).join('')||opt('','Chưa có phiên',''))+'</select></div>';
 on('shop','change',e=>{shop=e.target.value;sid='';clear();render()});on('session','change',e=>{sid=e.target.value;clear();render()});
 if(tab==='advanced'){const s=current();const previous=s && available().filter(x=>x.scope===s.scope && (x.date<s.date || x.date===s.date && x.at<s.at))[0];advanced({root:document.querySelector('#view'),mode:workMode,session:s,previous,icon,open:openWork})}else if(tab==='import')importView();else if(tab==='shops')shopsView();else if(tab==='history')historyView();else if(!current()){$('#view').innerHTML=title(nav[tab])+'<div class="card"><p>Chưa có bảng giá cho phạm vi này.</p><div class="actions">'+button('go','Nhập bảng giá',true)+'</div></div>';click('go',()=>{tab='import';render()})}else if(tab==='search')searchView();else if(tab==='report'){
   renderReport({root:$('#view'),session:current(),scope:scopeText(current()),dict:state.dict,esc,opt,detail,download,guarded,filter:reportFilter,
     send(codes,target='news'){selected=new Set(codes);lookup='';mode='source';tab=target;render()}});
 }else if(tab==='overview')overview({root:$('#view'),session:current(),dict:state.dict,esc,icon,detail,openWork,previous:priorTo(current()),shop,send(id,codes){selected=new Set(codes);lookup='';mode='source';tab=id;render()},open(id,f){q='';page=0;filters=f;tab=id;render()}});
 else batchView();
}
const fileInput='<input type="file" accept=".xlsx" id="xlsx" hidden><label class="file" tabindex="0" for="xlsx">Chọn file Excel</label>';
function importView(){
 $('#view').innerHTML=title('Nhập bảng giá','Chọn file Excel, kiểm tra dữ liệu và lưu phiên áp dụng cho shop.')+
 '<section class="card hero">'+icon('file',36)+'<h2>'+(draft?esc(draft.file):'Bảng giá từ Excel')+'</h2><p class="muted">Kéo thả một file .xlsx vào đây hoặc chọn file trên thiết bị.</p>'+fileInput+'</section><div id="preview"></div>';
 $('.file').onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();$('#xlsx').click()}};
 const dropZone=$('.hero');
 dropZone.ondragover=e=>{e.preventDefault();e.dataTransfer.dropEffect='copy';dropZone.classList.add('dragging')};
 dropZone.ondragleave=e=>{if(!dropZone.contains(e.relatedTarget))dropZone.classList.remove('dragging')};
 dropZone.ondrop=guarded(async e=>{
   e.preventDefault();dropZone.classList.remove('dragging');
   if(e.dataTransfer.files.length!==1)throw Error('Chọn một file Excel mỗi lần nhập.');
   await previewFile(e.dataTransfer.files[0]);
 });
 on('xlsx','change',e=>previewFile(e.target.files[0]));
 async function previewFile(file){
   if(!file)return;
   if(!/\.xlsx$/i.test(file.name))throw Error('Vui lòng chọn file Excel .xlsx.');
   const bytes=await file.arrayBuffer();const wb=await readWorkbook(bytes);
   const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
 try{seed=bundled?JSON.parse(document.querySelector('#bundled-seed').textContent):await (await fetch('./sample.local.json')).json()}catch{seed=null}
 draft={wb,file:file.name,hash,index:0,map:{...mapping},rows:await wb.rows(0),date:seed?.hash===hash?seed.date:date(),name:file.name.replace(/\.xlsx$/i,''),scope:shop};importView()}
 if(!draft){$('#preview').innerHTML='<div class="grid"><section class="card"><h2>Kiểm tra dữ liệu</h2><p class="muted">Xem sheet, mã trùng, giá thiếu và các dòng có điều kiện khác nhau trước khi lưu.</p></section><section class="card"><h2>Phạm vi áp dụng</h2><p class="muted">Chọn bảng chung cho toàn cụm hoặc bảng riêng của một shop.</p></section></div>';return}
 const d=draft;Object.assign(d,group(d.rows,d.map));const n=d.stats;
 $('#preview').innerHTML=stats([['Dòng nguồn',n.rows],['Mã duy nhất',n.codes],['Tên khác nhau',n.names],['Dòng lặp',n.duplicates],['Thiếu giá S',n.missingS],['Thiếu giá U',n.missingU],['Mã xung đột',n.conflicts]])+
 '<section class="card"><h2>Kiểm tra nguồn</h2><label>Sheet<select id="sheet">'+d.wb.sheets.map((s,i)=>opt(i,s.name,d.index)).join('')+'</select></label><details><summary>Ánh xạ cột Excel</summary><div class="mapping">'+Object.entries(d.map).map(([k,v])=>'<label>'+names[k]+'<input data-map="'+k+'" value="'+esc(v)+'" maxlength="3"></label>').join('')+'</div></details><div class="scroll"><table><tr><th>Dòng</th><th>Mã G</th><th>Tên sản phẩm</th><th>Giá trên tem</th></tr>'+d.rows.slice(0,4).map(r=>'<tr><td>'+r.row+'</td><td>'+esc(r.cells[d.map.code])+'</td><td>'+esc(r.cells[d.map.name])+'</td><td>'+fmt(money(r.cells[d.map.u]))+'</td></tr>').join('')+'</table></div>'+(n.invalid.length?'<p class="error">Dòng thiếu mã: '+n.invalid.join(', ')+'</p>':'')+'</section>'+
 '<section class="card"><h2>Lưu phiên bảng giá</h2><div class="row">'+input('dname','Tên phiên','text',d.name)+input('ddate','Ngày áp dụng','date',d.date)+'<label>Phạm vi<select id="dscope">'+scopeOpts(d.scope)+'</select></label></div>'+(seed?.hash===d.hash?'<p class="muted">Phiên mẫu ngày '+esc(seed.date)+' có xác nhận quản lý đi kèm. Xác nhận áp dụng cho phạm vi bạn chọn.</p>':'')+'<div class="actions">'+button('commit','Xác nhận và lưu phiên',true)+'</div></section>';
 on('sheet','change',async e=>{d.index=Number(e.target.value);d.rows=await d.wb.rows(d.index);importView()});
 all('[data-map]').forEach(el=>el.onchange=()=>{const v=el.value.trim().toUpperCase();if(/^[A-Z]{1,3}$/.test(v))d.map[el.dataset.map]=v;importView()});
 for(const [id,k] of [['dname','name'],['ddate','date'],['dscope','scope']])on(id,'input',e=>d[k]=e.target.value);
 click('commit',async()=>{if(!d.date||!d.name.trim()||!n.codes||n.invalid.length)throw Error('Kiểm tra tên phiên, ngày áp dụng và mã ở các dòng nguồn.');if(duplicate(state.sessions,d))throw Error('File đã được nhập cho cùng ngày và phạm vi.');
 const s={id:crypto.randomUUID(),at:new Date().toISOString(),name:d.name.trim(),date:d.date,scope:d.scope,file:d.file,sheet:d.wb.sheets[d.index].name,hash:d.hash,map:{...d.map},products:d.products,stats:d.stats};
 const p=s.products[seed?.code];if(seed?.hash===s.hash&&s.date===seed.date&&s.sheet===seed.sheet&&JSON.stringify(s.map)===JSON.stringify(mapping)&&p&&!p.issues.length&&value(p).s===seed.s&&value(p).u===seed.u)confirmPrice(p,seed.price,seed.condition,seed.reason);
 const prior=state.sessions.filter(x=>x.scope===s.scope&&x.date<=s.date).sort((a,b)=>b.date.localeCompare(a.date)||b.at.localeCompare(a.at))[0];
 if(prior)for(const c of compare(prior,s))if(prior.products[c.code]?.history.length&&s.products[c.code])s.products[c.code].recheck=true;
 state.sessions.push(s);await save();shop=s.scope;sid=s.id;tab='search';draft=null;clear();render();toast('Đã lưu phiên bảng giá')});
}


function searchView(){const s=current();const ps=Object.values(s.products);const tags=[...new Set(ps.flatMap(p=>offers(value(p).promo).flatMap(x=>x.tags)))];
 const sel=(id,label,vals)=>'<label>'+label+'<select id="'+id+'">'+opt('','Tất cả',filters[id])+vals.map(v=>opt(v,v,filters[id])).join('')+'</select></label>';
 $('#view').innerHTML=title('Tra giá tại quầy',scopeText(s)+' · '+s.date+' · '+s.file)+stats([['Mã sản phẩm',ps.length],['Có giá cuối',ps.filter(hasFinal).length],['Cần kiểm tra',ps.filter(needs).length]])+
 '<section class="card"><label class="search">'+icon('search')+'<input id="query" placeholder="Tìm tên, mã sản phẩm hoặc mã tham chiếu…" value="'+esc(q)+'"></label><details '+(Object.values(filters).some(Boolean)?'open':'')+'><summary>Bộ lọc sản phẩm</summary><div class="grid">'+sel('cat','Nhóm phụ kiện',categories)+sel('offer','Loại ưu đãi',tags)+sel('status','Trạng thái',['Đặc quyền','Có giá cuối','Cần xác nhận','Cần kiểm tra'])+input('min','Giá từ (đ)','number',filters.min)+input('max','Giá đến (đ)','number',filters.max)+'</div></details></section><section class="card"><h2 id="count"></h2><div id="results"></div></section>';
 on('query','input',e=>{q=e.target.value;page=0;results()});for(const k of ['cat','offer','status','min','max'])on(k,'input',e=>{filters[k]=e.target.value;page=0;results()});results();
}
function matches(p,t){return p.code.includes(t)||p.variants.some(({v})=>fold(v.ref).includes(t)||normalize(v.name,state.dict).includes(t)||fold(v.name).includes(t))}
function results(){const s=current(),t=normalize(q,state.dict);const list=Object.values(s.products).filter(p=>{const v=value(p),g=quote(p);return matches(p,t)&&(!filters.cat||category(v.name,state.dict)===filters.cat)&&(!filters.offer||offers(v.promo).some(o=>o.tags.includes(filters.offer)))&&(!filters.min||g.price!=null&&g.price>=Number(filters.min))&&(!filters.max||g.price!=null&&g.price<=Number(filters.max))&&(!filters.status||({'Đặc quyền':v.exclusive,'Có giá cuối':hasFinal(p),'Cần xác nhận':!hasFinal(p)&&needs(p),'Cần kiểm tra':needs(p)})[filters.status])}).sort((a,b)=>Number(b.code===t)-Number(a.code===t)||String(value(a).name).localeCompare(String(value(b).name),'vi'));
 $('#count').textContent=list.length+' sản phẩm';$('#results').innerHTML=list.length?'<table class="catalog"><thead><tr><th>Sản phẩm</th><th>Giá báo khách</th><th>Trạng thái</th></tr></thead><tbody>'+list.slice(page*30,page*30+30).map(p=>{const g=quote(p);return '<tr data-code="'+esc(p.code)+'"><td><button class="product">'+esc(value(p).name)+'</button><br><span class="code">'+esc(p.code)+'</span> · <button class="brand-edit" data-editbrand>'+esc(C933Brands.resolve(value(p).name,p.code))+'</button></td><td><span class="list-price">'+fmt(g.price)+'</span><br><small>'+g.label+'</small></td><td>'+(value(p).exclusive?pill('Đặc quyền'):'')+(hasFinal(p)?pill(p.history.length?'Quản lý xác nhận':'Theo ưu đãi'):needs(p)?pill('Cần kiểm tra',true):'—')+'</td></tr>'}).join('')+'</tbody></table><div class="actions">'+(page?button('prev','Trang trước'):'')+'<small>Trang '+(page+1)+' / '+Math.ceil(list.length/30)+'</small>'+(list.length>(page+1)*30?button('next','Trang sau'):'')+'</div>':'<p class="empty">Không có sản phẩm phù hợp.</p>';all('[data-code]').forEach(el=>el.onclick=e=>{detail(el.dataset.code);if(e.target.closest('[data-editbrand]')){const input=document.querySelector('#manualBrand');input.closest('details').open=true;input.focus()}});click('prev',()=>{page--;results()});click('next',()=>{page++;results()})}
function detail(code){detailCode=code;const s=current(),p=s.products[code],v=value(p),g=quote(p),os=offers(v.promo),rates=os.filter(o=>o.rate!=null),dialog=$('#dialog');
 const amount=v.s!=null&&v.u!=null?v.s-v.u:null;
 const raw='<details><summary>Dòng Excel gốc · '+p.count+' lần xuất hiện</summary>'+p.variants.map(x=>'<p>'+esc(s.file)+' · '+esc(s.sheet)+' · dòng '+x.rows.join(', ')+'</p><pre>'+esc(JSON.stringify(x.cells,null,2))+'</pre>').join('')+'</details>';
 dialog.innerHTML=button('close','Đóng')+'<p class="code">'+esc(code)+'</p><h2>'+esc(v.name)+'</h2><p>'+esc(scopeText(s))+' · '+esc(s.date)+'</p><p class="muted">'+esc(s.name)+' · Nhập '+when(s.at)+'</p>'+
 (p.issues.length?'<div class="card warn"><b>Dữ liệu xung đột</b><p>Trường khác nhau: '+p.issues.map(k=>names[k]||k).join(', ')+'. Đối chiếu các dòng nguồn trước khi báo giá.</p></div>'+raw:
 '<div class="card"><div>'+pill(g.label)+(v.exclusive?pill('Đặc quyền'):'')+(!hasFinal(p)&&needs(p)?pill('Cần xác nhận',true):'')+'</div><div class="price">'+fmt(g.price)+'</div>'+(g.source?'<p>'+esc(g.source)+(g.rate!=null?' · '+esc(g.reason):'')+'</p>':'')+'<p>Giá đối chiếu: '+fmt(v.s)+' · Giá trên tem: '+fmt(v.u)+'</p>'+(amount!=null?'<small>Chênh lệch S − U: '+fmt(amount)+(v.s>0?' ('+(amount/v.s*100).toLocaleString('vi-VN',{maximumFractionDigits:2})+'%)':'')+'</small>':'')+(amount<0?'<p class="error">Giá trên tem cao hơn giá đối chiếu.</p>':'')+'</div>'+
 '<div class="actions">'+button('customer','Copy báo khách',true)+button('staff','Copy cho nhân viên')+button('oneprint','Xem tem')+'</div><details><summary>Xem trước nội dung copy</summary><h3>Báo khách</h3><pre>'+esc(message(p,s,scopeText(s)))+'</pre><h3>Cho nhân viên</h3><pre>'+esc(message(p,s,scopeText(s),true))+'</pre></details>'+
 '<h3>Khuyến mãi</h3>'+os.map(o=>'<details><summary>'+esc(o.tags.join(' · ')||'Ưu đãi theo nguồn')+'</summary><p>'+esc(o.source)+'</p></details>').join('')+
 '<details><summary>Thông số sản phẩm</summary><p class="lines">'+esc(lines(v.spec).join('\n')||'Chưa có thông số')+'</p></details><details><summary>Phương án trả chậm</summary>'+plans(v)+'</details>'+raw+
 '<details id="manager"><summary>Quản lý xác nhận giá</summary><div class="form">'+(rates.length?'<label>Ưu đãi tính thử<select id="rate">'+rates.map((o,i)=>opt(i,o.source,0)).join('')+'</select></label><p id="trial"></p><button id="useTrial" type="button">Dùng giá tính thử để xác nhận</button>':'')+input('finalprice','Giá cuối xác nhận (đ)','number',g.price??'')+'<label>Điều kiện gửi khách<textarea id="condition">'+esc(g.condition)+'</textarea></label><label>Lý do xác nhận hoặc sửa giá<textarea id="reason"></textarea></label>'+button('confirmprice','Lưu xác nhận',true)+'</div><h3>Lịch sử xác nhận</h3>'+p.history.slice().reverse().map(h=>'<p>'+when(h.at)+' · '+fmt(h.price)+' · '+esc(h.source)+'</p><small>'+esc(h.reason)+'</small>').join('')+'</details>');
 const brand=C933Brands.resolve(v.name,code);
 dialog.querySelector('h2').insertAdjacentHTML('afterend','<details><summary>Hãng · '+esc(brand)+'</summary><label>Hãng cho mã '+esc(code)+'<input id="manualBrand" list="knownBrands" maxlength="60" value="'+esc(brand==='Chưa xác định'?'':brand)+'"></label><datalist id="knownBrands">'+C933Brands.names.map(n=>'<option value="'+esc(n)+'">').join('')+'</datalist><div class="actions">'+button('saveBrand','Lưu hãng cho mã này')+button('autoBrand','Dùng nhận diện tự động')+'</div></details>');
 click('saveBrand',()=>{const name=$('#manualBrand').value.trim();if(!name)throw Error('Nhập hoặc chọn hãng.');C933Brands.save(code,name);if(tab==='search')results();detail(code);toast('Đã lưu hãng cho '+code)});
 click('autoBrand',()=>{C933Brands.save(code,'');if(tab==='search')results();detail(code);toast('Đã dùng nhận diện tự động')});
 const timeline=state.sessions.filter(x=>x.scope===s.scope).sort((a,b)=>b.date.localeCompare(a.date)||b.at.localeCompare(a.at));
 const history=document.createElement('details');
 history.innerHTML='<summary>Diễn biến giá qua '+timeline.length+' phiên cùng phạm vi</summary><div class="scroll"><table><tr><th>Phiên</th><th>Giá trên tem</th><th>Giá báo khách</th><th>Khuyến mãi theo nguồn</th></tr>'+timeline.map(x=>{
   const item=x.products[code];let body='<td colspan="3">Mã vắng trong phiên</td>';
   if(item){
     const g=quote(item),v=value(item);
     body=item.issues.length?'<td colspan="3">Xung đột dữ liệu nguồn</td>':'<td>'+fmt(v.u)+'</td><td>'+fmt(g.price)+'<br><small>'+esc(g.label)+'</small></td><td>'+esc(lines(v.promo).join(' · ')||'—')+'</td>';
   }
   return '<tr><td>'+esc(x.date)+'<br>'+esc(x.name)+'</td>'+body+'</tr>';
 }).join('')+'</table></div>';
 dialog.append(history);
 $('#close').className='close';click('close',()=>dialog.close());if(!dialog.open)dialog.showModal();dialog.scrollTop=0;
 click('customer',()=>copy(message(p,s,scopeText(s))));click('staff',()=>copy(message(p,s,scopeText(s),true)));click('oneprint',()=>{selected=new Set([code]);mode=hasFinal(p)?'final':'source';dialog.close();tab='print';render()});
 if($('#rate')){const calc=()=>{const o=rates[Number($('#rate').value)];$('#trial').textContent='Giá tính thử: '+fmt(v.u)+' × '+(100-o.rate)+'% = '+fmt(trial(v.u,o.rate))};calc();on('rate','change',calc);click('useTrial',()=>{const offer=rates[Number($('#rate').value)];$('#finalprice').value=trial(v.u,offer.rate)??'';$('#condition').value=offer.source})}
 click('confirmprice',async()=>{
   if(shop!==s.scope)throw Error('Đây là bảng chung. Chọn Toàn cụm để xác nhận cho cả cụm, hoặc nhập phiên riêng cho shop.');
   confirmPrice(p,$('#finalprice').value,$('#condition').value.trim(),$('#reason').value.trim());
   await save();render();detail(code);toast('Đã lưu giá cuối');
 });
}
function plans(v){return installments(v).map(p=>'<div><b>'+esc(p.partner)+'</b> '+(p.amounts?esc('Lãi suất phẳng/thực '+p.amounts[0]+' · Trả trước '+fmt(p.amounts[1])+' · '+fmt(p.amounts[2])+'/tháng · Tổng trả chậm '+fmt(p.amounts[3])):'<span class="lines">'+esc(lines(v.labels).join('\n')+'\n'+lines(p.raw).join('\n'))+'</span>')+'</div>').join('')||'Không có dữ liệu trả chậm.'}
function historyView(){const s=current();const peers=s?state.sessions.filter(a=>a.scope===s.scope&&a.id!==s.id).sort((a,b)=>b.date.localeCompare(a.date)||b.at.localeCompare(a.at)):[];if(!peers.some(p=>p.id===oldId))oldId=(peers.find(p=>p.date<=s.date)||peers[0])?.id||'';
 $('#view').innerHTML=title('Lịch sử phiên')+'<section class="card"><h2>Các phiên đã nhập</h2><div class="scroll"><table><tr><th>Phiên / file</th><th>Phạm vi</th><th>Áp dụng / nhập lúc</th><th>Kiểm tra</th><th></th></tr>'+state.sessions.slice().reverse().map(a=>'<tr><td>'+esc(a.name)+'<br><small>'+esc(a.file)+'</small></td><td>'+esc(scopeName(a.scope))+'</td><td>'+esc(a.date)+'<br>'+when(a.at)+'</td><td>'+a.stats.codes+' mã · '+a.stats.duplicates+' dòng lặp · '+a.stats.conflicts+' xung đột</td><td><button data-open="'+esc(a.id)+'">Mở</button></td></tr>').join('')+'</table></div></section><section class="card"><h2>So sánh với phiên đang chọn</h2>'+(oldId?'<label>Phiên đối chiếu<select id="old">'+peers.map(a=>opt(a.id,a.date+' · '+a.name,oldId)).join('')+'</select></label>'+diffTable(compare(peers.find(a=>a.id===oldId),s)):'<p>Cần hai phiên cùng phạm vi để so sánh.</p>')+'</section>';
 if(oldId){
   const prior=peers.find(a=>a.id===oldId);
   const actions=document.createElement('div');
   actions.className='actions comparison-actions';
   actions.innerHTML='<b>'+esc(prior.date+' · '+prior.name)+' → '+esc(s.date+' · '+s.name)+'</b>'+button('reverseComparison','Đảo chiều')+button('exportComparison','Xuất Excel theo bộ lọc');
   $('#old').parentElement.after(actions);
   click('reverseComparison',()=>{const nextId=s.id;sid=prior.id;clear();oldId=nextId;render()});
   click('exportComparison',async()=>{
     const kind=$('#diffKind')?.value;
     const changes=compare(prior,s).filter(c=>!kind||c.kind===kind);
     if(!changes.length)throw Error('Chưa có thay đổi để xuất.');
     const data=[['Mã','Tên sản phẩm','Loại thay đổi','Giá U trước','Giá U sau','Chênh lệch (đ)','Thay đổi (%)','Ưu đãi cũ','Ưu đãi mới','Phiên trước','Phiên sau','Phạm vi'],
       ...changes.map(c=>[c.code,c.y.name||c.x.name,c.kind,c.x.u,c.y.u,c.delta,c.pct,lines(c.x.promo).join('\n'),lines(c.y.promo).join('\n'),prior.date+' · '+prior.name,s.date+' · '+s.name,scopeText(s)])];
     download(await exportExcel(data,'So sánh phiên'),'So-sanh-'+prior.date+'_'+s.date+'.xlsx');
   });
 }
 on('diffKind','change',e=>{
   const kind=e.target.value;
   all('[data-diff-kind]').forEach(row=>{row.hidden=Boolean(kind)&&row.dataset.diffKind!==kind});
 });
 on('old','change',e=>{oldId=e.target.value;render()});all('[data-open]').forEach(el=>el.onclick=()=>{const a=state.sessions.find(s=>s.id===el.dataset.open);shop=a.scope;sid=a.id;tab='search';clear();render()})}
function diffTable(changes){
 const counts=new Map();
 for(const {kind} of changes)counts.set(kind,(counts.get(kind)||0)+1);
 const filter=changes.length?'<label>Loại thay đổi<select id="diffKind">'+opt('','Tất cả ('+changes.length+')','')+[...counts].map(([kind,n])=>opt(kind,kind+' ('+n+')','')).join('')+'</select></label>':'';
 return filter+'<div class="scroll"><table><tr><th>Mã / thay đổi</th><th>Giá U trước / sau</th><th>Chênh lệch</th><th>Ưu đãi cũ</th><th>Ưu đãi mới</th></tr>'+changes.map(c=>'<tr data-diff-kind="'+esc(c.kind)+'"><td>'+esc(c.code)+'<br>'+esc(c.kind)+'</td><td>'+fmt(c.x.u)+' / '+fmt(c.y.u)+'</td><td>'+(c.delta==null?'—':fmt(c.delta))+' '+(c.pct==null?'':c.pct.toFixed(2)+'%')+'</td><td>'+esc(lines(c.x.promo).join(' · '))+'</td><td>'+esc(lines(c.y.promo).join(' · '))+'</td></tr>').join('')+'</table></div>'+(changes.length?'':'<p>Hai phiên có cùng giá và khuyến mãi.</p>')}


function batchView(){const s=current(),news=tab==='news',ps=Object.values(s.products),before=state.sessions.filter(x=>x.scope===s.scope&&(x.date<s.date||x.date===s.date&&x.at<s.at)).sort((a,b)=>b.date.localeCompare(a.date)||b.at.localeCompare(a.at))[0];const changes=before?compare(before,s):[];
 const quick=['Đặc quyền','Có giá cuối',...(before?['Giảm giá','Đổi khuyến mãi']:[])];
 $('#view').innerHTML=title(nav[tab],scopeText(s)+' · '+s.date+' · '+s.name)+'<section class="card"><h2>Chọn sản phẩm</h2><input id="lookup" aria-label="Tìm mã cần chọn" placeholder="Tìm mã hoặc tên sản phẩm" value="'+esc(lookup)+'"><div class="actions">'+quick.map(k=>'<button data-quick="'+k+'">'+k+'</button>').join('')+button('none','Bỏ chọn')+'</div><div id="pick"></div></section><section class="card" id="output"></section>';
 function picks(){const list=ps.filter(p=>matches(p,normalize(lookup,state.dict)));$('#pick').innerHTML='<div class="picklist">'+list.map(p=>'<label class="check"><input data-pick="'+esc(p.code)+'" type="checkbox" '+(selected.has(p.code)?'checked':'')+' '+(p.issues.length?'disabled':'')+'><span>'+esc(value(p).name)+' <small>'+esc(p.code)+'</small></span></label>').join('')+'</div>'}
 $('#pick').onchange=e=>{const c=e.target.dataset.pick;if(c){if(e.target.checked)selected.add(c);else selected.delete(c);output()}};
 on('lookup','input',e=>{lookup=e.target.value;picks()});all('[data-quick]').forEach(el=>el.onclick=()=>{const k=el.dataset.quick;for(const p of ps)if(!p.issues.length&&(k==='Đặc quyền'?value(p).exclusive:k==='Có giá cuối'?hasFinal(p):changes.some(c=>c.code===p.code&&c.kind===k)))selected.add(p.code);picks();output()});
 click('none',()=>{selected.clear();picks();output()});picks();output();
 function output(){const list=[...selected].map(c=>s.products[c]).filter(Boolean);const out=$('#output');
 if(news){const valid=list.filter(p=>quote(p).price!=null);const bulletin=valid.length?[scopeText(s)+' · '+s.date+' · '+s.name,...valid.map(p=>message(p,s,scopeText(s)))].join('\n\n'):'';
 out.innerHTML='<h2>Xem trước bản tin · '+valid.length+' mã</h2><pre>'+esc(bulletin||'Chọn mã để tạo bản tin.')+'</pre>'+button('zalo','Copy gửi Zalo',true)+' '+button('excel','Xuất Excel');click('zalo',()=>copy(bulletin));click('excel',async()=>{if(!valid.length)throw Error('Chọn sản phẩm có giá.');download(await exportExcel([['Mã sản phẩm','Tên','Loại giá','Giá báo khách','Điều kiện','Shop','Phiên','Ngày'],...valid.map(p=>{const g=quote(p);return [p.code,value(p).name,g.label,g.price,g.condition,scopeText(s),s.name,s.date]})]),'Ban-tin-'+s.date+'.xlsx')});return}
 const isFinal=mode==='final',printable=list.filter(p=>!isFinal||hasFinal(p));const type=isFinal?'Tem giá cuối cho shop':'Tem đối chiếu nguồn';
 out.innerHTML='<h2>'+type+'</h2><div class="row"><label>Loại tem<select id="mode">'+opt('source','Tem đối chiếu nguồn',mode)+opt('final','Tem giá cuối cho shop',mode)+'</select></label>'+input('width','Rộng (mm)','number',width)+input('height','Cao (mm)','number',height)+'</div><p class="muted">'+printable.length+' tem'+(list.length>printable.length?' · '+(list.length-printable.length)+' mã chưa có giá cuối':'')+'</p><div class="preview" id="tickets">'+printable.map(p=>ticket(p,s,type)).join('')+'</div><div class="actions">'+button('printnow','In tem',true)+'</div>';
 on('mode','change',e=>{mode=e.target.value;output()});for(const k of ['width','height'])on(k,'change',e=>{const n=Number(e.target.value);if(n<30||n>600)throw Error('Kích thước từ 30 đến 600 mm.');if(k==='width')width=n;else height=n;output()});
 click('printnow',()=>{if(!printable.length)throw Error('Chọn ít nhất một mã phù hợp.');if(all('#tickets .ticket').some(el=>el.offsetHeight>height*96/25.4+2))throw Error('Nội dung dài hơn chiều cao tem. Tăng chiều cao hoặc chiều rộng rồi in lại.');let st=$('#pageSize');if(!st){st=document.createElement('style');st.id='pageSize';document.head.append(st)}st.textContent='@media print{@page{size:'+width+'mm '+height+'mm;margin:0}}';$('#paper').innerHTML=$('#tickets').innerHTML;window.print()})
 }}
function ticket(p,s,type){const v=value(p),g=quote(p);return '<article class="ticket" style="width:'+width+'mm;min-height:'+height+'mm"><h2>'+esc(v.name)+'</h2><p>'+esc(p.code)+' · '+esc(v.ref)+'</p><div class="grid"><div><b>Khuyến mãi</b><div class="lines">'+esc(lines(v.promo).join('\n'))+'</div></div><div><b>Thông số</b><div class="lines">'+esc(lines(v.spec).join('\n')||'—')+'</div></div></div><div class="foot">'+plans(v)+'</div><p>'+(mode==='source'&&v.s!=null?'<del>'+fmt(v.s)+'</del> · ':'')+(mode==='source'?'Giá trên tem':g.label)+' <b class="price">'+fmt(mode==='source'?v.u:g.price)+'</b></p><small>'+esc(type)+' · '+esc(scopeText(s))+' · '+esc(s.date)+'</small></article>'}
function validatePackage(x){if(x?.version!==1||typeof x.cluster!=='string'||!Array.isArray(x.shops)||!Array.isArray(x.sessions)||!x.dict||Array.isArray(x.dict)||typeof x.dict!=='object'||Object.values(x.dict).some(v=>typeof v!=='string'))throw Error('Gói bảng giá không đúng định dạng.');
 const scopes=new Set(['*']);for(const sh of x.shops){if(!sh?.id||typeof sh.id!=='string'||!sh.name||scopes.has(sh.id))throw Error('Thông tin shop không hợp lệ.');scopes.add(sh.id)}if(!scopes.has(x.defaultShop))throw Error('Shop mặc định không hợp lệ.');
 const ids=new Set();for(const s of x.sessions){if(!s?.id||ids.has(s.id)||!s.date||!s.file||!s.at||!s.name||!s.sheet||!s.map||!s.hash||!s.products||!s.stats||!scopes.has(s.scope))throw Error('Phiên thiếu dữ liệu.');ids.add(s.id);
 for(const [code,p] of Object.entries(s.products)){if(code!==p.code||!Array.isArray(p.history)||!Array.isArray(p.issues)||!p.variants?.length||!p.variants.every(a=>a.v?.code===code&&a.cells&&Array.isArray(a.rows))||p.history.some(h=>money(h.price)!==h.price||h.price==null||!h.reason||h.source!=='Quản lý xác nhận'))throw Error('Dữ liệu sản phẩm chưa hợp lệ.')}}}
function shopsView(){const s=current();
 $('#view').innerHTML=title('Quản lý cụm','Cấu hình shop, từ điển tra cứu và gói dữ liệu cho nhân viên.')+'<section class="card"><h2>Cụm và shop</h2><div class="row">'+input('cluster','Tên cụm','text',state.cluster)+'<label>Shop mặc định<select id="defaultshop">'+scopeOpts(state.defaultShop)+'</select></label></div><div class="actions">'+button('settings','Lưu cấu hình',true)+'</div><hr><div class="row">'+input('shopcode','Mã shop')+input('shopname','Tên shop')+'</div><div class="actions">'+button('addshop','Thêm shop')+'</div></section><section class="card"><h2>Từ điển viết tắt</h2><label>Mỗi dòng theo mẫu PSDP = pin sạc dự phòng<textarea id="dictionary" rows="4">'+esc(Object.entries(state.dict).map(a=>a.join(' = ')).join('\n'))+'</textarea></label><div class="actions">'+button('savedict','Lưu từ điển')+'</div></section><section class="card"><h2>Sao lưu và chuyển máy</h2><p>Gói phiên mang theo shop, giá đã xác nhận và lịch sử sửa. Shop mặc định áp dụng khi nhận gói trên máy mới.</p><div class="actions">'+button('backup','Sao lưu toàn bộ')+button('pack','Xuất gói phiên đang xem')+'<label class="file" for="restore">Nhập gói / khôi phục</label><input type="file" accept=".json" id="restore" hidden></div></section>';
 click('settings',async()=>{if(!$('#cluster').value.trim())throw Error('Nhập tên cụm.');state.cluster=$('#cluster').value.trim();state.defaultShop=$('#defaultshop').value;await save();render();toast('Đã lưu cấu hình')});
 click('addshop',async()=>{const id=$('#shopcode').value.trim(),name=$('#shopname').value.trim();if(!id||!name||id==='*'||state.shops.some(x=>x.id===id))throw Error('Nhập mã mới và tên shop.');state.shops.push({id,name});await save();render();toast('Đã thêm shop')});
 click('savedict',async()=>{const entries=$('#dictionary').value.split('\n').filter(x=>x.trim()).map(x=>x.split('=').map(y=>y.trim()));if(entries.some(x=>x.length!==2||!x[0]||!x[1]))throw Error('Mỗi dòng cần một viết tắt và nghĩa.');state.dict=Object.fromEntries(entries);await save();toast('Đã lưu từ điển')});
 const json=(x,name)=>download(new Blob([JSON.stringify(x)],{type:'application/json'}),name+'.json');
 click('backup',()=>json({...state,kind:'backup'},'Sao-luu-'+date()));click('pack',()=>{if(!s)throw Error('Chọn phiên cần xuất.');json({...state,kind:'session',defaultShop:shop,sessions:[s]},'Goi-bang-gia-'+s.date)});
 on('restore','change',async e=>{const file=e.target.files[0];if(!file)return;const x=JSON.parse(await file.text());validatePackage(x);
 if(x.kind==='backup'){if(!confirm('Thay toàn bộ dữ liệu trên thiết bị bằng bản sao lưu này?'))return;state={...x,revision:state.revision}}
 else if(x.kind==='session'){const next=structuredClone(state);if(!next.sessions.length){next.cluster=x.cluster;next.defaultShop=x.defaultShop;next.dict=x.dict}else if(next.cluster!==x.cluster)throw Error('Gói thuộc cụm khác. Hãy dùng hồ sơ trình duyệt riêng cho cụm này.');
 for(const sh of x.shops){const existing=next.shops.find(t=>t.id===sh.id);if(!existing)next.shops.push(sh);else if(existing.name!==sh.name)throw Error('Trùng mã shop nhưng khác tên.')}
 for(const s of x.sessions){const i=next.sessions.findIndex(t=>t.id===s.id);if(i>=0){if(!confirm('Thay phiên '+s.name+' và lịch sử xác nhận bằng phiên trong gói?'))return;next.sessions[i]=s}else if(duplicate(next.sessions,s))throw Error('Đã có phiên cùng file, ngày và phạm vi.');else next.sessions.push(s)}state=next}else throw Error('Loại gói không hợp lệ.');
 await save();shop=x.defaultShop;sid=x.sessions.at(-1)?.id||'';clear();tab='search';render();toast('Đã nhập dữ liệu')})
}
render();




