// Page 4 content: 能源轉換（低碳與無碳能源） -- all page-specific drawing + animation. Shared helpers come from ../engine/stage.js.
// `posePage(t)` sets every object's state for time t (pure function of t, safe to seek backwards).
// Layout (1920x1080, content x<1280, teacher on the right): title+rule y<165 | timeline strip y 200-290 | teaching zone y 318-612 | cards y 630-968.
import {T,root,group,mesh,rect,poly,disk,line,text,E,opacity,clamp,prog,ease,arrive,ellipse,arc,ring,smooth,easeIO} from '../engine/stage.js';
import {registerEditable} from '../engine/layout-engine.js';
import {COLORS as C,CUES as Q,IDLE as I,DURATION,DT,FRAMES,EXIT_FRAMES} from '../config.js';
const col=(a,b,k)=>new T.Color(a).lerp(new T.Color(b),k);
const backOut=x=>{x=clamp(x);const c=1.9;return 1+(c+1)*(x-1)**3+c*(x-1)**2;};
const reg=(o,id,name,kind='icon')=>{registerEditable(o,{id,name,kind});return o;};
// ---- small shape helpers ----
const dropPts=(w,h,n=36)=>{const a=[];for(let i=0;i<n;i++){const t=i/n*Math.PI*2;a.push([w*Math.sin(t)*Math.sin(t/2)/.77,-h*Math.cos(t)]);}return a;}; // teardrop, tip up, centred
const flamePts=(w,h)=>dropPts(w,h/2).map(([x,y])=>[x,y-h/2]); // bottom edge at y=0, tip at y=-h
const leafPts=(w,h,n=16)=>{const a=[];for(let i=0;i<=n;i++){const s=i/n;a.push([w*Math.sin(Math.PI*s)**.85,-h+2*h*s]);}for(let i=n-1;i>=1;i--){const s=i/n;a.push([-w*Math.sin(Math.PI*s)**.85,-h+2*h*s]);}return a;};
const leaf=(g,w,h,c,rot,x,y)=>{const k=group(g,x,y);k.rotation.z=rot;poly(k,leafPts(w,h),c);return k;};
const pathPoint=(pts,f)=>{const segs=[];let tot=0;for(let i=1;i<pts.length;i++){const l=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);segs.push(l);tot+=l;}let d=((f%1)+1)%1*tot;for(let i=0;i<segs.length;i++){if(d<=segs[i]){const k=d/segs[i];return [pts[i][0]+(pts[i+1][0]-pts[i][0])*k,pts[i][1]+(pts[i+1][1]-pts[i][1])*k];}d-=segs[i];}return pts.at(-1);};
const at=(g,x,y,s=1)=>{g.position.set(x,y,0);g.userData.home=[x,y];g.scale.setScalar(s);g.userData.s0=s;return g;};
const pill=(parent,cx,cy,w,h,fill,label,size=40,tc='#ffffff')=>{const k=group(parent);rect(k,-w/2,-h/2,w,h,fill,h/2);text(k,label,0,0,size,tc,{weight:700});at(k,cx,cy);return k;};
// ================= title + rule (page-3 style; rule geometry is the handoff state, do not move) =================
const ruleG=group();E(rect(ruleG,60,158,1180,3,C.line),'shape-ptitle-rule','標題底線');E(rect(ruleG,60,155,135,8,C.teal),'shape-ptitle-accent','標題強調短線');
const titleG=group();text(titleG,'能源轉換（低碳與無碳能源）',60,94,60,C.blue,{align:'left',weight:700});
// ================= teaching-zone bands (columns of the timeline) =================
const bandRect=(x,w,fill,id,name)=>{const g=group();rect(g,x,318,w,294,fill,22);return reg(g,id,name,'shape');};
const band0=bandRect(60,300,'#eef2f4','shape-band-now','現在欄底色'),band1=bandRect(372,418,C.ice,'shape-band-short','短期欄底色'),band2=bandRect(802,438,C.pale,'shape-band-long','長期欄底色');
// ================= timeline strip (y 238) =================
const TY=238,PX={now:200,short:580,long:1020};
const trackG=group();const trackBase=rect(trackG,0,-4,1,8,'#cfdcdf');trackBase.position.x=100;
const trackHead=group();poly(trackHead,[[1214,TY-20],[1252,TY],[1214,TY+20]],'#cfdcdf');reg(trackHead,'shape-track-head','時間軸箭頭','shape');
reg(trackG,'line-track-base','時間軸（現在→短期→長期）','line');trackG.position.set(0,TY,0);
const fillA=group(),fillB=group(),fillC=group();
const mkFill=(g,x,c,id,name)=>{const m=rect(g,0,-6,1,12,c);m.position.x=x;g.position.set(0,TY,0);reg(g,id,name,'line');return m;};
const fa=mkFill(fillA,272,C.blue,'line-fill-now-short','時間軸進度（現在→短期）'),fb=mkFill(fillB,652,C.teal,'line-fill-short-long','時間軸進度（短期→長期）'),fc=mkFill(fillC,1092,C.teal,'line-fill-long-end','時間軸進度（長期→無碳）');
const chevrons=[700,770,840,910,1128,1188].map((x,i)=>{const g=group();line(g,[[x-9,TY-14],[x+7,TY],[x-9,TY+14]],'#9fb6bb',6);return reg(g,`shape-chevron-${i+1}`,`循序漸進箭頭 ${i+1}`,'shape');});
const mkPill=(key,label,fill,id)=>{const g=group();const k=group(g);rect(k,-72,-32,144,64,fill,32);text(k,label,0,0,44,'#ffffff',{weight:700});reg(g,id,`${label}節點`);at(g,PX[key],TY);return g;};
const pillNow=mkPill('now','現在',C.grey,'icon-pill-now'),pillShort=mkPill('short','短期',C.blue,'icon-pill-short'),pillLong=mkPill('long','長期',C.teal,'icon-pill-long');
// clock ("需要時間")
const clockG=group();{const k=group(clockG);disk(k,0,0,34,C.navy);disk(k,0,0,28,'#ffffff');for(let i=0;i<12;i++){const t=group(k);t.rotation.z=i*Math.PI/6;rect(t,-1.5,-26,3,i%3?5:8,C.navy);}
 var minute=group(k),hour=group(k);rect(minute,-2,-23,4,25,C.blue,2);rect(hour,-2.5,-15,5,17,C.navy,2);disk(k,0,0,4,C.teal);at(clockG,390,TY);reg(clockG,'icon-clock','時鐘（需要時間）');}
