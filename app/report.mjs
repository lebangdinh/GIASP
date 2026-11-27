import {category, fmt, normalize, offers, quote, value} from './core.mjs';
import {exportExcel} from './excel.mjs';

const bands = [
  ['Dưới 200.000đ', 0, 200000],
  ['200.000 – dưới 500.000đ', 200000, 500000],
  ['500.000 – dưới 1 triệu', 500000, 1000000],
  ['Từ 1 triệu đồng', 1000000, Infinity],
];
const orders = {amount:'Tiền giảm cao nhất', percent:'Tỷ lệ giảm cao nhất', low:'Giá báo thấp nhất', high:'Giá báo cao nhất'};
const blank = {query:'', group:'', tag:'', band:'', amount:'', percent:'', sort:'amount'};
const percentText = n => n == null ? '—' : n.toLocaleString('vi-VN',{maximumFractionDigits:2})+'%';

export function reportRows(session, dict) {
  return Object.values(session.products).filter(p=>!p.issues.length).map(p=>{
    const v=value(p), g=quote(p);
    const amount=v.s!=null && v.u!=null ? v.s-v.u : null;
    return {code:p.code, name:v.name, group:category(v.name,dict), s:v.s, u:v.u, ...g,
      amount, percent:v.s>0 && amount!=null ? 100*amount/v.s : null,
      band:bands.findIndex(([,min,max])=>g.price!=null && g.price>=min && g.price<max),
      tags:[...new Set(offers(v.promo).flatMap(o=>o.tags))]};
  });
}

export function filterReport(rows, filter, dict) {
  const term=normalize(filter.query,dict);
  const filtered=rows.filter(r=>(!term || r.code.includes(term) || normalize(r.name,dict).includes(term))
    && (!filter.group || r.group===filter.group) && (!filter.tag || r.tags.includes(filter.tag))
    && (filter.band==='' || r.band===Number(filter.band))
    && (filter.amount==='' || r.amount!=null && r.amount>=Number(filter.amount))
    && (filter.percent==='' || r.percent!=null && r.percent>=Number(filter.percent)));
  const key=['low','high'].includes(filter.sort)?'price':filter.sort;
  return filtered.sort((a,b)=>{
    if(a[key]==null || b[key]==null) return Number(a[key]==null)-Number(b[key]==null) || a.code.localeCompare(b.code);
    return (filter.sort==='low'?1:-1)*(a[key]-b[key]) || a.code.localeCompare(b.code);
  });
}

