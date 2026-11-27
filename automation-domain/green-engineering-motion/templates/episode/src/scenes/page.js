// Native Three.js vector artwork; shared stage/editor copied from page 006.
import {T,root,group,rect as rr,poly as pp,disk as dd,line as ll,text as tt,E,opacity,clamp,prog,ease,ring as rg,arc as aa} from '../engine/stage.js';
import {COLORS as C,PARTS,DT,DURATION} from '../config.js';
let uid=0;const animated=[],clips=[];const RED='#dc6555',STEEL='#7f9ab5',PALE='#f0f6f8';
const reg=(o,name='形狀')=>E(o,`shape-ep2-${++uid}`,name,{center:false});
const rect=(...a)=>reg(rr(...a)),poly=(...a)=>reg(pp(...a)),disk=(...a)=>reg(dd(...a)),line=(...a)=>reg(ll(...a)),ring=(...a)=>reg(rg(...a)),arc=(...a)=>reg(aa(...a));
const text=(g,s,x,y,size=40,c=C.navy,opt={})=>tt(g,s,x+(++uid)*.00001,y,size,c,opt);
function item(g,name,x=0,y=0){const m=E(group(g,x,y),`icon-ep2-${++uid}`,name,{center:false});m.userData.nm=name;return m;}
function anim(g,start,fn){animated.push({g,start,fn});return g;}
const back=x=>{x=clamp(x);return 1+2.6*(x-1)**3+1.6*(x-1)**2;};
function show(g,t,s,d=.5,dy=25){const p=prog(t,s,d),b=g.userData.poseBase;g.visible=p>0;g.position.set(b.x,b.y+dy*(1-ease(p)),0);g.scale.set(b.sx*(.97+.03*back(p)),b.sy*(.97+.03*back(p)),1);opacity(g,ease(p));}
function build(p){const g=group(),o={...p,g,steps:[],loops:[]};clips.push(o);return o;}
function cue(o,g,start=0,fn){g.userData.poseBase={x:g.position.x,y:g.position.y,sx:g.scale.x,sy:g.scale.y};o.steps.push({g,start,fn});return g;}
function title(o,s,kicker='智能診斷與量測技術導論'){
 let g=item(o.g,'標題');text(g,s,60,94,60,C.blue,{align:'left',weight:700});rect(g,60,158,1180,3,C.line);rect(g,60,155,135,8,C.teal);cue(o,g,.08);
 if(kicker){g=item(o.g,'段落導言');text(g,kicker,60,222,40,C.navy,{align:'left'});cue(o,g,.55);}return g;
}
function card(o,x,y,w,h,label,sub,color=C.teal,start=0){const g=item(o.g,label);rect(g,x,y,w,h,color,18);rect(g,x+3,y+3,w-6,h-6,color===C.blue?C.ice:color===C.amber?'#fbf0dc':C.pale,15);text(g,label,x+28,y+43,46,color,{align:'left',weight:700});if(sub)text(g,sub,x+28,y+108,40,C.navy,{align:'left',width:Math.min(w-56,820)});cue(o,g,start);return g;}
function arrow(g,x,y,c=C.teal,w=95){rect(g,x,y-4,w-16,8,c,3);poly(g,[[x+w-25,y-15],[x+w,y],[x+w-25,y+15]],c);}
function gear(parent,x,y,r=60,c=C.blue){const g=item(parent,'齒輪',x,y);for(let i=0;i<12;i++){const a=i*Math.PI/6,m=rect(g,-r*.14,-r*.18,r*.28,r*.36,c,3);m.rotation.z=a;m.position.set(Math.sin(a)*(r-3),-Math.cos(a)*(r-3),0);}disk(g,0,0,r,c);disk(g,0,0,r*.65,'#dce8f3');ring(g,0,0,r*.42,6,c);disk(g,0,0,r*.18,C.white);return g;}
function motor(parent,x,y,s=1){const g=item(parent,'馬達與轉軸',x,y);g.scale.setScalar(s);rect(g,-105,32,180,20,C.navy,5);rect(g,-85,-53,150,96,STEEL,16);rect(g,-80,-47,140,84,'#c1d6e3',12);for(let i=0;i<7;i++)rect(g,-69+i*17,-39,7,68,C.blue,2);disk(g,65,-5,43,C.blue);disk(g,65,-5,31,'#dce8f3');rect(g,65,-14,76,18,STEEL,4);rect(g,-42,-73,65,23,C.blue,5);const rot=gear(g,137,-5,21,C.teal);return {g,rot};}
function warning(g,x,y,s=1){const a=item(g,'異常警示',x,y);a.scale.setScalar(s);poly(a,[[0,-58],[59,48],[-59,48]],RED);poly(a,[[0,-43],[44,39],[-44,39]],C.gold);rect(a,-5,-18,10,30,C.navy,3);disk(a,0,25,6,C.navy);return a;}
function leaf(g,x,y,s=1){const a=item(g,'綠色效率',x,y);a.scale.setScalar(s);poly(a,[[0,45],[-42,9],[-38,-30],[13,-54],[52,-58],[47,-9],[18,26]],C.green);line(a,[[-15,28],[28,-32]],C.white,5);return a;}
function sensor(parent,x,y,s=1){const g=item(parent,'感測器',x,y);g.scale.setScalar(s);rect(g,-40,-44,80,88,C.navy,11);rect(g,-32,-36,64,72,C.ice,7);disk(g,0,-3,22,C.teal);ring(g,0,-3,13,4,C.white);for(let i=0;i<4;i++)rect(g,-26+i*17,45,7,19,STEEL,2);return g;}
function wave(parent,x,y,w,h,c=C.teal,noise=false){const g=item(parent,'訊號波形',x,y),segs=[];line(g,[[0,-h*.65],[0,h*.65],[w,h*.65]],C.line,3);for(let i=0;i<90;i++)segs.push(rect(g,0,0,1,4,c));const set=(t,amp=1)=>{for(let i=0;i<90;i++){let f=u=>Math.sin(u*6*Math.PI-t*2)*h*.35+(noise?Math.sin(u*39*Math.PI-t*4)*h*.18:0);let u=i/90,v=(i+1)/90,a=[u*w,f(u)*amp],b=[v*w,f(v)*amp],m=segs[i];m.position.set((a[0]+b[0])/2,(a[1]+b[1])/2,0);m.rotation.z=Math.atan2(b[1]-a[1],b[0]-a[0]);m.scale.x=Math.hypot(b[0]-a[0],b[1]-a[1]);}};set(0);return {g,set};}
function turbine(parent,x,y,s=1){const g=item(parent,'風力機系統',x,y);g.scale.setScalar(s);poly(g,[[-14,-5],[14,-5],[30,223],[-30,223]],STEEL);rect(g,-23,211,50,14,C.navy,4);rect(g,-27,-39,126,55,C.blue,10);const rotor=item(g,'風力機葉輪');for(let i=0;i<3;i++){const b=poly(rotor,[[0,-8],[10,-42],[14,-143],[0,-159],[-8,-53]],'#b5d8e5');b.rotation.z=i*Math.PI*2/3;}disk(rotor,0,0,18,C.teal);disk(rotor,0,0,8,C.white);return {g,rotor};}
function scooter(parent,x,y){const g=item(parent,'機車維護',x,y);[-85,85].forEach(a=>{disk(g,a,37,30,C.navy);disk(g,a,37,17,C.white);});line(g,[[-85,37],[-41,-20],[39,3],[85,37]],C.teal,15);rect(g,-47,-30,71,15,C.blue,6);line(g,[[85,37],[62,-55],[34,-55]],C.blue,10);return g;}
function network(parent,x,y){const g=item(parent,'診斷模型',x,y);const pts=[[-80,-55],[-80,0],[-80,55],[0,-35],[0,35],[80,0]];[[0,3],[0,4],[1,3],[1,4],[2,3],[2,4],[3,5],[4,5]].forEach(([a,b])=>line(g,[pts[a],pts[b]],C.trackBlue,5));pts.forEach((p,i)=>disk(g,...p,i===5?20:15,i===5?C.blue:C.teal));return g;}
function spectrum(parent,x,y,w,large=true){const g=item(parent,'平衡前後頻譜示意',x,y);line(g,[[0,-180],[0,0],[w,0]],C.line,3);const peaks=[.10,.51,.60,.68],heights=[large?165:34,60,90,54];let pts=[];for(let i=0;i<=220;i++){const u=i/220;let v=3+Math.sin(i*3.2)*1.5;peaks.forEach((p,k)=>v+=heights[k]*Math.exp(-(((u-p)/.006)**2)));pts.push([u*w,-v]);}line(g,pts,large?RED:C.blue,3);return g;}
uid=67; // 01 was rebuilt (ids now 80001+); 02 keeps the ids it always had (icon-ep2-68 …)
// 02 — Full-frame title in the first music bed.
{
const o=build(PARTS[1]);let g=item(o.g,'第二集標題');rect(g,216,548,150,8,C.teal,4);text(g,'機器設備智能診斷系統',210,324,44,'#75d6c4',{align:'left',weight:400});text(g,'智能診斷與',210,411,76,C.white,{align:'left',weight:700});text(g,'量測技術導論',210,497,76,C.white,{align:'left',weight:700});text(g,'授課教師　○○○ 教授',210,750,40,'#c9e4e9',{align:'left',weight:400});cue(o,g,.3);const a=gear(o.g,1530,490,128,C.teal),b=sensor(o.g,1515,490,1.55);cue(o,a,1);cue(o,b,1.3);o.loops.push(t=>a.rotation.z=t*.16);
uid=85000;text(g,'Intelligent Diagnostics and',210,604,40,'#c9e4e9',{align:'left',weight:400});text(g,'Measurement Technology',210,652,40,'#c9e4e9',{align:'left',weight:400});
}
// ---- Episode-1 density helpers (slides: 簡報靜態/pdf v3 page 9-17) ----
const SUB='#3f5a76',TINT={[C.teal]:C.pale,[C.blue]:C.ice,[C.green]:'#e4f5ec',[C.amber]:'#fbf0dc',[RED]:'#fbe8e4'};
const bold=(g,s,x,y,size,c,o={})=>text(g,s,x,y,size,c,{weight:700,...o});
function wave2(parent,x,y,w,h,c=C.teal,opt={}){const g=item(parent,'訊號波形',x,y),segs=[],{f=6,nf=39,na=.18,noise=false}=opt;line(g,[[0,-h*.7],[0,h*.7],[w,h*.7]],C.line,3);const N=110;for(let i=0;i<N;i++)segs.push(rr(g,0,0,1,5,c));
 const set=(t,amp=1)=>{const F=u=>(Math.sin(u*f*Math.PI-t*2)*h*.4+(noise?Math.sin(u*nf*Math.PI-t*4)*h*na*2:0))*amp;for(let i=0;i<N;i++){const u=i/N,v=(i+1)/N,a=[u*w,F(u)],b=[v*w,F(v)],m=segs[i];m.position.set((a[0]+b[0])/2,(a[1]+b[1])/2,0);m.rotation.z=Math.atan2(b[1]-a[1],b[0]-a[0]);m.scale.x=Math.hypot(b[0]-a[0],b[1]-a[1]);}};set(0);return {g,set};}