// ================= icons =================
const smokes=[],flames=[],bubbles=[],rotors=[];
function coalPlant(g,dark=false){const b=dark?'#46535f':'#5b6b7a',t=dark?'#6a7885':'#7f8e9b';
 rect(g,-72,12,144,46,b,4);rect(g,-72,0,52,14,b,3);poly(g,[[-52,12],[-18,12],[-24,-38],[-46,-38]],t);poly(g,[[2,12],[36,12],[30,-38],[8,-38]],t);
 rect(g,48,-52,16,64,b,2);rect(g,48,-42,16,8,'#c0392b');rect(g,48,-26,16,8,'#c0392b');rect(g,-82,58,164,6,'#3d4b58',2);
 for(let i=0;i<4;i++)rect(g,-60+i*30,26,16,12,'#c7d2da',2);
 for(let i=0;i<3;i++){const s=group(g,-35,-40);disk(s,0,0,14,dark?'#8a98a5':'#a9b5bf');smokes.push({s,i,x:-35,y:-40,k:i});}}
function barrel(g){rect(g,-30,-48,60,96,'#4a5560',12);rect(g,-30,-26,60,8,'#8b98a3');rect(g,-30,10,60,8,'#8b98a3');rect(g,-26,-54,52,8,'#6c7a86',4);const d=group(g,0,-4);poly(d,dropPts(10,14),'#e6edf2');}
function flameIcon(g,outer,mid,core,base,k=1){rect(g,-34,38,68,12,base,4);rect(g,-22,28,44,12,base,3);const f=group(g,0,30);f.scale.setScalar(k);poly(f,flamePts(31,70),outer);const m=group(f,0,-2);poly(m,flamePts(19,44),mid);const c=group(f,0,-4);poly(c,flamePts(9,22),core);f.userData.k=k;flames.push(f);return f;}
function bioIcon(g,r=50){disk(g,0,0,r,C.pale);disk(g,0,0,r-4,'#c5ebdc');const k=group(g);leaf(k,22,38,C.green,-.7,-6,2);leaf(k,15,26,'#7ccaa4',.8,12,-2);rect(k,-3,-8,5,34,'#ffffff',2).rotation.z=-.45;const d=group(g,20,22);poly(d,dropPts(10,14),C.gold);return k;}
function plantIcon(g){poly(g,[[-24,12],[24,12],[18,38],[-18,38]],C.amber);rect(g,-3,-22,6,36,C.green);const l1=leaf(g,13,24,C.green,-.9,-14,-12),l2=leaf(g,13,24,'#7ccaa4',.9,14,-22);return [l1,l2];}
function h2Tank(g){rect(g,-44,34,12,14,C.navy,2);rect(g,32,34,12,14,C.navy,2);rect(g,-10,-46,20,14,C.navy,3);rect(g,-66,-34,132,70,C.teal,35);rect(g,-46,-24,92,10,'#6fcfc9',5);text(g,'H₂',0,8,40,'#ffffff',{weight:700});
 for(let i=0;i<4;i++){const b=group(g,0,0);disk(b,0,0,[7,5,6,4][i],'#9fe0da');bubbles.push({b,i,x:-30+i*20});}}
