// Usage: node tools/still.mjs <outdir> <t1,t2,...|part:<id>> [prefix]   renders opaque (white / dark / teacher-ref) stills via the editor server (MG_URL or :4232)
import {openBrowser} from './browser.mjs';
import {writeFile,mkdir} from 'node:fs/promises';
import {PARTS,DT} from '../src/config.js';
const out=process.argv[2],spec=process.argv[3]||'',prefix=process.argv[4]||'',url=process.env.MG_URL||'http://127.0.0.1:4232';
await mkdir(out,{recursive:true});
const times=spec.split(',').filter(Boolean).map(Number);
const browser=await openBrowser(),page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto(url+'/?clean=1&nocache='+Date.now());await page.waitForFunction(()=>window.MG?.ready,{timeout:30000});
 for(const t of times){
  const r=await page.evaluate(t=>{const st=window.MG.renderAt(t);const c=document.createElement('canvas');c.width=1920;c.height=1080;const x=c.getContext('2d');x.fillStyle=st.mode==='left'?'#fff':'#0a222b';x.fillRect(0,0,1920,1080);x.drawImage(window.MG.canvas,0,0);
   if(st.mode==='left'){x.strokeStyle='rgba(255,0,0,.35)';x.setLineDash([8,8]);x.beginPath();x.moveTo(1280,0);x.lineTo(1280,1080);x.stroke();}
   const items=window.MG.getItems().filter(i=>i.active);
   return {st,png:c.toDataURL('image/png').split(',')[1],over:items.filter(i=>st.mode==='left'&&i.bounds&&i.bounds.x+i.bounds.width>1280.5).map(i=>i.name),small:items.filter(i=>i.kind==='text'&&i.style.fontSize*i.layoutScale<39.8).map(i=>i.name+':'+i.style.fontSize)};},t);
  await writeFile(`${out}/${prefix}${String(t).replace('.','_')}.png`,Buffer.from(r.png,'base64'));
  console.log(t,r.st.part,r.st.local.toFixed(2),r.over.length?'OVER:'+r.over.join('|'):'',r.small.length?'SMALL:'+r.small.join('|'):'');
 }
 if(errors.length)console.log('ERRORS',errors);
}finally{await browser.close();}