function spectrum2(parent,x,y,w,large,hs){const g=item(parent,'平衡前後頻譜示意',x,y);line(g,[[0,-190*hs],[0,0],[w,0]],C.line,3);const peaks=[.10,.51,.60,.68],hh=[large?165:34,60,90,54];let pts=[];for(let i=0;i<=240;i++){const u=i/240;let v=3+Math.sin(i*3.2)*1.5;peaks.forEach((p,k)=>v+=hh[k]*Math.exp(-(((u-p)/.007)**2)));pts.push([u*w,-v*hs]);}line(g,pts,large?RED:C.blue,4);return g;}
function bearing(parent,x,y,s=1){const g=item(parent,'軸承',x,y);g.scale.setScalar(s);disk(g,0,0,80,C.navy);disk(g,0,0,64,'#dce8f3');const rot=item(g,'軸承滾珠');for(let i=0;i<8;i++){const a=i*Math.PI/4,px=Math.cos(a)*48,py=Math.sin(a)*48;disk(rot,px,py,13,STEEL);disk(rot,px,py,6,C.white);}disk(g,0,0,34,C.blue);disk(g,0,0,17,C.white);return {g,rot};}
function carWall(parent,x,y,s=1){const g=item(parent,'移動測距',x,y);g.scale.setScalar(s);rect(g,-110,-35,205,70,C.blue,18);rect(g,-62,-72,100,42,C.blue,10);rect(g,-52,-64,38,26,C.ice,5);rect(g,-6,-64,38,26,C.ice,5);[-62,55].forEach(a=>{disk(g,a,40,26,C.navy);disk(g,a,40,13,C.white);});disk(g,98,0,9,C.teal);arc(g,98,0,32,40,-.7,.7,C.teal);arc(g,98,0,58,66,-.7,.7,C.teal);rect(g,175,-80,18,160,STEEL,3);return g;}
const dashH=(p,x0,x1,y,c,w=4,d=28,gap=16,name='虛線')=>{const grp=item(p,name,0,0);for(let x=x0;x<x1;x+=d+gap)rr(grp,x,y-w/2,Math.min(d,x1-x),w,c);return grp;};
function iconIn(o,g,kind,cx,cy,r,col=C.teal){const k=r/70;disk(g,cx,cy,r,col);disk(g,cx,cy,r-5,C.white);
 if(kind==='motor'){const m=motor(g,cx-12*k,cy+4*k,.44*k);o.loops.push(t=>m.rot.rotation.z=t*.9);}
 else if(kind==='sensor')sensor(g,cx,cy-9*k,1.05*k);
 else if(kind==='wave'){const w=wave2(g,cx-50*k,cy,100*k,40*k,col);o.loops.push(t=>w.set(t));}
 else if(kind==='net')network(g,cx,cy).scale.setScalar(.72*k);
 else if(kind==='leaf')leaf(g,cx,cy,1.05*k);
 else if(kind==='gear'){const q=gear(g,cx,cy,52*k,col);o.loops.push(t=>q.rotation.z=t*.5);}
 else if(kind==='warn')warning(g,cx,cy+2*k,.72*k);
 else if(kind==='bearing'){const b=bearing(g,cx,cy,.78*k);o.loops.push(t=>b.rot.rotation.z=t*1.2);}
 else if(kind==='gs'){const q=gear(g,cx-18*k,cy+8*k,40*k,col);sensor(g,cx+22*k,cy-6*k,.62*k);o.loops.push(t=>q.rotation.z=t*.5);}}
function rowCard(o,p){const {x,y,w,h,title,sub,color=C.teal,start=0,num,icon}=p;const g=item(o.g,title);rect(g,x,y,w,h,TINT[color]||C.pale,18);rect(g,x,y+14,9,h-28,color,4);let tx=x+42;
 if(num){disk(g,x+90,y+h/2,Math.min(38,h*.24),C.teal);text(g,String(num),x+90,y+h/2,44,C.white,{weight:700});tx=x+165;}
 bold(g,title,tx,y+h*.34,52,C.navy,{align:'left'});if(sub)text(g,sub,tx,y+h*.74,42,SUB,{align:'left'});if(icon)icon(g,x+w-100,y+h/2,Math.min(88,h/2-12));cue(o,g,start);return g;}
function agenda(o,active,wind=false,start=.55){const g=item(o.g,'診斷需要知道清單');const L=['運轉原理','量測技術','訊號的物理意義'].concat(wind?['如風力機系統']:[]);let x=60;
 L.forEach((s,i)=>{const w=44+s.length*42+16,act=i===active||i===3;if(i===active)rect(g,x-8,190,w,64,C.ice,12);rect(g,x+8,214,18,18,act?C.blue:C.navy);text(g,s,x+34,222,42,act?C.blue:C.navy,{align:'left',weight:act?700:600});x+=w+(i===2?18:10);});cue(o,g,start);return g;}
function cloud(parent,cx,cy,w,h){const g=item(parent,'思考雲',0,0),hw=w/2-62,hh=h/2-62,pts=[],nx=7,ny=3;for(let i=0;i<=nx;i++){const x=-hw+2*hw*i/nx;pts.push([x,-hh],[x,hh]);}for(let j=1;j<ny;j++){const y=-hh+2*hh*j/ny;pts.push([-hw,y],[hw,y]);}
 const tails=[[w/2-130,h/2+38,30],[w/2-82,h/2+86,19],[w/2-50,h/2+120,11]];
 [[68,5,C.blue],[62,0,'#f6fafc']].forEach(([R,tr,col])=>{pts.forEach(([px,py])=>dd(g,cx+px,cy+py,R,col));rr(g,cx-hw,cy-hh-R,2*hw,2*hh+2*R,col);rr(g,cx-hw-R,cy-hh,2*hw+2*R,2*hh,col);tails.forEach(([tx,ty,r])=>dd(g,cx+tx,cy+ty,r+tr,col));});
 return g;}
const ORG='#e07a2f';


// ================= Round 2: ep0-style layout, narration-synced cues (parts 03, 04, 06-10) =================
// Every entrance below is `sync(o,group,spokenSeconds,phrase)`: absolute ep1.mp4 time of the key word (review/alignment.json); the
// entrance starts `lead` (default 0.2 s) earlier and takes 0.5 s. All cues are logged in `cueLog` (-> review/cue-sync.md).
export const cueLog=[];
const est=(s,size)=>[...String(s)].reduce((a,c)=>a+(c.charCodeAt(0)<256?size*.58:size),0);
function sync(o,g,spoken,phrase,opt={}){const {lead=.2,until,d}=opt,base=o.start*DT,rel=Math.max(0,spoken-lead-base);cue(o,g,rel);const st=o.steps.at(-1);if(d)st.d=d;if(until!==undefined)st.until=until-base;
 cueLog.push({part:o.id,id:g.userData.editableId,name:g.userData.nm||'',phrase,spoken,spokenRel:spoken-base,cue:rel,cueAbs:rel+base,until:until===undefined?null:until});return g;}
const title2=(o,s,spoken,phrase,lead=.25)=>{const g=item(o.g,'標題');text(g,s,60,94,60,C.blue,{align:'left',weight:700});rect(g,60,158,1180,3,C.line);rect(g,60,155,135,8,C.teal);return sync(o,g,spoken,phrase,{lead});};
const kicker2=(o,s,spoken,phrase,until)=>{const g=item(o.g,'導言');text(g,s,60,222,42,C.navy,{align:'left',weight:400});return sync(o,g,spoken,phrase,{until});};
function chip(g,x,y,w,h,label,color,size=42,fill,weight=400){rect(g,x,y,w,h,fill||TINT[color]||C.pale,16);rect(g,x,y+14,8,h-28,color,4);bold(g,label,x+w/2+4,y+h/2,size,color,{weight});}
function chain(o,y,items,{h=84,x0=60,gap=70,size=42}={}){let x=x0;items.forEach((it,i)=>{const g=item(o.g,it.s),w=Math.round(est(it.s,size)+56);if(i&&it.arrow!==false)arrow(g,x-gap+2,y+h/2,it.color||C.teal,gap-8);chip(g,x,y,w,h,it.s,it.color,size,undefined,it.w||400);sync(o,g,it.spoken,it.phrase,{until:it.until});x+=w+gap;});return x;}
function emph(o,label,spoken,phrase,until){const g=item(o.g,label),w=Math.round(est(label,40)+56);chip(g,1240-w,288,w,62,label,C.amber,40,undefined,700);return sync(o,g,spoken,phrase,{until});}
function agenda2(o,items,spans){let x=60;const pos=items.map(it=>{const w=44+est(it.s,42)-0+16,r={x,w};x+=w+14;return r;});
 spans.forEach(sp=>{const g=item(o.g,'目前項目：'+items[sp.i].s),{x,w}=pos[sp.i];rect(g,x-8,190,w,64,C.ice,12);rect(g,x-8,196,6,52,C.blue,3);sync(o,g,sp.from,'(目前項目 '+items[sp.i].s+')',{lead:.1,until:sp.to});});
 items.forEach((it,i)=>{const g=item(o.g,'清單：'+it.s);rect(g,pos[i].x+8,214,18,18,C.navy);text(g,it.s,pos[i].x+34,222,42,C.navy,{align:'left',weight:400});sync(o,g,it.spoken,it.phrase);});}
// ---- recognisable, centred icons ----
function sensor2(parent,x,y,s=1){const g=item(parent,'感測器',x,y);g.scale.setScalar(s);rect(g,-42,-54,84,84,C.navy,12);rect(g,-34,-46,68,68,C.ice,8);disk(g,0,-12,26,C.teal);disk(g,0,-12,17,C.white);disk(g,0,-12,7,C.teal);for(let i=0;i<4;i++)rect(g,-31.5+i*21-3.5,30,7,22,STEEL,2);return g;}
function motorC(parent,x,y,s=1){const w=item(parent,'馬達與轉軸',x,y),m=motor(w,-28*s,10*s,s);return {g:w,rot:m.rot};}
function toothGear(parent,x,y,rp,N,phase,col){const g=group(parent,x,y),tw=Math.PI*rp/N;for(let k=0;k<N;k++){const t=group(g);t.rotation.z=phase+k*2*Math.PI/N;poly(t,[[rp-9,-tw*.5-1],[rp-9,tw*.5+1],[rp+8,tw*.3],[rp+8,-tw*.3]],col);}disk(g,0,0,rp-4,col);disk(g,0,0,rp*.62,'#dce8f3');disk(g,0,0,rp*.3,col);disk(g,0,0,rp*.13,C.white);return g;}
function gearbox2(parent,x,y,s=1){const g=item(parent,'齒輪箱',x,y);g.scale.setScalar(s);
 rect(g,-195,-12,60,24,STEEL,6);rect(g,135,-12,70,24,STEEL,6);rect(g,-145,-102,290,204,C.navy,28);rect(g,-138,-95,276,190,'#e6eff6',23);
 const a=toothGear(g,-42,0,70,14,0,C.blue),b=toothGear(g,73,0,45,9,Math.PI+Math.PI/9,C.teal);return {g,a,b};}
