const {chromium}=require('playwright');
const assert=require('node:assert/strict');

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined,headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1350,height:900}});
 const notices=[];
 page.on('dialog',async d=>{notices.push(d.message());await d.accept()});
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:4173');
 const nav=id=>page.locator('[data-tab="'+id+'"]').click();
 await nav('shops');
 for(const id of ['A','B']){
   await page.locator('#shopcode').fill(id);
   await page.locator('#shopname').fill('Shop thử '+id);
   await page.locator('#addshop').click();
   await page.locator('#shop option[value="'+id+'"]').waitFor({state:'attached'});
 }
 const make=async rows=>Buffer.from(await page.evaluate(async rows=>{
   const {exportExcel}=await import('./excel.mjs');
   const matrix=rows.map(([code,name,u,promo])=>{const row=Array(21).fill(null);row[0]=name;row[6]=code;row[7]=promo;row[20]=u;return row});
   return Array.from(new Uint8Array(await (await exportExcel(matrix)).arrayBuffer()));
 },rows));
 const rows=[['001','Cáp thử',1000,'Giảm thêm 3%'],['002','Cáp thử',2000,''],['003','Thiết bị thử',1000,''],['003','Thiết bị thử',1100,''],['004','Cáp rời',500,'']];
 const source=await make(rows),next=await make([['001','Cáp thử',1000,'Tặng quà'],['002','Cáp thử',2500,''],['005','Cáp mới',600,'']]);
 const upload=async(bytes,scope,date,name)=>{
   await nav('import');
   if(name==='A1'){
     await page.locator('.hero').evaluate((zone,bytes)=>{
       const files=new DataTransfer();
       files.items.add(new File([Uint8Array.from(bytes)],'A1.xlsx'));
       zone.dispatchEvent(new DragEvent('drop',{dataTransfer:files,bubbles:true,cancelable:true}));
     },Array.from(bytes));
   }else await page.locator('#xlsx').setInputFiles({name:name+'.xlsx',mimeType:'application/octet-stream',buffer:bytes});
   await page.locator('#dname').fill(name);await page.locator('#ddate').fill(date);
   await page.locator('#dscope').selectOption(scope);await page.locator('#commit').click();
 };
 await upload(source,'A','2026-01-01','A1');await page.locator('#query').fill('003');await page.locator('[data-code]').click();
 assert.match(await page.locator('#dialog').innerText(),/xung đột/i);assert.equal(await page.locator('#customer').count(),0);
 await page.locator('#close').click();
 const open=async code=>{await page.locator('#query').fill(code);await page.locator('[data-code]').first().click()};
 await open('001');await page.locator('#manager summary').click();await page.locator('#useTrial').click();await page.locator('#reason').fill('Duyệt 3%');await page.locator('#confirmprice').click();
 await page.locator('#manager summary').click();await page.locator('#finalprice').fill('950');await page.locator('#reason').fill('Đính chính');await page.locator('#confirmprice').click();
 await page.waitForFunction(()=>document.querySelector('#dialog .price')?.textContent==='950đ');await page.locator('#close').click();
 await upload(source,'A','2026-01-01','A1-lặp');assert.ok(notices.some(s=>s.includes('đã được nhập')));
 await upload(source,'B','2026-01-01','B1');await open('001');assert.match(await page.locator('.price').innerText(),/1.000đ/);await page.locator('#close').click();
 await page.locator('#shop').selectOption('A');await open('001');assert.match(await page.locator('.price').innerText(),/950đ/);await page.locator('#close').click();
 await upload(next,'A','2026-01-02','A2');await open('001');assert.match(await page.locator('#dialog').innerText(),/Cần xác nhận/);assert.match(await page.locator('.price').innerText(),/1.000đ/);await page.locator('#close').click();
 await nav('history');const diff=await page.locator('#view').innerText();for(const label of ['Đổi khuyến mãi','Tăng giá','Mã vắng','Mã mới'])assert.ok(diff.includes(label));
 await page.locator('#diffKind').selectOption('Tăng giá');
 assert.equal(await page.locator('[data-diff-kind]:visible').count(),1);
 assert.match(await page.locator('[data-diff-kind]:visible').innerText(),/002/);
 const [comparison]=await Promise.all([page.waitForEvent('download'),page.locator('#exportComparison').click()]);
 assert.match(comparison.suggestedFilename(),/So-sanh/);
 await page.locator('#reverseComparison').click();
 assert.match(await page.locator('[data-diff-kind="Giảm giá"]').innerText(),/002/);
 await nav('report');
 assert.equal(await page.locator('.report-table tbody tr').count(),3);
 await page.locator('[data-field=query]').fill('001');
 await page.getByText('Bộ lọc đã lưu trên máy',{exact:true}).click();
 await page.locator('#presetName').fill('Mã kiểm thử');
 await page.locator('[data-action=savePreset]').click();
 await page.locator('[data-action=reset]').click();
 await page.locator('[data-action=loadPreset]').click();
 assert.equal(await page.locator('.report-table tbody tr').count(),1);
 await page.locator('[data-detail="001"]').click();
 const timeline=page.locator('#dialog details').filter({has:page.getByText(/Diễn biến giá qua/)});
 assert.match(await timeline.textContent(),/A1/);
 assert.match(await timeline.textContent(),/A2/);
 assert.doesNotMatch(await timeline.textContent(),/B1/);
 await page.locator('#close').click();
 const [report]=await Promise.all([page.waitForEvent('download'),page.locator('[data-action=excel]').click()]);
 const bytes=require('node:fs').readFileSync(await report.path()).toString('base64');
 const sheet=await page.evaluate(async b=>{const {readWorkbook}=await import('./excel.mjs');const w=await readWorkbook(Uint8Array.from(atob(b),c=>c.charCodeAt(0)));return {rows:await w.rows(0),name:w.sheets[0].name}},bytes);
 assert.equal(sheet.name,'Phân tích giá');assert.equal(sheet.rows.length,2);assert.equal(sheet.rows[1].cells.A,'001');assert.equal(sheet.rows[1].cells.H,950);
 await page.locator('[data-action=news]').click();
 assert.match(await page.locator('#output pre').innerText(),/950đ/);
 console.log('PASS fixture UI: conflict, duplicate, manager trial and correction, shop isolation, reconfirmation, comparison');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});

