// Episode 0 (第一集) opening MG, 0 – 52.8528 s of the ep0 film (user-supplied; not bundled).
// Native Three.js vector artwork. Helpers (sync/cue/show, text weight hierarchy, leaf/gear icons) come from episode-002-diagnostics; the engine in ../engine is shared.
// Teacher stands in the centre (x≈640-1320) in 0-37.1 s -> MG lives in the left column (x 60-570) and the right column (x 1360-1900); nothing in x=590..1340.
// From 37.1 s the film plays its own globe / title card (no MG); page-002's MG starts at frame 3168 (52.8528 s) from an empty frame, so this clip ends empty.
import {T,root,group,rect as rr,poly as pp,disk as dd,line as ll,text as tt,E,opacity,clamp,prog,ease,ring as rg,arc as aa} from '../engine/stage.js';
import {COLORS as C,PARTS,DT,DURATION} from '../config.js';
let uid=0;const clips=[];
// dark-film palette (same family as episode-002 intro/title)
const WHITE='#ffffff',MINT='#75d6c4',GOLD='#f4c66b',SOFT='#c9e4e9',GREEN='#5fd39a',DK='#0e3340',DK2='#14505a',STEEL='#7f9ab5',PALE='#d7e9ee';
const reg=(o,name='形狀')=>E(o,`shape-ep0-${++uid}`,name,{center:false});
const rect=(...a)=>reg(rr(...a)),poly=(...a)=>reg(pp(...a)),disk=(...a)=>reg(dd(...a)),line=(...a)=>reg(ll(...a)),ring=(...a)=>reg(rg(...a)),arc=(...a)=>reg(aa(...a));
const text=(g,s,x,y,size=42,c=WHITE,opt={})=>tt(g,s,x+(++uid)*.00001,y,size,c,opt);
const bold=(g,s,x,y,size,c,o={})=>text(g,s,x,y,size,c,{weight:700,...o});
function item(g,name,x=0,y=0){const m=E(group(g,x,y),`icon-ep0-${++uid}`,name,{center:false});m.userData.nm=name;return m;}
const back=x=>{x=clamp(x);return 1+2.6*(x-1)**3+1.6*(x-1)**2;};
function show(g,t,s,d=.5,dy=25){const p=prog(t,s,d),b=g.userData.poseBase;g.visible=p>0;g.position.set(b.x,b.y+dy*(1-ease(p)),0);g.scale.set(b.sx*(.97+.03*back(p)),b.sy*(.97+.03*back(p)),1);opacity(g,ease(p));}
function build(p){const g=group(),o={...p,g,steps:[],loops:[]};clips.push(o);return o;}
function cue(o,g,start=0,fn){g.userData.poseBase={x:g.position.x,y:g.position.y,sx:g.scale.x,sy:g.scale.y};o.steps.push({g,start,fn});return g;}
// ---- every entrance = sync(o,group,spokenSeconds,phrase): spoken = absolute time of the key word in ep0_3.mp4 (review/alignment.json + energy onsets) ----
export const cueLog=[];
const est=(s,size)=>[...String(s)].reduce((a,c)=>a+(c.charCodeAt(0)<256?size*.58:size),0);
function sync(o,g,spoken,phrase,opt={}){const {lead=.2,until,d}=opt,base=o.start*DT,rel=Math.max(0,spoken-lead-base);cue(o,g,rel);const st=o.steps.at(-1);if(d)st.d=d;if(until!==undefined)st.until=until-base;
 cueLog.push({part:o.id,id:g.userData.editableId,name:g.userData.nm||'',phrase,spoken,spokenRel:spoken-base,cue:rel,cueAbs:rel+base,until:until===undefined?null:until});return g;}
const END=37.2; // narration (last word 製造 ends ~37.1 s) is over; the film's globe enters at ~37.1 s -> 0.25 s fade ends here