function windTurbine(g){E(rect(g,-7,-110,14,230,C.navy,5),'shape-wind-tower','風機塔柱');E(poly(g,[[-18,120],[18,120],[10,-105],[-10,-105]],'#8fbfbb'),'shape-wind-tower-fill','風機塔身');E(rect(g,-42,117,84,8,C.navy,4),'shape-wind-base','風機底座');const rotor=group(g,0,-110);for(let i=0;i<3;i++){const blade=group(rotor);blade.rotation.z=i*Math.PI*2/3;poly(blade,[[0,0],[-13,-23],[-8,-110],[5,-127],[11,-22]],C.teal);E(blade,`shape-wind-blade-${i+1}`,`風機葉片 ${i+1}`,{center:false});}E(disk(rotor,0,0,16,C.navy),'shape-wind-hub','風機輪轂');E(disk(rotor,0,0,7,C.white),'shape-wind-hub-core','輪轂中心');E(rotor,'icon-wind-rotor','風機葉輪（葉片與輪轂）',{center:false});rotors.push(rotor);}
function solarPanel(g){E(rect(g,-10,8,12,55,C.navy),'shape-solar-pole','光電板支柱');E(rect(g,-60,64,125,7,C.navy,3),'shape-solar-base','光電板底座');E(poly(g,[[-85,-47],[65,-47],[95,29],[-65,29]],C.navy),'shape-solar-frame','光電板外框');E(poly(g,[[-78,-41],[61,-41],[86,22],[-61,22]],C.blue),'shape-solar-glass','光電板玻璃');const grid=group(g);for(let i=1;i<4;i++)E(line(grid,[[-78+i*35,-40],[-61+i*36,21]],'#a8cfdf',2),`line-solar-grid-v${i}`,`光電板直格線 ${i}`);for(let j=1;j<3;j++)E(line(grid,[[-78+j*5,-41+j*21],[61+j*8,-41+j*21]],'#a8cfdf',2),`line-solar-grid-h${j}`,`光電板橫格線 ${j}`);E(grid,'icon-solar-grid','光電板格線');}

