import {openBrowser} from './browser.mjs';
import {writeFile,mkdir} from 'node:fs/promises';
import {PARTS,DT} from '../src/config.js';
const browser=await openBrowser(),page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto('http://127.0.0.1:4222/?clean=1');await page.waitForFunction(()=>window.MG?.ready,{timeout:30000});
 await mkdir('review/stills',{recursive:true});
 const samples=[8,20,36,50,64,81,87,101,110,120,125,130,137,147,152,155,158.4,164,174,190,210,230,246,260,270,290,299,308,320,330,343,350,355,361];
 const checks=[];
 for(const t of samples){const s=await page.evaluate(t=>{const state=window.MG.renderAt(t);return {state,items:window.MG.getItems().filter(i=>i.active),png:window.MG.canvas.toDataURL('image/png').split(',')[1]};},t);
  await writeFile(`review/stills/${String(t).replace('.','-')}.png`,Buffer.from(s.png,'base64'));
  const p=PARTS.find(p=>t>=p.start*DT&&t<p.end*DT),outside=p.mode==='left'?s.items.filter(i=>i.bounds&&i.bounds.x+i.bounds.width>1280.5).map(i=>({id:i.id,name:i.name,box:i.bounds})):[];
  const small=s.items.filter(i=>i.kind==='text'&&i.style.fontSize*i.layoutScale<39.8).map(i=>({name:i.name,px:i.style.fontSize*i.layoutScale}));
  checks.push({t,part:p.id,active:s.items.length,outside,small});
 }
 const prior=await page.evaluate(()=>{window.MG.renderAt(155);return window.MG.canvas.toDataURL();});
 const after=await page.evaluate(()=>{window.MG.renderAt(20);window.MG.renderAt(155);return window.MG.canvas.toDataURL();});
 await writeFile('review/review.json',JSON.stringify({errors,checks,seekPNGExact:prior===after},null,2));console.log(JSON.stringify({errors,checks:checks.map(c=>({t:c.t,outside:c.outside,small:c.small})),seekPNGExact:prior===after},null,2));
}finally{await browser.close();}