// ================= icons (centre cx,cy; nominal radius 50 before k) =================
function disc(g,cx,cy,r,col=MINT){disk(g,cx,cy,r,col);disk(g,cx,cy,r-5,DK);}
function gear(parent,x,y,r=60,c=MINT){const g=item(parent,'齒輪',x,y);for(let i=0;i<12;i++){const a=i*Math.PI/6,m=rect(g,-r*.14,-r*.18,r*.28,r*.36,c,3);m.rotation.z=a;m.position.set(Math.sin(a)*(r-3),-Math.cos(a)*(r-3),0);}disk(g,0,0,r,c);disk(g,0,0,r*.65,'#dce8f3');ring(g,0,0,r*.42,6,c);disk(g,0,0,r*.18,WHITE);return g;}
function leaf2(parent,x,y,s=1){const g=item(parent,'綠色製造',x,y);g.scale.setScalar(s);const a=-.62,c=Math.cos(a),n=Math.sin(a),R=(px,py)=>[px*c-py*n,px*n+py*c],up=[],lo=[];
 for(let i=0;i<=30;i++){const u=i/30,w=44*Math.sin(Math.PI*u)**.8*(1-.22*u);up.push(R(-52+104*u,-w));lo.push(R(-52+104*u,w));}
 poly(g,[...up,...lo.reverse()],GREEN);line(g,[R(-56,0),R(40,0)],WHITE,5);const W=u=>44*Math.sin(Math.PI*u)**.8*(1-.22*u);[-.3,0,.3].forEach(d=>{const u0=.5+d*.9,px=-52+104*u0,u1=Math.min(.92,u0+.17),w1=W(u1)*.62;line(g,[R(px,0),R(-52+104*u1,-w1)],WHITE,4);line(g,[R(px,0),R(-52+104*u1,w1)],WHITE,4);});line(g,[R(-52,0),R(-68,0)],GREEN,7);return g;}
function iPencil(g,cx,cy,k=1){const p=item(g,'設計・鉛筆',cx,cy);p.scale.setScalar(k);p.rotation.z=.8;rect(p,-9,-30,18,50,GOLD,2);rect(p,-9,-38,18,10,'#e98686',3);rect(p,-9,-30,18,4,'#fff3d6');poly(p,[[-9,20],[9,20],[0,40]],'#f6e3c0');poly(p,[[-3.6,32],[3.6,32],[0,40]],'#2a3f48');return p;}
function iBox(g,cx,cy,k=1){const b=item(g,'包裝・紙箱',cx,cy);b.scale.setScalar(k);rect(b,-30,-14,60,42,'#e7b75a',4);rect(b,-34,-28,68,16,GOLD,3);rect(b,-6,-28,12,56,'#fff3d6');return b;}
function iRecycle(g,cx,cy,k=1){const s=item(g,'回收・循環',cx,cy);s.scale.setScalar(k);const sp=group(s);for(let i=0;i<3;i++){const a0=i*2*Math.PI/3+.3,a1=a0+1.5,R=26;arc(sp,0,0,R-4.5,R+4.5,a0,a1,GREEN);poly(sp,[[Math.cos(a1)*(R+14),Math.sin(a1)*(R+14)],[Math.cos(a1)*(R-14),Math.sin(a1)*(R-14)],[Math.cos(a1)*R-Math.sin(a1)*20,Math.sin(a1)*R+Math.cos(a1)*20]],GREEN);}return {g:s,spin:sp};}
function iBooks(g,cx,cy,k=1){const b=item(g,'好幾門課程・書本',cx,cy);b.scale.setScalar(k);
 [[-34,-30,20,60,GREEN],[-11,-40,22,70,GOLD],[13,-26,22,56,MINT],[36,-34,18,64,'#e98686']].forEach(([x,y,w,h,c])=>{rect(b,x,y,w,h,c,3);rect(b,x+3,y+8,w-6,3,WHITE);rect(b,x+3,y+h-12,w-6,3,WHITE);});rect(b,-44,30,96,6,SOFT,3);return b;}
