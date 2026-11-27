import {SCENE_ID,PAGE_LABEL} from '../config.js';
export {SCENE_ID};
export {tidyLayout} from '../scenes/tidy.js';
export const CONTENT_RIGHT=1280;
export function textId(text,x,y){let h=2166136261;for(const c of `${text}@${x},${y}`){h^=c.codePointAt(0);h=Math.imul(h,16777619);}return `text-${(h>>>0).toString(16)}`;}
export function emptyLayout(){return {schemaVersion:1,sceneId:SCENE_ID,updatedAt:null,items:{}};}
export function validateLayout(input){
 if(!input||input.schemaVersion!==1||input.sceneId!==SCENE_ID||!input.items||Array.isArray(input.items)||typeof input.items!=='object')throw new Error('這份版面不屬於本頁，請匯入'+PAGE_LABEL+'的版面 JSON。');
 const out=emptyLayout();out.updatedAt=typeof input.updatedAt==='string'?input.updatedAt:null;
 const entries=Object.entries(input.items);if(entries.length>400)throw new Error('版面物件數超過上限。');
 const ranges={x:[-4000,4000],y:[-2500,2500],scale:[.2,3],rotation:[-360,360],fontSize:[12,200],boxWidth:[24,1800]};
 for(const [id,p] of entries){if(!/^(text-[a-f0-9]+|(icon|line|shape)-[a-z0-9-]+)$/.test(id)||!p||typeof p!=='object'||Array.isArray(p))throw new Error('版面物件格式錯誤。');const item={};
  for(const [key,[lo,hi]] of Object.entries(ranges))if(p[key]!==undefined){if(typeof p[key]!=='number'||!Number.isFinite(p[key])||p[key]<lo||p[key]>hi)throw new Error(`無效的 ${key} 數值。`);item[key]=Math.round(p[key]*1000)/1000;}
  for(const key of ['hidden','locked'])if(p[key]!==undefined){if(typeof p[key]!=='boolean')throw new Error('物件狀態格式錯誤。');item[key]=p[key];}
  if(p.text!==undefined){if(typeof p.text!=='string'||p.text.length>500)throw new Error('文字長度需少於 500 字。');item.text=p.text;}
  if(p.textAlign!==undefined){if(!['left','center','right'].includes(p.textAlign))throw new Error('文字對齊格式錯誤。');item.textAlign=p.textAlign;}
  if(p.color!==undefined){if(!/^#[0-9a-f]{6}$/i.test(p.color))throw new Error('文字顏色格式錯誤。');item.color=p.color;}
  if(Object.keys(item).length)out.items[id]=item;
 }return out;
}
