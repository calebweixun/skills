// Renders single transparent stills from the running preview server: node tools/still.mjs <outDir> <t1> [t2 ...]
// (t = "last" for the final frame). Used to compare against exports without a full render.
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {openBrowser} from './browser.mjs';
import {DT} from '../src/config.js';
const [dir,...times]=process.argv.slice(2),url=process.env.MG_URL||'http://127.0.0.1:4206';
await mkdir(dir,{recursive:true});const browser=await openBrowser();
try{const page=await browser.newPage({viewport:{width:1920,height:1080}});await page.goto(url+'/?clean=1'+(process.env.MG_SCENE==='transition'?'&scene=transition':'')+(process.env.MG_LAYOUT_URL?'&snapshot='+encodeURIComponent(process.env.MG_LAYOUT_URL):''));page.on('pageerror',e=>console.log('ERR',e.message));page.on('console',m=>console.log('C',m.text()));await page.waitForFunction(()=>window.MG,null,{polling:100});if(!await page.evaluate(()=>window.MG.ready))throw new Error(await page.evaluate(()=>window.MG.error));
 for(const v of times){const t=v==='last'?(await page.evaluate(()=>MG.duration))-DT:Number(v);const b64=await page.evaluate(t=>{MG.renderAt(t);return MG.canvas.toDataURL('image/png').split(',')[1];},t);await writeFile(path.join(dir,`still-${v}.png`),Buffer.from(b64,'base64'));console.log('wrote',v);}
}finally{await browser.close();}
