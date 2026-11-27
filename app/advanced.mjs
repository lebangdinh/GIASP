import {value,lines} from './core.mjs';

export const workflows = {
  promo:['Xếp hạng khuyến mãi','Lọc deal theo hãng, mức giảm và phân khúc. Xuất ảnh theo hãng để gửi cho shop.','report'],
  pmh:['Phiếu mua hàng','Đọc điều kiện từng phiếu, xem mệnh giá và khoản có thể quy đổi.','file'],
  stock:['Tồn kho liên shop','Nhập bảng tồn, xem số lượng có thể bán theo mã, siêu thị và trạng thái.','shops'],
  compare:['So sánh hai bảng giá','Đặt hai ngày cạnh nhau để tìm mã tăng, giảm, mới hoặc ngừng khuyến mãi.','history'],
  catalog:['Danh mục & danh sách in','Chọn mã, lưu danh sách theo tên và xuất Excel theo mẫu in giá.','print'],
  vip:['Báo cáo & tra cứu','Lọc nhiều điều kiện, hỏi dữ liệu và xuất báo cáo Excel bốn sheet hoặc HTML.','report'],
  sessions:['Kho file so sánh','Mở lại file đã tải trong màn hình so sánh, chọn cặp phiên hoặc sao lưu.','history']
};
function source(session) {
  if(!session)return null;
  const rows=Object.values(session.products).filter(p=>!p.issues.length).map(p=>{
    const v=value(p),row=Array(21).fill('');
    row[0]=v.name;row[6]=p.code;row[7]=lines(v.promo).join('\n');row[18]=v.s;row[20]=v.u;
    return row;
  });
  return {id:session.id,file:session.file,sheet:session.sheet,at:session.at,date:session.date,label:session.name+' · '+session.date,rows};
}
let frame,ready=false,request;
function deliver(){if(ready && request)frame.contentWindow.postMessage(request,'*')}
window.addEventListener('message',event=>{
  if(frame && event.source===frame.contentWindow && event.data?.type==='giasp-ready'){ready=true;deliver()}
});
export function advanced({root,mode,session,previous,icon,open}){
  if(!mode){
    root.innerHTML='<div class="title"><div><h1>Nghiệp vụ nâng cao</h1><p class="muted">Chọn công việc cho phiên bảng giá đang xem.</p></div></div><div class="workflow-grid">'+Object.entries(workflows).map(([key,[label,desc,glyph]])=>'<button class="workflow" data-work="'+key+'"><span class="metric-icon">'+icon(glyph,22)+'</span><strong>'+label+'</strong><span>'+desc+'</span></button>').join('')+'</div>';
    root.onclick=e=>{const b=e.target.closest('[data-work]');if(b)open(b.dataset.work)};
    return;
  }
  root.innerHTML='<div class="work-heading"><h1>'+workflows[mode][0]+'</h1><button id="workMenu">Chọn nghiệp vụ khác</button></div>';
  root.querySelector('#workMenu').onclick=()=>open('');
  request={type:'giasp-open',mode,current:source(session),previous:source(previous)};
  const mount=document.getElementById('advancedMount');
  mount.hidden=false;
  if(!frame){
    frame=document.createElement('iframe');frame.title='C933 KIỂM TRA GIÁ SẢN PHẨM · Nghiệp vụ nâng cao';frame.allow='clipboard-write';
    const standalone=document.getElementById('advanced-document');
    if(standalone)frame.srcdoc=JSON.parse(standalone.textContent);
    else frame.src='./advanced.html';
    mount.append(frame);
  }else deliver();
}


