const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const rel='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const pkg='http://schemas.openxmlformats.org/package/2006/relationships';
const tags=(node,name)=>Array.from(node.getElementsByTagNameNS('*',name));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export async function readWorkbook(bytes){
 const zip=await JSZip.loadAsync(bytes);const xml=async path=>{const f=zip.file(path);if(!f)throw Error('Thiếu thành phần Excel: '+path);const doc=new DOMParser().parseFromString(await f.async('string'),'application/xml');if(doc.querySelector('parsererror'))throw Error('XML Excel không hợp lệ');return doc};
 const book=await xml('xl/workbook.xml'),rels=await xml('xl/_rels/workbook.xml.rels');
 const strings=zip.file('xl/sharedStrings.xml')?tags(await xml('xl/sharedStrings.xml'),'si').map(n=>tags(n,'t').map(t=>t.textContent).join('')):[];
 const sheets=tags(book,'sheet').map(s=>{const id=s.getAttributeNS(rel,'id');const target=tags(rels,'Relationship').find(r=>r.getAttribute('Id')===id)?.getAttribute('Target');return {name:s.getAttribute('name'),path:new URL(target,'https://local/xl/workbook.xml').pathname.slice(1)}});
 const styles=zip.file('xl/styles.xml')?await xml('xl/styles.xml'):null;
 const formats=new Map(tags(styles||book,'numFmt').map(n=>[n.getAttribute('numFmtId'),n.getAttribute('formatCode')]));
 const xfs=styles?tags(styles,'cellXfs')[0]?.children:[];
 return {sheets,async rows(index){const doc=await xml(sheets[index].path);return tags(doc,'row').map(r=>{const cells={};for(const c of tags(r,'c')){const col=c.getAttribute('r')?.match(/^[A-Z]+/)?.[0];let t=c.getAttribute('t'),v=tags(c,'v')[0]?.textContent;if(t==='inlineStr')v=tags(c,'t').map(x=>x.textContent).join('');else if(t==='s')v=strings[Number(v)];else if((!t||t==='n')&&v){const format=formats.get(xfs?.[Number(c.getAttribute('s'))]?.getAttribute('numFmtId'));v=format&&/^00+$/.test(format)?v.padStart(format.length,'0'):Number(v)}if(col&&v!=null&&v!=='')cells[col]=v}return {row:Number(r.getAttribute('r')),cells}}).filter(r=>Object.keys(r.cells).length)}};
}
function column(i){let s='';for(i++;i;i=Math.floor((i-1)/26))s=String.fromCharCode(65+(i-1)%26)+s;return s}
export async function exportExcel(rows,sheetName="Bản tin"){const z=new JSZip();
 z.file('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
 const relationships=(target,type)=>'<Relationships xmlns="'+pkg+'"><Relationship Id="rId1" Type="'+rel+'/'+type+'" Target="'+target+'"/></Relationships>';
 z.file('_rels/.rels',relationships('xl/workbook.xml','officeDocument'));z.file('xl/_rels/workbook.xml.rels',relationships('worksheets/sheet1.xml','worksheet'));
 z.file('xl/workbook.xml','<workbook xmlns="'+ns+'" xmlns:r="'+rel+'"><sheets><sheet name="'+esc(sheetName)+'" sheetId="1" r:id="rId1"/></sheets></workbook>');
 z.file('xl/worksheets/sheet1.xml','<worksheet xmlns="'+ns+'"><sheetData>'+rows.map((r,i)=>'<row r="'+(i+1)+'">'+r.map((v,j)=>v==null?'':'<c r="'+column(j)+(i+1)+'" '+(typeof v==='number'?'><v>'+v+'</v>':'t="inlineStr"><is><t xml:space="preserve">'+esc(v)+'</t></is>')+'</c>').join('')+'</row>').join('')+'</sheetData></worksheet>');
 return z.generateAsync({type:'blob',compression:'DEFLATE',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})}