function iCloud(g,cx,cy,k=1){const c=item(g,'減少碳排・雲與下降箭頭',cx,cy);c.scale.setScalar(k);const u=group(c,0,-8);disk(u,-17,2,15,SOFT);disk(u,0,-8,20,SOFT);disk(u,19,1,14,SOFT);rect(u,-19,0,40,16,SOFT,7);const ar=group(c,0,0);rect(ar,-5,12,10,16,GREEN,2);poly(ar,[[-14,28],[14,28],[0,44]],GREEN);return {g:c,ar};}
function iBolt(g,cx,cy,k=1){const b=item(g,'降低能耗・電力下降',cx,cy);b.scale.setScalar(k);poly(b,[[8,-36],[-16,4],[-3,4],[-10,36],[18,-8],[4,-8],[13,-36]],GOLD);const ar=group(b,0,0);rect(ar,24,-14,8,22,GREEN,2);poly(ar,[[17,6],[39,6],[28,22]],GREEN);return {g:b,ar};}
function iBars(g,cx,cy,k=1){const b=item(g,'經濟效益・長條上升',cx,cy);b.scale.setScalar(k);[[-27,8,14,26],[-8,-6,14,40],[11,-22,14,56]].forEach(([x,y,w,h])=>rect(b,x,y,w,h,GREEN,2));rect(b,-34,34,70,4,SOFT,2);line(b,[[-30,-8],[-8,-24],[6,-16],[24,-38]],GOLD,4);poly(b,[[14,-42],[36,-44],[30,-24]],GOLD);return b;}
function iTarget(g,cx,cy,k=1){const t=item(g,'重點・靶心',cx,cy);t.scale.setScalar(k);ring(t,0,0,30,5,SOFT);ring(t,0,0,19,5,GOLD);disk(t,0,0,8,GOLD);line(t,[[6,-6],[34,-34]],WHITE,4);return t;}
function iClock(g,cx,cy,k=1){const c=item(g,'現在・時鐘',cx,cy);c.scale.setScalar(k);ring(c,0,0,28,5,SOFT);const h=group(c);rect(h,-2.5,-22,5,24,GOLD,2);const m=group(c);rect(m,-2,-16,4,18,WHITE,2);disk(c,0,0,4,GOLD);return {g:c,hand:h,min:m};}
function iFactory(g,cx,cy,k=1,loops){const f=item(g,'智慧工廠',cx,cy);f.scale.setScalar(k);
 rect(f,-84,-10,168,92,PALE,6);for(let i=0;i<3;i++)poly(f,[[-84+i*56,-10],[-84+i*56,-50],[-84+(i+1)*56,-10]],PALE);
 rect(f,48,-88,28,80,STEEL,3);rect(f,43,-94,38,10,'#5d7993',3);
 for(let j=0;j<2;j++)for(let i=0;i<4;i++)rect(f,-70+i*32,10+j*28,22,16,'#2a7f93',2);rect(f,38,40,34,42,'#2a7f93',3);
 const sg=gear(f,-52,-34,15,GREEN);sg.scale.setScalar(1);
 const puffs=[0,1,2].map(()=>disk(f,0,0,10,'#b7cdd6'));
 if(loops)loops.push(t=>{puffs.forEach((m,i)=>{const p=(t*.32+i/3)%1;m.position.set(62+p*20,-100-p*68,0);m.scale.setScalar(.7+p*1.1);m.material.opacity*=(1-p)*.85;});sg.rotation.z=t*.9;});return f;}

