import {spawn} from 'node:child_process';
import {once} from 'node:events';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),port=process.env.MG_CHECK_PORT||'4232';
const env={...process.env,PORT:port,MG_URL:`http://127.0.0.1:${port}`,MG_EXPORT_DIR:path.join(root,'tools/.check-test')};
const server=spawn(process.execPath,['server.mjs'],{cwd:root,env,stdio:['ignore','pipe','pipe'],windowsHide:true});
try{
 let ready=false;
 await new Promise((resolve,reject)=>{server.once('error',reject);server.once('exit',c=>{if(!ready)reject(new Error(`Test server exited (${c}); port may be occupied.`));});server.stderr.on('data',d=>{if(!ready)reject(new Error(String(d)));});server.stdout.on('data',d=>{if(String(d).includes('MG Layout Editor:')){ready=true;resolve();}});});
 const child=spawn(process.execPath,['tools/render.mjs','--check-only'],{cwd:root,env,stdio:'inherit',windowsHide:true});
 const [code]=await once(child,'exit');if(code!==0)process.exitCode=code||1;
}finally{server.kill();}
