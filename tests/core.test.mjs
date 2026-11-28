import test from 'node:test';
import assert from 'node:assert/strict';
import {groupColorVariants,staffList,group,quote,confirmPrice,compare,duplicate,offers,trial,money,needs,normalize,category} from '../app/core.mjs';
const row=(row,G,U,H='')=>({row,cells:{A:'Sản phẩm thử',G,U,H}});
const session=(scope,rows)=>({scope,hash:'abc',date:'2026-01-01',...group(rows)});
test('Giữ mã, phân biệt cùng tên, lưu dòng lặp và chặn báo giá xung đột',()=>{
 const s=session('*',[row(1,'01',100),row(2,'02',100),row(3,'01',100),row(4,'01',90)]);
 assert.equal(s.stats.codes,2);assert.equal(s.stats.names,1);assert.equal(s.stats.duplicates,1);
 assert.equal(s.stats.conflicts,1);assert.equal(s.stats.missingS,2);assert.deepEqual(s.products['01'].variants[0].rows,[1,3]);assert.equal(quote(s.products['01']).price,null);
});
test('Nhập trùng, cách ly phạm vi, lịch sử xác nhận và phiên mới',()=>{
 const a=session('A',[row(1,'01',100,'Giảm 3%')]),b=session('B',[row(1,'01',100)]),p=a.products['01'];
 assert.ok(duplicate([a],a));assert.ok(!duplicate([a],b));assert.throws(()=>compare(a,b));confirmPrice(p,97,'','Lần đầu');confirmPrice(p,92,'','Điều chỉnh');assert.equal(p.history.length,2);assert.equal(quote(p).price,92);assert.equal(quote(b.products['01']).price,100);
 const next=session('A',[row(1,'01',110,'Giảm 3%')]);assert.equal(quote(next.products['01']).label,'Giá khuyến mãi');assert.ok(needs(next.products['01']));
});
test('So sánh theo mã cùng phạm vi',()=>{const a=session('A',[row(1,'01',100),row(2,'02',200),row(3,'03',300),row(4,'04',400)]),b=session('A',[row(1,'01',80),row(2,'02',220),row(3,'03',300,'Tặng quà'),row(4,'05',200)]);assert.deepEqual(compare(a,b).map(x=>x.kind),['Giảm giá','Tăng giá','Đổi khuyến mãi','Mã vắng','Mã mới']);assert.equal(compare(a,b)[0].pct,-20)});
test('Giá thiếu, PMH, giảm thử và từ điển',()=>{assert.equal(money(''),null);assert.equal(money('490,000đ'),490000);assert.equal(money('-1'),null);assert.equal(trial(815000,3),790550);assert.equal(offers('Tặng PMH mua camera')[0].rate,null);assert.equal(trial(null,3),null);assert.equal(category('PSDP ABC',{PSDP:'pin sạc dự phòng'}),'Pin sạc dự phòng');assert.equal(normalize('PSDP',{PSDP:'pin sạc dự phòng'}),'pin sac du phong')});


test('Quy tắc trên giá sau khuyến mãi dùng U, giữ điều kiện và ưu tiên giá chốt riêng',()=>{
 const line=rate=>'Giảm thêm '+rate+'% trên giá sau khuyến mãi (không áp dụng udnv)';
 const simple='Giảm 3% trên giá sau khuyến mãi';
 const item=(promo,u=100000)=>session('A',[row(1,'001',u,promo)]).products['001'];
 for(const [promo,price] of [[simple,97000],[line(16),84000],[line(30),70000],[line(16)+'_x000a_'+simple,84000],[simple+'\n'+line(20),80000]]){
   const p=item(promo);assert.equal(quote(p).price,price);assert.equal(quote(p).label,'Giá cuối');assert.equal(quote(p).source,'Quy tắc giảm giá đã duyệt');
 }
 const p=item(line(16)+'\nTặng PMH mua camera');assert.match(quote(p).condition,/không áp dụng udnv/);assert.match(quote(p).condition,/PMH mua camera/);
 confirmPrice(p,81000,'','Chốt giá riêng');assert.equal(quote(p).price,81000);
 for(const text of [line(16)+'\n'+line(30),'Giảm thêm 16% trên giá sau khuyến mãi khi dùng thẻ X','Tặng PMH mua camera'])assert.equal(quote(item(text)).label,'Giá khuyến mãi');
 assert.equal(quote(item(simple,'')).price,null);
});
test('Tách giảm từ niêm yết và giảm thêm theo giá cuối, kể cả khi thiếu giá nguồn',async()=>{
  const {discounts}=await import('../app/core.mjs');
  const source={s:180000,u:160000};
  assert.deepEqual(discounts(source,{label:'Giá cuối',price:134400}),{fromList:20000,extra:25600,extraPercent:16});
  assert.deepEqual(discounts({...source,s:null},{label:'Giá cuối',price:134400}),{fromList:null,extra:25600,extraPercent:16});
  assert.deepEqual(discounts(source,{label:'Giá khuyến mãi',price:160000}),{fromList:20000,extra:null,extraPercent:null});
  assert.deepEqual(discounts({s:100,u:0},{label:'Giá cuối',price:0}),{fromList:100,extra:0,extraPercent:null});
});
test('Nhận diện thiết bị theo tên sản phẩm và phân biệt phụ kiện đi kèm',()=>{
 const cases=[
   ['Galaxy A37 (8G+128G) Đen','Điện thoại'],
   ['Samsung Galaxy Tab S10 Wi-Fi','Tablet'],
   ['MacBook Air M3 256GB','Laptop'],
   ['Cáp sạc cho iPhone','Cáp'],
   ['Bàn phím cho iPad Air','Bàn phím'],
   ['Giá đỡ laptop','Giá đỡ']
 ];
 for(const [name,expected] of cases)assert.equal(category(name,{}),expected);
});

test('Danh sách nhân viên tách màu theo ưu đãi và điều kiện xác nhận',()=>{
 const items=['Đen','Trắng','Xanh','Tím','Vàng'].map((color,i)=>{
   const source=row(i+1,String(i),100,['Tặng cáp','Tặng cáp','Tặng sạc','Tặng cáp',''][i]);
   source.cells.A='Galaxy thử '+color;
   return group([source]).products[String(i)];
 });
 confirmPrice(items[3],100,'Áp dụng khi mua kèm','QL xác nhận');
 const groups=groupColorVariants(items,()=>'Samsung');
 assert.deepEqual(groups.map(g=>g.map(p=>p.code)),[['0','1'],['2'],['3'],['4']]);
 const rows=staffList(groups,'Shop','2026-11-28').split('\n');
 assert.match(rows[1],/Màu: Đen, Trắng · KM: Tặng cáp/);
 assert.match(rows[2],/KM: Tặng sạc/);
 assert.match(rows[3],/Điều kiện đã xác nhận: Áp dụng khi mua kèm/);
 assert.match(rows[4],/Chưa ghi khuyến mãi/);
 const brief=staffList(groups,'Shop','2026-11-28',false).split('\n');
 assert.equal(brief.length,rows.length);
 assert.match(brief[1],/Mã đại diện 0 · 100đ · Màu: Đen, Trắng$/);
 assert.doesNotMatch(brief.join('\n'),/Tặng|KM:|Điều kiện đã xác nhận|Chưa ghi khuyến mãi/);
});
