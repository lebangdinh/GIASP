(()=>{
const brandNames='Anker|Soundcore|Xmobile|UGREEN|AVA+|Hydrus|Rezo|Havit|Huawei|Kingston|DareU|HIKSEMI|SanDisk|Logitech|Rapoo|Philips|Amazfit|Maxell|INNOSTYLE|JBL|Kioxia|Sony|Baseus|AULA|TP-Link|Ulanzi|Energizer|Apple|Samsung|Xiaomi|OPPO|Vivo|Realme|Honor|Nokia|Motorola|Tecno|Nubia|Nothing|OnePlus|Dell|HP|Asus|Lenovo|Acer|MSI|LG|Panasonic|Toshiba|Daikin|Mitsubishi|Casper|Electrolux|Sharp|Beko|Nagakawa|Aqua|Kangaroo|Sunhouse'.split('|');
const brandsByName=new Map(brandNames.map(b=>[b.toLowerCase(),b]));
const explicitBrand=new RegExp('(?:^|[^a-z0-9])('+brandNames.map(b=>b.replace('+','\\+')).join('|')+')(?=$|[^a-z0-9])','i');
const brandModels=[
  ['Anker',/\ba110[lm]\b/],['AVA+',/\b(?:ava plus|gn-05)\b/],['Ulanzi',/\bma39\b/],
  ['Huawei',/\bfreebuds\b/],['Soundcore',/\br60i nc\b/],['Kingston',/\bdtxg2\b/],
  ['Logitech',/\b(?:logim240(?:pink|black)|m185)\b/],['Rapoo',/\brapoob2s(?:blue|black)\b/],
  ['JBL',/\bjblc200si\w*/],['Asus',/\basustuf\w*|\b(?:vivobook|zenbook|rog|tuf)\b/],
  ['Energizer',/\be9[12]bp\d/],['Apple',/\b(?:iphone|ipad|macbook|airpods)\b/],
  ['Samsung',/\bgalaxy\b/],['Xiaomi',/\b(?:redmi|poco)\b/],['OPPO',/\b(?:reno|find x)\b/],
  ['Motorola',/\bmoto\b|^g06 power\b/],['Dell',/\b(?:inspiron|xps|alienware)\b/],
  ['HP',/\b(?:pavilion|elitebook|omen|probook)\b/],['Lenovo',/\b(?:thinkpad|ideapad|legion|yoga)\b/],
  ['Acer',/\b(?:aspire|nitro|predator|swift)\b/]
];
function infer(name){
  const text=String(name||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('đ','d').split(/\b(?:tuong thich|danh cho|compatible with|for)\b/)[0];
  const match=explicitBrand.exec(text);
  if(match)return brandsByName.get(match[1].toLowerCase());
  return brandModels.find(([,pattern])=>pattern.test(text))?.[0]||'Chưa xác định';
}
const key=code=>'c933.brand.'+code;
function resolve(name,code){return (code && localStorage.getItem(key(code))) || infer(name);}
function save(code,raw){
  const text=raw.trim();
  if(text && !/^[\p{L}\p{N}][\p{L}\p{N} .+&()-]{0,59}$/u.test(text))throw Error('Kiểm tra tên hãng (tối đa 60 ký tự).');
  if(text)localStorage.setItem(key(code),brandsByName.get(text.toLowerCase())||text);
  else localStorage.removeItem(key(code));
}
window.C933Brands={resolve,save,names:brandNames};
})();
