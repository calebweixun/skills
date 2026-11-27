// Storyboard: node tools/storyboard.mjs <out.jpg> <t1> <t2> ... [--cols=4] [--w=640] [--single]
// Renders the clean scene at each time (seconds; "last" = final frame), composites on white with a time caption grid, writes one JPG (and, with --single, one JPG per time next to it).
import {writeFile,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {openBrowser} from './browser.mjs';
import {ffmpegBin} from './ffmpeg-path.mjs';
import {DT} from '../src/config.js';
const args=process.argv.slice(2),flags=Object.fromEntries(args.filter(a=>a.startsWith('--')).map(a=>a.slice(2).split('='))),pos=args.filter(a=>!a.startsWith('--'));
const [outFile,...times]=pos,cols=Number(flags.cols||4),W=Number(flags.w||640),H=Math.round(W*9/16),url=process.env.MG_URL||'http://127.0.0.1:4206';
const root=new URL('../',import.meta.url),bin=ffmpegBin;
const tmp=path.join(path.dirname(path.resolve(outFile)),'_sb');await mkdir(tmp,{recursive:true});
const ff=(a)=>new Promise((res,rej)=>{const p=spawn(bin,['-hide_banner','-loglevel','error','-y',...a],{windowsHide:true});let e='';p.stderr.on('data',d=>e+=d);p.on('close',c=>c?rej(new Error(e)):res());});
const browser=await openBrowser();const files=[];
try{const page=await browser.newPage({viewport:{width:1920,height:1080}});await page.goto(url+'/?clean=1'+(process.env.MG_LAYOUT_URL?'&snapshot='+encodeURIComponent(process.env.MG_LAYOUT_URL):''));await page.waitForFunction(()=>window.MG?.ready);
 for(const v of times){const t=v==='last'?(await page.evaluate(()=>MG.duration))-DT:Number(v);const b64=await page.evaluate(t=>{MG.renderAt(t);return MG.canvas.toDataURL('image/png').split(',')[1];},t);const png=path.join(tmp,`s-${v}.png`);await writeFile(png,Buffer.from(b64,'base64'));
  // white background + guide: right 1/3 teacher zone tint, caption with the time
  const jpg=path.join(tmp,`s-${v}.jpg`);await ff(['-f','lavfi','-i','color=c=white:s=1920x1080','-i',png,'-filter_complex',`[0][1]overlay=format=auto,drawbox=x=1280:y=0:w=640:h=1080:color=0xff0000@0.06:t=fill,drawbox=x=0:y=0:w=1920:h=1080:color=0x888888@0.6:t=3[v]`,'-map','[v]','-frames:v','1','-q:v','3',jpg]);files.push({v,jpg});}
}finally{await browser.close();}
if(flags.single)for(const f of files)await ff(['-i',f.jpg,'-q:v','3',path.resolve(outFile).replace(/\.jpg$/,`-${f.v}.jpg`)]);
const rows=Math.ceil(files.length/cols),inputs=files.flatMap(f=>['-i',f.jpg]),lab=files.map((f,i)=>`[${i}:v]scale=${W}:${H},drawtext=text='${f.v}s':x=8:y=6:fontsize=26:fontcolor=black:box=1:boxcolor=yellow@0.8[c${i}]`).join(';'),layout=files.map((f,i)=>`${(i%cols)*W}_${Math.floor(i/cols)*H}`).join('|');
await ff([...inputs,'-filter_complex',`${lab};${files.map((f,i)=>`[c${i}]`).join('')}xstack=inputs=${files.length}:layout=${layout}[o]`,'-map','[o]','-frames:v','1','-q:v','3',path.resolve(outFile)]);
console.log('wrote',outFile);
