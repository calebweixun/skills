import {DT,DURATION,PARTS,NOTE_LABEL} from '../config.js';
import {CONTENT_RIGHT} from './layout-model.js';
export const MIN_TEACHING_PX=40,ATTRIBUTION_PX=24,CORNER_LEFT=200,CORNER_TOP=1020;
const EPS=.5,pt=px=>Math.round(px/2*10)/10;
// Include each boundary and the final frame of each part in addition to regular samples.
const sampleTimes=()=>[...new Set([...Array.from({length:Math.ceil(DURATION/.25)},(_,i)=>i*.25),...PARTS.flatMap(p=>[p.start*DT,(p.end-1)*DT,...[.05,.3,.8].map(d=>p.start*DT+d).filter(t=>t<p.end*DT)])].filter(t=>t>=0&&t<DURATION))].sort((a,b)=>a-b);
export function checkExport(MG){
 const keep=MG.time,small=new Map(),over=new Map(),notes={present:false,issues:[]};
 try{for(const t of sampleTimes()){
  MG.renderAt(t);const part=PARTS.find(p=>t>=p.start*DT&&t<p.end*DT);
  for(const i of MG.getItems()){
   if(!i.active||!i.bounds)continue;
   const label=i.name.replace(/\n/g,' '),b=i.bounds,right=b.x+b.width,bottom=b.y+b.height;
   if(i.kind==='text'&&i.name.trim()){
    const px=i.style.fontSize*i.layoutScale,min=['attribution','footnote'].includes(i.role)?ATTRIBUTION_PX:MIN_TEACHING_PX;
    if(px<min-.01&&!(small.get(i.id)?.px<=px))small.set(i.id,{label,px,min,role:i.role});
    if(i.role==='attribution'){notes.present=true;if(b.x<CORNER_LEFT||bottom>CORNER_TOP)notes.issues.push(`${NOTE_LABEL}「${label}」需避開左下角藍色裝飾。`);}
   }
   const reasons=[];
   if(b.x < -EPS||b.y < -EPS||right>1920+EPS||bottom>1080+EPS)reasons.push('超出畫面');
   if(part?.mode==='left'&&right>CONTENT_RIGHT+EPS)reasons.push(`侵入右側老師區（x>${CONTENT_RIGHT}）`);
   if(part?.mode==='center'&&b.x<1340-EPS&&right>590+EPS)reasons.push('侵入中央老師區（x=590–1340）');
   for(const reason of reasons){const key=`${part?.id}:${i.id}:${reason}`;if(!over.has(key))over.set(key,{label,part:part?.id,reason,time:t,bounds:b});}
  }
 }}finally{MG.renderAt(keep);}
 const errors=[];
 if(small.size)errors.push('以下文字小於最小字級（教學文字 20 pt，來源及註腳 12 pt）：\n'+[...small.values()].map(v=>`・「${v.label}」${pt(v.px)} pt（需 ≥ ${pt(v.min)} pt）`).join('\n'));
 if(over.size)errors.push('以下物件觸及保留區或超出畫面：\n'+[...over.values()].map(v=>`・${v.part}「${v.label}」${v.reason}（約 ${v.time.toFixed(2)} 秒）`).join('\n'));
 if(NOTE_LABEL&&!notes.present)errors.push(NOTE_LABEL+'被隱藏或移除，輸出必須保留。');
 errors.push(...new Set(notes.issues));
 return {ok:!errors.length,errors,warnings:errors,message:errors.join('\n\n'),smallText:[...small.values()],overflow:[...over.values()],attribution:notes.present};
}
