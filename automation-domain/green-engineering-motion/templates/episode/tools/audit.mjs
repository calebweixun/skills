// node tools/audit.mjs out.json  -> text inventory of the build served at MG_URL (default :4232)
import {openBrowser} from './browser.mjs';import {writeFile} from 'node:fs/promises';
const b=await openBrowser(),p=await b.newPage();await p.goto((process.env.MG_URL||'http://127.0.0.1:4232')+'/?clean=1');await p.waitForFunction(()=>window.MG?.ready);
const a=await p.evaluate(async()=>(await import('/src/scenes/page.js')).textAudit());await writeFile(process.argv[2],JSON.stringify(a,null,1));console.log(a.length);await b.close();