const label=(x,y,s,c=C.navy)=>{const g=group();text(g,s,x,y,40,c,{weight:700});return g;};
// ---- 現在: coal + oil ----
const coalG=group(),oilG=group();coalPlant(coalG);barrel(oilG);at(coalG,140,455);at(oilG,270,468);reg(coalG,'icon-coal','燃煤發電廠');reg(oilG,'icon-oil','石油桶（燃油）');
const lbCoal=label(140,565,'燃煤',C.grey),lbOil=label(270,565,'燃油',C.grey);
const crossBuild=(len,x,y,id,name)=>{const g=group();const a=rect(g,-len/2,-5,len,10,C.red,5),b=rect(g,-len/2,-5,len,10,C.red,5);a.rotation.z=Math.PI/4;b.rotation.z=-Math.PI/4;at(g,x,y);return {g:reg(g,id,name),a,b};};
const crossCoal=crossBuild(112,140,455,'icon-cross-coal','燃煤 ✕'),crossOil=crossBuild(88,270,468,'icon-cross-oil','燃油 ✕');
// ---- 短期: natural gas + biomass ----
const gasG=group();flameIcon(gasG,'#2f80d8','#8fcdf7','#ffffff',C.blue);at(gasG,480,455);reg(gasG,'icon-gas','天然氣火焰');
const bioG=group();bioIcon(bioG);at(bioG,690,455);reg(bioG,'icon-biomass','生質燃料（葉片與油滴）');
const lbGas=label(480,565,'天然氣',C.blue),lbBio=label(690,565,'生質燃料',C.green);
// ---- 長期: solar, wind, hydrogen ----
const solarG=group();solarPanel(solarG);at(solarG,880,443,.75);reg(solarG,'icon-solar','太陽光電板');
const sunG=group();{disk(sunG,0,0,18,C.gold);const rays=group(sunG);for(let i=0;i<8;i++){const r=group(rays);r.rotation.z=i*Math.PI/4;rect(r,-2,-34,4,10,C.gold,2);}at(sunG,835,398);reg(sunG,'icon-sun','太陽');}
const sunRays=sunG.children[1];
const windG=group();windTurbine(windG);at(windG,1050,480,.42);reg(windG,'icon-wind','風力發電機');
const h2G=group();h2Tank(h2G);at(h2G,1170,455);reg(h2G,'icon-h2','氫氣儲槽（H₂）');
const lbSolar=label(880,565,'太陽光電',C.blue),lbWind=label(1050,565,'風電',C.teal),lbH2=label(1170,565,'氫能',C.teal);
// "接近無碳" pill + declining CO2 bars
const nearG=pill(root,1020,350,196,56,C.teal,'接近無碳');reg(nearG,'icon-near-zero','「接近無碳」標籤');
const barsG=group();const bars=[];{[105,80,56,32,10].forEach((h,i)=>{const b=group(barsG,910+i*46,500);rect(b,-17,-h,34,h,i<2?C.amber:i<4?'#6ab98c':C.teal,4);bars.push(b);});rect(barsG,880,500,250,5,C.navy,2);reg(barsG,'icon-co2-bars','碳排逐步下降長條圖');}
const barLabel=group();text(barLabel,'CO₂',1138,430,40,C.grey,{align:'left',weight:700});
// ================= 生質燃料 focus (hero icons) =================
const heroBio=group();bioIcon(heroBio,64);at(heroBio,380,455);reg(heroBio,'icon-hero-biofuel','生質燃料（主角圖示）');
const lbHeroBio=label(380,565,'生質燃料',C.green);
const heroFossil=group();{const k=group(heroFossil,-70,6);k.scale.setScalar(.8);coalPlant(k,true);const o=group(heroFossil,92,14);o.scale.setScalar(.8);barrel(o);at(heroFossil,820,455);reg(heroFossil,'icon-hero-fossil','傳統化石燃料（燃煤與燃油）');}
const lbHeroFossil=label(820,565,'傳統化石燃料',C.grey);
const checkPill=(cx,cy,w,fill,s,id,name)=>{const g=pill(root,cx,cy,w,56,fill,s);g.children[1].position.x=14;line(g,[[-w/2+20,0],[-w/2+32,12],[-w/2+52,-11]],'#ffffff',6);at(g,cx,cy);return reg(g,id,name);};
const cleanBadge=checkPill(380,356,200,C.green,'更乾淨','icon-clean-badge','「更乾淨」標籤');
// ================= two reason frames =================
const mkFrame=(x,w,fill,border,id,name)=>{const g=group();rect(g,x,318,w,294,border,24);rect(g,x+4,322,w-8,286,fill,20);return reg(g,id,name,'shape');};
const frameL=mkFrame(60,740,'#f1f9f5','#b9ddcd','shape-frame-cycle','碳中和循環框'),frameR=mkFrame(820,420,'#f4f7fb','#c6d4e5','shape-frame-pollutant','污染物比較框');
const chipL=pill(root,256,350,360,52,C.green,'碳中和的循環特性'),chipR=pill(root,996,350,320,52,C.blue,'有害污染物較少');reg(chipL,'icon-chip-neutral','「碳中和的循環特性」標籤');reg(chipR,'icon-chip-pollutant','「有害污染物較少」標籤');
// loop: A plant (170) -> B biofuel (430) -> C combustion (690) -> CO2 returns above to the plant
const LY=482,LP=[[170,LY],[430,LY],[690,LY],[690,412],[170,412],[170,LY]];
const arrowG=(pts,id,name,head)=>{const g=group();line(g,pts,C.green,8);poly(g,head,C.green);return reg(g,id,name,'shape');};
const arr1=arrowG([[226,LY],[366,LY]],'shape-loop-arrow-1','循環箭頭：植物→生質燃料',[[366,LY-14],[386,LY],[366,LY+14]]),arr2=arrowG([[486,LY],[626,LY]],'shape-loop-arrow-2','循環箭頭：生質燃料→燃燒',[[626,LY-14],[646,LY],[626,LY+14]]);
const retG=group();line(retG,[[690,438],[690,412],[170,412],[170,424]],'#9bcbb6',8);disk(retG,690,412,4,'#9bcbb6');disk(retG,170,412,4,'#9bcbb6');poly(retG,[[156,422],[170,442],[184,422]],'#9bcbb6');reg(retG,'shape-loop-return','循環回路：CO₂ 回到植物','shape');
const dotsG=group();const loopDots=[0,1,2,3,4].map(()=>disk(dotsG,0,0,7,C.green));reg(dotsG,'shape-loop-dots','循環光點','shape');
const nodeRing=(g,c)=>{disk(g,0,0,44,c);disk(g,0,0,38,'#ffffff');};
const nodeA=group(),nodeB=group(),nodeC=group();
nodeRing(nodeA,C.green);const plantLeaves=(()=>{const k=group(nodeA,0,4);k.scale.setScalar(.7);return plantIcon(k);})();at(nodeA,170,LY);reg(nodeA,'icon-node-plant','植物（吸收 CO₂）');
nodeRing(nodeB,C.green);{const k=group(nodeB);k.scale.setScalar(.62);bioIcon(k,50);}at(nodeB,430,LY);reg(nodeB,'icon-node-biofuel','生質燃料');
nodeRing(nodeC,'#e8872b');{const k=group(nodeC,0,6);k.scale.setScalar(.56);flameIcon(k,'#e8872b','#f5c04a','#fff3c4','#7a8794');}at(nodeC,690,LY);reg(nodeC,'icon-node-burn','燃燒（釋放 CO₂）');
const lbA=label(170,565,'植物吸收',C.green),lbB=label(430,565,'生質燃料',C.green),lbC=label(690,565,'燃燒釋放','#c06a14');
const cloud=(x,id)=>{const g=group();disk(g,-28,6,20,'#b3c3d1');disk(g,0,-6,27,'#b3c3d1');disk(g,30,6,20,'#b3c3d1');rect(g,-48,6,96,20,'#b3c3d1',2);text(g,'CO₂',x===300?.5:0,6,40,C.navy,{weight:700});at(g,x,412);return reg(g,id,'CO₂ 雲朵');};
const cloud1=cloud(560,'icon-cloud-release'),cloud2=cloud(300,'icon-cloud-absorb');
// pollutants: fossil (many, large, dark) vs biofuel (few, small, light)
const mkStack=(x,body,band,id,name)=>{const g=group();rect(g,-16,-40,32,80,body,3);rect(g,-22,-46,44,10,band,3);if(band!==body)rect(g,-16,-6,32,10,band);at(g,x,495);return reg(g,id,name);};
const stackF=mkStack(930,'#5b6b7a','#3d4b58','icon-stack-fossil','化石燃料煙囪'),stackB=mkStack(1130,C.green,'#2d8e68','icon-stack-biofuel','生質燃料煙囪');
const partsF=group(),partsB=group();const pF=[0,1,2,3,4,5,6].map(i=>disk(partsF,0,0,[12,10,14,9,13,11,10][i],'#4a5560')),pB=[0,1,2].map(i=>disk(partsB,0,0,[5,4,5][i],'#9fb1c0'));reg(partsF,'shape-particles-fossil','污染物粒子（多、大）','shape');reg(partsB,'shape-particles-biofuel','污染物粒子（少、小）','shape');
const lbF=label(930,565,'化石燃料',C.grey),lbBR=label(1130,565,'生質燃料',C.green);
const lessBadge=checkPill(1040,420,130,C.green,'較少','icon-less-badge','「較少」標籤');
// ================= bottom cards (both slide bullets) =================
const CARD_Y=630,CARD_H=338;
function card(x,w,c,fill,title,chips,detail,id,name){
 const g=group();E(rect(g,x,CARD_Y,w,CARD_H,c,22),`shape-card-${id}-border`,`${title}卡片外框`);E(rect(g,x+4,CARD_Y+4,w-8,CARD_H-8,fill,18),`shape-card-${id}-fill`,`${title}卡片底色`);
 text(g,title,x+26,CARD_Y+44,44,c,{align:'left',weight:700});
 let cx=x+26;chips.forEach(([s,cc],k)=>{const cw=s.length*40+40;E(rect(g,cx,CARD_Y+84,cw,52,cc||c,26),`shape-card-${id}-chip-${k+1}`,`${s}標籤底`);text(g,s,cx+cw/2,CARD_Y+110,40,'#ffffff',{weight:700});cx+=cw+12;});
 const n=detail.split('\n').length;text(g,detail,x+20,CARD_Y+150+(n*54+6)/2,40,C.navy,{align:'left',weight:400});
 return reg(g,`icon-card-${id}`,name);}
