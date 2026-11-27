// Usage: node tools/idcheck.mjs <out.json> [before.json]  — prints kind/name/parent/part/bounds for each id in layout.json (editor server at MG_URL, default :4232)
import {openBrowser} from './browser.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {PARTS,DT} from '../src/config.js';
const url=process.env.MG_URL||'http://127.0.0.1:4232',ids=Object.keys(JSON.parse(await readFile('layout.json','utf8')).items);
const b=await openBrowser(),p=await b.newPage({viewport:{width:1920,height:1080}});
await p.goto(url+'/?clean=1');await p.waitForFunction(()=>window.MG?.ready);
const all=await p.evaluate(()=>window.MG.getItems().map(i=>({id:i.id,kind:i.kind,name:i.originalName,parent:i.parentId,text:i.style?.text||null})));
const by=Object.fromEntries(all.map(i=>[i.id,i]));
// part of an item = first part in which it is ever active
const res={};for(const id of ids){const it=by[id];if(!it){res[id]=null;continue;}let part=null,box=null;
 for(const pt of PARTS){const t=await p.evaluate(({id,s,e})=>{for(let t=s;t<e;t+=.5){window.MG.renderAt(t);const i=window.MG.getItem(id);if(i&&i.active)return {t,b:i.bounds};}return null;},{id,s:pt.start*DT+.05,e:pt.end*DT});if(t){part=pt.id;box=t.b;break;}}
 res[id]={kind:it.kind,name:it.name,parent:it.parent,part,seenAt:box?null:null,box:box&&{x:Math.round(box.x),y:Math.round(box.y),w:Math.round(box.width),h:Math.round(box.height)}};}
await writeFile(process.argv[2],JSON.stringify(res,null,1));
let before=null;try{before=JSON.parse(await readFile(process.argv[3],'utf8'));}catch{}
for(const id of ids){const a=res[id],o=before?.[id];const f=x=>x?`${x.kind} "${x.name}" part=${x.part} box=${JSON.stringify(x.box)}`:'MISSING';console.log(id.padEnd(18),'now:',f(a),before?('\n'.padEnd(20)+'was: '+f(o)+(o&&a&&o.name===a.name&&o.part===a.part&&o.kind===a.kind?'  [same]':'  [CHANGED]')):'');}
await b.close();