function generator2(parent,x,y,s=1){const g=item(parent,'發電機',x,y);g.scale.setScalar(s);const w=group(g,9,-5);
 rect(w,-100,48,200,16,C.navy,5);rect(w,-158,-11,52,22,STEEL,5);rect(w,-110,-56,200,104,STEEL,18);rect(w,-104,-50,188,92,'#c1d6e3',14);for(let i=0;i<7;i++)rect(w,-88+i*24,-42,9,76,C.blue,3);
 disk(w,90,-4,54,C.blue);disk(w,90,-4,43,'#dce8f3');poly(w,[[100,-30],[74,-1],[88,-1],[80,26],[108,-8],[93,-8]],C.amber);return {g};}
function turbine2(parent,x,y,s=1){const g=item(parent,'風力發電機',x,y);g.scale.setScalar(s);
 rect(g,-150,364,360,6,C.line);poly(g,[[40,26],[60,26],[74,364],[26,364]],'#b4c6d6');rect(g,10,358,80,12,C.navy,5);rect(g,-6,-24,116,52,C.blue,16);
 const rotor=group(g);for(let i=0;i<3;i++){const b=group(rotor);b.rotation.z=i*2*Math.PI/3;poly(b,[[-10,-16],[-19,-50],[-17,-100],[-10,-148],[-3,-168],[3,-168],[7,-146],[11,-100],[13,-50],[9,-16]],C.teal);}
 disk(rotor,0,0,25,C.navy);disk(rotor,0,0,11,C.white);return {g,rotor};}
function train2(parent,x,y,s=1){const g=item(parent,'列車',x,y);g.scale.setScalar(s);const w=group(g,-10,-14);
 rect(w,-170,66,360,6,STEEL,3);rect(w,-150,-45,262,90,C.blue,16);poly(w,[[100,-45],[150,-6],[162,45],[100,45]],C.blue);rect(w,114,-30,28,26,C.ice,5);for(let i=0;i<4;i++)rect(w,-132+i*55,-27,38,32,C.ice,5);rect(w,-150,17,262,9,C.teal);[-110,-40,30,100].forEach(a=>{disk(w,a,52,18,C.navy);disk(w,a,52,8,C.white);});return g;}
function leaf2(parent,x,y,s=1){const g=item(parent,'綠色效率',x,y);g.scale.setScalar(s);const a=-.62,c=Math.cos(a),n=Math.sin(a),R=(px,py)=>[px*c-py*n,px*n+py*c],up=[],lo=[];
 for(let i=0;i<=30;i++){const u=i/30,w=44*Math.sin(Math.PI*u)**.8*(1-.22*u);up.push(R(-52+104*u,-w));lo.push(R(-52+104*u,w));}
 poly(g,[...up,...lo.reverse()],C.green);line(g,[R(-56,0),R(40,0)],C.white,5);const W=u=>44*Math.sin(Math.PI*u)**.8*(1-.22*u);[-.3,0,.3].forEach(d=>{const u0=.5+d*.9,px=-52+104*u0,u1=Math.min(.92,u0+.17),w1=W(u1)*.62;line(g,[R(px,0),R(-52+104*u1,-w1)],C.white,4);line(g,[R(px,0),R(-52+104*u1,w1)],C.white,4);});line(g,[R(-52,0),R(-68,0)],C.green,7);return g;}
function thermo2(parent,x,y,s=1){const g=item(parent,'溫度',x,y);g.scale.setScalar(s);rect(g,-12,-60,24,100,C.navy,12);rect(g,-6,-54,12,92,C.white,6);disk(g,0,42,24,C.navy);disk(g,0,42,16,RED);rect(g,-4,-8,8,50,RED,3);return g;}
function carHit(parent,x,y,s=1){const g=item(parent,'倒車與牆',x,y);g.scale.setScalar(s);const car=group(g);
 rect(car,-110,-35,205,70,C.blue,18);rect(car,-62,-72,100,42,C.blue,10);rect(car,-52,-64,38,26,C.ice,5);rect(car,-6,-64,38,26,C.ice,5);[-62,55].forEach(a=>{disk(car,a,40,26,C.navy);disk(car,a,40,13,C.white);});
 sensor2(car,-12,-96,.42);rect(g,215,-100,22,200,STEEL,3);for(let i=0;i<5;i++)line(g,[[237,-80+i*40],[256,-62+i*40]],STEEL,4);return {g,car};}
function wave3(parent,x,y,w,h){const g=item(parent,'振動波形',x,y),segs=[],N=120;line(g,[[0,-h*.75],[0,h*.75],[w,h*.75]],C.line,3);for(let i=0;i<N;i++)segs.push(rr(g,0,0,1,6,C.teal));const c0=new T.Color(C.teal),c1=new T.Color(RED);
 const set=(t,amp,mix)=>{const col=c0.clone().lerp(c1,mix),F=u=>Math.sin(u*6*Math.PI-t*2)*h*.4*amp+Math.sin(u*39*Math.PI-t*4)*h*.2*mix;for(let i=0;i<N;i++){const u=i/N,v=(i+1)/N,a=[u*w,F(u)],b=[v*w,F(v)],m=segs[i];m.material.color.copy(col);m.position.set((a[0]+b[0])/2,(a[1]+b[1])/2,0);m.rotation.z=Math.atan2(b[1]-a[1],b[0]-a[0]);m.scale.x=Math.hypot(b[0]-a[0],b[1]-a[1]);}};set(0,.2,0);return {g,set};}
// icon on a soft disc footprint (shared size, shared centre)
function ico(o,g,kind,cx,cy,col,k=1){const r=128*k;disk(g,cx,cy,r,TINT[col]||C.pale);
 if(kind==='motor'){const m=motorC(g,cx,cy,.8*k);o.loops.push(t=>m.rot.rotation.z=t*.9);}
 else if(kind==='sensor')sensor2(g,cx,cy,1.65*k);
 else if(kind==='wave'){const w=wave2(g,cx-100*k,cy,200*k,66*k,col);o.loops.push(t=>w.set(t));}
 else if(kind==='net')network(g,cx,cy).scale.setScalar(1.15*k);
 else if(kind==='leaf')leaf2(g,cx+4*k,cy-2*k,1.7*k);
 else if(kind==='bearing'){const b=bearing(g,cx,cy,1.05*k);o.loops.push(t=>b.rot.rotation.z=t*1.2);}
 else if(kind==='warn')warning(g,cx,cy+2*k,1.55*k);
 else if(kind==='gs'){const m=motorC(g,cx-50*k,cy+8*k,.46*k);o.loops.push(t=>m.rot.rotation.z=t*.9);sensor2(g,cx+60*k,cy-2*k,.9*k);}
 else if(kind==='gear'){const q=gear(g,cx,cy,70*k,col);o.loops.push(t=>q.rotation.z=t*.5);}}
function bubble(o,name,{x0,y0,w,h,tipY,lines}){const tipX=1274,g=item(o.g,name,tipX,tipY);g.userData.pop=true;const L=x0-tipX,T0=y0-tipY,R=L+w,NV=C.navy,WH='#fbfdfe';
 rect(g,L,T0,w,h,NV,46);poly(g,[[R-8,-36],[0,0],[R-8,36]],NV);rect(g,L+6,T0+6,w-12,h-12,WH,40);poly(g,[[R-14,-27],[-15,0],[R-14,27]],WH);
 sync(o,g,lines[0].spoken,lines[0].phrase,{lead:.3,until:lines.until});
 lines.forEach((ln,i)=>{const lg=item(g,'對話泡泡文字 '+(i+1));let x=L+40;const y=T0+40+i*68+33;ln.segs.forEach(([s,c,w=700])=>{bold(lg,s,x,y,46,c,{align:'left',weight:w});x+=est(s,46);});sync(o,lg,ln.spoken,ln.phrase,{lead:.2});});
 o.loops.push(t=>{g.position.y+=5*Math.sin(t*1.4);});return g;}