const card1=card(60,560,C.blue,C.ice,'短期替代',[['天然氣',C.blue],['生質燃料',C.green]],'以「天然氣」及生質燃料\n取代燃煤與燃油','short','短期替代卡片');
const card2=card(640,600,C.teal,C.pale,'長期轉型',[['太陽光電',C.blue],['風電',C.teal],['氫能',C.teal]],'布局綠電（如太陽光電、風電）\n以及無碳能源（如氫能）\n技術的商業化應用','long','長期轉型卡片');
// ================= pose =================
const topLevel=[...root.children].filter(c=>c!==ruleG);
const place=(g,m,a)=>{const alpha=clamp(a)*m;g.visible=alpha>.003;if(g.visible)opacity(g,alpha);return g.visible;};
const pop=(g,t,cue,{d=.5,m=1,k=1,dx=0,dy=0}={})=>{const p=prog(t,cue,d),v=backOut(p),h=g.userData.home||[0,0],s0=g.userData.s0||1;g.position.set(h[0]+dx*(1-ease(p)),h[1]+dy*(1-ease(p)),0);g.scale.setScalar(s0*(.4+.6*v)*k);return place(g,m,p*2.5);};
const fade=(g,t,cue,{d:dd=.5,m=1}={})=>place(g,m,ease(prog(t,cue,dd)));
const slide=(g,t,cue,{dx=0,dy=14,d=.6,m=1}={})=>{const p=prog(t,cue,d),v=ease(p),h=g.userData.home||[0,0];g.position.set(h[0]+dx*(1-v),h[1]+dy*(1-v),0);return place(g,m,p);};
const fadedMats=new Set();
export function posePage(seconds){
 for(const m of fadedMats)m.opacity=m.userData.preFade;fadedMats.clear(); // undo last frame's exit fade for objects whose opacity is not re-posed every frame
 const t=Math.max(0,Math.min(seconds,DURATION));
 for(const c of topLevel)c.visible=false; // anything not posed below stays hidden (frame 0 = rule only)
 // phases
 const out=ease(prog(t,Q.focus-.17,.45)),back=ease(prog(t,Q.back+.15,.6)),vis=1-out*(1-back); // now/short column visibility (hidden while the biofuel explanation runs)
 const fm=ease(prog(t,Q.frames,.5))*(1-ease(prog(t,Q.back,.5))); // the two reason frames
 const heroM=ease(prog(t,Q.focus-.05,.3))*(1-ease(prog(t,Q.frames-.28,.4)));
 // title
 arrive(titleG,t,Q.title,{dy:42,d:.75});
 // ---- timeline strip ----
 {const tp=ease(prog(t,Q.now,3.7));trackG.visible=tp>0;trackBase.scale.x=Math.max(.001,1114*tp);trackBase.position.x=100+trackBase.scale.x/2;opacity(trackG,1);fade(trackHead,t,Q.now+3.5,{d:.3});
  const sa=ease(prog(t,Q.short,.9)),sb=ease(prog(t,Q.long,1.0)),sc=ease(prog(t,Q.near,1.2));
  fa.scale.x=Math.max(.001,236*sa);fa.position.x=272+fa.scale.x/2;fillA.visible=sa>0;opacity(fillA,1);fb.scale.x=Math.max(.001,296*sb);fb.position.x=652+fb.scale.x/2;fillB.visible=sb>0;opacity(fillB,1);fc.scale.x=Math.max(.001,120*sc);fc.position.x=1092+fc.scale.x/2;fillC.visible=sc>0;opacity(fillC,1);
  pop(pillNow,t,Q.now,{d:.45});
  const pk=(pl,cue,act)=>{const a=ease(prog(t,act,.5));pop(pl,t,cue,{d:.45,m:.42+.58*a,k:1+.12*Math.sin(Math.PI*prog(t,act,.6))});};
  pk(pillShort,Q.steps+.15,Q.short);pk(pillLong,Q.steps+.95,Q.long);
  chevrons.forEach((g,i)=>{const cue=i<4?Q.steps+.22*i:Q.near+.2*(i-4);slide(g,t,cue,{dx:-16,dy:0,d:.4});if(g.visible){const k=i<4?ease(prog(t,Q.long+.2*i,.5)):ease(prog(t,Q.near+.2*(i-4),.5));const c=col('#9fb6bb',C.teal,k);g.traverse(o=>{if(o.material)o.material.color.copy(c);});}});
  pop(clockG,t,Q.clock,{d:.5,dy:10});minute.rotation.z=t*I.clockSpeed;hour.rotation.z=t*I.clockSpeed/12;}
 // ---- bands + columns ----
 fade(band0,t,Q.now+.05,{m:vis});fade(band1,t,Q.short,{m:vis});fade(band2,t,Q.long,{m:1});
 pop(coalG,t,Q.now+.1,{m:vis*(1-.7*ease(prog(t,Q.replace+.45,.6)))});pop(oilG,t,Q.now+.2,{m:vis*(1-.7*ease(prog(t,Q.replace+.6,.6)))});
 slide(lbCoal,t,Q.now+.25,{m:vis*(1-.45*ease(prog(t,Q.replace+.45,.6)))});slide(lbOil,t,Q.now+.35,{m:vis*(1-.45*ease(prog(t,Q.replace+.6,.6)))});
 for(const [cr,d0] of [[crossCoal,0],[crossOil,.18]]){const p=ease(prog(t,Q.replace+d0,.4));cr.a.scale.x=Math.max(.001,p);cr.b.scale.x=Math.max(.001,ease(prog(t,Q.replace+d0+.15,.4)));place(cr.g,vis,p*3);}
 pop(gasG,t,Q.gas,{m:vis});slide(lbGas,t,Q.gas+.12,{m:vis});pop(bioG,t,Q.bio,{m:vis});slide(lbBio,t,Q.bio+.12,{m:vis});
 pop(solarG,t,Q.solar,{d:.6});pop(sunG,t,Q.solar+.05,{d:.6,k:1+I.sunPulse*Math.sin(t*I.sunPulseSpeed)});slide(lbSolar,t,Q.solar+.12);
 pop(windG,t,Q.wind,{d:.6});slide(lbWind,t,Q.wind+.12);pop(h2G,t,Q.h2,{d:.6});slide(lbH2,t,Q.h2+.12);
 {const bm=1-ease(prog(t,Q.solar-.25,.45));pop(nearG,t,Q.near,{d:.5});
  bars.forEach((b,i)=>{b.scale.y=Math.max(.001,ease(prog(t,Q.near+.25+.22*i,.5)));});place(barsG,bm,ease(prog(t,Q.near+.2,.4)));slide(barLabel,t,Q.near+.3,{dy:0,m:bm});}
 // ---- biofuel focus: biofuel is "cleaner" than conventional fossil fuel ----
 pop(heroBio,t,Q.focus,{d:.6,m:heroM});slide(lbHeroBio,t,Q.focus+.12,{m:heroM});
 pop(heroFossil,t,Q.vs,{d:.6,m:heroM});slide(lbHeroFossil,t,Q.vs+.12,{m:heroM});
 pop(cleanBadge,t,Q.clean1,{d:.5,m:heroM,k:1+.12*Math.sin(Math.PI*prog(t,Q.clean2,.5))});
 // ---- two core reasons (frames) ----
 place(frameL,fm,1);place(frameR,fm,1);
 pop(chipL,t,Q.frames+.12,{m:fm});pop(chipR,t,Q.frames+.65,{m:fm});
 pop(nodeB,t,Q.frames+.3,{m:fm});slide(lbB,t,Q.frames+.42,{m:fm});
 pop(nodeA,t,Q.neutral,{m:fm});slide(lbA,t,Q.neutral+.12,{m:fm});slide(arr1,t,Q.neutral+.35,{dx:-20,dy:0,m:fm});
 pop(nodeC,t,Q.neutral+.5,{m:fm});slide(lbC,t,Q.neutral+.62,{m:fm});slide(arr2,t,Q.neutral+.75,{dx:-20,dy:0,m:fm});
 slide(retG,t,Q.cycle,{dx:0,dy:0,d:.8,m:fm});place(dotsG,fm,ease(prog(t,Q.cycle+.4,.5)));
 loopDots.forEach((d,i)=>{const p=pathPoint(LP,t*I.loopDotSpeed+i/5);d.position.set(p[0],p[1],0);});
 pop(cloud1,t,Q.cycle+.9,{m:fm});pop(cloud2,t,Q.cycle+1.15,{m:fm});
 for(const [c,ph] of [[cloud1,0],[cloud2,1.7]])if(c.visible)c.position.y=412+I.cloudBob*Math.sin(t*I.cloudSpeed+ph);
 pop(stackF,t,Q.burn,{m:fm});slide(lbF,t,Q.burn+.12,{m:fm});place(partsF,fm,ease(prog(t,Q.burn+.35,.5)));
 pop(stackB,t,Q.pollut,{m:fm});slide(lbBR,t,Q.pollut+.12,{m:fm});place(partsB,fm,ease(prog(t,Q.pollut+.3,.5)));
 pop(lessBadge,t,Q.less,{d:.5,m:fm});
 // ---- cards ----
 arrive(card1,t,Q.card1,{dy:36,d:.8});arrive(card2,t,Q.card2,{dy:36,d:.8});
 // ---- idle loops (functions of time only; multiply the opacity the pose set above) ----
 flames.forEach((f,i)=>{const k=f.userData.k||1;f.scale.set(k*(1+.05*Math.sin(t*I.flameSpeed*1.3+i)),k*(1+I.flameFlicker*Math.sin(t*I.flameSpeed+i*1.7)+.03*Math.sin(t*I.flameSpeed*2.3)));});
 smokes.forEach(sm=>{const f=((t*I.smokeSpeed+sm.k/3)%1);sm.s.position.set(sm.x+5*Math.sin(f*6+sm.k),sm.y-f*34,0);sm.s.scale.setScalar(.6+.8*f);sm.s.children[0].material.opacity*=Math.sin(Math.PI*f)**.7;});
 bubbles.forEach(({b,i,x})=>{const f=((t*I.bubbleSpeed+i/4)%1);b.position.set(x+4*Math.sin(f*7+i),-48-f*52,0);b.children[0].material.opacity*=Math.sin(Math.PI*f)**.6;});
 rotors.forEach((r,i)=>{r.rotation.z=t*I.windSpeed+i;});sunRays.rotation.z=t*I.sunSpin;
 plantLeaves.forEach((l,i)=>{l.rotation.z=(i?.9:-.9)+I.leafSway*Math.sin(t*I.leafSpeed+i);});
 pF.forEach((m,i)=>{const f=((t*I.particleSpeed+i/7)%1);m.position.set(930+16*Math.sin(f*5+i*1.3),452-f*62,0);m.scale.setScalar(.55+.9*f);m.material.opacity*=Math.sin(Math.PI*f)**.6;});
 pB.forEach((m,i)=>{const f=((t*I.particleSpeed*.8+i/3)%1);m.position.set(1130+9*Math.sin(f*5+i*2),452-f*62,0);m.scale.setScalar(.6+.6*f);m.material.opacity*=Math.sin(Math.PI*f)**.6;});
 bars.forEach((b,i)=>{if(i===4)b.scale.y*=1+I.barPulse*Math.sin(t*2.1);});
 // ---- exit / handoff state: everything except the title rule + accent fades out over the last EXIT_FRAMES frames; the last frame = rule only ----
 {const x=easeIO(clamp((t-(FRAMES-1-EXIT_FRAMES)*DT)/(EXIT_FRAMES*DT)));if(x>0)for(const c of root.children){if(c===ruleG)continue;c.traverse(o=>{if(o.material){o.material.userData.preFade=o.material.opacity;o.material.opacity*=1-x;fadedMats.add(o.material);}});}}
 return {time:seconds,clampedTime:t,exit:clamp((t-(FRAMES-1-EXIT_FRAMES)*DT)/(EXIT_FRAMES*DT))};
}
