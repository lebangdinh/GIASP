export const mapping={name:'A',badge1:'B',badge2:'C',ref:'D',time:'F',code:'G',promo:'H',spec:'I',labels:'K',values1:'L',partner1:'M',partner2:'N',values2:'O',partner3:'P',values3:'Q',s:'S',u:'U'};
export const fold=s=>String(s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('đ','d').trim();
export const lines=s=>String(s??'').split(/_x000a_|\r?\n|•/i).map(x=>x.trim()).filter(Boolean);
export function money(x){if(typeof x==='number')return Number.isSafeInteger(x)&&x>=0?x:null;const s=String(x??'').trim().replace(/\s*(?:đ|₫|vnd)$/i,'').trim();if(!/^(?:\d+|\d{1,3}(?:[., ]\d{3})+)$/.test(s))return null;const n=Number(s.replace(/[., ]/g,''));return Number.isSafeInteger(n)?n:null}
export const fmt=n=>n==null?'Thiếu giá':n.toLocaleString('vi-VN')+'đ';
const accessoryGroups=[
  ['Pin sạc dự phòng',/pin sac du phong|\bpsdp\b|\d{4,5}\s*mah|\bugreen pb\d/],
  ['Pin AA / AAA',/\bpin\s+(?:alkaline\s+)?aaa?\b|\bpin than\b/],
  ['Tai nghe',/tai nghe|\b(?:tws|ows|buds|freebuds)\b/],
  ['Chuột',/\bchuot\b/],
  ['Bàn phím',/\bban phim\b/],
  ['Lưu trữ',/the nho|usb flash|o cung|o ssd|microsd|\busb\s+\d+gb|\b(?:kingston|sandisk)\b.*\d+gb/],
  ['Thiết bị mạng',/router|wi-?fi|thiet bi mang|switch|tp-link m7350/],
  ['Loa',/^loa\b/],
  ['Giá đỡ',/^gia do\b/],
  ['Thiết bị định vị',/thiet bi dinh vi/],
  ['Củ sạc',/^(?:bo )?adapter sac/],
  ['Cáp',/\bcap\b|^lightning\b/],
  ['Bộ chuyển đổi',/adapter chuyen doi/],
  ['Sạc',/\bsac\b/]
];
const deviceGroups=[
  ['Tablet',/^(?:may tinh bang|tablet|(?:apple )?ipad|(?:samsung )?galaxy tab|(?:xiaomi |redmi |oppo |honor |oneplus )pad|(?:lenovo )?tab [mp]\d|huawei matepad)\b/],
  ['Laptop',/^(?:laptop|notebook|ultrabook|(?:apple )?macbook|(?:asus )?(?:vivobook|zenbook)|(?:dell )?(?:inspiron|latitude|xps)|(?:lenovo )?(?:thinkpad|ideapad)|hp (?:pavilion|probook|elitebook)|acer (?:aspire|nitro|swift))\b/],
  ['Điện thoại',/^(?:dien thoai|smartphone|(?:apple )?iphone|(?:samsung )?galaxy (?:[aszmf]\s?\d|z (?:fold|flip))|(?:xiaomi )?(?:redmi|poco) (?:note |[a-z]?\d)|xiaomi \d|oppo (?:reno|find|[ak]\d)|vivo [vyx]\d|realme (?:note|gt|[cn]?\d)|honor (?:play|magic|[x]?\d)|nubia [avz]\d|tecno (?:spark|pova|camon)|motorola (?:g\d|edge|signature|razr)|g06 power\b|nothing phone|nokia \d)/]
];
export const categories=[...deviceGroups.map(([name])=>name),...accessoryGroups.map(([name])=>name),'Chưa phân loại'];
export function normalize(s,dict){let t=fold(s);for(const [a,b] of Object.entries(dict))if(fold(a))t=t.replaceAll(fold(a),fold(b));return t}
export function category(s,dict){
  const text=normalize(s,dict);
  return deviceGroups.find(([,pattern])=>pattern.test(text))?.[0]||accessoryGroups.find(([,pattern])=>pattern.test(text))?.[0]||'Chưa phân loại';
}
export function offers(raw){return lines(raw).map(source=>{const s=fold(source);const m=s.match(/giam(?: them)?\s+(\d+(?:[.,]\d+)?)\s*%/);const rate=m?Number(m[1].replace(',','.')):null;let tags=[];if(rate!=null)tags.push('Giảm '+rate+'%');if(/tra cham.*0%/.test(s))tags.push('Trả chậm 0%');if(/phieu mua hang|\bpmh\b/.test(s))tags.push('Phiếu mua hàng');else if(/tang/.test(s))tags.push('Tặng quà');if(s.includes('khong ap dung udnv'))tags.push('Không áp dụng udnv');return {source,rate,tags}})}
export function installments(v){return [1,2,3].filter(i=>v['partner'+i]||v['values'+i]).map(i=>{const raw=v['values'+i];const parts=lines(raw);const ok=parts.length===4&&parts.slice(1).every(x=>money(x)!=null)&&lines(v.labels).length===5;return {partner:v['partner'+i],raw,amounts:ok?[parts[0],...parts.slice(1).map(money)]:null}})}
export function group(rows,map=mapping){let products={},names=new Set(),count=0,invalid=[];for(const r of rows){let v=Object.fromEntries(Object.entries(map).map(([k,c])=>[k,r.cells[c]??'']));v.code=String(v.code).trim();if(!v.code){invalid.push(r.row);continue}count++;names.add(v.name);v.s=money(v.s);v.u=money(v.u);v.exclusive=fold(v.badge1+' '+v.badge2).replace(/\s/g,'')==='dacquyen';let p=Object.hasOwn(products,v.code)?products[v.code]:null;if(!p){p={code:v.code,variants:[],issues:[],count:0,history:[]};Object.defineProperty(products,v.code,{value:p,enumerable:true,configurable:true,writable:true})}p.count++;
 let same=p.variants.find(x=>JSON.stringify(x.cells)===JSON.stringify(r.cells));if(same)same.rows.push(r.row);else p.variants.push({v,cells:r.cells,rows:[r.row]});
 }
 for(const p of Object.values(products))for(const k of ['name','s','u','promo','exclusive'])if(new Set(p.variants.map(x=>JSON.stringify(k==='promo'?lines(x.v[k]):x.v[k]))).size>1)p.issues.push(k);
 const ps=Object.values(products);return {products,stats:{rows:count+invalid.length,codes:ps.length,names:names.size,duplicates:ps.reduce((n,p)=>n+p.variants.reduce((t,x)=>t+x.rows.length-1,0),0),missingS:ps.filter(p=>p.variants.some(x=>x.v.s==null)).length,missingU:ps.filter(p=>p.variants.some(x=>x.v.u==null)).length,conflicts:ps.filter(p=>p.issues.length).length,invalid}}}
export const value=p=>p.variants[0].v;
export function confirmPrice(p,price,condition,reason,at=new Date().toISOString()){if(p.issues.length||money(price)==null||!reason.trim())throw Error('Kiểm tra giá, xung đột và lý do xác nhận.');p.history.push({price:money(price),condition,reason,at,source:'Quản lý xác nhận'})}
function approvedDiscount(entries) {
  const candidates=[];
  for(const {source} of entries){
    const line=fold(source).replace(/\s+/g,' ');
    if(!/giam.*%/.test(line))continue;
    const match=line.match(/^giam( them)? (\d+(?:[.,]\d+)?)\s*% tren gia sau khuyen mai(?:\s*\(khong ap dung udnv\))?[.!]?$/);
    if(!match)return null;
    const rate=Number(match[2].replace(',','.'));
    if(rate<=0||rate>100)return null;
    candidates.push({rate,extra:Boolean(match[1]),source});
  }
  if(candidates.length===1)return candidates[0];
  const extra=candidates.filter(c=>c.extra);
  if(extra.length===1 && candidates.length===2 && candidates.some(c=>!c.extra && c.rate===3))return extra[0];
  return null;
}

export function quote(p) {
  if(p.issues.length)return {label:'Cần kiểm tra',price:null,condition:''};
  const last=p.history.at(-1);
  if(last)return {label:'Giá cuối',...last};
  const v=value(p), entries=offers(v.promo);
  const benefits=entries.filter(o=>o.tags.some(t=>['Tặng quà','Phiếu mua hàng'].includes(t))).map(o=>o.source);
  const discount=approvedDiscount(entries);
  if(!p.recheck && v.u!=null && discount){
    const price=trial(v.u,discount.rate);
    return {label:'Giá cuối',price,source:'Quy tắc giảm giá đã duyệt',rate:discount.rate,
      reason:fmt(v.u)+' × '+(100-discount.rate)+'% = '+fmt(price),
      condition:[discount.source,...benefits].join('\n')};
  }
  return {label:'Giá khuyến mãi',price:v.u,condition:benefits.join('\n')};
}
export function discounts(v,g){
  const fromList=v.s!=null && v.u!=null?v.s-v.u:null;
  const extra=g.label==='Giá cuối' && g.price!=null && v.u!=null?v.u-g.price:null;
  return {fromList,extra,extraPercent:v.u>0 && extra!=null?100*extra/v.u:null};
}
export const budgets=[
  ['Dưới 100k',0,100000],['100–<200k',100000,200000],['200–<300k',200000,300000],
  ['300–<500k',300000,500000],['500k–<1 triệu',500000,1000000],['1–<3 triệu',1000000,3000000],['3–<5 triệu',3000000,5000000],['5–<10 triệu',5000000,10000000],
  ['10–<20 triệu',10000000,20000000],['20–<30 triệu',20000000,30000000],['Từ 30 triệu',30000000,Infinity]
];
export const hasFinal=p=>quote(p).label==='Giá cuối';
export function message(p,session,scope,staff=false){const q=quote(p);if(q.price==null)return '';return [value(p).name,q.label+': '+fmt(q.price),q.condition,staff&&('Mã '+p.code+' · '+scope+' · '+session.date),staff&&(session.name+' · '+session.file+' · '+(q.source||'Cột U')),staff&&q.reason].filter(Boolean).join('\n')}
export const trial=(u,rate)=>u==null?null:Math.round(u*(100-rate)/100);
export const needs=p=>p.issues.length||value(p).u==null||value(p).s!=null&&value(p).u>value(p).s||!hasFinal(p)&&(p.recheck||offers(value(p).promo).some(o=>o.rate!=null));
export const duplicate=(sessions,s)=>sessions.some(t=>['hash','date','scope'].every(k=>s[k]===t[k]));
export function compare(a,b){if(a.scope!==b.scope)throw Error('Hai phiên phải cùng phạm vi.');let changes=[];for(const code of new Set([...Object.keys(a.products),...Object.keys(b.products)])){let old=a.products[code],next=b.products[code];let x=old?value(old):{},y=next?value(next):{};let delta=x.u!=null&&y.u!=null?y.u-x.u:null;let kind=!old?'Mã mới':!next?'Mã vắng':old.issues.length||next.issues.length?'Xung đột':x.u!==y.u?(delta==null?'Thay đổi giá thiếu':delta>0?'Tăng giá':'Giảm giá'):JSON.stringify(lines(x.promo))!==JSON.stringify(lines(y.promo))?'Đổi khuyến mãi':x.s!==y.s?'Đổi giá niêm yết':'';if(kind)changes.push({code,kind,x,y,delta,pct:x.u?delta==null?null:delta/x.u*100:null})}return changes}



const colorSuffix=/(?:\s*[-–]\s*|\s+)(?:màu\s+)?(?:xanh(?:\s+(?:lá(?: cây)?|dương|đen|lam|lục|rêu|nhạt|đậm|ngọc|băng))?|đen|trắng|tím(?: đen| nhạt)?|vàng(?: hồng| đồng)?|hồng|đỏ|bạc|xám(?: đen)?|cam|nâu|bạch kim|black|white|blue|green|silver|gold|purple|pink|gray|grey)$/iu;
function modelAndColor(product){
 const name=String(value(product).name).trim().normalize('NFC');
 const suffix=name.match(colorSuffix);
 if(!suffix)return {model:name,color:''};
 return {model:name.slice(0,suffix.index).trim(),color:suffix[0].replace(/^[\s–-]+/,'').replace(/^màu\s+/i,'')};
}
function staffOffers(product){
 const clean=text=>lines(text).map(line=>line.normalize('NFC').replace(/\s+/g,' '));
 return {promo:clean(value(product).promo),condition:clean(product.history.at(-1)?.condition)};
}
export function staffList(groups,scope,date,includeOffers=true){
 const rows=groups.map(variants=>{
   const first=variants[0],price=fmt(quote(first).price);
   const fields=[value(first).name,'Mã '+first.code,price];
   if(variants.length>1){
     const colors=variants.map(modelAndColor);
     fields.splice(0,2,colors[0].model,'Mã đại diện '+first.code);
     fields.push('Màu: '+colors.map(v=>v.color).join(', '));
   }
   if(first.issues.length){fields.push('Cần kiểm tra dữ liệu xung đột');return fields.join(' · ')}
   if(!includeOffers)return fields.join(' · ');
   const {promo,condition}=staffOffers(first);
   fields.push(promo.length?'KM: '+promo.join(' • '):'Chưa ghi khuyến mãi');
   if(condition.length)fields.push('Điều kiện đã xác nhận: '+condition.join(' • '));
   return fields.join(' · ');
 });
 return ['Bảng giá · '+scope+' · '+date,...rows].join('\n');
}
export function counterExportRows(groups,brandFor,scope,date,includeOffers){
 const header=['Sản phẩm','Mã sản phẩm / đại diện','Hãng','Màu','Giá báo khách (đ)','Loại giá','Trạng thái','Phạm vi','Ngày áp dụng'];
 if(includeOffers)header.push('Khuyến mãi','Điều kiện đã xác nhận');
 const rows=groups.map(variants=>{
   const first=variants[0],v=value(first),g=quote(first),colors=variants.map(modelAndColor);
   const status=[];
   if(v.exclusive)status.push('Đặc quyền');
   if(hasFinal(first))status.push(first.history.length?'Quản lý xác nhận':'Theo ưu đãi');
   else if(needs(first))status.push('Cần kiểm tra');
   const row=[variants.length>1?colors[0].model:v.name,first.code,brandFor(first),colors.map(x=>x.color).filter(Boolean).join(', '),g.price,g.label,status.join(' · '),scope,date];
   if(includeOffers){
     const {promo,condition}=staffOffers(first);
     row.push(first.issues.length?'Cần kiểm tra dữ liệu xung đột':promo.join(' • '),condition.join(' • '));
   }
   return row;
 });
 return [header,...rows];
}
export function groupColorVariants(products,brandFor){
 const groups=[],byKey=new Map();
 for(const product of products){
   const variant=modelAndColor(product),price=quote(product).price;
   if(!variant.color || price==null || product.issues.length){groups.push([product]);continue}
   const color=variant.color.toLocaleLowerCase('vi');
   const key=JSON.stringify([variant.model.toLocaleLowerCase('vi'),brandFor(product),price,Boolean(value(product).exclusive),staffOffers(product)]);
   let buckets=byKey.get(key);
   if(!buckets){buckets=[];byKey.set(key,buckets)}
   let bucket=buckets.find(b=>!b.colors.has(color));
   if(!bucket){bucket={colors:new Set(),items:[]};buckets.push(bucket);groups.push(bucket.items)}
   bucket.colors.add(color);bucket.items.push(product);
 }
 return groups;
}
