import {daily} from './daily.mjs';
import {category,fmt,hasFinal,needs,value} from './core.mjs';
import {reportRows} from './report.mjs';

export function overview({root,session,dict,esc,icon,open,openWork,detail,previous,shop,send}) {
  const products=Object.values(session.products);
  const deals=reportRows(session,dict).filter(row=>row.amount>0).sort((a,b)=>b.amount-a.amount).slice(0,5);
  const groups=new Map();
  for(const p of products){
    const name=category(value(p).name,dict);
    groups.set(name,(groups.get(name)||0)+1);
  }
  const ranked=[...groups].sort((a,b)=>b[1]-a[1]);
  const metrics=[
    ['search','Mã sản phẩm',products.length,''],
    ['file','Có giá cuối',products.filter(hasFinal).length,'Có giá cuối'],
    ['history','Cần kiểm tra',products.filter(needs).length,'Cần kiểm tra']
  ];
  root.innerHTML=`<section class="desk-banner">
    <div class="desk-copy"><span class="desk-date">${icon('file',15)} ${esc(session.date.split('-').reverse().join('/'))}</span>
    <h1>Tổng quan bảng giá</h1><p>${esc(session.file)}</p>
    <div class="actions"><button class="desk-primary" data-go="search">${icon('search',17)} Tra giá tại quầy</button><button class="desk-secondary" data-go="import">${icon('import',17)} Nhập bảng mới</button></div></div>
    <div class="ticket-art" aria-hidden="true"><div class="art-back"></div><div class="art-tag"><i></i><b>₫</b><em></em></div></div>
  </section>
  <div class="desk-metrics">${metrics.map(([glyph,label,count,status],i)=>`<button data-status="${status}" class="metric m${i}"><span class="metric-icon">${icon(glyph,21)}</span><span>${label}<strong>${count.toLocaleString('vi-VN')}</strong></span></button>`).join('')}</div>
  <div class="desk-shortcuts"><button data-work="promo">${icon('report',17)} Xếp hạng khuyến mãi</button><button data-work="pmh">${icon('file',17)} Phiếu mua hàng</button><button data-work="stock">${icon('shops',17)} Tồn kho liên shop</button><button data-work="vip">${icon('news',17)} Báo cáo Excel</button></div><section class="card" id="daily"></section><div class="desk-panels"><section class="card"><div class="panel-top"><h2>Giảm thêm sau khuyến mãi nhiều nhất</h2><button data-go="report">Xem phân tích</button></div>
  <div class="deal-list">${deals.map((r,i)=>`<button data-item="${esc(r.code)}"><span class="rank">${i+1}</span><span class="deal-name">${esc(r.name)}<small>${esc(r.code)}</small></span><span class="saving">−${fmt(r.amount)}</span></button>`).join('')||'<p>Chưa có mã giảm thêm sau khuyến mãi.</p>'}</div></section>
  <section class="card"><div class="panel-top"><h2>Nhóm phụ kiện</h2></div><div class="category-bars">${ranked.map(([name,n])=>`<button data-group="${esc(name)}"><span>${esc(name)}<b>${n}</b></span><i><em style="width:${100*n/ranked[0][1]}%"></em></i></button>`).join('')}</div></section></div>`;
  daily({root:root.querySelector('#daily'),session,previous,shop,esc,detail,send});
  root.onclick=e=>{
    const b=e.target.closest('button');
    if(!b)return;
    if(b.dataset.work)openWork(b.dataset.work);
    else if(b.dataset.item)detail(b.dataset.item);
    else if('status' in b.dataset)open('search',{status:b.dataset.status});
    else if(b.dataset.group)open('search',{cat:b.dataset.group});
    else if(b.dataset.go)open(b.dataset.go,{});
  };
}


