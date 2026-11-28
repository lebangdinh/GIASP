import {fmt,lines,value,quote} from './core.mjs';

export function stockFor(shop){
  const stock=JSON.parse(localStorage.getItem('bgp_stock_v1')||'null');
  if(!stock?.rows)return {note:'Chưa nhập bảng tồn kho.'};
  const stores=new Set(stock.stores.flatMap((s,i)=>shop==='*'||String(s.c)===shop?[i]:[]));
  if(!stores.size)return {note:'Bảng tồn chưa có shop đang xem.'};
  const quantities=new Map();
  for(const [store,item,,,,,sell] of stock.rows){
    if(!stores.has(store))continue;
    const code=stock.items[item].ma;
    quantities.set(code,(quantities.get(code)||0)+sell);
  }
  return {quantities,note:'Tồn có thể bán · '+stock.file+' · '+(shop==='*'?'toàn cụm':'shop '+shop)};
}

export function daily({root,session,previous,shop,esc,detail,send}){
  root.innerHTML='<div class="panel-top"><h2>Cần xử lý hôm nay</h2></div>';
  if(!previous){root.insertAdjacentHTML('beforeend','<p>Chưa có phiên trước cùng phạm vi để đối chiếu.</p>');return}
  const stock=stockFor(shop),rows=[];
  for(const p of Object.values(session.products)){
    const old=previous.products[p.code],now=value(p),was=old&&value(old),kinds=[];
    if(!old)kinds.push('Mã mới');
    else if(!old.issues.length&&!p.issues.length){
      if(was.u!==now.u)kinds.push('Đổi giá khuyến mãi');
      if(lines(was.promo).join('\n')!==lines(now.promo).join('\n'))kinds.push('Đổi ưu đãi');
    }
    if(old?.issues.length||p.issues.length)kinds.push('Cần đối chiếu');
    if(kinds.length)rows.push({p,was,now,kinds,qty:stock.quantities?.get(p.code)});
  }
  root.insertAdjacentHTML('beforeend',`<p class="muted">So với ${esc(previous.name)} · ${esc(previous.date)}. ${esc(stock.note)}</p>
  <div class="actions"><label>Loại thay đổi<select id="dailyKind">${['Tất cả','Đổi giá khuyến mãi','Đổi ưu đãi','Mã mới','Cần đối chiếu'].map(k=>'<option>'+k+'</option>').join('')}</select></label>
  <label class="check"><input id="dailyStock" type="checkbox" ${stock.quantities?'':'disabled'}>Chỉ mã còn hàng</label></div><div id="dailyRows"></div>`);
  const find=id=>root.querySelector('#'+id);
  let picked=new Set();
  function draw(reset){
    const visible=rows.filter(r=>(find('dailyKind').value==='Tất cả'||r.kinds.includes(find('dailyKind').value))&&(!find('dailyStock').checked||r.qty>0));
    const eligible=visible.filter(r=>!r.p.issues.length && r.now.u!=null);
    if(reset)picked=new Set(eligible.map(r=>r.p.code));
    find('dailyRows').innerHTML=`<div class="actions"><b>${visible.length} mã · đã chọn ${picked.size}</b><button data-batch="news" ${picked.size?'':'disabled'}>Tạo bản tin</button></div>`+(visible.length?`<div class="scroll daily-table"><table><thead><tr><th><input aria-label="Chọn tất cả mã đang lọc" id="dailyAll" type="checkbox" ${picked.size && picked.size===eligible.length?'checked':''}></th><th>Sản phẩm</th><th>Thay đổi</th><th>Giá khuyến mãi trước → sau</th><th>Có thể bán</th></tr></thead><tbody>${visible.map(({p,was,now,kinds,qty})=>`<tr><td><input aria-label="Chọn ${esc(p.code)}" data-pickday="${esc(p.code)}" type="checkbox" ${picked.has(p.code)?'checked':''} ${p.issues.length||now.u==null?'disabled':''}></td><td><button class="product" data-item="${esc(p.code)}">${esc(now.name)}</button><br><small>${esc(p.code)}</small></td><td>${kinds.join(' · ')}${kinds.includes('Đổi ưu đãi')?'<details><summary>Xem điều kiện</summary><p>Trước · '+esc(lines(was.promo).join(' • ')||'Không có')+'</p><p>Sau · '+esc(lines(now.promo).join(' • ')||'Không có')+'</p></details>':''}</td><td>${was?fmt(was.u):'—'} → ${fmt(now.u)}</td><td>${qty??'Chưa rõ'}</td></tr>`).join('')}</tbody></table></div>`:'<p>'+(rows.length?'Không có mã phù hợp với bộ lọc.':'Hai phiên không có thay đổi cần xử lý ở các mã hiện có.')+'</p>');
    const toggle=find('dailyAll');
    if(toggle)toggle.onchange=()=>{picked=new Set(toggle.checked?eligible.map(r=>r.p.code):[]);draw(false)};
    for(const b of root.querySelectorAll('[data-pickday]'))b.onchange=()=>{if(b.checked)picked.add(b.dataset.pickday);else picked.delete(b.dataset.pickday);draw(false)};
    for(const b of root.querySelectorAll('[data-batch]'))b.onclick=()=>send([...picked]);
  }
  find('dailyKind').onchange=find('dailyStock').onchange=()=>draw(true);draw(true);
}
