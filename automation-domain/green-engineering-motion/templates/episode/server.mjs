import http from 'node:http';
import {createReadStream,existsSync,statSync} from 'node:fs';
import {readFile,writeFile,mkdir,rename,copyFile,readdir,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn,execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {validateLayout,tidyLayout} from './src/engine/layout-model.js';
const root=path.dirname(fileURLToPath(import.meta.url)),port=Number(process.env.PORT||4222),jobs=new Map();
// Listen addresses (MG_LISTEN, comma list, default 127.0.0.1; 127.0.0.1 is always required for the internal render). Never binds 0.0.0.0.
const listenAddrs=(process.env.MG_LISTEN||process.env.MG_HOST||'127.0.0.1').split(',').map(s=>s.trim()).filter(Boolean);
if(listenAddrs.some(a=>a==='0.0.0.0'||a==='::'))throw new Error('不允許綁定 0.0.0.0／::，請指定明確位址。');
if(!listenAddrs.includes('127.0.0.1'))listenAddrs.unshift('127.0.0.1');
const allowedNames=new Set(['localhost',...listenAddrs,...(process.env.MG_ALLOWED_HOSTS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean)]);
if(listenAddrs.some(a=>a.startsWith('100.'))){try{const t=process.env.TAILSCALE_EXE||'tailscale',dns=JSON.parse(execFileSync(t,['status','--json'],{timeout:5000,windowsHide:true}).toString()).Self?.DNSName;if(dns){const full=dns.replace(/\.$/,'').toLowerCase();allowedNames.add(full);allowedNames.add(full.split('.')[0]);}}catch{}}
const allowedHosts=new Set([...allowedNames].map(n=>`${n}:${port}`));
const layoutFile=process.env.MG_LAYOUT_FILE?path.resolve(process.env.MG_LAYOUT_FILE):path.join(root,'layout.json'),historyDir=process.env.MG_LAYOUT_FILE?path.join(path.dirname(layoutFile),'history'):path.join(root,'layouts/history'),jobsRoot=path.join(root,'exports/renders');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.mov':'video/quicktime','.wav':'audio/wav','.zip':'application/zip','.md':'text/plain; charset=utf-8'};
const vendor={'/vendor/three.module.js':'node_modules/three/build/three.module.js','/vendor/three.core.js':'node_modules/three/build/three.core.js'};
const json=(res,status,data)=>res.writeHead(status,{'Content-Type':types['.json'],'Cache-Control':'no-store'}).end(JSON.stringify(data));
async function body(req){if(!/^application\/json\b/.test(req.headers['content-type']||''))throw Object.assign(new Error('請使用 JSON 格式。'),{status:415});let size=0,parts=[];for await(const chunk of req){size+=chunk.length;if(size>262144)throw Object.assign(new Error('版面檔案過大。'),{status:413});parts.push(chunk);}try{return JSON.parse(Buffer.concat(parts).toString('utf8'));}catch{throw Object.assign(new Error('JSON 格式錯誤。'),{status:400});}}
async function project(){if(!existsSync(layoutFile))return {layout:tidyLayout(),revision:0};const raw=JSON.parse(await readFile(layoutFile,'utf8'));return {layout:validateLayout(raw),revision:raw.revision||0};}
async function jobRecord(job){await writeFile(path.join(jobsRoot,job.id,'job.json'),JSON.stringify(job,null,2),'utf8');}
async function recentJobs(){await mkdir(jobsRoot,{recursive:true});const ids=(await readdir(jobsRoot,{withFileTypes:true})).filter(d=>d.isDirectory()&&/^\d{8}T\d{6}-[a-f0-9]{8}$/.test(d.name)).map(d=>d.name).sort().reverse().slice(0,8);const list=[];for(const id of ids){if(jobs.has(id)){list.push(jobs.get(id));continue;}try{const job=JSON.parse(await readFile(path.join(jobsRoot,id,'job.json'),'utf8'));if(job.status==='running'){job.status='failed';job.message='伺服器已重新啟動，請重新輸出。';}list.push(job);}catch{}}return list;}
async function startRender(layout,scene='page'){const TR=false;
 const active=[...jobs.values()].find(j=>j.status==='running');if(active)throw Object.assign(new Error('已有影片正在輸出，請等待完成。'),{status:409,job:active});
 const id=new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'-'+randomUUID().slice(0,8),dir=path.join(jobsRoot,id);
 await mkdir(dir,{recursive:true});await writeFile(path.join(dir,'layout.json'),JSON.stringify(layout,null,2),'utf8');
 const env={...process.env,MG_URL:`http://127.0.0.1:${port}`,MG_EXPORT_DIR:dir,MG_LAYOUT_URL:`/exports/renders/${id}/layout.json`,MG_JOB_ID:id,MG_SCENE:'page'};
 const pre=await new Promise(resolve=>{let out='';const c=spawn(process.execPath,[path.join(root,'tools/render.mjs'),'--check-only'],{cwd:root,windowsHide:true,env});c.stdout.on('data',d=>out+=d);c.stderr.on('data',d=>out+=d);c.on('error',e=>resolve({code:1,out:e.message}));c.on('close',code=>resolve({code,out}));});
 if(pre.code!==0){await rm(dir,{recursive:true,force:true});throw Object.assign(new Error('輸出前檢查失敗：'+pre.out.trim().slice(-600)),{status:422});}
 // Export rules are reminders only: they are listed on the job but never block it.
 let warnings=[];try{warnings=JSON.parse(await readFile(path.join(dir,'export-check.json'),'utf8')).errors||[];}catch{}
 const job={id,scene,status:'running',progress:0,message:'準備畫面',createdAt:new Date().toISOString(),layout,warnings,files:null};jobs.set(id,job);await jobRecord(job);
 if(process.env.MG_RENDER_STUB){job.status='complete';job.progress=100;job.message='影片已完成（測試模式，未實際繪製）';job.finishedAt=new Date().toISOString();await jobRecord(job);return job;}
 const child=spawn(process.execPath,[path.join(root,'tools/render.mjs')],{cwd:root,windowsHide:true,env});
 let log='',pending='';const logStream=await import('node:fs').then(fs=>fs.createWriteStream(path.join(dir,'render.log')));
 child.stdout.on('data',d=>{logStream.write(d);log+=d;pending+=d;const lines=pending.split('\n');pending=lines.pop();for(const line of lines){const m=line.match(/Frames (\d+)\/(\d+)/);if(m){job.progress=Math.round(Number(m[1])/Number(m[2])*88);job.message=`繪製影格 ${m[1]} / ${m[2]}`;}if(line.includes('Compositing narration')){job.progress=92;job.message='合成老師原音預覽';}if(line.includes('Compositing original')){job.progress=96;job.message='合成原片對照版';}}});
 child.stderr.on('data',d=>{logStream.write(d);log+=d;});
 let finalized=false;async function finish(code,error){if(finalized)return;finalized=true;logStream.end();job.finishedAt=new Date().toISOString();if(code===0&&!error){job.status='complete';job.progress=100;job.message='影片已完成';const prefix=`/exports/renders/${id}/`;job.files=TR?{transparent:prefix+'Transition-2to3-Transparent-1080p5994.mov',preview:prefix+'Transition-2to3-Preview.mp4',png:prefix+'Endpoint-Transparent.png',layout:prefix+'layout.json'}:{transparent:prefix+'Episode-002-Transparent-1080p5994.mov',preview:prefix+'Episode-002-Full-Narration-Preview.mp4',png:prefix+'Endpoint-Transparent.png',layout:prefix+'layout.json'};}else{job.status='failed';job.message=error?.message||log.trim().slice(-1200)||'輸出失敗，請重試。';}await jobRecord(job);}
 child.on('error',e=>finish(1,e));child.on('close',c=>finish(c));return job;
}
const handler=async(req,res)=>{try{
 const host=req.headers.host||'';if(!allowedHosts.has(host.toLowerCase())){json(res,403,{error:'只接受本機或已授權（Tailscale）的編輯器連線。'});return;}
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{json(res,400,{error:'無效網址。'});return;}
 if(pathname==='/favicon.ico'){res.writeHead(204).end();return;}
 if(req.method==='POST'){
  if(req.headers.origin&&new URL(req.headers.origin).host!==host){json(res,403,{error:'不接受其他網站的寫入請求。'});return;}
  if(pathname==='/api/layout'){
   const input=await body(req),current=await project();if(input.baseRevision!==current.revision){json(res,409,{error:'專案已在另一個分頁更新。請先匯出目前版面備份，再按「載入已儲存」取得最新版。',revision:current.revision});return;}
   const layout=validateLayout(input.layout);layout.updatedAt=new Date().toISOString();const revision=current.revision+1;
   await mkdir(historyDir,{recursive:true});if(existsSync(layoutFile))await copyFile(layoutFile,path.join(historyDir,`${Date.now()}-${revision-1}.json`));
   const temporary=layoutFile+'.tmp';await writeFile(temporary,JSON.stringify({...layout,revision},null,2),'utf8');await rename(temporary,layoutFile);json(res,200,{layout,revision});return;
  }
  if(pathname==='/api/render'){const input=await body(req),layout=validateLayout(input.layout);const job=await startRender(layout,'page');json(res,202,{job});return;}
  json(res,404,{error:'找不到此功能。'});return;
 }
 if(!['GET','HEAD'].includes(req.method)){json(res,405,{error:'不支援的操作。'});return;}
 if(pathname==='/api/layout'){json(res,200,await project());return;}
 if(pathname==='/api/renders'){json(res,200,{jobs:await recentJobs()});return;}
 const jobMatch=pathname.match(/^\/api\/render\/([\dT]+-[a-f0-9]{8})$/);if(jobMatch){const job=(await recentJobs()).find(j=>j.id===jobMatch[1]);json(res,job?200:404,job?{job}:{error:'找不到輸出工作。'});return;}
 const relative=vendor[pathname]||(pathname==='/'?'index.html':pathname.slice(1)),file=path.resolve(root,relative);
 if(!file.startsWith(root+path.sep)||(!vendor[pathname]&&relative.split(/[\\/]/).some(p=>p.startsWith('.')||p==='node_modules'))){res.writeHead(403).end();return;}
 if(!existsSync(file)||!statSync(file).isFile()){res.writeHead(404).end('Not found');return;}
 const size=statSync(file).size,headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'},range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
 if(range){const start=Number(range[1]),end=Math.min(range[2]?Number(range[2]):size-1,size-1);if(start>end||start>=size){res.writeHead(416,{'Content-Range':`bytes */${size}`}).end();return;}res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});if(req.method==='HEAD')res.end();else createReadStream(file,{start,end}).pipe(res);}
 else{res.writeHead(200,{...headers,'Content-Length':size});if(req.method==='HEAD')res.end();else createReadStream(file).pipe(res);}
}catch(error){json(res,error.status||400,{error:error.message,job:error.job});}};
for(const addr of listenAddrs){const server=http.createServer(handler);server.on('error',e=>{console.error(`${addr}:${port} ${e.message}`);process.exit(1);});server.listen(port,addr,()=>console.log(`MG Layout Editor: http://${addr}:${port}`));}