// 01 — 0–43.2 s, teacher centred (x≈640–1320) on a dark film. Rebuilt in round 5 to match page-001-opening (ep0): top-left kicker + course title block,
// left column of icon rows (x 60–570), right column diagram (x 1360–1900), x=590..1340 stays empty. Palette/helpers ported from page-001-opening/src/scenes/page.js.
// Every entrance = sync(o,group,spokenSeconds,phrase); spoken = absolute ep1.mp4 time (review/alignment.json word times; sentence starts corrected by silence onsets).
// Ids: fixed base 80000 so nothing in parts 02–11 shifts (the old 01 used ids 1–65).
uid=80000;
{
const WHITE='#ffffff',MINT='#75d6c4',GOLD='#f4c66b',SOFT='#c9e4e9',GREEN='#5fd39a',DK='#0e3340',DK2='#14505a',STEEL0='#7f9ab5',PALE2='#d7e9ee',CORAL='#e9786a',ROSE='#e98686',TEAL2='#2a7f93';
const o=build(PARTS[0]);
const L=70,RX=1640,ROW=i=>570+i*138;
const polyAt=(pts,u)=>{const n=pts.length-1,f=Math.min(.9999,Math.max(0,u))*n,i=Math.floor(f),r=f-i,a=pts[i],b=pts[i+1];return [a[0]+(b[0]-a[0])*r,a[1]+(b[1]-a[1])*r];};
// ---- icons (centre cx,cy; nominal radius ~50 before k). Each pushes its own idle loop. ----
function disc(g,cx,cy,r,col=MINT){disk(g,cx,cy,r,col);disk(g,cx,cy,r-5,DK);}
function iMotor(g,cx,cy,k=1){const m=item(g,'馬達',cx,cy);m.scale.setScalar(k);const q=group(m,-18,0);rect(q,-40,26,84,8,STEEL0,3);rect(q,-36,-22,62,48,PALE2,8);for(let i=0;i<5;i++)rect(q,-27+i*12,-15,5,34,TEAL2,2);rect(q,-18,-32,28,11,TEAL2,3);disk(q,28,2,22,STEEL0);disk(q,28,2,14,PALE2);rect(q,44,-5,22,10,STEEL0,3);const rot=gear(q,70,0,12,MINT);o.loops.push(t=>{rot.rotation.z=t*1.6;});return {g:m,rot};}
function iWarn(g,cx,cy,k=1){const a=item(g,'異常警示',cx,cy);a.scale.setScalar(k);poly(a,[[0,-46],[48,38],[-48,38]],CORAL);poly(a,[[0,-31],[35,30],[-35,30]],GOLD);rect(a,-4.5,-12,9,24,DK,3);disk(a,0,22,5.5,DK);o.loops.push(t=>{const s=1+.05*Math.sin(t*5);a.children.forEach(c=>c.scale.setScalar(s));});return a;}
function iWorker(g,cx,cy,k=1){const w=item(g,'人員',cx,cy);w.scale.setScalar(k);rect(w,-28,8,56,34,SOFT,12);rect(w,-9,8,18,34,GOLD,4);disk(w,0,-12,15,'#f2d2b3');const h=[];for(let i=0;i<=16;i++){const a=Math.PI*i/16;h.push([Math.cos(a)*18,-14-Math.sin(a)*17]);}poly(w,h,GOLD);rect(w,-22,-16,44,5,GOLD,2);const bob=w.children.slice();o.loops.push(t=>{const d=2.5*Math.sin(t*2.2);bob.forEach(c=>c.position.y=d);});return w;}
function iBell(g,cx,cy,k=1){const b=item(g,'預警鈴',cx,cy);b.scale.setScalar(k);const sw=group(b,0,-34);const dome=[];for(let i=0;i<=16;i++){const a=Math.PI+Math.PI*i/16;dome.push([Math.cos(a)*24,34-6+Math.sin(a)*24]);}poly(sw,[...dome,[24,28],[32,54],[40,62],[-40,62],[-32,54],[-24,28]],GOLD);disk(sw,0,2,4.5,GOLD);disk(sw,0,70,7.5,GOLD);arc(b,0,-4,42,47,-.6,.6,GOLD);arc(b,0,-4,42,47,Math.PI-.6,Math.PI+.6,GOLD);o.loops.push(t=>{sw.rotation.z=.2*Math.sin(t*6);});return b;}
function iWrench(g,cx,cy,k=1){const w=item(g,'維修・扳手',cx,cy);w.scale.setScalar(k);w.rotation.z=.8;rect(w,-6,-8,12,58,SOFT,5);disk(w,0,-24,19,SOFT);rect(w,-7,-50,14,26,DK);o.loops.push(t=>{w.rotation.z=.8+.18*Math.sin(t*3);});return w;}
function iCheck(g,cx,cy,k=1){const c=item(g,'修好・勾選',cx,cy);c.scale.setScalar(k);disk(c,0,0,32,GREEN);line(c,[[-15,2],[-4,14],[17,-12]],WHITE,8);o.loops.push(t=>{c.scale.setScalar(k*(1+.04*Math.sin(t*3)));});return c;}
function iHourglass(g,cx,cy,k=1){const h=item(g,'慢慢變舊・沙漏',cx,cy);h.scale.setScalar(k);rect(h,-26,-42,52,7,GOLD,3);rect(h,-26,35,52,7,GOLD,3);poly(h,[[-21,-35],[21,-35],[3,0],[21,35],[-21,35],[-3,0]],SOFT);poly(h,[[-15,-30],[15,-30],[0,-5]],GOLD);poly(h,[[-17,35],[17,35],[0,16]],GOLD);const d=disk(h,0,0,2.5,GOLD);o.loops.push(t=>{d.position.y=-4+((t*.8)%1)*38;});return h;}
function iGauge(g,cx,cy,k=1,rev=false,fn=()=>.5){const q=item(g,rev?'效率錶':'耗油錶',cx,cy);q.scale.setScalar(k);const cols=rev?[CORAL,GOLD,GREEN]:[GREEN,GOLD,CORAL],T=Math.PI/3;cols.forEach((c,i)=>arc(q,0,14,34,46,Math.PI+i*T+.03,Math.PI+(i+1)*T-.03,c));const n=group(q,0,14);rect(n,-2.5,-40,5,40,WHITE,2);disk(n,0,0,7,WHITE);rect(q,-42,24,84,5,SOFT,2);o.loops.push(t=>{n.rotation.z=(fn(t)-.5)*Math.PI*.92;});return q;}
function iDrop(g,cx,cy,k=1){const d=item(g,'耗油・油滴',cx,cy);d.scale.setScalar(k);const p=[[0,-42]];for(let i=0;i<=24;i++){const a=-Math.PI/5+(Math.PI*1.4)*i/24;p.push([Math.cos(a)*26,12+Math.sin(a)*26]);}poly(d,p,GOLD);disk(d,-9,16,6,'#fbe6b0');const ar=group(d,0,0);rect(ar,23,-6,8,24,ROSE,2);poly(ar,[[16,-4],[38,-4],[27,-24]],ROSE);o.loops.push(t=>{ar.position.y=-4*Math.abs(Math.sin(t*2.4));});return d;}
function iStar(g,cx,cy,k=1){const s=item(g,'非常重要・星',cx,cy);s.scale.setScalar(k);const p=[];for(let i=0;i<10;i++){const r=i%2?15:38,a=-Math.PI/2+i*Math.PI/5;p.push([Math.cos(a)*r,Math.sin(a)*r+2]);}poly(s,p,GOLD);o.loops.push(t=>{s.rotation.z=.12*Math.sin(t*2);s.scale.setScalar(k*(1+.05*Math.sin(t*4)));});return s;}
function iShield(g,cx,cy,k=1){const s=item(g,'提前預警・盾牌',cx,cy);s.scale.setScalar(k);poly(s,[[0,-42],[36,-30],[36,4],[0,44],[-36,4],[-36,-30]],GREEN);line(s,[[-15,0],[-3,13],[17,-13]],WHITE,7);o.loops.push(t=>{s.scale.setScalar(k*(1+.04*Math.sin(t*3)));});return s;}
function iScooter(g,cx,cy,k=1,fresh=false){const s=item(g,fresh?'維護後的摩托車':'摩托車',cx,cy);s.scale.setScalar(k);const body=group(s);rect(body,-40,12,72,10,MINT,4);poly(body,[[-64,-6],[-22,-14],[-14,14],[-60,14]],MINT);rect(body,-62,-22,50,10,GOLD,5);poly(body,[[24,14],[32,-34],[44,-34],[52,14]],MINT);line(body,[[34,-34],[28,-46],[50,-50]],SOFT,5);disk(body,52,-32,6,GOLD);line(body,[[40,-8],[54,36]],SOFT,5);line(body,[[-56,16],[-52,36]],SOFT,5);
 const wh=[-54,56].map(x=>{const w=group(s,x,36);ring(w,0,0,20,6,SOFT);const sp=group(w);rect(sp,-1.5,-16,3,32,SOFT);const sp2=group(w);sp2.rotation.z=Math.PI/2;rect(sp2,-1.5,-16,3,32,SOFT);disk(w,0,0,6,GOLD);return w;});
 o.loops.push(t=>{wh.forEach(w=>w.rotation.z=t*3.2);body.position.y=1.5*Math.sin(t*5);});
 if(fresh)[[-82,-48,1],[80,-62,.7],[8,-70,.8]].forEach(([x,y,sc],i)=>{const st=group(s,x,y);poly(st,[[0,-14],[3,-3],[14,0],[3,3],[0,14],[-3,3],[-14,0],[-3,-3]],GOLD);o.loops.push(t=>{const f=.6+.4*Math.sin(t*4+i*2);st.scale.setScalar(sc*f);st.rotation.z=t*.6;});});return s;}
function iMonitor(g,cx,cy,k=1){const m=item(g,'預警系統・監測螢幕',cx,cy);m.scale.setScalar(k);rect(m,-52,-40,104,72,PALE2,9);rect(m,-45,-33,90,58,DK2,5);rect(m,-6,32,12,12,STEEL0);rect(m,-24,44,48,6,STEEL0,3);const pts=[[-38,-4],[-20,-4],[-11,-22],[0,16],[10,-12],[19,-4],[38,-4]];line(m,pts,GREEN,4.5);const dot=disk(m,0,0,5.5,WHITE);o.loops.push(t=>{const p=polyAt(pts,(t*.5)%1);dot.position.set(p[0],p[1],0);});return m;}
function iRecycleGear(g,cx,cy,k=1){const s=item(g,'更換零件',cx,cy);s.scale.setScalar(k);const sp=group(s);for(let i=0;i<3;i++){const a0=i*2*Math.PI/3+.3,a1=a0+1.5,R=33;arc(sp,0,0,R-4.5,R+4.5,a0,a1,GREEN);poly(sp,[[Math.cos(a1)*(R+14),Math.sin(a1)*(R+14)],[Math.cos(a1)*(R-14),Math.sin(a1)*(R-14)],[Math.cos(a1)*R-Math.sin(a1)*20,Math.sin(a1)*R+Math.cos(a1)*20]],GREEN);}const q=gear(s,0,0,15,MINT);o.loops.push(t=>{sp.rotation.z=t*.5;q.rotation.z=-t*.9;});return s;}
function iLeaf(g,cx,cy,k=1){const g2=item(g,'環境友善',cx,cy);g2.scale.setScalar(k);const a=-.62,c=Math.cos(a),n=Math.sin(a),R=(px,py)=>[px*c-py*n,px*n+py*c],up=[],lo=[];
 for(let i=0;i<=30;i++){const u=i/30,w=44*Math.sin(Math.PI*u)**.8*(1-.22*u);up.push(R(-52+104*u,-w));lo.push(R(-52+104*u,w));}
 poly(g2,[...up,...lo.reverse()],GREEN);line(g2,[R(-56,0),R(40,0)],WHITE,5);const W=u=>44*Math.sin(Math.PI*u)**.8*(1-.22*u);[-.3,0,.3].forEach(d=>{const u0=.5+d*.9,px=-52+104*u0,u1=Math.min(.92,u0+.17),w1=W(u1)*.62;line(g2,[R(px,0),R(-52+104*u1,-w1)],WHITE,4);line(g2,[R(px,0),R(-52+104*u1,w1)],WHITE,4);});line(g2,[R(-52,0),R(-68,0)],GREEN,7);o.loops.push(t=>{g2.rotation.z=.08*Math.sin(t*1.3);});return g2;}
function iClock(g,cx,cy,k=1){const c=item(g,'損失時間・時鐘',cx,cy);c.scale.setScalar(k);ring(c,0,0,28,5,SOFT);const h=group(c);rect(h,-2.5,-22,5,24,GOLD,2);const m=group(c);rect(m,-2,-16,4,18,WHITE,2);disk(c,0,0,4,GOLD);o.loops.push(t=>{h.rotation.z=t*.5;m.rotation.z=t*3;});return c;}
function iGear(g,cx,cy,k=1){const q=gear(g,cx,cy,26*k,MINT);o.loops.push(t=>q.rotation.z=t*.8);return q;}
const arrowD=(g,x,y0,y1,c=GREEN)=>{rect(g,x-4,y0,8,y1-y0-30,c,3);poly(g,[[x-20,y1-38],[x+20,y1-38],[x,y1]],c);};
const rowAt=(i,spoken,phrase,icon,label,col,until)=>{const g=item(o.g,'列：'+label),yc=ROW(i);disc(g,112,yc,46,col);icon(g,112,yc,.85);bold(g,label,190,yc,48,WHITE,{align:'left'});return sync(o,g,spoken,phrase,{until:until??undefined});};
const lab=(name,s,x,y,spoken,phrase,until,{size=44,col=WHITE,b=false,lead}={})=>{const g=item(o.g,name);(b?bold:text)(g,s,x,y,size,col,b?{}:{weight:400});return sync(o,g,spoken,phrase,{until:until??undefined,lead});};
// ---------- title block (top-left), same geometry as ep0 ----------
let g=item(o.g,'歡迎來到');text(g,'歡迎來到',L,118,44,MINT,{align:'left',weight:400});sync(o,g,1.20,'歡迎各位來到');
g=item(o.g,'課程名稱');bold(g,'機器設備',L,205,76,WHITE,{align:'left'});bold(g,'智能診斷',L,291,76,WHITE,{align:'left'});rect(g,L+6,342,150,8,C.teal,4);text(g,'Intelligent Diagnostics',L,398,40,SOFT,{align:'left',weight:400});text(g,'of Machinery',L,446,40,SOFT,{align:'left',weight:400});sync(o,g,2.47,'機器設備智能診斷',{lead:.25});
// ================= A. 突然故障 (4.8 – 15.75): right = running machine -> sudden failure; left = what a failure costs =================
const UA=15.75;
g=item(o.g,'設備運轉');disc(g,RX,320,95,MINT);iMotor(g,RX,320,1.55);sync(o,g,6.32,'當設備運轉',{until:UA});
lab('設備運轉文字','設備運轉',RX,450,6.32,'當設備運轉',UA);
lab('關鍵時刻','關鍵時刻',RX,505,7.56,'的關鍵時刻',UA,{col:GOLD});
g=item(o.g,'突然→箭頭');arrowD(g,RX,548,640,ROSE);sync(o,g,8.54,'突然出現故障',{until:UA});
g=item(o.g,'異常警示圓盤');disc(g,RX,742,95,CORAL);iWarn(g,RX,742,1.5);sync(o,g,8.54,'突然出現故障',{until:UA});
lab('突然故障','突然故障',RX,880,8.98,'故障',UA,{size:60,col:GOLD,b:true});
rowAt(0,10.09,'情況輕微的狀態',(g,x,y,k)=>iGauge(g,x,y+4,k*.95,false,t=>.18+.04*Math.sin(t*2)),'情況輕微',GREEN,UA);
rowAt(1,12.22,'損失的時間',iClock,'損失時間',GOLD,UA);
rowAt(2,12.92,'等它被修好',iWrench,'等待維修',SOFT,UA);
rowAt(3,14.24,'我們就可以使用了',iCheck,'修好再使用',GREEN,UA);
// ================= B. 傷害人員 -> 預警 (15.9 – 23.0) =================
const UB=23.0;
rowAt(0,16.96,'出現的狀況',iWarn,'嚴重狀況',CORAL,UB);
rowAt(1,18.05,'會傷害到人員',iWorker,'傷害人員',GOLD,UB);
rowAt(2,20.2,'那預警系統',iBell,'預警系統',GOLD,UB);
rowAt(3,21.52,'非常重要了',iStar,'非常重要',GOLD,UB);
g=item(o.g,'人員圓盤');disc(g,RX,320,95,GOLD);iWorker(g,RX,320,1.6);sync(o,g,18.05,'傷害到人員',{until:UB});
lab('傷害到人員','傷害到人員',RX,450,18.6,'到人員',UB);
g=item(o.g,'預警→箭頭');arrowD(g,RX,500,606,GREEN);sync(o,g,20.2,'預警系統',{until:UB});
g=item(o.g,'預警盾牌圓盤');disc(g,RX,710,95,GREEN);iShield(g,RX,710,1.7);sync(o,g,20.2,'預警系統',{until:UB});
lab('提前預警','提前預警',RX,846,20.2,'預警系統',UB,{size:56,col:GOLD,b:true});
lab('守護人員安全','守護人員安全',RX,918,21.74,'非常重要',UB,{col:SOFT});
// ================= C. 摩托車變舊、耗油 (23.1 – 34.08) =================
const UC=34.08;
rowAt(0,23.9,'設備的運轉',iMotor,'設備運轉',MINT,UC);
rowAt(1,28.3,'都會慢慢變舊',iHourglass,'慢慢變舊',GOLD,UC);
rowAt(2,29.88,'車上的零件堪用',iGear,'零件堪用',MINT,UC);
rowAt(3,31.94,'會越來越耗油',iDrop,'越來越耗油',GOLD,UC);
g=item(o.g,'同樣的設備');disc(g,RX,400,100,MINT);iMotor(g,RX,400,1.5);sync(o,g,23.42,'同樣設備的運轉',{until:26.35});
lab('同樣的設備文字','同樣的設備',RX,540,23.42,'同樣設備的運轉',26.35,{size:52,b:true});
g=item(o.g,'摩托車圖');iScooter(g,RX,335,2.0,false);sync(o,g,26.6,'像是大家的摩托車',{until:UC});
lab('摩托車','摩托車',RX,512,26.6,'摩托車',UC,{size:56,b:true});
g=item(o.g,'新→舊');{text(g,'新',1480,590,44,SOFT,{weight:400});text(g,'舊',1800,590,44,SOFT,{weight:400});for(let i=0;i<24;i++)rect(g,1520+i*10,583,10,14,i<8?GREEN:i<16?GOLD:ROSE);const mk=disk(g,1520,590,15,WHITE);o.loops.push(t=>{mk.position.x=1520+240*Math.min(1,Math.max(0,(t-28.5)/2));});}sync(o,g,28.3,'都會慢慢變舊',{until:UC});
g=item(o.g,'耗油表');iGauge(g,RX,790,2.0,false,t=>.2+.7*Math.min(1,Math.max(0,(t-32.0)/1.4))+.015*Math.sin(t*9));sync(o,g,31.94,'越來越耗油',{until:UC});
lab('耗油','耗油',RX,915,32.58,'耗油',UC,{size:60,col:ROSE,b:true});
// ================= D. 即時提醒 -> 效率如新 -> 環境友善 (34.08 – 43.2) =================
const UD=37.1;
g=item(o.g,'預警系統圖');iMonitor(g,RX,340,2.0);sync(o,g,34.10,'若有系統',{until:UD,lead:.02});
lab('預警系統文字','預警系統',RX,480,34.10,'若有系統',UD,{size:56,col:MINT,b:true,lead:.02});
g=item(o.g,'提醒→箭頭');arrowD(g,RX,528,626,GREEN);sync(o,g,35.06,'提醒我們',{until:UD});
g=item(o.g,'更換零件圖');disc(g,RX,740,90,GREEN);iRecycleGear(g,RX,740,1.5);sync(o,g,35.60,'更換零件',{until:UD});
lab('提醒更換零件','提醒更換零件',RX,880,35.60,'更換零件',UD,{size:52,b:true});
rowAt(0,34.62,'事實地提醒',iBell,'即時提醒',GOLD,null);
rowAt(1,35.60,'更換零件',iRecycleGear,'更換零件',GREEN,null);
rowAt(2,37.46,'車子的效率',(g,x,y,k)=>iGauge(g,x,y+4,k*.95,true,t=>.84+.03*Math.sin(t*2.4)),'效率如新',GREEN,null);
rowAt(3,41.04,'對環境是不是會更友善',iLeaf,'環境更友善',GREEN,null);
g=item(o.g,'新的摩托車');iScooter(g,RX,320,2.0,true);sync(o,g,37.46,'車子的效率',{lead:.25});
lab('效率像新的一樣','效率像新的一樣',RX,496,38.5,'和新的幾乎一樣好',null,{size:52,col:GREEN,b:true});
g=item(o.g,'效率錶（高）');iGauge(g,RX,660,2.0,true,t=>.85+.025*Math.sin(t*2.4));sync(o,g,37.98,'效率和新的',{});
g=item(o.g,'環境友善徽章');disc(g,RX,830,82,GREEN);iLeaf(g,RX,830,1.08);sync(o,g,41.04,'對環境是不是會更友善',{});
lab('對環境更友善','對環境更友善',RX,962,41.74,'是不是會更友善',null,{size:52,col:GREEN,b:true});
}

