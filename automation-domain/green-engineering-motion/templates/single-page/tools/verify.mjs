// Verifies the ACTUAL exported files of one render job (page 4). Usage: node tools/verify.mjs [exports/renders/<job>]  (default = latest job)
// Env: MG_URL (default http://127.0.0.1:4206), P3_ENDPOINT (optional: previous page's Endpoint-Transparent.png; when set, frame 0 is compared with it as the handoff check).
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {openBrowser} from './browser.mjs';
import {jobDir} from './jobs.mjs';
import {ffmpegBin} from './ffmpeg-path.mjs';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {relative} from 'node:path';
import {FRAMES,DURATION,DT,CUES,EXIT_FRAMES} from '../src/config.js';
const root=new URL('../',import.meta.url),file=s=>fileURLToPath(new URL(s,root));const bin=ffmpegBin;
async function ff(args,output='utf8'){return new Promise((resolve,reject)=>{const p=spawn(bin,['-hide_banner',...args],{windowsHide:true});const out=[],err=[];p.stdout.on('data',d=>out.push(d));p.stderr.on('data',d=>err.push(d));p.on('error',reject);p.on('close',code=>code===0?resolve({out:output==='buffer'?Buffer.concat(out):Buffer.concat(out).toString(),err:Buffer.concat(err).toString()}):reject(new Error(Buffer.concat(err).toString().slice(-4000))));});}
const dir=jobDir(root),out=n=>path.join(dir,n),rel=relative(fileURLToPath(root),dir).split(path.sep).join('/'),base=process.env.MG_URL||'http://127.0.0.1:4206';
const P3=process.env.P3_ENDPOINT&&existsSync(process.env.P3_ENDPOINT)?process.env.P3_ENDPOINT:null;
console.log('Verifying '+dir);
const hash=b=>createHash('sha256').update(b).digest('hex');
const report={job:dir,checks:{},samples:[],source:'assets/narration.wav',spec:{width:1920,height:1080,fps:'60000/1001',frames:FRAMES,duration:DURATION}};
const mov=out('Energy-Transition-Transparent-1080p5994.mov'),mp4=out('Energy-Transition-Teacher-Sync-Preview.mp4');
const movDecoded=await ff(['-i',mov,'-filter_complex','[0:v]split[v][a];[a]alphaextract,crop=640:1080:1280:0,format=gray[reserved]','-map','[v]','-map','[reserved]','-threads:v','1','-f','framemd5','-']);await writeFile(out('movie-framemd5.txt'),movDecoded.out);
const rows=movDecoded.out.split('\n').filter(x=>x&&!x.startsWith('#'));const hashes=rows.filter(x=>/^0,/.test(x));const reserved=rows.filter(x=>/^1,/.test(x));const transparentRegionHash=createHash('md5').update(Buffer.alloc(640*1080)).digest('hex');
report.presenterSafeArea={x:1280,width:640,checkedFrames:reserved.length};report.checks.presenterAreaEmptyAllFrames=reserved.length===FRAMES&&reserved.every(s=>s.split(',').at(-1).trim()===transparentRegionHash);
report.actualMovieInfo=movDecoded.err.slice(0,2200);report.actualFrameCount=hashes.length;report.checks.frames=hashes.length===FRAMES;
report.checks.frameTimebase=/60000/.test(movDecoded.out)&&/1001/.test(movDecoded.out);report.checks.size=/1920x1080/.test(movDecoded.err);report.checks.codec=/prores/.test(movDecoded.err)&&/4444/.test(movDecoded.err);report.checks.alphaPixelFormat=/yuva444p/.test(movDecoded.err);
const tb=movDecoded.out.match(/#tb 0:\s*(\d+)\/(\d+)/),last=hashes.at(-1).split(',').map(s=>s.trim());report.actualDurationSeconds=tb?(Number(last[2])+Number(last[3]))*Number(tb[1])/Number(tb[2]):null;report.checks.duration=Math.abs(report.actualDurationSeconds-DURATION)<0.00001;
const hs=hashes.map(s=>s.split(',').at(-1).trim());
{const i0=Math.ceil(CUES.freeze/DT),i1=FRAMES-1-EXIT_FRAMES;const tail=hs.slice(i0,i1);report.tailFrames=tail.length;report.tailDistinctFrames=new Set(tail).size;report.checks.movieTailAnimates=tail.length>10&&report.tailDistinctFrames>=Math.floor(tail.length*.8);}
report.checks.movieFirstEqualsLastHash=hs[0]===hs.at(-1);
const previewDecoded=await ff(['-i',mp4,'-map','0:v','-f','framemd5','-']);report.previewActualFrames=previewDecoded.out.split('\n').filter(x=>x&&!x.startsWith('#')).length;report.checks.previewFrames=report.previewActualFrames===FRAMES;report.checks.previewAudio=/Audio: aac/.test(previewDecoded.err);report.previewInfo=previewDecoded.err.slice(0,1800);
{const a=await ff(['-i',mp4,'-map','0:a','-f','null','-']);const t=[...a.err.matchAll(/time=(\d+):(\d+):([\d.]+)/g)].at(-1);const sec=t?Number(t[1])*3600+Number(t[2])*60+Number(t[3]):0;report.previewAudioSeconds=sec;
 const wavBytes=(await readFile(file('assets/narration.wav'))).length;report.narrationSeconds=(wavBytes-44)/(48000*4);report.checks.durationMatchesNarration=DURATION>=report.narrationSeconds-.001&&DURATION-report.narrationSeconds<2*DT&&Math.abs(sec-DURATION)<.05;
 const A=(await ff(['-i',mp4,'-map','0:a','-t','36','-ac','1','-ar','16000','-f','s16le','pipe:1'],'buffer')).out,B=(await ff(['-i',file('assets/narration.wav'),'-t','36','-ac','1','-ar','16000','-f','s16le','pipe:1'],'buffer')).out;
 const n2=Math.min(A.length,B.length)>>1;let num=0,da=0,db=0;for(let k=2000;k<n2;k++){const x=A.readInt16LE(k*2),y=B.readInt16LE(k*2);num+=x*y;da+=x*x;db+=y*y;}report.audioCorrelationWithNarration=num/Math.sqrt(da*db);report.checks.previewAudioSync=report.audioCorrelationWithNarration>.95;}
await mkdir(out('decoded'),{recursive:true});
const times=[0,1.4,3,5.4,7.3,9.4,11,14,16,18.5,20.5,23,25,27.5,30,33,34.9,35.6];
const alphas=[];
for(const t of times){
 await ff(['-y','-ss',String(t),'-i',mov,'-frames:v','1','-pix_fmt','rgba',out(`decoded/transparent-${t}s.png`)]);
 await ff(['-y','-ss',String(t),'-i',mp4,'-frames:v','1',out(`decoded/preview-${t}s.png`)]);
 const a=await ff(['-ss',String(t),'-i',mov,'-frames:v','1','-vf','alphaextract','-f','rawvideo','-pix_fmt','gray','pipe:1'],'buffer');let min=255,max=0,zero=0,full=0;for(const v of a.out){min=Math.min(min,v);max=Math.max(max,v);if(!v)zero++;if(v===255)full++;}report.samples.push({time:t,alpha:{min,max,zeroPixels:zero,opaquePixels:full},alphaHash:hash(a.out)});alphas.push(a.out);
}
report.checks.actualDecodedAlpha=report.samples.every(s=>s.alpha.min===0&&(s.time===0||s.alpha.max>0)&&s.alpha.zeroPixels>1000000);
const guide=(await ff(['-i',file('assets/corner-guide.png'),'-vf','alphaextract,format=gray','-f','rawvideo','-pix_fmt','gray','pipe:1'],'buffer')).out;
report.cornerOverlapPixels=alphas.map(buf=>{let n=0;for(let i=0;i<guide.length;i++)if(guide[i]>8&&buf[i]>8)n++;return n;});report.checks.actualCornerDecorationClear=report.cornerOverlapPixels.every(n=>n===0);
// ---- pixel comparison helpers (composited on white, 8-bit) ----
async function rgba(args){return (await ff([...args,'-f','rawvideo','-pix_fmt','rgba','pipe:1'],'buffer')).out;}
function diff(a,b){let n=0,max=0,sum=0,bb=[1e9,1e9,-1,-1];for(let i=0;i<a.length;i+=4){let m=0;for(let c=0;c<3;c++){const x=a[i+c]*a[i+3]/255+255*(1-a[i+3]/255),y=b[i+c]*b[i+3]/255+255*(1-b[i+3]/255);m=Math.max(m,Math.abs(x-y));}m=Math.max(m,Math.abs(a[i+3]-b[i+3]));if(m>0){n++;sum+=m;max=Math.max(max,m);const p=(i/4)%1920,q=Math.floor(i/4/1920);bb=[Math.min(bb[0],p),Math.min(bb[1],q),Math.max(bb[2],p),Math.max(bb[3],q)];}}return {differingPixels:n,maxDelta:Math.round(max*10)/10,meanDeltaOverDiffering:n?Math.round(sum/n*100)/100:0,bbox:n?bb:null};}
{const ref=P3?await rgba(['-i',P3]):null,firstPng=await rgba(['-i',out('First-Frame.png')]),lastPng=await rgba(['-i',out('Endpoint-Transparent.png')]),movFirst=await rgba(['-i',mov,'-frames:v','1']),movLast=await rgba(['-i',mov,'-vf',`select=eq(n\\,${FRAMES-1})`,'-vsync','0','-frames:v','1']);
 if(ref){report.frame0VsPage3Handoff={reference:P3,rawCanvasFrame0:diff(firstPng,ref),decodedMovFrame0:diff(movFirst,ref)};
 report.checks.frame0MatchesPage3Handoff=report.frame0VsPage3Handoff.rawCanvasFrame0.differingPixels===0&&report.frame0VsPage3Handoff.decodedMovFrame0.maxDelta<=24;}
 report.lastVsFirst={rawCanvas:diff(lastPng,firstPng),decodedMov:diff(movLast,movFirst)};report.checks.lastFrameEqualsFrame0=report.lastVsFirst.rawCanvas.differingPixels===0&&report.lastVsFirst.decodedMov.maxDelta<=2;
 let ob=[1e9,1e9,-1,-1];for(let i=0;i<firstPng.length;i+=4)if(firstPng[i+3]>0){const p=(i/4)%1920,q=Math.floor(i/4/1920);ob=[Math.min(ob[0],p),Math.min(ob[1],q),Math.max(ob[2],p),Math.max(ob[3],q)];}report.frame0OpaqueBBox=ob;}
const browser=await openBrowser();try{const page=await browser.newPage({viewport:{width:1920,height:1080}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(base+'/?clean=1&snapshot='+encodeURIComponent('/'+rel+'/layout.json'));await page.waitForFunction(()=>window.MG?.ready);
 const mid=Math.round(FRAMES/3)*DT;
 const determinism=await page.evaluate(([mid,end])=>{const capture=t=>{window.MG.renderAt(t);return window.MG.canvas.toDataURL();};capture(mid);const a=capture(mid);capture(end);capture(.2);const b=capture(mid);return {backwardSeek:a===b,drawingBuffer:[window.MG.canvas.width,window.MG.canvas.height]};},[mid,DURATION-DT]);report.checks.backwardSeek=determinism.backwardSeek;report.checks.drawingBuffer=determinism.drawingBuffer.join('x')==='1920x1080';report.browser=determinism;
 const T0=CUES.freeze+.05,T1=(FRAMES-1-EXIT_FRAMES)*DT-.05;
 report.checks.browserTailAnimates=await page.evaluate(([a,b])=>{const c=t=>{MG.renderAt(t);return MG.canvas.toDataURL();};return c(a)!==c(b);},[T0,T1]);
 const regions=await page.evaluate(([a0,b0])=>{const at=t=>{MG.renderAt(t);return MG.getItems().filter(i=>i.active&&i.bounds).map(i=>({id:i.id,kind:i.kind,b:i.bounds}));};const a=at(a0),b=at(b0);
   const still=a.filter(i=>i.kind==='text'&&b.some(j=>j.id===i.id)).map(i=>({id:i.id,b:i.b}));
   const mv=id=>{const x=a.find(i=>i.id===id)?.b,y=b.find(i=>i.id===id)?.b;return x&&y&&x.x===y.x&&x.y===y.y?null:{x,y};};return {still,textBoundsMoved:still.filter(s=>{const y=b.find(i=>i.id===s.id).b;return Math.abs(y.x-s.b.x)>.01||Math.abs(y.y-s.b.y)>.01||Math.abs(y.width-s.b.width)>.01;}).map(s=>s.id),rotor:a.find(i=>i.id==='icon-wind-rotor')?.b};},[T0,T1]);
 const crop=async(t,r)=>hash((await ff(['-ss',String(t),'-i',mov,'-frames:v','1','-vf',`crop=${Math.ceil(r.width)+2}:${Math.ceil(r.height)+2}:${Math.max(0,Math.floor(r.x)-1)}:${Math.max(0,Math.floor(r.y)-1)}`,'-f','rawvideo','-pix_fmt','rgba','pipe:1'],'buffer')).out);
 // text static: each text region identical between two idle-tail frames of the ACTUAL movie, unless an idle object overlaps (flames, particles etc. are separate non-text items)
 report.idleRegions={staticTextRegions:regions.still.length,textBoundsMoved:regions.textBoundsMoved};const unstable=[];for(const r of regions.still)if(await crop(T0,r.b)!==await crop(T1,r.b))unstable.push(r.id);report.idleRegions.unstableTextRegions=unstable;report.idleRegions.rotorChanged=await crop(T0,regions.rotor)!==await crop(T1,regions.rotor);
 report.checks.textStaticWhileIdleMoves=regions.still.length>=15&&unstable.length===0&&regions.textBoundsMoved.length===0&&report.idleRegions.rotorChanged;
 // cues: object absent just before its cue, present just after
 report.cueCheck=await page.evaluate(()=>{const vis=(t,id)=>{MG.renderAt(t);return !!MG.getItem(id)?.active;};const C=(id,cue)=>({id,cue,before:vis(cue-.3,id),after:vis(cue+.5,id)});return [C('icon-coal',1.30+.1),C('icon-clock',2.33),C('icon-pill-short',3.37),C('icon-gas',7.22),C('icon-biomass',8.08),C('icon-cross-coal',9.20),C('icon-card-short',9.80),C('icon-hero-biofuel',10.37),C('icon-hero-fossil',13.07),C('icon-clean-badge',15.07),C('shape-frame-cycle',17.62),C('icon-node-plant',19.62),C('shape-loop-return',21.0),C('icon-stack-fossil',22.64),C('icon-stack-biofuel',24.30),C('icon-less-badge',25.45),C('icon-near-zero',28.55),C('icon-card-long',29.05),C('icon-solar',32.55),C('icon-wind',33.89),C('icon-h2',34.70)];});
 report.checks.cuesAppearInOrder=report.cueCheck.every(c=>!c.before&&c.after);
 report.exportRules=await page.evaluate(async()=>{const {checkExport}=await import('/src/engine/export-check.js');return checkExport(window.MG);});report.checks.exportRules=report.exportRules.ok;
 report.typography=await page.evaluate(()=>{const res=[];for(const t of [34.5,35.5]){MG.renderAt(t);for(const i of MG.getItems().filter(i=>i.kind==='text'&&i.active&&i.name.trim()))res.push({name:i.name,fs:i.style.fontSize*i.layoutScale,right:i.bounds.x+i.bounds.width});}return {minimumTeachingSize:Math.min(...res.map(r=>r.fs)),maxRight:Math.max(...res.map(r=>r.right)),texts:res.length,unit:'1920x1080 output pixels; 40px = 20pt'};});
 report.checks.minimumTypography=report.typography.minimumTeachingSize>=40;report.checks.textInsideContentZone=report.typography.maxRight<=1280;
 await page.goto(base);await page.waitForFunction(()=>window.MG?.ready);await page.evaluate(()=>window.MG.renderAt(35));await page.screenshot({path:out('editor-view.png')});
 await page.click('#restart');await page.click('#play');await page.waitForFunction(()=>document.querySelector('audio').currentTime>.6,{timeout:8000});report.playerAudioSync=await page.evaluate(()=>({audioTime:document.querySelector('audio').currentTime,displayedTime:parseFloat(document.querySelector('#time').textContent),audioDuration:document.querySelector('audio').duration,playing:!document.querySelector('audio').paused}));report.checks.playerAudioSync=report.playerAudioSync.playing&&Math.abs(report.playerAudioSync.audioTime-report.playerAudioSync.displayedTime)<.06;await page.click('#play');
 report.checks.noBrowserErrors=errors.length===0;report.browserErrors=errors;
}finally{await browser.close();}
// Export rules are reminders only: reported as warnings, never fail the run.
const ruleLabels={exportRules:'輸出規則檢查（字級／右側老師區）',presenterAreaEmptyAllFrames:'右側老師區（x ≥ 1280）有內容',minimumTypography:'教學文字小於 20 pt',textInsideContentZone:'文字超出 x=1280',actualCornerDecorationClear:'輸出畫面與左下角藍色裝飾重疊'};
report.ruleChecks={};report.warnings=[];for(const [k,label] of Object.entries(ruleLabels)){if(!(k in report.checks))continue;report.ruleChecks[k]=report.checks[k];delete report.checks[k];if(!report.ruleChecks[k])report.warnings.push(label+(k==='exportRules'?'：\n'+report.exportRules.message:''));}
report.passed=Object.values(report.checks).every(Boolean);await writeFile(out('verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
