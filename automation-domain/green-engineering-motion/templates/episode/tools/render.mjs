import {mkdir,writeFile,readFile,copyFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {openBrowser} from './browser.mjs';
import {ffmpegBin} from './ffmpeg-path.mjs';
import {PARTS,FRAMES,DURATION,DT} from '../src/config.js';
const root=fileURLToPath(new URL('../',import.meta.url)),bin=ffmpegBin,url=process.env.MG_URL||'http://127.0.0.1:4222';
const out=process.env.MG_EXPORT_DIR?path.resolve(process.env.MG_EXPORT_DIR):path.join(root,'exports/v1'),partArg=process.argv.find(a=>a.startsWith('--part='))?.slice(7);
await mkdir(out,{recursive:true});
const errors=[],logs=[];
function ff(args,name){const p=spawn(bin,['-hide_banner','-y',...args],{windowsHide:true});let log='';p.stderr.on('data',d=>log+=d);const done=new Promise((resolve,reject)=>{p.on('error',reject);p.on('close',async c=>{await writeFile(path.join(out,name+'.log'),log);c===0?resolve():reject(new Error(`${name}: ${c}\n${log.slice(-2200)}`));});});done.catch(()=>{});return {p,done};}
const browser=await openBrowser();
async function open(){const p=await browser.newPage({viewport:{width:1920,height:1080}});p.on('pageerror',e=>errors.push(String(e)));await p.goto(url+'/?clean=1'+(process.env.MG_LAYOUT_URL?'&snapshot='+encodeURIComponent(process.env.MG_LAYOUT_URL):''));await p.waitForFunction(()=>window.MG?.ready);return p;}
try{
 const init=await open();
 const layout=await init.evaluate(()=>window.MG.getLayout());await writeFile(path.join(out,'layout.json'),JSON.stringify(layout,null,2));
 const check=await init.evaluate(async()=>{const m=await import('/src/engine/export-check.js');return m.checkExport(window.MG);});await writeFile(path.join(out,'export-check.json'),JSON.stringify(check,null,2));console.log(check.ok?'Export rules passed.':'MG_CHECK_WARNINGS '+check.message);
 if(process.argv.includes('--check-only')){await init.close();}
 else{
 const createdAt=new Date().toISOString();
 await writeFile(path.join(out,'render-start.json'),JSON.stringify({createdAt},null,2));
 await init.close();let completed=0;
 const todo=PARTS.filter(p=>!partArg||p.id===partArg).sort((a,b)=>(b.end-b.start)-(a.end-a.start));
 async function worker(){const page=await open();try{while(todo.length){const p=todo.shift(),n=p.end-p.start,dur=n*DT,dir=path.join(out,p.id);await mkdir(dir,{recursive:true});console.log(`BEGIN ${p.id} ${n} frames`);
  const encoder=ff(['-f','image2pipe','-framerate','60000/1001','-vcodec','png','-i','pipe:0','-an','-c:v','prores_ks','-profile:v','4','-pix_fmt','yuva444p10le','-alpha_bits','16','-qscale:v','9','-threads','3','-vendor','apl0',path.join(dir,'MG-Transparent-1080p5994.mov')],p.id+'-transparent');
  for(let i=0;i<n;i+=8){const count=Math.min(8,n-i),arr=await page.evaluate(({base,count,dt})=>{const a=[];for(let j=0;j<count;j++){window.MG.renderAt((base+j)*dt);a.push(window.MG.canvas.toDataURL('image/png').split(',')[1]);}return a;},{base:p.start+i,count,dt:DT});
   for(let j=0;j<arr.length;j++){const png=Buffer.from(arr[j],'base64');if(i+j===0)await writeFile(path.join(dir,'First-Frame.png'),png);if(i+j===n-1)await writeFile(path.join(dir,'Endpoint-Transparent.png'),png);if(!encoder.p.stdin.write(png))await once(encoder.p.stdin,'drain');}
   if(i%120===0)console.log(`Frames ${completed+i}/${FRAMES} (${p.id} ${i}/${n})`);
  }
  encoder.p.stdin.end();await encoder.done;completed+=n;console.log(`ENCODED ${p.id}`);
  const bg=p.mode==='left'?'white':'0x0a222b',args=['-i',path.join(dir,'MG-Transparent-1080p5994.mov'),'-ss',String(p.start*DT),'-i',path.join(root,'assets/narration.wav')];
  let filter=`color=c=${bg}:s=1920x1080:r=60000/1001:d=${dur}[bg];[bg][0:v]overlay=shortest=1:format=auto,format=yuv420p[v];[1:a]apad[a]`;
  if(p.mode==='center'){args.push('-loop','1','-framerate','60000/1001','-i',path.join(root,'assets/reference-01.png'));filter=`[2:v]scale=1920:1080[bg];[bg][0:v]overlay=shortest=1:format=auto,format=yuv420p[v];[1:a]apad[a]`;}
  await ff([...args,'-filter_complex',filter,'-map','[v]','-map','[a]','-t',String(dur),'-r','60000/1001','-c:v','libx264','-preset','veryfast','-crf','19','-c:a','aac','-b:a','192k','-threads','2','-movflags','+faststart',path.join(dir,'MG-Narration-Preview.mp4')],p.id+'-preview').done;
  const m={...p,startSeconds:p.start*DT,endSeconds:p.end*DT,frames:n,duration:dur,width:1920,height:1080,fps:'60000/1001',format:'ProRes 4444 (encoder input yuva444p10le; FFmpeg decodes yuva444p12le)',previewTeacher:p.mode==='center'?'supplied still image for proportion reference only':null};await writeFile(path.join(dir,'render.json'),JSON.stringify(m,null,2));logs.push(m);console.log(`DONE ${p.id}`);
 }}finally{await page.close();}}
 await Promise.all(Array.from({length:partArg?1:2},worker));
 {
  const list=PARTS.map(p=>`file '${p.id}/MG-Narration-Preview.mp4'\nduration ${(p.end-p.start)*DT}`).join('\n');await writeFile(path.join(out,'preview-concat.txt'),list);
  await ff(['-f','concat','-safe','0','-i',path.join(out,'preview-concat.txt'),'-c:v','copy','-an',path.join(out,'preview-video.mp4')],'preview-concat').done;
  await ff(['-i',path.join(out,'preview-video.mp4'),'-i',path.join(root,'assets/narration.wav'),'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','256k','-t',String(DURATION),'-movflags','+faststart',path.join(out,'Episode-002-Full-Narration-Preview.mp4')],'preview-final').done;
  await writeFile(path.join(out,'transparent-concat.txt'),PARTS.map(p=>`file '${p.id}/MG-Transparent-1080p5994.mov'`).join('\n'));
  await ff(['-f','concat','-safe','0','-i',path.join(out,'transparent-concat.txt'),'-c','copy',path.join(out,'Episode-002-Transparent-1080p5994.mov')],'transparent-concat').done;
  await copyFile(path.join(out,PARTS[0].id,'First-Frame.png'),path.join(out,'First-Frame.png'));await copyFile(path.join(out,PARTS.at(-1).id,'Endpoint-Transparent.png'),path.join(out,'Endpoint-Transparent.png'));
  let prev=null;if(partArg){try{prev=JSON.parse(await readFile(path.join(out,'render.json'),'utf8'));}catch{}}
  const allParts=partArg&&prev?[...prev.parts.filter(x=>x.id!==partArg),...logs]:logs;
  await writeFile(path.join(out,'render.json'),JSON.stringify({createdAt:prev?.createdAt||createdAt,finishedAt:new Date().toISOString(),partsRerendered:partArg?[partArg]:undefined,format:'ProRes 4444 (encoder input yuva444p10le; FFmpeg decodes yuva444p12le)',width:1920,height:1080,fps:'60000/1001',frames:FRAMES,duration:DURATION,parts:allParts.sort((a,b)=>a.start-b.start),browserErrors:errors},null,2));
 }
 console.log('Export complete.');
 }
}finally{await browser.close();}