// 03 — 59.45–106.55 s. Order of the narration: 各種不同的設備 → 原理／量測／物理意義 → 軸承順暢 → 軸承異常 → 異常種類繁多 → 建立判別模型 (slide v3 p9 pyramid).
uid=10000;
{
const o=build(PARTS[2]);title2(o,'從機器運轉到異常診斷',59.7,'各種不同的機器設備');kicker2(o,'各種不同的機器設備',59.7,'各種不同的機器設備',73.3);
const SP3=[62.4,64.3,67.7];
[['motor','運轉原理','不同的運轉原理',C.teal,250,'有不同的運轉原理'],['sensor','量測技術','不同的量測手段',C.blue,650,'需要不同的量測手段'],['wave','訊號的物理意義','訊號代表的物理意義',C.green,1050,'了解量測到的訊號所代表的物理意義']].forEach(([k,s,sub,c,cx,ph],i)=>{
 const g=item(o.g,s);ico(o,g,k,cx,480,c,1.15);bold(g,s,cx,690,s.length>5?46:52,c);text(g,sub,cx,758,42,SUB,{width:396,weight:400});sync(o,g,SP3[i],ph,{until:73.3});
 if(i){const a=item(o.g,'箭頭 '+i);arrow(a,cx-205,480,C.teal,60);sync(o,a,SP3[i],ph+'(箭頭)',{until:73.3,lead:.15});}});
{const g=item(o.g,'挑選訊號特徵');rect(g,60,820,1180,100,TINT[C.amber],18);rect(g,60,834,9,72,C.amber,4);bold(g,'挑選訊號的特徵　非常重要',650,870,46,C.amber);sync(o,g,71.9,'挑選訊號的特徵非常重要',{until:73.3});}
// bearing: smooth → vibration rises → possible fault
{const gi=item(o.g,'軸承圖示');ico(o,gi,'bearing',260,610,C.teal,1.3);sync(o,gi,74.8,'新裝配好的軸承',{until:89.7});
 const g=item(o.g,'新軸承標籤');bold(g,'新裝配的軸承',260,820,44,C.teal,{weight:400});sync(o,g,74.8,'新裝配好的軸承',{until:85.4});
 const g2=item(o.g,'運轉順暢');bold(g2,'運轉順暢',260,885,44,C.teal,{weight:400});sync(o,g2,77.2,'運轉起來非常順暢',{until:85.4});
 const g3=item(o.g,'軸承標籤');bold(g3,'軸承',260,820,44,C.navy,{weight:400});sync(o,g3,85.6,'(軸承：高的震動量)',{lead:.3,until:89.7});
 const sn=item(o.g,'加速規');line(sn,[[205,375],[245,440]],C.line,5);sensor2(sn,185,340,1.1);bold(sn,'加速規',185,262,42,C.blue,{weight:400});sync(o,sn,80.0,'安裝加速規',{until:89.7});
 const wv=wave3(o.g,540,540,700,170);const hd=item(o.g,'量測振動');bold(hd,'量測到的振動',540,365,44,C.navy,{align:'left',weight:400});sync(o,hd,81.5,'量測到的振動',{until:89.7});
sync(o,wv.g,81.7,'量測到的振動(波形)',{until:89.7});
 const ramp=t=>{const u=Math.max(0,Math.min(1,(t-(85.2-o.start*DT))/1.2));return u*u*(3-2*u);};
 o.loops.push(t=>{const m=ramp(t);wv.set(t,.28+.72*m,m);});
 const c1=item(o.g,'振動很小');bold(c1,'振動很小',540,730,46,C.teal,{align:'left',weight:400});sync(o,c1,82.4,'震動就會非常小',{until:85.2});
 const c2=item(o.g,'振動量升高');bold(c2,'振動量升高',540,730,46,RED,{align:'left',weight:400});sync(o,c2,85.7,'高的震動量',{until:89.7});
 const c3=item(o.g,'軸承可能異常');bold(c3,'軸承可能發生異常',540,800,46,RED,{align:'left'});sync(o,c3,87.4,'軸承可能發生異常',{until:89.7});
 const wn=item(o.g,'異常警示');warning(wn,430,350,1.5);sync(o,wn,88.8,'異常了',{until:89.7});}
// anomalies are numerous: A/B/C together on their word, then highlights follow "有些相似" / "有些很不同"; exit 1.8 s after the last highlight
{const EXIT=98.3,fr=(g,x,y,w,h,c,t=5)=>{rect(g,x,y,w,t,c);rect(g,x,y+h-t,w,t,c);rect(g,x,y,t,h,c);rect(g,x+w-t,y,t,h,c);};
 const hd=item(o.g,'異常種類繁多');bold(hd,'異常種類繁多',60,345,56,C.amber,{align:'left'});sync(o,hd,91.4,'異常種類實在太多了',{until:EXIT});
 const ws=[['異常 A',RED,{f:6,nf:39,noise:true}],['異常 B',RED,{f:6.5,nf:35,noise:true}],['異常 C',C.blue,{f:2.5,noise:false}]].map(([s,c,op],i)=>{const g=item(o.g,s),x=60+i*400;rect(g,x,420,360,300,'#f3f8fa',16);bold(g,s,x+180,466,44,c,{weight:400});const w=wave2(g,x+25,600,310,96,c,op);sync(o,g,91.8,'異常種類實在太多(A/B/C 同時出現)',{until:EXIT});return w;});
 o.loops.push(t=>ws.forEach(w=>w.set(t)));
 let g=item(o.g,'相似框');fr(g,52,412,766,316,C.teal);sync(o,g,95.0,'又有點相似',{until:EXIT});
 g=item(o.g,'有些相似');bold(g,'有些相似',435,775,46,C.teal);sync(o,g,95.0,'又有點相似',{until:EXIT});
 g=item(o.g,'很不同框');fr(g,852,412,376,316,C.blue);sync(o,g,96.7,'有些又非常的不同',{until:EXIT});
 g=item(o.g,'有些很不同');bold(g,'有些很不同',1040,775,46,C.blue);sync(o,g,96.7,'有些又非常的不同',{until:EXIT});}
// 設備診斷三部曲 (slide v3 p9) as stepped, rounded tiers with icon discs; bottom-up, active tier outlined
{const tiers=[['運轉原理','認識設備的運轉原理',C.blue,'motor',98.4,'(回顧：運轉原理，62.4)',null],['量測技術','理解運轉的量測技術',C.teal,'sensor',98.9,'(回顧：量測技術，64.3)',null],['物理意義','分析訊號的物理意義',C.green,'wave',99.4,'建立…(物理意義)','Level 1'],['智慧計算','轉化物理的智慧計算',C.green,'gear',99.9,'可以判別的','Level 2'],['診斷模型','應用智慧診斷模型',C.amber,'net',100.8,'判別的模型','Level 3']];
 const g0=item(o.g,'設備診斷三部曲');bold(g0,'設備診斷三部曲',780,292,50,C.blue,{align:'left'});sync(o,g0,98.5,'所以這個時候我們就要建立…模型',{lead:.3});
 tiers.forEach(([s,sub,c,k,sp,ph,lv],i)=>{const w=1180-120*i,x=650-w/2,y=860-i*126,h=116,nx=i<4?tiers[i+1][4]:1e9;
  const hl=item(o.g,'目前層：'+s);rect(hl,x-6,y-6,w+12,h+12,C.navy,26);sync(o,hl,sp,ph,{lead:.15,until:i<4?nx:undefined});
  const g=item(o.g,s);rect(g,x,y,w,h,TINT[c]||C.pale,22);rect(g,x,y+16,8,h-32,c,4);iconIn(o,g,k,x+70,y+h/2,40,c);bold(g,s,x+135,y+h/2-24,46,C.navy,{align:'left'});text(g,sub,x+135,y+h/2+26,42,SUB,{align:'left',weight:400});
  if(lv){const lw=Math.round(est(lv,40)+36);rect(g,x+w-lw-24,y+h/2-27,lw,54,C.blue,27);bold(g,lv,x+w-lw/2-24,y+h/2,40,C.white);}
  sync(o,g,sp,ph,{lead:.15});});
 const al=item(o.g,'ALL');rect(al,470,256,300,70,'#f4b400',35);bold(al,'ALL',620,291,48,C.navy);sync(o,al,103.5,'現場工作的技師(ALL)',{lead:.3});}
}
// 04 — 106.55–151.45 s. 「但是…」bubble → TRL curve with every description on the line → 導入綠色設計 → 維護運轉 → 診斷系統.
uid=20000;
{
const o=build(PARTS[3]);
bubble(o,'綠色工程與診斷提問',{x0:640,y0:222,w:540,h:352,tipY:400,lines:Object.assign([
 {segs:[['但是…',C.navy,400]],spoken:106.8,phrase:'但是'},
 {segs:[['綠色工程',C.green],['和',C.navy,400]],spoken:107.2,phrase:'綠色工程'},
 {segs:[['機器設備診斷',C.blue]],spoken:108.5,phrase:'機器設備診斷'},
 {segs:[['有何關係呢？',ORG,400]],spoken:110.6,phrase:'有何關係呢'}],{until:112.7})});
{let g=item(o.g,'綠色工程');ico(o,g,'leaf',175,400,C.green,.9);bold(g,'綠色工程',175,555,46,C.green);sync(o,g,107.4,'綠色工程',{until:112.7});
 g=item(o.g,'機器設備診斷');ico(o,g,'gs',440,400,C.blue,.9);bold(g,'機器設備診斷',440,555,42,C.blue);sync(o,g,108.7,'機器設備診斷',{until:112.7});}
title2(o,'產品設計到量產流程',112.9,'市售產品從概念…');
kicker2(o,'*Technology Readiness Level　技術成熟度指標',122.6,'技術成熟度指標');
const labels=['基本原理發現','應用概念成型','關鍵功能驗證','實驗室雛形驗證','實際環境雛形驗證','實際環境系統驗證','真實環境系統展示','系統完成並通過測試','系統實際運行成功'];
const stg=[['概念',C.blue,113.9,'概念'],['驗證・試量產',C.teal,115.3,'驗證／試量產'],['量產',C.green,117.0,'量產']];
const px=[130,178,230,285,345,408,475,545,620],py=i=>960-80*i,P=px.map((x,i)=>[x,py(i)]);
const trlSp=[113.9,114.4,114.9,115.3,115.8,116.2,117.0,117.5,118.0],TU=139.3;
stg.forEach(([s,c,sp,ph],k)=>{const g=item(o.g,'階段 '+s),top=py(3*k+2)-40,bot=py(3*k)+40;rect(g,60,top,1180,bot-top,TINT[c],16);rect(g,60,top+14,9,bot-top-28,c,4);bold(g,s,1220-est(s,50),(top+bot)/2,50,c,{align:'left'});sync(o,g,sp,ph,{until:TU});});
const lines=P.map((p,i)=>{if(!i)return null;const g=item(o.g,`TRL ${i+1} 連線`);line(g,[P[i-1],p],stg[Math.floor(i/3)][1],12);return g;});
const halos=[];
for(let i=0;i<9;i++){const c=stg[Math.floor(i/3)][1];if(lines[i])sync(o,lines[i],trlSp[i],`TRL ${i+1} 連線`,{until:TU,lead:.25});
 const g=item(o.g,`TRL ${i+1}`);halos.push(disk(g,...P[i],40,c));disk(g,...P[i],31,c);bold(g,String(i+1),P[i][0],P[i][1],42,C.white);bold(g,labels[i],P[i][0]+50,P[i][1],42,C.navy,{align:'left',weight:400});sync(o,g,trlSp[i],i<3?'概念 → TRL '+(i+1):i<6?'驗證／試量產 → TRL '+(i+1):'量產 → TRL '+(i+1),{until:TU,lead:.25});}
o.loops.push(t=>halos.forEach((h,i)=>h.material.opacity*=.1+.16*Math.sin(t*2.2-i*.5)**2));
{const pulse=item(o.g,'TRL 掃光');disk(pulse,0,0,16,C.white);disk(pulse,0,0,9,C.gold);sync(o,pulse,125.2,'TRL 來區分',{until:TU});
 const len=[0];for(let i=1;i<9;i++)len.push(len.at(-1)+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]));const tot=len.at(-1),at=L=>{for(let i=1;i<9;i++)if(L<=len[i]){const u=(L-len[i-1])/(len[i]-len[i-1]);return [P[i-1][0]+(P[i][0]-P[i-1][0])*u,P[i-1][1]+(P[i][1]-P[i-1][1])*u];}return P[8];};
 o.loops.push(t=>{const l=((t-(125.2-o.start*DT))*.5)%1.4;const p=at(Math.min(1,l)*tot);pulse.position.set(p[0],p[1],0);if(l>1)pulse.visible=false;});}
