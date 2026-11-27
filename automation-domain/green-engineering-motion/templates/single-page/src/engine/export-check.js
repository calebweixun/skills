import {CUES,DT,DURATION} from '../config.js';
import {CONTENT_RIGHT} from './layout-model.js';
import {NOTE_LABEL} from '../config.js';
// Export rules (1920x1080 output pixels; 40 px = 20 pt on the 960x540 pt source slide).
export const MIN_TEACHING_PX=40,ATTRIBUTION_PX=24,CORNER_LEFT=200,CORNER_TOP=1020;
const EPS=0.5,pt=px=>Math.round(px/2*10)/10;
// Idle loops keep moving after the freeze cue, so the tail is sampled too (settle frames stay last: freeze cue, final frame).
const sampleTimes=()=>{const out=[];for(let t=0;t<CUES.freeze;t+=0.25)out.push(t);for(let t=Math.ceil(CUES.freeze/0.25)*0.25;t<DURATION-DT;t+=0.25)if(t>CUES.freeze)out.push(t);out.push(CUES.freeze,DURATION-DT);return out;};
// Runs the export rules against the current layout. Leaves the timeline where it was.
export function checkExport(MG){
 const keep=MG.time,small=new Map(),over=new Map(),notes={present:false,issues:[]};let settle=true;
 const times=sampleTimes();
 try{
  for(const t of [...times.slice(-2),...times.slice(0,-2)]){
   MG.renderAt(t);
   for(const i of MG.getItems()){
    if(!i.active)continue;
    const label=i.name.replace(/\n/g,' ');
    if(i.kind==='text'&&i.name.trim()){
     const px=i.style.fontSize*i.layoutScale,min=i.role==='attribution'?ATTRIBUTION_PX:MIN_TEACHING_PX;
     if(px<min-0.01&&!(small.get(i.id)?.px<=px))small.set(i.id,{label,px,min,role:i.role});
     if(i.role==='attribution'&&t===times.at(-2)){
      notes.present=true;const b=i.bounds;
      if(b.x<CORNER_LEFT||b.y+b.height>CORNER_TOP)notes.issues.push(`${NOTE_LABEL}「${label}」需避開左下角藍色裝飾（至少離左側 ${CORNER_LEFT}px、底部 ${1080-CORNER_TOP}px）。`);
     }
    }
    const right=i.bounds.x+i.bounds.width;
    if(right>CONTENT_RIGHT+EPS){const key=i.id,prev=over.get(key);if(!prev||right>prev.right)over.set(key,{label,right,settle:t===times.at(-2)||prev?.settle,time:t});}
   }
  }
 }finally{MG.renderAt(keep);}
 const errors=[];
 if(small.size)errors.push(`以下文字小於最小字級（教學文字至少 20 pt，來源附註 12 pt）：\n`+[...small.values()].map(v=>`・「${v.label}」${pt(v.px)} pt（需 ≥ ${pt(v.min)} pt）`).join('\n'));
 if(over.size)errors.push(`以下物件超出左側內容區（右緣需 ≤ x=${CONTENT_RIGHT}，右側留給老師人像）：\n`+[...over.values()].map(v=>`・「${v.label}」右緣 x=${Math.round(v.right)}（約 ${v.time.toFixed(1)} 秒${v.settle?'，落位畫面':''}）`).join('\n'));
 if(NOTE_LABEL&&!notes.present)errors.push(NOTE_LABEL+'被隱藏或移除，輸出必須保留。');
 errors.push(...notes.issues);
 // Reminders only: callers list `warnings` but never block export (render.mjs --strict is the opt-in blocking mode).
 return {ok:!errors.length,errors,warnings:errors,message:errors.join('\n\n'),smallText:[...small.values()],overflow:[...over.values()],attribution:notes.present};
}