export function renderReport({root,session,scope,dict,esc,opt,detail,send,download,guarded,filter}) {
  const rows=reportRows(session,dict);
  const f=Object.assign({},blank,filter);
  let displayed=[];
  const groups=[...new Set(rows.map(r=>r.group))].sort();
  const tags=[...new Set(rows.flatMap(r=>r.tags))].sort();
  const presetKey='topzone.report.filters.v1';
  let presets=[];
  try {
    const saved=JSON.parse(localStorage.getItem(presetKey)||'[]');
    if(Array.isArray(saved))presets=saved.filter(p=>typeof p?.name==='string'&&p.filter);
  } catch {}
  const select=(key,label,items)=>'<label>'+label+'<select data-field="'+key+'">'+items.map(([v,l])=>opt(v,l,f[key])).join('')+'</select></label>';
  const choices=values=>[['','Tất cả'],...values.map(s=>[s,s])];
  root.innerHTML='<div class="title"><div><h1>Phân tích giá</h1><p class="muted">'+esc(scope)+' · '+esc(session.date)+' · '+esc(session.name)+'</p></div></div>'+
    '<div class="report-summary"></div><section class="card"><h2>Phân khúc theo giá báo khách</h2><div class="band-grid"></div></section>'+
    '<section class="card"><h2>Xếp hạng sản phẩm</h2><p class="muted">Tiền giảm trên tem = giá đối chiếu S − giá trên tem U. Tỷ lệ giảm tính trên S.</p>'+
    '<div class="report-filters"><label>Tên hoặc mã<input data-field="query" type="search"></label>'+
    select('group','Nhóm phụ kiện',choices(groups))+select('tag','Loại ưu đãi',choices(tags))+
    '<label>Giảm ít nhất (đ)<input type="number" min="0" data-field="amount"></label>'+
    '<label>Giảm ít nhất (%)<input type="number" min="0" step="any" data-field="percent"></label>'+
    select('sort','Sắp xếp',Object.entries(orders))+'</div><div class="actions"><button data-action="reset">Xóa bộ lọc</button></div>'+
    '<details><summary>Bộ lọc đã lưu trên máy</summary><div class="row"><label>Tên bộ lọc<input id="presetName" maxlength="64"></label><button data-action="savePreset">Lưu bộ lọc hiện tại</button></div><div class="row"><label>Chọn bộ lọc<select id="presetList"></select></label><button data-action="loadPreset">Áp dụng</button><button data-action="deletePreset">Xóa bộ lọc đã lưu</button></div></details></section>'+
    '<section class="card"><div class="report-head"><h2 id="reportCount"></h2><div class="actions"><button data-action="excel">Xuất bảng Excel</button><button data-action="news" class="primary">Đưa vào bản tin</button></div></div>'+
    '<div class="report-table scroll"></div><p class="muted" id="reportNote"></p></section>';
  const find=s=>root.querySelector(s);
  function showPresets(index=0){
    find('#presetList').innerHTML=presets.length?presets.map((p,i)=>opt(i,p.name,index)).join(''):opt('','Chưa có bộ lọc','');
    for(const action of ['loadPreset','deletePreset'])find('[data-action="'+action+'"]').disabled=!presets.length;
  }
  function applyFilter(settings){
    Object.assign(f,blank);
    for(const key of Object.keys(blank))if(typeof settings[key]==='string')f[key]=settings[key];
    for(const el of root.querySelectorAll('[data-field]')){
      el.value=f[el.dataset.field];
      if(el.tagName==='SELECT'&&el.selectedIndex<0){el.selectedIndex=0;f[el.dataset.field]=el.value}
    }
    update();
  }
  showPresets();
  for(const input of root.querySelectorAll('[data-field]')){
    const key=input.dataset.field;
    input.value=f[key];
    input.addEventListener(input.tagName==='SELECT'?'change':'input',()=>{f[key]=input.value;update()});
  }
  function update(){
    Object.assign(filter,f);
    const base=filterReport(rows,{...f,band:''},dict);
    displayed=filterReport(base,f,dict);
    const counts=bands.map((_,i)=>base.filter(r=>r.band===i).length);
    find('.band-grid').innerHTML=bands.map(([label],i)=>'<button data-band="'+i+'" aria-pressed="'+(f.band===String(i))+'"><span>'+label+'</span><strong>'+counts[i]+' mã</strong><meter min="0" max="'+Math.max(1,...counts)+'" value="'+counts[i]+'"></meter></button>').join('');
    find('.report-summary').innerHTML='<div class="stats">'+[['Mã trong kết quả',displayed.length],['Giảm trên tem',displayed.filter(r=>r.amount>0).length],['Có giá cuối',displayed.filter(r=>r.label==='Giá cuối').length],['Thiếu giá đối chiếu',displayed.filter(r=>r.s==null).length]].map(([k,v])=>'<div class="stat"><small>'+k+'</small><strong>'+v+'</strong></div>').join('')+'</div>';
    find('#reportCount').textContent=displayed.length+' sản phẩm';
    find('.report-table').innerHTML='<table><thead><tr><th>Sản phẩm</th><th>Giá đối chiếu</th><th>Giá trên tem</th><th>Giảm trên tem</th><th>Giá báo khách</th></tr></thead><tbody>'+displayed.map(r=>'<tr><td><button class="product" data-detail="'+esc(r.code)+'">'+esc(r.name)+'</button><br><small>'+esc(r.code)+' · '+esc(r.group)+'</small></td><td>'+fmt(r.s)+'</td><td>'+fmt(r.u)+'</td><td>'+(r.amount==null?'—':fmt(r.amount))+'<br><small>'+percentText(r.percent)+'</small></td><td><b>'+fmt(r.price)+'</b><br><small>'+esc(r.label)+'</small></td></tr>').join('')+'</tbody></table>';
    find('#reportNote').textContent=[!displayed.length?'Không có mã phù hợp.':'',session.stats.conflicts?session.stats.conflicts+' mã xung đột đang chờ kiểm tra, đã loại khỏi báo cáo.':''].filter(Boolean).join(' ');
    find('[data-action="excel"]').disabled=!displayed.length;
    const eligible=displayed.filter(r=>r.price!=null);
    find('[data-action="news"]').disabled=!eligible.length;
    find('[data-action="news"]').textContent='Đưa '+eligible.length+' mã vào bản tin';
  }
  root.onclick=guarded(async e=>{
    const b=e.target.closest('button');
    if(!b)return;
    if(b.dataset.band!=null){f.band=f.band===b.dataset.band?'':b.dataset.band;update()}
    if(b.dataset.detail)detail(b.dataset.detail);
    if(b.dataset.action==='reset')applyFilter(blank);
    if(b.dataset.action==='savePreset'){
      const name=find('#presetName').value.trim();
      if(!name)throw Error('Nhập tên bộ lọc cần lưu.');
      if(presets.some(p=>p.name===name))throw Error('Tên này đã có. Chọn tên mới hoặc xóa bộ lọc cũ.');
      presets.push({name,filter:{...f}});
      localStorage.setItem(presetKey,JSON.stringify(presets));showPresets(presets.length-1);find('#presetName').value='';
    }
    if(b.dataset.action==='loadPreset')applyFilter(presets[Number(find('#presetList').value)].filter);
    if(b.dataset.action==='deletePreset'){
      presets.splice(Number(find('#presetList').value),1);
      localStorage.setItem(presetKey,JSON.stringify(presets));showPresets();
    }
    if(b.dataset.action==='news')send(displayed.filter(r=>r.price!=null).map(r=>r.code));
    if(b.dataset.action==='excel'){
      const data=[['Mã','Tên','Nhóm','S','U','Giảm trên tem (đ)','Giảm trên tem (%)','Giá báo khách','Nguồn giá','Điều kiện','Shop','Phiên','Ngày'],
        ...displayed.map(r=>[r.code,r.name,r.group,r.s,r.u,r.amount,r.percent,r.price,r.label,r.condition,scope,session.name,session.date])];
      download(await exportExcel(data,'Phân tích giá'),'Phan-tich-gia-'+session.date+'.xlsx');
    }
  });
  update();
}