// which stage? (three quick frames)
stg.forEach(([s,c],k)=>{const g=item(o.g,'哪一階段 '+s),top=py(3*k+2)-40,bot=py(3*k)+40;rect(g,60,top,1180,5,c);rect(g,60,bot-5,1180,5,c);rect(g,60,top,5,bot-top,c);rect(g,1235,top,5,bot-top,c);sync(o,g,137.9+k*.4,'哪一個階段',{until:138.35+k*.4,lead:.2});});
// leave: green design → maintenance → diagnostic system
[['leaf','綠色設計','導入綠色設計',C.green,250,139.6,'導入綠色設計'],['motor','維護運轉','機器設備的維護運轉',C.teal,650,144.4,'影響機器設備的維護運轉'],['net','診斷系統','整段系統的建構',C.blue,1050,150.1,'整段系統的建構']].forEach(([k,s,sub,c,cx,sp,ph],i)=>{
 const g=item(o.g,s);ico(o,g,k,cx,500,c);bold(g,s,cx,685,52,c);text(g,sub,cx,752,42,SUB,{width:396,weight:400});sync(o,g,sp,ph);
 if(i<2){const a=item(o.g,'箭頭 '+(i+1));arrow(a,cx+190,500,C.teal,70);sync(o,a,i?147.9:142.6,i?'又會如何影響到':'會怎麼影響',{lead:.2});}});
}

