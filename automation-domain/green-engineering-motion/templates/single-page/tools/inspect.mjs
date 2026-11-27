import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {openBrowser} from './browser.mjs';
const base=process.env.MG_URL||'http://127.0.0.1:4205';
const browser=await openBrowser();const page=await browser.newPage({viewport:{width:1920,height:1080}});const errors=[];
page.on('pageerror',e=>errors.push(String(e)));await page.goto(base+'/?clean=1');await page.waitForFunction(()=>window.MG?.ready);
await mkdir(new URL('../review/',import.meta.url),{recursive:true});
for(const t of [0.5,3,7,10.5,13,17.5,21.5,22.8,24.2,26,29.5,31,36]){await page.evaluate(t=>window.MG.renderAt(t),t);const data=await page.evaluate(()=>window.MG.canvas.toDataURL('image/png').split(',')[1]);await writeFile(new URL(`../review/preview-${String(t).replace('.','-')}s.png`,import.meta.url),Buffer.from(data,'base64'));}
await page.goto(base);await page.waitForFunction(()=>window.MG?.ready);await page.evaluate(()=>window.MG.renderAt(36));await page.screenshot({path:fileURLToPath(new URL('../review/player.png',import.meta.url))});
console.log(JSON.stringify({errors}));await browser.close();
