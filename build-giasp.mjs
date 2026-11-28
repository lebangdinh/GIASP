import fs from 'node:fs';
const read = name => fs.readFileSync(new URL(name, import.meta.url),'utf8');
const modules = ['core','excel','report','daily','overview','advanced','state','ui'];
const scripts = modules.map(name=>{
  const source = read('./app/'+name+'.mjs');
  const names = [...source.matchAll(/^export (?:async )?(?:function|const) (\w+)/gm)].map(m=>m[1]);
  const code=source.replace(/^import (\{[^}]+\}) from '\.\/(\w+)\.mjs';/gm,'const $1 = modules.$2;').replace(/^export /gm,'');
  return 'modules.'+name+'=await (async()=>{\n'+code+'\nreturn {'+names.join(',')+'};})();';
});
function jsonTag(id,value){return '<script type="application/json" id="'+id+'">'+JSON.stringify(value).replaceAll('<','\\u003c')+'</script>'}
const advancedBridge=read('./app/advanced-bridge.js').replace("import {quote} from './core.mjs';",()=>read('./app/core.mjs').replace(/^export /gm,''));
const advancedDoc=read('./app/advanced.html').replace('<script type="module" src="./advanced-bridge.js"></script>',()=>'<script type="module">'+advancedBridge+'</script>').replace(/<script src="\.\/(vendor\/(?:xlsx\.bundle|chart\.umd)\.js|advanced-bridge\.js|brands\.js)"><\/script>/g,(_,path)=>'<script>'+read('./app/'+path).replace(/<\/script/gi,'<\\/script')+'</script>');
let html=read('./index.html').replace('<base href="./app/">\n','')
  .replace('<script src="./brands.js"></script>',()=>'<script>'+read('./app/brands.js')+'</script>')
  .replace('</head>',()=>jsonTag('advanced-document',advancedDoc)+'</head>')
  .replace(/<link rel="stylesheet" href="\.\/style\.css(?:\?v=[\w-]+)?">/,()=>'<style>'+read('./app/style.css')+'</style>')
  .replace('<script src="./vendor/jszip.min.js"></script>',()=>'<script>'+read('./app/vendor/jszip.min.js')+'</script>')
  .replace('<script type="module" src="./ui.mjs"></script>',()=>'<script type="module">const modules={};try{'+scripts.join('\n')+'}catch(e){document.querySelector("#view").textContent="Không mở được bảng giá. "+e.message;console.error(e)}</script>');
fs.writeFileSync(new URL(process.argv.includes('--public')?'./C933.html':'./GIASP.html',import.meta.url),html);