uid=494;
// 05 — silent 「課程重點」 section card (same construction as Episode 1's card).
{
const o=build(PARTS[4]);let g=item(o.g,'章節標題');bold(g,'課程重點',96,215,140,C.blue,{align:'left'});cue(o,g,.1);
g=item(o.g,'章節標題底線');rect(g,100,338,1080,3,C.line);rect(g,100,334,135,8,C.teal);cue(o,g,.3);
g=item(o.g,'點陣裝飾');const dots=[];for(let j=0;j<3;j++)for(let i=0;i<4;i++)dots.push(disk(g,1150+i*24,120+j*24,6,C.blue));cue(o,g,.5);o.loops.push(t=>dots.forEach((m,i)=>m.material.opacity*=.55+.45*Math.sin(t*1.6-(i%4)*.5-Math.floor(i/4)*.8)**2));
[['運轉原理','先理解設備的動作與能量傳遞',C.teal,'motor'],['量測技術','再選對感測器與量測方式',C.blue,'sensor'],['訊號的物理意義','把波形連回設備運轉狀態',C.green,'wave'],['異常警示建模','建立判別異常的模型',C.amber,'net']].forEach(([s,sub,c,k],i)=>{const y=470+i*130,g=item(o.g,s);rect(g,100,y-58,1150,116,TINT[c]||C.pale,22);rect(g,100,y-34,8,68,c,4);disk(g,155,y,38,C.teal);text(g,String(i+1),155,y,44,C.white,{weight:700});bold(g,s,225,y-24,46,C.navy,{align:'left'});text(g,sub,225,y+26,40,SUB,{align:'left',weight:400});iconIn(o,g,k,1190,y,50,c);cue(o,g,.8+i*.55);});
}

// 06 — 158.57–227.0 s. v3 p12 bubble → p13 「設備的運轉診斷需要知道」 with a properly drawn wind turbine.
uid=30000;
{
const o=build(PARTS[5]);
bubble(o,'回到設備的運轉診斷提問',{x0:640,y0:222,w:540,h:290,tipY:380,lines:Object.assign([
 {segs:[['回到…',C.navy,400]],spoken:158.6,phrase:'回到'},
 {segs:[['設備的運轉診斷，',C.blue]],spoken:159.1,phrase:'設備的運轉診斷'},
 {segs:[['我們需要了解甚麼？',ORG,400]],spoken:161.1,phrase:'我們需要了解什麼'}],{until:163.1})});
{let g=item(o.g,'設備的運轉診斷');ico(o,g,'motor',230,400,C.teal,1.1);bold(g,'設備',230,570,44,C.teal,{weight:400});sync(o,g,159.1,'設備的運轉診斷',{until:163.1});
 g=item(o.g,'問號');bold(g,'？',500,400,190,C.amber);sync(o,g,162.4,'需要了解的是什麼？',{until:163.1});}
title2(o,'設備的運轉診斷需要知道',163.4,'量測技術',.2);
agenda2(o,[{s:'量測技術',spoken:163.4,phrase:'量測技術'},{s:'運轉原理',spoken:184.1,phrase:'風力帶動葉片、主軸旋轉(運轉原理)'},{s:'訊號的物理意義',spoken:204.7,phrase:'訊號隱含的物理意義'}],[{i:0,from:163.4,to:184.0},{i:1,from:184.1,to:204.6},{i:2,from:204.7,to:1e9}]);
// scene: turbine on the left, drivetrain cutaway on the right. Hub / shaft / gearbox / generator share y=520.
const HY=520;
let g=item(o.g,'案例標籤');bold(g,'風力發電機',60,318,44,C.blue,{align:'left'});sync(o,g,167.2,'風力發電機');
const tu=turbine2(o.g,250,HY);sync(o,tu.g,167.0,'風力發電機',{lead:.3});
const pn=item(o.g,'傳動系統底板');rect(pn,590,345,650,490,C.band,20);rect(pn,590,361,8,458,C.teal,4);sync(o,pn,167.2,'風力發電機(傳動系統)',{lead:.3});
const shaft=item(o.g,'主軸');rect(shaft,352,HY-9,262,18,STEEL,5);ring(shaft,500,HY,26,9,C.navy);sync(o,shaft,167.2,'風力發電機(主軸)',{lead:.3});
const gb=gearbox2(o.g,765,HY,.95);const gn=generator2(o.g,1085,HY,.88);
sync(o,gb.g,167.2,'風力發電機(齒輪箱)',{lead:.3});sync(o,gn.g,167.2,'風力發電機(發電機)',{lead:.3});
const sh2=item(o.g,'輸出軸');rect(sh2,905,HY-9,64,18,STEEL,5);sync(o,sh2,167.2,'風力發電機(輸出軸)',{lead:.3});
g=item(o.g,'葉片標籤');bold(g,'葉片',400,350,44,C.teal,{weight:400});line(g,[[392,376],[368,424]],C.teal,3);sync(o,g,188.3,'葉片');
g=item(o.g,'主軸標籤');bold(g,'主軸',500,612,44,C.blue,{weight:400});sync(o,g,189.8,'主軸');
g=item(o.g,'發電機標籤');bold(g,'發電機',1085,395,44,C.blue,{weight:400});sync(o,g,192.5,'發電機');
g=item(o.g,'軸承標籤');bold(g,'軸承',500,435,44,C.green,{weight:400});sync(o,g,213.3,'軸承');
g=item(o.g,'齒輪箱標籤');bold(g,'齒輪箱',765,395,44,C.blue,{weight:400});sync(o,g,214.4,'(軸承、)齒輪');
tu.rotor.traverse(m=>{if(m.isMesh)m.renderOrder+=2e6;});
o.loops.push(t=>{tu.rotor.rotation.z=t*.5;gb.a.rotation.z=-t*.5;gb.b.rotation.z=t*.5*14/9;});
[['振動',765,617,170.9,'量測振動'],['轉速',420,535,172.0,'量測轉速'],['發電量',1085,575,172.8,'量測發電量']].forEach(([s,x,y0,sp,ph])=>{const g=item(o.g,`${s}量測`);line(g,[[x,y0],[x,688]],C.teal,4);sensor2(g,x,735,.62);bold(g,s,x,810,44,C.teal,{weight:400});sync(o,g,sp,ph);});
const mk=(x,y,w,h,c,sp,ph,nm)=>{const g=item(o.g,nm);rect(g,x,y,w,6,c);rect(g,x,y+h-6,w,6,c);rect(g,x,y,6,h,c);rect(g,x+w-6,y,6,h,c);sync(o,g,sp,ph,{until:219.4});return g;};
{const g=item(o.g,'軸承強調');ring(g,500,HY,52,6,C.green);sync(o,g,213.3,'軸承',{until:219.4});mk(612,418,306,206,C.green,214.4,'齒輪','齒輪箱強調');mk(955,445,260,160,C.green,215.4,'發電機','發電機強調');}
// bottom explanatory chain (one per topic)
chain(o,905,[{s:'振動・轉速・發電量',color:C.blue,spoken:173.9,phrase:'才能知道…',until:183.9},{s:'掌握運轉狀態',color:C.blue,spoken:176.8,phrase:'運轉的狀態',until:183.9},],{h:84});emph(o,'教學重點 ①',180.6,'教學重點之一',183.9);
chain(o,905,[{s:'風力',color:C.teal,spoken:185.1,phrase:'風力',until:204.5},{s:'葉片',color:C.teal,spoken:188.3,phrase:'葉片',until:204.5},{s:'主軸',color:C.teal,spoken:189.8,phrase:'主軸旋轉',until:204.5},{s:'發電機轉子',color:C.teal,spoken:193.3,phrase:'發電機的轉子',until:204.5},{s:'線圈感應發電',color:C.teal,spoken:195.5,phrase:'銅線圈感應發電',until:204.5}],{h:84,gap:52,size:40});emph(o,'教學重點 ②',202.5,'教學重點之二',204.5);
chain(o,905,[{s:'軸承',color:C.green,spoken:213.5,phrase:'軸承'},{s:'齒輪',color:C.green,spoken:214.6,phrase:'齒輪'},{s:'發電機',color:C.green,spoken:215.5,phrase:'發電機'},{s:'正常／異常？',color:C.amber,spoken:221.2,phrase:'正常還是異常'},{s:'何時維修',color:C.green,spoken:224.4,phrase:'何時介入維修'}],{h:84,gap:48,size:40});
}
// 07 — 227.0–264.0 s. v3 p14: 運轉原理 highlighted; rotating machine vs. a train; sensor ⇄ principle matching; accelerometer-as-parking-sensor.
uid=40000;
{
const o=build(PARTS[6]);title2(o,'設備的運轉診斷需要知道',227.0,'設備的運轉原理',.2);
agenda2(o,[{s:'運轉原理',spoken:227.8,phrase:'設備的運轉原理'},{s:'量測技術',spoken:230.1,phrase:'使用何種感測器'},{s:'訊號的物理意義',spoken:252.5,phrase:'運轉狀態變化的訊號'}],[{i:0,from:227.8,to:1e9}]);
let g=item(o.g,'旋轉設備');ico(o,g,'motor',330,470,C.teal,1.15);bold(g,'旋轉設備',330,295,48,C.teal);sync(o,g,231.3,'一個會繞著軸心旋轉的馬達');
g=item(o.g,'馬達說明');bold(g,'繞著軸心旋轉的馬達',330,650,44,C.navy,{weight:400});sync(o,g,232.2,'繞著軸心旋轉');
g=item(o.g,'列車');const tr=train2(g,840,470,1.1);bold(g,'列車',930,295,48,C.blue);sync(o,g,236.0,'列車衝出去');
g=item(o.g,'列車說明');bold(g,'衝出去就不會回來',930,650,44,C.navy,{weight:400});sync(o,g,236.6,'衝出去就不會回來');
o.loops.push(t=>{const u=Math.max(0,Math.min(1,(t-(236.6-o.start*DT))/2.2));tr.position.x=830+130*u*u*(3-2*u);});
g=item(o.g,'感測器不同');bold(g,'≠',608,420,110,C.amber);bold(g,'感測器\n不同',608,540,42,C.amber);sync(o,g,239.2,'用的感測器是不同的');
chain(o,745,[{s:'感測器',color:C.blue,spoken:243.6,phrase:'感測器…'},{s:'設備原理',color:C.teal,spoken:244.9,phrase:'設備原理的匹配',arrow:true},{s:'有效訊號',color:C.green,spoken:252.5,phrase:'運轉狀態變化的訊號'}],{h:84,gap:80});
const ex=item(o.g,'倒車示例');const car=carHit(ex,940,905,.95);
g=item(o.g,'倒車標題');bold(g,'振動加速規 ≠',60,880,44,C.amber,{align:'left'});bold(g,'倒車距離感測器',60,945,44,C.amber,{align:'left',weight:400});sync(o,g,255.1,'拿振動加速規去當倒車的距離感測');
sync(o,ex,256.9,'倒車的距離感測',{lead:.3});
o.loops.push(t=>{const u=Math.max(0,Math.min(1,(t-(260.8-o.start*DT))/1.3));car.car.position.x=-60+180*u*u;});
g=item(o.g,'撞到牆才有訊號');const sp=poly(g,[[1127,905],[1147,880],[1143,905],[1163,890],[1145,918],[1160,935],[1135,925],[1128,945],[1122,925],[1100,935],[1115,915],[1095,905],[1118,903],[1110,880]],C.amber);bold(g,'撞到牆，才有訊號！',410,930,44,RED,{align:'left'});sync(o,g,262.7,'才會收到訊號');
}
// 08 — 264.0–302.0 s. v3 p15: 量測技術 highlighted; four selection factors; capacitive accelerometer working principle.
uid=50000;
{
const o=build(PARTS[7]);title2(o,'設備的運轉診斷需要知道',264.1,'感測器的種類繁多',.2);
agenda2(o,[{s:'量測技術',spoken:264.1,phrase:'感測器的種類繁多'},{s:'運轉原理',spoken:269.6,phrase:'根據設備的運轉原理'}],[{i:0,from:264.1,to:1e9}]);
let g=item(o.g,'設備運轉原理');const mi=motorC(g,300,610,1.5);bold(g,'設備運轉原理',300,820,50,C.teal);sync(o,g,268.5,'根據設備的運轉原理',{until:285.3});o.loops.push(t=>mi.rot.rotation.z=t*.8);
g=item(o.g,'選型箭頭');arrow(g,520,610,C.teal,300);sync(o,g,270.5,'選擇',{until:285.3});
g=item(o.g,'合適的感測器');sensor2(g,1000,610,2.2);bold(g,'合適的感測器',1000,820,50,C.blue);sync(o,g,271.0,'選擇合適的感測器',{until:285.3});
[['背景知識',278.4,'感測器的背景知識'],['環境限制',279.6,'使用的環境限制'],['訊號頻寬',281.5,'訊號的頻寬'],['裝設挑戰',282.8,'裝設感測器的挑戰']].forEach(([s,sp,ph],i)=>{const g=item(o.g,s),x=60+i*300,c=i%2?C.blue:C.teal;rect(g,x,285,280,100,TINT[c],14);bold(g,s,x+140,335,44,c,{weight:400});sync(o,g,sp,ph);});
g=item(o.g,'電容式加速規圖解標題');bold(g,'電容式加速規工作原理圖解',60,432,48,C.navy,{align:'left'});sync(o,g,285.7,'電容式的加速規');
const mem=item(o.g,'電容式加速規工作原理');rect(mem,160,453,920,331,C.navy,18);rect(mem,170,463,900,311,C.ice,13);rect(mem,310,484,24,267,C.blue,3);rect(mem,907,484,24,267,C.blue,3);let mass=item(mem,'慣性質量塊',620,617);rect(mass,-115,-67,230,134,C.gold,8);text(mass,'質量塊',0,0,42,C.navy,{weight:400});const springs=[];[565,667].forEach(y=>{for(let side of [-1,1]){const sg=item(mem,'彈簧'),segs=Array.from({length:16},()=>rect(sg,0,-2.5,1,5,STEEL));springs.push({segs,y,side});}});text(mem,'C₁',392,620,44,C.blue,{weight:400});text(mem,'C₂',848,620,44,C.blue,{weight:400});mem.scale.setScalar(1.12);mem.position.set(-125,-10,0);sync(o,mem,285.7,'電容式的加速規',{lead:.3});
const ramp=t=>{const u=Math.max(0,Math.min(1,(t-(292.9-o.start*DT))/.9));return u*u*(3-2*u);};
o.loops.push(t=>{const dx=34*Math.sin(t*1.6)*ramp(t);mass.position.x=620+dx;for(const s of springs){const a=s.side<0?335:735+dx,b=s.side<0?505+dx:907;for(let i=0;i<16;i++){const x0=a+(b-a)*i/16,x1=a+(b-a)*(i+1)/16,y0=s.y+(i===0?0:i%2?9:-9),y1=s.y+(i===15?0:(i+1)%2?9:-9),m=s.segs[i];m.position.set((x0+x1)/2,(y0+y1)/2,0);m.rotation.z=Math.atan2(y1-y0,x1-x0);m.scale.x=Math.hypot(x1-x0,y1-y0);}}});
g=item(o.g,'慣性力標示');bold(g,'慣性力 → 質量塊位移 → 電容差',60,905,44,C.teal,{align:'left',weight:400});sync(o,g,293.0,'可以量到慣性力');
g=item(o.g,'電容式溫度影響');thermo2(g,88,968,.7);bold(g,'電容式：易受環境溫度影響',135,972,42,C.amber,{align:'left'});sync(o,g,297.0,'容易受到環境溫度的影響');
g=item(o.g,'壓電式');bold(g,'壓電式：溫度影響不同',745,972,42,C.blue,{align:'left',weight:400});sync(o,g,299.4,'壓電式的加速規不會');
}
// 09 — 302.0–338.25 s. v3 p16: raw signal → pre-processing → physical meaning (Before/After balanced).
uid=60000;
{
const o=build(PARTS[8]);title2(o,'設備的運轉診斷需要知道',302.2,'沒有勾稽物理意義的訊號',.2);
agenda2(o,[{s:'訊號的物理意義',spoken:303.1,phrase:'勾稽物理意義'}],[{i:0,from:303.1,to:1e9}]);
let g=item(o.g,'原始訊號');bold(g,'原始訊號',60,325,50,RED,{align:'left'});const w1=wave2(g,60,445,1180,92,RED,{noise:true,nf:39});sync(o,g,303.9,'沒有…的訊號',{until:322.9});
g=item(o.g,'只是波形圖');bold(g,'→ 只是上上下下的波形圖',330,325,42,SUB,{align:'left',weight:400});sync(o,g,304.9,'只是上上下下的波形圖',{until:322.9});
g=item(o.g,'前處理箭頭');rect(g,100,545,8,36,C.teal,3);poly(g,[[88,579],[104,601],[120,579]],C.teal);bold(g,'前處理',160,573,46,C.blue,{align:'left'});sync(o,g,316.3,'經過合適的前處理',{until:322.9});
g=item(o.g,'濾波移動平均');bold(g,'濾波・移動平均',400,573,46,C.blue,{align:'left',weight:400});sync(o,g,318.5,'移動平均',{until:322.9});
g=item(o.g,'前處理後');bold(g,'前處理後',60,655,50,C.teal,{align:'left'});const w2=wave2(g,60,775,1180,92,C.teal);sync(o,g,319.0,'濾波、移動平均、更高階的訊號處理',{until:322.9});
o.loops.push(t=>{w1.set(t);w2.set(t);});
g=item(o.g,'平衡前後頻譜比較');[['Before balanced','平衡前',RED,60,true],['After balanced','平衡後',C.blue,660,false]].forEach(([a,b,c,x,l])=>{rect(g,x,285,580,520,TINT[c],18);bold(g,a,x+32,330,46,c,{align:'left'});text(g,b,x+32,383,42,SUB,{align:'left',weight:400});spectrum2(g,x+40,720,500,l,1.35);text(g,'頻率',x+290,768,40,C.muted,{weight:400});});sync(o,g,323.3,'整理出…',{lead:.25});
g=item(o.g,'頻譜說明');text(g,'示意：比較特徵峰值，連回設備不平衡',650,850,42,C.navy,{weight:400});sync(o,g,325.1,'可以解釋設備運轉狀態');
[['前處理',C.teal,316.3,'前處理'],['物理特徵',C.blue,327.5,'物理現象'],['運轉條件標註',C.green,332.1,'運轉條件標註'],['偵測模型',C.amber,336.0,'偵測模型']].forEach(([s,c,sp,ph],i)=>{const g=item(o.g,s),x=60+i*299;rect(g,x,905,282,100,c,14);bold(g,s,x+141,955,42,C.white);sync(o,g,sp,ph);});
}
// 10 — 338.25–357.01 s. v3 p17 「課程目標」 four lines, each when the lecturer reaches it.
uid=70000;
{
const o=build(PARTS[9]);title2(o,'課程目標',338.5,'在本課程的目標',.25);
[['介紹常見產業設備的運轉原理',C.teal,'motor',341.0,'介紹常用的產業設備的運轉原理'],['工業用感測器的感測技術',C.blue,'sensor',345.9,'工業用的感測器的感測技術'],['解釋獲得訊號的物理意義',C.green,'wave',348.7,'並解釋獲得訊號之後的物理意義'],['設備異常警示的建模技術',C.amber,'net',352.4,'針對設備異常警示…建模技術']].forEach(([s,c,k,sp,ph],i)=>{
 const y=300+i*178,g=item(o.g,s);disk(g,100,y+80,40,C.teal);text(g,String(i+1),100,y+80,46,C.white,{weight:700});bold(g,s,170,y+80,52,C.navy,{align:'left'});ico(o,g,k,1130,y+80,c,.66);rect(g,60,y+168,1180,2,C.line);sync(o,g,sp,ph);});
}

