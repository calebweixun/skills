// Writes review/cue-sync.md (+ review/cue-sync.json) from the cue log that src/scenes/page.js records (every entrance = sync(...) call).
import {openBrowser} from './browser.mjs';
import {writeFile} from 'node:fs/promises';
import {PARTS,DT} from '../src/config.js';
const url=process.env.MG_URL||'http://127.0.0.1:4232';
const browser=await openBrowser(),page=await browser.newPage();
try{
 await page.goto(url+'/?clean=1');await page.waitForFunction(()=>window.MG?.ready);
 const log=await page.evaluate(async()=>(await import('/src/scenes/page.js')).cueLog);
 await writeFile('review/cue-sync.json',JSON.stringify(log,null,1));
 const f=v=>v.toFixed(2),L=[];
 L.push('# Episode 2 — cue sync (parts 01 and 03–10)','','Source of spoken times: `review/alignment.json` (faster-whisper small, zh, word timestamps on ep1.mp4). Each entrance starts `lead` seconds before the key word (default 0.2 s, titles ≤ 0.3 s, never earlier) and takes 0.5 s to settle, so the element is fully visible ~0.3 s after the word. `exit` = the narration has moved on and the layout needs the space (0.25 s fade ending at that time); everything else stays on screen to the end of its part (idle motion continues).','','Part 01 was rebuilt in round 5 in the ep0 opening style (spoken times: word timestamps, sentence starts corrected by silence onsets measured on ep1.mp4; nothing is cued earlier than 0.3 s before its word; persistent items fade with the closing 0.25 s of the part so the last frame is empty). Parts 02 and 11 are unchanged in timing. Part 05 (silent “課程重點” transition, no narration) is unchanged.','');
 for(const p of PARTS){const rows=log.filter(r=>r.part===p.id);if(!rows.length)continue;
  L.push(`## ${p.id} — ${p.label} (absolute ${f(p.start*DT)}–${f(p.end*DT)} s)`,'','| element id | element | key phrase (spoken) | spoken abs (s) | spoken part-rel (s) | cue abs (s) | cue part-rel (s) | lead (s) | exit abs (s) |','| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |');
  for(const r of rows.sort((a,b)=>a.cueAbs-b.cueAbs))L.push(`| ${r.id} | ${r.name} | ${r.phrase} | ${f(r.spoken)} | ${f(r.spokenRel)} | ${f(r.cueAbs)} | ${f(r.cue)} | ${f(r.spoken-r.cueAbs)} | ${r.until===null?'—':f(r.until)} |`);
  L.push('');}
 const bad=log.filter(r=>r.spoken-r.cueAbs<-0.01);L.push('## Checks','',`- entries: ${log.length}; any cue later than its spoken word: ${bad.length}; any cue more than 0.3 s ahead of its word: ${log.filter(r=>r.spoken-r.cueAbs>0.31).map(r=>r.id).join(', ')||'none'} (the bubble pop-in uses 0.3 s; recap/arrow rows noted in the table).`);
 L.push('','## What was wrong before (round 1 cue → spoken word, absolute seconds)','','| part | element | round-1 cue (abs) | actually spoken | old cue early by (+) / late by (−) |','| --- | --- | ---: | ---: | ---: |');
 for(const r of [['03','三列卡片「運轉原理」',60.15,62.4],['03','「量測技術」',62.45,64.3],['03','「訊號的物理意義」',65.85,67.7],['03','軸承運轉順暢面板',73.65,75.7],['03','振動量升高面板',84.5,85.7],['03','異常種類繁多',89.85,91.4],['03','診斷模型卡',97.3,100.9],['03','金字塔（全部六層，各 0.45 s）',101.05,100.9],['04','TRL 1 圓點（全部九點 0.35 s 間隔）',112.95,113.9],['04','TRL 4–6 說明列',123.55,115.3],['04','綠色設計→維護→診斷流程',134.55,139.6],['06','振動／轉速／發電量感測器',170.57,170.9],['06','「運轉原理」切換',182.27,184.1],['07','旋轉設備卡',227.6,231.3],['07','移動與距離卡',230.5,236.0],['08','電容式加速規圖',284.9,285.7],['09','Before／After 頻譜',322.0,323.3],['10','第 1 行目標',338.35,341.0]])L.push(`| ${r[0]} | ${r[1]} | ${f(r[2])} | ${f(r[3])} | ${(r[3]-r[2]>=0?'+':'')+f(r[3]-r[2])} |`);
 await writeFile('review/cue-sync.md',L.join('\n'));console.log('rows',log.length,'late',bad.length);
}finally{await browser.close();}
