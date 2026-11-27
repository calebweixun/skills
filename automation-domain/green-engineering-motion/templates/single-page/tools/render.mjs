import {mkdir,writeFile,createWriteStream} from 'node:fs';
import {mkdir as mkdirAsync,writeFile as writeFileAsync} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {openBrowser} from './browser.mjs';
import {ffmpegBin} from './ffmpeg-path.mjs';
import {FRAMES,DURATION,DT} from '../src/config.js';
const SCENE='page',TR=false;
const NAMES={mov:'Energy-Transition-Transparent-1080p5994.mov',preview:'Energy-Transition-Teacher-Sync-Preview.mp4'};
const root=new URL('../',import.meta.url),file=s=>fileURLToPath(new URL(s,root));
const bin=ffmpegBin,url=process.env.MG_URL||'http://127.0.0.1:4206';
const outputRoot=process.env.MG_EXPORT_DIR?path.resolve(process.env.MG_EXPORT_DIR):file('exports');
const output=name=>path.join(outputRoot,name);
const pngSequence=process.argv.includes('--png-sequence'),checkOnly=process.argv.includes('--check-only'),strict=process.argv.includes('--strict');
await mkdirAsync(outputRoot,{recursive:true});await mkdirAsync(file('review'),{recursive:true});
if(pngSequence)await mkdirAsync(output('png-sequence'),{recursive:true});
const logs=[];
function ff(args,name){const p=spawn(bin,['-hide_banner','-y',...args],{windowsHide:true});let log='';p.stderr.on('data',d=>log+=d);const done=new Promise((resolve,reject)=>{p.on('error',reject);p.on('close',code=>{writeFile(file(`review/${name}.log`),log,()=>{});code===0?resolve():reject(new Error(`${name}: ${code}\n${log.slice(-3000)}`));});});return {p,done};}
const browser=await openBrowser();let page;
try{
 page=await browser.newPage({viewport:{width:1920,height:1080}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const snapshot=process.env.MG_LAYOUT_URL;await page.goto(url+'/?clean=1'+(TR?'&scene=transition':'')+(snapshot?'&snapshot='+encodeURIComponent(snapshot):''));await page.waitForFunction(()=>window.MG?.ready);
 if(await page.evaluate(()=>window.MG.getItems().some(i=>i.overflow)))throw new Error('文字框過窄，請拉寬文字框後重新輸出。');
 const check=TR?{ok:true,errors:[],message:'',warnings:[]}:await page.evaluate(async()=>{const {checkExport}=await import('/src/engine/export-check.js');return checkExport(window.MG);});
 await writeFileAsync(output('export-check.json'),JSON.stringify(check,null,2));
 if(!check.ok){console.log('MG_CHECK_WARNINGS（輸出提醒，不影響輸出）\n'+check.message);if(strict){console.error('MG_CHECK_FAILED\n'+check.message);process.exitCode=3;throw Object.assign(new Error('export rules'),{checked:true});}}
 if(checkOnly){console.log(check.ok?'Export rules passed.':'Export rules: '+check.errors.length+' reminder(s) above (informational; export is not blocked).');process.exitCode=0;throw Object.assign(new Error('check only'),{checked:true,ok:true});}
 const exportedLayout=await page.evaluate(()=>window.MG.getLayout());await writeFileAsync(output('layout.json'),JSON.stringify(exportedLayout,null,2));
 const encoder=ff(['-f','image2pipe','-framerate','60000/1001','-vcodec','png','-i','pipe:0','-an','-c:v','prores_ks','-profile:v','4','-pix_fmt','yuva444p10le','-alpha_bits','16','-qscale:v','9','-threads','4','-vendor','apl0',output(NAMES.mov)],TR?'encode-transparent-transition':'encode-transparent');
 let lastPNG;const start=Date.now();
 for(let base=0;base<FRAMES;base+=12){const count=Math.min(12,FRAMES-base);const frames=await page.evaluate(({base,count,dt})=>{const out=[];for(let j=0;j<count;j++){window.MG.renderAt((base+j)*dt);out.push(window.MG.canvas.toDataURL('image/png').split(',')[1]);}return out;},{base,count,dt:DT});
  for(let j=0;j<frames.length;j++){lastPNG=Buffer.from(frames[j],'base64');if(base+j===0)await writeFileAsync(output('First-Frame.png'),lastPNG);if(pngSequence)await writeFileAsync(output(`png-sequence/frame-${String(base+j).padStart(5,'0')}.png`),lastPNG);if(!encoder.p.stdin.write(lastPNG))await once(encoder.p.stdin,'drain');}
  if(base%120===0)console.log(`Frames ${base}/${FRAMES}, ${((Date.now()-start)/1000).toFixed(0)}s elapsed`);
 }
 encoder.p.stdin.end();await encoder.done;await writeFileAsync(output('Endpoint-Transparent.png'),lastPNG);
 if(errors.length)throw new Error(errors.join('\n'));
 console.log('Transparent movie completed. Compositing narration preview...');
 const pa=TR?['-f','lavfi','-i','anullsrc=r=48000:cl=stereo']:['-i',file('assets/narration.wav')];const preview=ff(['-i',output(NAMES.mov),...pa,'-filter_complex',`color=c=white:s=1920x1080:r=60000/1001:d=${DURATION}[bg];[bg][0:v]overlay=shortest=1:format=auto,format=yuv420p[v];[1:a]apad[a]`,'-map','[v]','-map','[a]','-t',String(DURATION),'-c:v','libx264','-preset','fast','-crf','18','-c:a','aac','-b:a','192k','-r','60000/1001','-movflags','+faststart','-threads','4',output(NAMES.preview)],TR?'encode-preview-transition':'encode-preview');await preview.done;
 if(!TR){console.log('Compositing original vs MG comparison...');
 await new Promise(resolve=>{const c=spawn(process.execPath,[file('tools/compare-source.mjs')],{windowsHide:true,env:{...process.env,MG_EXPORT_DIR:outputRoot},stdio:'inherit'});c.on('error',resolve);c.on('close',resolve);});}
 await writeFileAsync(output('render.json'),JSON.stringify({scene:SCENE,width:1920,height:1080,fps:'60000/1001',frames:FRAMES,duration:DURATION,layout:exportedLayout,transparent:'prores_ks profile 4 yuva444p10le alpha_bits16',elapsedSeconds:(Date.now()-start)/1000,browserErrors:errors,exportWarnings:check.errors},null,2));
 console.log('Export complete.');
}catch(error){if(!error.checked)throw error;}finally{await browser.close();}