uid=1224;
// 11 — Music-only closing; clean cards leave with a brief ease-out.
{
const o=build(PARTS[10]);const g=item(o.g,'片尾收束');text(g,'理解設備，才能讀懂訊號',960,413,78,C.white,{weight:700});text(g,'選對量測，才能做好診斷',960,536,66,'#75d6c4',{weight:700});rect(g,760,649,400,8,C.teal,4);text(g,'機器設備智能診斷系統',960,739,40,'#bfd9df');cue(o,g,.3);
}
const backBig=x=>{x=clamp(x);return 1+3.2*(x-1)**3+2.2*(x-1)**2;};
function popShow(g,t,s,d=.55){const p=prog(t,s,d),b=g.userData.poseBase,k=.55+.45*backBig(p);g.visible=p>0;g.position.set(b.x,b.y,0);g.scale.set(b.sx*k,b.sy*k,1);opacity(g,ease(clamp(p*1.7)));}
export function posePage(t){
 const p=clips.find(p=>t>=p.start*DT&&t<p.end*DT)||clips.at(-1);
 for(const o of clips)o.g.visible=o===p;
 const local=t-p.start*DT,end=(p.end-p.start)*DT;
 for(const s of p.steps){if(s.g.userData.pop)popShow(s.g,local,s.start);else show(s.g,local,s.start,s.d||.5);if(s.fn)s.fn(local);}
 p.loops.forEach(fn=>fn(local));
 // Items that the narration moves on from leave with a short fade (ends exactly at `until`); everything else stays to the end of the part.
 for(const s of p.steps){if(s.until===undefined)continue;if(local>=s.until)s.g.visible=false;else if(local>s.until-.25&&s.g.visible){const f=clamp((s.until-local)/.25);s.g.traverse(m=>{if(m.material)m.material.opacity*=f;});}}
 // Tiny, finite exit; preserves reading time and never changes global speed.
 const tail=p.id==='11-outro'?clamp((end-local)/.9):p.id==='01-intro'?clamp((end-DT-local)/.25):clamp((end-local)/.22);
 p.g.traverse(m=>{if(m.material)m.material.opacity*=tail;});
 return {part:p.id,local,mode:p.mode};
}
// Text inventory for review/round4/weight-audit.md (tools/audit.mjs)
export function textAudit(){const out=[];for(const o of clips)o.g.traverse(m=>{if(m.userData&&m.userData.text!==undefined&&m.userData.editableId)out.push({part:o.id,id:m.userData.editableId,text:m.userData.text,size:m.userData.fontSize,weight:m.userData.weight,color:m.userData.tcolor});});return out;}
