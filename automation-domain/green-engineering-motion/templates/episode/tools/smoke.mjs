import {spawn} from 'node:child_process';
import {writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import net from 'node:net';
import {openBrowser} from './browser.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),dir=path.join(root,'tools/.smoke-'+Date.now()),port=process.env.MG_SMOKE_PORT||'4232',base=`http://127.0.0.1:${port}`;await mkdir(dir,{recursive:true});
await new Promise((resolve,reject)=>{const probe=net.createServer();probe.once('error',()=>reject(new Error(`Smoke test port ${port} is occupied; set MG_SMOKE_PORT.`)));probe.listen(Number(port),'127.0.0.1',()=>probe.close(resolve));});
const server=spawn(process.execPath,['server.mjs'],{cwd:root,windowsHide:true,env:{...process.env,PORT:port,MG_LAYOUT_FILE:path.join(dir,'layout.json')}});let browser;const checks=[],errors=[];
const ok=(value,label)=>{checks.push({label,ok:!!value});if(!value)throw new Error(label);};
try{
 for(let i=0;i<40;i++){try{if((await fetch(base+'/api/layout')).ok)break;}catch{}await new Promise(r=>setTimeout(r,150));}
 browser=await openBrowser();const p=await browser.newPage({viewport:{width:1680,height:1100}});p.on('pageerror',e=>errors.push(String(e)));await p.goto(base+'/?t=355');await p.waitForFunction(()=>window.MG?.editor);
 ok(await p.evaluate(()=>MG.ready&&MG.canvas.width===1920&&MG.canvas.height===1080),'1920×1080 editor ready');
 const id=await p.evaluate(()=>MG.getItems().find(i=>i.kind==='text'&&i.name==='課程目標').id);await p.evaluate(id=>{MG.editor.select([id]);},id);
 const before=await p.evaluate(id=>MG.getItem(id).bounds.x,id);await p.fill('#prop-x','80');await p.locator('#prop-x').dispatchEvent('change');
 const after=await p.evaluate(id=>MG.getItem(id).bounds.x,id);ok(Math.abs(before-after)>5,'inspector edits visible text position');
 await p.evaluate(()=>MG.editor.undo());const undone=await p.evaluate(id=>MG.getItem(id).bounds.x,id);ok(Math.abs(undone-before)<.1,'undo restores the position');
 await p.evaluate(()=>MG.editor.redo());ok(Math.abs((await p.evaluate(id=>MG.getItem(id).bounds.x,id))-after)<.1,'redo restores the edit');
 ok(await p.evaluate(()=>MG.editor.save()),'save layout succeeds');await p.reload();await p.waitForFunction(()=>window.MG?.editor);ok(Math.abs((await p.evaluate(id=>MG.getItem(id).bounds.x,id))-after)<.1,'saved layout survives reload');
 await p.evaluate(()=>MG.renderAt(35));ok(await p.locator('#teacher-reference').isVisible(),'intro teacher proportion reference visible');await p.evaluate(()=>MG.renderAt(155));ok(!await p.locator('#teacher-reference').isVisible(),'teacher reference hidden in later content');
 ok(errors.length===0,'no browser exceptions');
 console.log(JSON.stringify({checks,errors},null,2));await writeFile(path.join(dir,'smoke.json'),JSON.stringify({checks,errors},null,2));
}finally{await browser?.close();server.kill();}