// ================= 0 – 52.8528 s =================
{
const o=build(PARTS[0]);
const L=70,RX=1630,ROW=i=>570+i*138;
// ---------- title block (top-left) ----------
let g=item(o.g,'歡迎來到');text(g,'歡迎來到',L,118,44,MINT,{align:'left',weight:400});sync(o,g,1.26,'歡迎各位來到',{until:END});
g=item(o.g,'課程名稱');bold(g,'綠色製造',L,205,76,WHITE,{align:'left'});bold(g,'與智慧工廠',L,291,76,WHITE,{align:'left'});rect(g,L+6,342,150,8,C.teal,4);text(g,'Green Manufacturing',L,398,40,SOFT,{align:'left',weight:400});text(g,'and Smart Factory',L,446,40,SOFT,{align:'left',weight:400});sync(o,g,3.26,'綠色製造與智慧工廠',{lead:.25,until:END});
// ---------- right: 綠色製造 life-cycle ring (5.77/6.23 – 22.75) ----------
{const cx=1640,cy=470,R=115,r=38,ang=i=>-Math.PI/2+i*Math.PI/2,P=i=>[cx+R*Math.cos(ang(i)),cy+R*Math.sin(ang(i))],UNTIL=22.75;
 g=item(o.g,'綠色製造');ring(g,cx,cy,R+3,6,DK2);bold(g,'綠色\n製造',cx,cy,52,MINT);sync(o,g,6.23,'綠色製造是指',{until:UNTIL});
 const seg=(grp,i,col=MINT)=>{const a0=ang(i)+.40,a1=ang(i+1)-.55;arc(grp,cx,cy,R-3,R+3,a0,a1,col);const e=a1+.17;poly(grp,[[(R+12)*Math.cos(a1),(R+12)*Math.sin(a1)],[(R-12)*Math.cos(a1),(R-12)*Math.sin(a1)],[R*Math.cos(e),R*Math.sin(e)]].map(([x,y])=>[cx+x,cy+y]),col);};
 const stages=[['設計',iPencil,7.86,'產品的設計',0,[0,-1]],['生產',null,8.70,'生產',1,[1,0]],['包裝',iBox,9.78,'包裝',2,[0,1]],['回收',iRecycle,10.64,'到回收',3,[-1,0]]];
 stages.forEach(([s,ic,sp,ph,i,[dx,dy]])=>{const q=item(o.g,'生命週期：'+s),[x,y]=P(i);if(i>0)seg(q,i-1);disc(q,x,y,r,MINT);
  if(s==='生產'){const gg=gear(q,x,y,22,MINT);o.loops.push(t=>gg.rotation.z=t*C_SPEED);}else if(s==='回收'){const rc=ic(q,x,y,.78);o.loops.push(t=>rc.spin.rotation.z=t*.5);}else ic(q,x,y,.9);
  const lx=dx===0?x:dx>0?x+r+12+46:x-r-12-46,ly=dy===0?y:dy>0?y+r+36:y-r-36;text(q,s,lx,ly,44,WHITE,{weight:400});sync(o,q,sp,ph,{until:UNTIL});});
 g=item(o.g,'完整生命週期');seg(g,3);text(g,'完整生命週期',cx,cy+R+r+120,44,SOFT,{weight:400});const dot=disk(g,cx,cy-R,9,GOLD);o.loops.push(t=>{const a=-Math.PI/2+t*.9;dot.position.set(cx+R*Math.cos(a),cy+R*Math.sin(a),0);});sync(o,g,11.54,'完整生命週期',{until:UNTIL});
 g=item(o.g,'永續製造模式');{const w=Math.round(est('永續製造模式',46)+60),x=cx-w/2,y=cy+R+r+190;rect(g,x,y,w,72,'#12483f',16);rect(g,x,y+14,8,44,GREEN,4);bold(g,'永續製造模式',cx+4,y+36,46,GREEN);}sync(o,g,20.52,'永續的製造模式',{until:UNTIL});}
// ---------- left: effects of 綠色製造 (13.73 – 22.75) ----------
{const UNTIL=22.75,row=(i,sp,ph,icon,label,col)=>{const g=item(o.g,'列：'+label),yc=ROW(i);disc(g,112,yc,46,col);const ic=icon(g,112,yc,.85);bold(g,label,190,yc,48,WHITE,{align:'left'});sync(o,g,sp,ph,{until:UNTIL});return ic;};
 row(0,13.73,'極小化對環境的影響',(g,x,y,k)=>{const l=leaf2(g,x,y,k*.62);o.loops.push(t=>l.rotation.z=.08*Math.sin(t*1.3));return l;},'極小化環境影響',GREEN);
 const cl=row(1,16.46,'減少碳排',iCloud,'減少碳排',SOFT);o.loops.push(t=>cl.ar.position.y=4*Math.sin(t*2.4));
 const bo=row(2,17.92,'降低能耗',iBolt,'降低能耗',GOLD);o.loops.push(t=>bo.ar.position.y=4*Math.sin(t*2.4+1));
 row(3,19.20,'兼顧經濟效益',iBars,'兼顧經濟效益',GREEN);}
// ---------- right: 好幾門課程 (23.06 – 25.95) ----------
g=item(o.g,'好幾門課程');iBooks(g,RX,470,2.2);bold(g,'好幾門課程',RX,640,52,WHITE);sync(o,g,23.06,'好幾門課程',{until:25.95});
g=item(o.g,'可以討論的主題');text(g,'可以討論的主題',RX,708,44,SOFT,{weight:400});sync(o,g,24.30,'可以討論的主題',{until:25.95});
// ---------- left: 今天的重點 (26.10 – END) ----------
{const row=(i,sp,ph,icon,label,col)=>{const g=item(o.g,'列：'+label),yc=ROW(i);disc(g,112,yc,46,col);const ic=icon(g,112,yc,.85);bold(g,label,190,yc,48,WHITE,{align:'left'});sync(o,g,sp,ph,{until:END});return ic;};
 row(0,26.10,'但今天我們將',iTarget,'今天的重點',GOLD);
 const gg=row(1,27.66,'針對生產的面向',(g,x,y,k)=>{const q=gear(g,x,y,26,MINT);o.loops.push(t=>q.rotation.z=t*.8);return q;},'生產面向',MINT);
 row(2,29.10,'也就是製造端',(g,x,y,k)=>iFactory(g,x,y+4,.28,o.loops),'製造端',MINT);
 const ck=row(3,31.40,'現在',iClock,'現在',GOLD);o.loops.push(t=>{ck.hand.rotation.z=t*.5;ck.min.rotation.z=t*3;});
 g=item(o.g,'→ 未來');{const x0=190+est('現在',48)+24;arrow2(g,x0,ROW(3),GOLD,64);bold(g,'未來',x0+84,ROW(3),48,WHITE,{align:'left'});}sync(o,g,32.72,'亦或是未來',{until:END});}
// ---------- right: factory supports green manufacturing (27.66 – END) ----------
g=item(o.g,'智慧工廠');iFactory(g,RX,430,1.5,o.loops);sync(o,g,27.66,'針對生產的面向',{until:END});
g=item(o.g,'工廠');bold(g,'工廠',RX,590,52,WHITE);sync(o,g,33.98,'工廠如何支援',{until:END});
g=item(o.g,'支援');{rect(g,RX-4,634,8,64,GREEN,3);poly(g,[[RX-20,694],[RX+20,694],[RX,732]],GREEN);}sync(o,g,34.90,'支援',{until:END,lead:.15});
g=item(o.g,'綠色製造徽章');disc(g,RX,830,82,GREEN);leaf2(g,RX,830,1.08);bold(g,'綠色製造',RX,962,52,GREEN);sync(o,g,35.74,'綠色製造',{until:END});
}
function arrow2(g,x,y,c=MINT,w=80){rect(g,x,y-4,w-16,8,c,3);poly(g,[[x+w-26,y-16],[x+w,y],[x+w-26,y+16]],c);}
const C_SPEED=.9;
const backBig=x=>{x=clamp(x);return 1+3.2*(x-1)**3+2.2*(x-1)**2;};
export function posePage(t){
 const p=clips.find(p=>t>=p.start*DT&&t<p.end*DT)||clips.at(-1);
 for(const o of clips)o.g.visible=o===p;
 const local=t-p.start*DT;
 for(const s of p.steps){show(s.g,local,s.start,s.d||.5);if(s.fn)s.fn(local);}
 p.loops.forEach(fn=>fn(local));
 // Items that the narration moves on from leave with a short fade (ends exactly at `until`).
 for(const s of p.steps){if(s.until===undefined)continue;if(local>=s.until)s.g.visible=false;else if(local>s.until-.25&&s.g.visible){const f=clamp((s.until-local)/.25);s.g.traverse(m=>{if(m.material)m.material.opacity*=f;});}}
 return {part:p.id,local,mode:p.mode};
}
export function textAudit(){const out=[];for(const o of clips)o.g.traverse(m=>{if(m.userData&&m.userData.text!==undefined&&m.userData.editableId)out.push({part:o.id,id:m.userData.editableId,text:m.userData.text,size:m.userData.fontSize,weight:m.userData.weight,color:m.userData.tcolor});});return out;}
