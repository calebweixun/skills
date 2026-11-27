// End-to-end smoke test for the layout editor. Starts its own server (port 4213, temp layout file),
// so the project's layout.json and exports are never touched. Exit code 1 on any failed assertion.
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {openBrowser} from './browser.mjs';
import {tidyLayout,emptyLayout,textId,validateLayout} from '../src/engine/layout-model.js';
import {readFile} from 'node:fs/promises';
const root=fileURLToPath(new URL('../',import.meta.url)),port=Number(process.env.SMOKE_PORT||4213),base=`http://127.0.0.1:${port}`;
const tmp=await mkdtemp(path.join(tmpdir(),'mg-smoke-')),failures=[];let passed=0;
const ok=(cond,name,detail)=>{if(cond){passed++;console.log('  ok   '+name);}else{failures.push(name);console.log('  FAIL '+name+(detail!==undefined?'  -> '+(typeof detail==='string'?detail:JSON.stringify(detail)):''));}};
const canon=v=>Array.isArray(v)?v.map(canon):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canon(v[k])])):v,items=l=>JSON.stringify(canon(l.items));
const server=spawn(process.execPath,[path.join(root,'server.mjs')],{cwd:root,windowsHide:true,env:{...process.env,PORT:String(port),MG_RENDER_STUB:'1',MG_LAYOUT_FILE:path.join(tmp,'layout.json')}});
let serverLog='';server.stdout.on('data',d=>serverLog+=d);server.stderr.on('data',d=>serverLog+=d);
const api=async(method,url,body,headers={})=>{const r=await fetch(base+url,{method,headers:body===undefined?headers:{'Content-Type':'application/json',...headers},body:body===undefined?undefined:typeof body==='string'?body:JSON.stringify(body)});let data=null;try{data=await r.json();}catch{}return {status:r.status,data};};
let browser;
try{
 for(let i=0;i<50;i++){try{if((await fetch(base+'/api/layout')).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
 console.log('Server / API');
 let r=await api('GET','/api/layout');
 ok(r.status===200&&r.data.revision===0,'GET /api/layout without saved file returns revision 0',r.status);
 ok(items(r.data.layout)===items(tidyLayout()),'server default layout is the tidy preset (整理對齊)');
 const tidy=r.data.layout,nameId=textId('以「天然氣」及生質燃料\n取代燃煤與燃油',80,837);
 r=await api('POST','/api/layout',{layout:tidy,baseRevision:0});ok(r.status===200&&r.data.revision===1,'save with baseRevision 0 -> revision 1',r);
 r=await api('POST','/api/layout',{layout:tidy,baseRevision:0});ok(r.status===409&&r.data.revision===1,'stale baseRevision is refused with 409',r);
 for(const [name,mutate] of [['fontSize 5px',l=>{l.items[nameId]={fontSize:5};}],['x out of range',l=>{l.items['icon-h2']={x:99999};}],['wrong sceneId',l=>{l.sceneId='other';}],['unknown item id',l=>{l.items['evil/../x']={x:1};}],['bad colour',l=>{l.items[nameId]={color:'red'};}]]){
  const bad=structuredClone(tidy);mutate(bad);r=await api('POST','/api/layout',{layout:bad,baseRevision:1});ok(r.status===400&&!!r.data.error,`invalid layout refused: ${name}`,r);}
 r=await api('POST','/api/layout','x=1',{'Content-Type':'text/plain'});ok(r.status===415,'non-JSON body refused (415)',r.status);
 r=await api('POST','/api/layout',{layout:tidy,baseRevision:1},{Origin:'http://evil.example'});ok(r.status===403,'cross-origin write refused (403)',r.status);
 console.log('Export rules (server preflight; reminders only)');
 const clean=await api('POST','/api/render',{layout:tidy});ok(clean.status===202&&clean.data.job?.warnings?.length===0,'a layout that follows the rules exports with no warnings',clean);
 {const bad=structuredClone(tidy);bad.items['icon-h2']={x:1200};const r2=await api('POST','/api/render',{layout:bad}),w=(r2.data?.job?.warnings||[]).join('\n');ok(r2.status===202&&w.includes('超出左側內容區')&&w.includes('氫氣儲槽'),'item entering the presenter zone is a non-blocking warning',w.slice(0,200));}
 console.log('Browser');
 browser=await openBrowser();const page=await browser.newPage({viewport:{width:1680,height:1100}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>{try{localStorage.removeItem('green-motion-layout-editor-page-004');}catch{}});
 await page.goto(base);await page.waitForFunction(()=>window.MG?.editor||window.MG?.error,{timeout:30000});
 const info=await page.evaluate(()=>({ready:MG.ready,error:MG.error,items:MG.getItems().length,hasEditor:!!MG.editor,canvas:[MG.canvas.width,MG.canvas.height],preset:document.querySelector('#preset').value,layout:MG.getLayout(),frames:MG.frameCount}));
 ok(info.ready&&!info.error&&info.hasEditor,'editor loads and is ready',info.error);
 ok(info.items>=100,'scene registers many editable items',info.items);
 ok(info.canvas.join('x')==='1920x1080','drawing buffer is 1920x1080',info.canvas);
 ok(info.frames===2181,'page has 2181 frames',info.frames);
 ok(info.preset==='tidy','#preset defaults to 整理對齊 (tidy)',info.preset);
 const preset=async v=>{await page.selectOption('#preset',v);await page.click('#apply-preset');return page.evaluate(()=>({layout:MG.getLayout(),preset:document.querySelector('#preset').value}));};
 let p=await preset('original');ok(Object.keys(p.layout.items).length===0&&p.preset==='original','原始版面 clears all overrides',p.preset);
 p=await preset('tidy');ok(items(p.layout)===items(tidyLayout())&&p.preset==='tidy','整理對齊 applies the tidy preset');
 console.log('Selectable objects');
 await page.evaluate(()=>{MG.setLayout(MG.projectInfo.layout);MG.renderAt(34);});
 const cov=await page.evaluate(async()=>{const {scene}=await import('/src/engine/stage.js');const unmapped=new Map(),seen=new Set();let meshes=0;const ids=new Set(MG.getItems().map(i=>i.id));
  for(let t=0;t<=36.3;t+=0.25){MG.renderAt(t);for(const i of MG.getItems())if(i.active)seen.add(i.id);scene.traverse(o=>{if(!o.isMesh)return;let v=o,vis=true;while(v){if(!v.visible)vis=false;v=v.parent;}const mats=Array.isArray(o.material)?o.material:[o.material];if(!vis||!mats.some(m=>m.opacity>.025))return;meshes++;let a=o,ok=false;while(a){if(a.userData.editableId){ok=true;break;}a=a.parent;}if(!ok)unmapped.set(o.uuid,t);});}
  MG.renderAt(34);return {count:ids.size,meshes,unmapped:unmapped.size,neverVisible:[...ids].filter(id=>!seen.has(id)&&!MG.getItem(id).hidden)};});
 ok(cov.unmapped===0&&cov.meshes>1000,'every visible mesh at every sampled time belongs to an editable item',cov);
 ok(cov.neverVisible.length===0,'every editable item is visible at some time (so it can be picked)',cov.neverVisible);
 const snapshot=()=>page.evaluate(()=>{const out={};for(const t of [0.5,5,10,13,15,17.5,19,24,34,36]){MG.renderAt(t);out[t]=Object.fromEntries(MG.getItems().map(i=>[i.id,{active:i.active,p:i.parentId,b:i.bounds&&[i.bounds.x,i.bounds.y,i.bounds.width,i.bounds.height]}]));}MG.renderAt(34);return out;});
 const before=await snapshot();await page.waitForTimeout(100);
 const box=await page.evaluate(()=>{const n=document.querySelector('#edit-overlay rect.hit[data-id="icon-gas"]');if(!n)return null;const r=n.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});
 ok(!!box,'gas icon has a draggable hit area in edit mode');
 if(box){await page.keyboard.down('Control');await page.keyboard.down('Alt');await page.mouse.move(box.x,box.y);await page.mouse.down();await page.mouse.move(box.x-30,box.y+25,{steps:6});await page.mouse.up();await page.keyboard.up('Alt');await page.keyboard.up('Control');}
 const patch=await page.evaluate(()=>MG.getLayout().items['icon-gas']||{});
 ok(Math.abs(patch.x||0)>3&&Math.abs(patch.y||0)>3,'drag writes an x/y offset to the layout',patch);
 ok(await page.evaluate(()=>document.querySelector('#preset').value)==='custom','preset selector shows 自訂調整 after a manual edit');
 const after=await snapshot();let timingSame=true,othersSame=true,movedOk=true;const dx=patch.x||0,dy=patch.y||0;
 for(const t of Object.keys(before))for(const id of Object.keys(before[t])){const a=before[t][id],b=after[t][id];if(a.active!==b.active)timingSame=false;if(!a.b||!b.b)continue;const d=b.b.map((v,i)=>v-a.b[i]);let anc=a.p,inside=id==='icon-gas';while(anc){if(anc==='icon-gas')inside=true;anc=before[t][anc]?.p;}if(inside){if(Math.abs(d[0]-dx)>.01||Math.abs(d[1]-dy)>.01||Math.abs(d[2])>.01||Math.abs(d[3])>.01)movedOk=false;}else if(/^(icon|line|text|shape)-/.test(id)){if(d.some(v=>Math.abs(v)>.01)){othersSame=false;(globalThis.__bad??=[]).push(t+':'+id);}}}
 ok(timingSame,'drag does not change which items are visible at any sampled time');
 ok(movedOk,'dragged item only translates by the stored offset at every time');
 ok(othersSame,'other items are unchanged at every sampled time',(globalThis.__bad||[]).slice(0,8));
 await page.evaluate(()=>MG.editor.undo());ok(await page.evaluate(()=>!MG.getLayout().items['icon-gas']?.x),'undo restores the position');
 await page.click('#save-layout');await page.waitForFunction(()=>MG.editor.revision>=2,{timeout:5000}).catch(()=>{});
 ok(await page.evaluate(()=>MG.editor.revision)>=2&&!(await page.evaluate(()=>MG.editor.dirty)),'save button writes the next revision and clears the dirty flag');
 console.log('Idle loops');
 const idle=await page.evaluate(()=>{MG.setLayout(MG.projectInfo.layout);const snap=t=>{MG.renderAt(t);return {png:MG.canvas.toDataURL(),b:Object.fromEntries(MG.getItems().map(i=>[i.id,i.bounds&&[i.bounds.x,i.bounds.y,i.bounds.width,i.bounds.height].map(v=>Math.round(v*100)/100)])),kinds:Object.fromEntries(MG.getItems().map(i=>[i.id,i.kind]))};};
  const a=snap(35.5),b=snap(35.8),last=snap(MG.duration-0.02),c=snap(35.5),d=snap(0.5),e=snap(35.5);
  const moving=Object.keys(a.b).filter(k=>a.b[k]&&b.b[k]&&a.b[k].join()!==b.b[k].join()),textMoved=Object.keys(a.b).filter(k=>a.kinds[k]==='text'&&a.b[k]&&b.b[k]&&a.b[k].join()!==b.b[k].join());
  return {pixelsChange:a.png!==b.png,pixelsChangeLate:b.png!==last.png,backward:a.png===c.png&&a.png===e.png,moving,textMoved};});
 ok(idle.pixelsChange&&idle.pixelsChangeLate,'frames keep changing up to the last frame (idle loops)',idle);
 ok(idle.backward,'seeking back and forth gives identical frames');
 ok(idle.textMoved.length===0,'no text item moves during the idle tail',idle.textMoved);
 ok(idle.moving.length>=5,'ambient parts (gear, flow dots, arrowheads, sensors ...) change bounds during the tail',idle.moving.slice(0,12));

 ok(errors.length===0,'no console / page errors',errors);
}catch(error){failures.push('unexpected error: '+error.message);console.error(error);}
finally{await browser?.close();server.kill();await new Promise(r=>setTimeout(r,300));await rm(tmp,{recursive:true,force:true}).catch(()=>{});}
console.log(`\n${passed} passed, ${failures.length} failed`);if(failures.length){console.log(failures.map(f=>' - '+f).join('\n'));if(serverLog.trim())console.log('server log:\n'+serverLog.slice(-800));}
process.exit(failures.length?1:0);
