// Screenshot of the editor at time t (default 36 s) with edit mode on and every hit rectangle outlined.
// node tools/editor-shot.mjs out.png [t]
import {openBrowser} from './browser.mjs';
const [out,t='29']=process.argv.slice(2),url=process.env.MG_URL||'http://127.0.0.1:4205';
const browser=await openBrowser();
try{const page=await browser.newPage({viewport:{width:1920,height:1080}});await page.addInitScript(()=>{try{localStorage.removeItem('green-motion-layout-editor-page-003');}catch{}});
 await page.goto(url);await page.waitForFunction(()=>window.MG?.editor||window.MG?.error,null,{polling:100});
 await page.evaluate(t=>{MG.editor.setMode(true);MG.renderAt(Number(t));},t);
 await page.addStyleTag({content:'#edit-overlay rect.hit{stroke:#e0245e;stroke-width:1;fill:rgba(224,36,94,.06);vector-effect:non-scaling-stroke}'});
 await page.waitForTimeout(300);const n=await page.evaluate(()=>document.querySelectorAll('#edit-overlay rect.hit').length);console.log('hit rects:',n);
 await page.screenshot({path:out});
}finally{await browser.close();}
