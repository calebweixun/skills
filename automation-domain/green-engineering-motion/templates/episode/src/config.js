export const WIDTH=1920,HEIGHT=1080,FPS=60000/1001,DT=1001/60000;
export const SCENE_ID='episode-002-diagnostics',PAGE_LABEL='第二集',DRAFT_KEY='green-motion-episode-002',NOTE_LABEL='',SCENE='page';
export const FRAMES=22096,DURATION=FRAMES*DT,CLIP={frames:FRAMES,duration:DURATION};
export const COLORS={navy:'#163e69',blue:'#29559a',teal:'#149a96',green:'#36a97e',pale:'#e0f3ef',ice:'#e9f0fa',amber:'#c98a22',gold:'#f4c66b',muted:'#7b8c9c',white:'#ffffff',line:'#a0bcbf',trackBlue:'#b9cce8',trackTeal:'#a9d8d4',band:'#f0f6f8',footnote:'#2f9a57'};
// Boundaries snap to the nearest 60000/1001 frame. Absolute time = original ep1.mp4.
const part=(id,label,start,end,mode='left')=>({id,label,start:Math.round(start/DT),end:Math.round(end/DT),mode});
export const PARTS=[part('01-intro','Intro・效率、安全與環境',0,43.2,'center'),part('02-title','標題開場',43.2,59.45,'full'),part('03-context','情境・從訊號到診斷',59.45,106.55),part('04-trl','TRL・綠色設計在哪裡導入',106.55,151.45),part('05-summary','第三段內容摘要轉場',151.45,158.57),part('06-wind','風力機・三項背景知識',158.57,227.0),part('07-principles','運轉原理・感測器匹配',227.0,264.0),part('08-sensors','量測技術・加速規',264.0,302.0),part('09-signals','訊號的物理意義',302.0,338.25),part('10-goals','課程目標・四項重點',338.25,357.0),part('11-outro','片尾收束',357.0,FRAMES*DT,'full')];
export const CHAPTERS=PARTS.map(p=>[p.label,p.start*DT]);
export const IDLE={gearSpeed:.65,waveSpeed:.35};
