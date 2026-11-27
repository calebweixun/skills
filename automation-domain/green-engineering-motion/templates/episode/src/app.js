import {renderer,renderAt} from './scene.js';
import {getLayout,setLayout,getItems,getItem} from './engine/layout-engine.js';
import {DT,CHAPTERS,SCENE,CLIP,PARTS} from './config.js';
const DURATION=CLIP.duration,FRAMES=CLIP.frames;
const $=s=>document.querySelector(s),params=new URLSearchParams(location.search),clean=params.has('clean');
$('#stage').append(renderer.domElement);if(clean){document.body.classList.add('clean');document.body.classList.remove('editing');}
const audio=$('#audio');let t=clean&&!params.has('t')?0:Number(params.get('t')||(PARTS.find(p=>p.id==='10-goals').start*DT+1)),playing=false,clockStart=0,projectInfo,lastMode;
function seek(seconds){t=Math.max(0,Math.min(seconds,DURATION-DT));const state=renderAt(t);if(lastMode!==state.mode){$('#safe-area').checked=state.mode==='left';lastMode=state.mode;}$('#stage').style.background=state.mode==='left'?'':'#0a222b';$('#presenter-zone').style.display=!clean&&$('#guide').checked&&state.mode==='left'?'':'none';$('#corner-guide').style.display=!clean&&$('#guide').checked&&state.mode==='left'?'':'none';$('#teacher-reference').style.display=!clean&&$('#teacher-ref').checked&&state.mode==='center'?'block':'none';$('#timeline').max=DURATION-DT;$('#timeline').value=t;$('#time').textContent=`${t.toFixed(2)} / ${DURATION.toFixed(2)} 秒`;$('#phase').textContent=CHAPTERS.filter(v=>v[1]<=t).at(-1)?.[0]||'';document.querySelectorAll('#chapters button').forEach(b=>b.classList.toggle('active',Number(b.dataset.time)<=t&&Number(b.dataset.end)>t));if(!clean)document.dispatchEvent(new CustomEvent('mg:render',{detail:{time:t}}));return state;}
function pause(){playing=false;audio.pause();$('#play').textContent='播放含老師原音';}
async function play(){if(t>=DURATION-DT)seek(0);window.MG?.editor?.setMode(false);clockStart=performance.now()-t*1000;playing=true;audio.currentTime=Math.min(t,audio.duration||t);$('#play').textContent='暫停';try{if($('#voice').checked)await audio.play();}catch(error){pause();document.dispatchEvent(new CustomEvent('mg:error',{detail:'原音尚未能播放，請再按一次播放，或暫時關閉老師原音。'}));}}
$('#play').onclick=()=>playing?pause():play();$('#restart').onclick=()=>{pause();audio.currentTime=0;seek(0);};$('#timeline').oninput=e=>{pause();seek(Number(e.target.value));audio.currentTime=t;};$('#bg').onchange=e=>{const grid=$('#stage').classList.contains('show-grid');$('#stage').className='stage '+e.target.value+(grid?' show-grid':'');};
$('#voice').onchange=()=>{if(!$('#voice').checked){audio.pause();clockStart=performance.now()-t*1000;}else if(playing){audio.currentTime=t;audio.play().catch(()=>pause());}};
$('#guide').onchange=()=>seek(t);$('#teacher-ref').onchange=()=>seek(t);
CHAPTERS.forEach(([label,time],i)=>{const b=document.createElement('button');b.textContent=`${time.toFixed(1)}s ${label}`;b.dataset.time=time;b.dataset.end=CHAPTERS[i+1]?.[1]??DURATION;b.onclick=()=>{pause();seek(time);audio.currentTime=time;};$('#chapters').append(b);});
function tick(){if(playing){const now=$('#voice').checked&&!audio.paused?audio.currentTime:(performance.now()-clockStart)/1000;seek(now);if(now>=DURATION-DT)pause();}requestAnimationFrame(tick);}requestAnimationFrame(tick);
try{const snapshot=params.get('snapshot');const response=await fetch(snapshot||'/api/layout',{cache:'no-store'});if(!response.ok)throw new Error('版面讀取失敗，請重新載入。');const data=await response.json();projectInfo=snapshot?{layout:data,revision:null}:data;
 setLayout(projectInfo.layout);await document.fonts.ready;seek(t);
 window.MG={ready:true,scene:SCENE,renderAt:seek,seekFrame:i=>seek(i*DT),pause,play,get time(){return t;},get playing(){return playing;},duration:DURATION,frameCount:FRAMES,canvas:renderer.domElement,getItems,getItem,getLayout,setLayout:value=>{setLayout(value);seek(t);},projectInfo};
 if(!clean){const {initEditor}=await import('./engine/editor.js');await initEditor(window.MG);}
}catch(error){$('#save-status').textContent=error.message;window.MG={ready:false,error:error.message};console.error(error);}
