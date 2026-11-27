// Page-specific configuration (page 4 = slide 4 「能源轉換（低碳與無碳能源）」). Everything the shared engine needs from the page lives here.
export const WIDTH=1920, HEIGHT=1080, FPS=60000/1001, DT=1001/60000;
export const SCENE_ID='page-004-energy-transition', PAGE_LABEL='第 4 頁', DRAFT_KEY='green-motion-layout-editor-page-004', NOTE_LABEL='';
// ---- Page (worked example: narration = assets/narration.wav, 2181 frames = 36.3863 s; set FRAMES to your own narration length) ----
export const FRAMES=2181, DURATION=FRAMES*DT;
// Exit (handoff to the next page): in the last EXIT_FRAMES frames all content fades out, leaving only the title rule + teal accent.
export const EXIT_FRAMES=30;
export const SCENE='page';
export const CLIP={frames:FRAMES,duration:DURATION};
// Cue times are seconds relative to the page start, set 0.05-0.15 s BEFORE the spoken keyword (keyword times from your own word alignment).
// 然而 0.587 | 能源的轉型 1.397 | 需要時間 2.427 | 循序漸進 3.327 | 短期 5.397 | 較乾淨的能源 5.947 | 天然氣 7.327 | 生質燃料 8.187 | 取代 9.307
// 針對生質燃料 10.467 | 之所以被認為 12.107 | 比傳統的石化燃料 13.167 | 更乾淨 15.177 / 16.287 | 核心的原因 17.747 | 碳中和 19.727 | 循環特性 21.087
// 燃燒時產生 22.737 | 有害污染物 24.367 | 較少 25.547 | 長期 26.827 | 接近無碳 28.647 | 太陽光電 32.647 | 風電 33.987 | 氫能 34.797
export const CUES={title:.15,now:1.30,clock:2.33,steps:3.22,short:5.30,gas:7.22,bio:8.08,replace:9.20,card1:9.80,focus:10.37,vs:13.07,clean1:15.07,clean2:16.20,frames:17.62,neutral:19.62,cycle:21.0,burn:22.64,pollut:24.30,less:25.45,back:26.35,long:26.72,near:28.55,card2:29.05,solar:32.55,wind:33.89,h2:34.70,freeze:35.45};
export const COLORS={navy:'#163e69',blue:'#29559a',teal:'#149a96',green:'#36a97e',pale:'#e0f3ef',ice:'#e9f0fa',amber:'#c98a22',gold:'#f4c66b',muted:'#7b8c9c',white:'#ffffff',line:'#a0bcbf',trackBlue:'#b9cce8',trackTeal:'#a9d8d4',band:'#f0f6f8',grey:'#5e6e7c',red:'#d64545'};
export const CHAPTERS=[['時間軸：現在→短期→長期',0],['短期替代：天然氣、生質燃料',CUES.short],['取代燃煤與燃油',CUES.replace],['生質燃料較乾淨',CUES.focus],['碳中和循環',CUES.neutral],['污染物較少',CUES.burn],['長期轉型',CUES.long],['太陽光電、風電、氫能',CUES.solar]];
// Idle loops: calm ambient motion after the entrances settle, through the last frame (pure functions of time). Set a speed/amplitude to 0 to freeze it.
export const IDLE={windSpeed:.9,sunSpin:.2,sunPulse:.05,sunPulseSpeed:2.0,flameFlicker:.08,flameSpeed:7.5,smokeSpeed:.38,loopDotSpeed:.16,bubbleSpeed:.42,particleSpeed:.3,clockSpeed:1.6,chevronSpeed:1.8,leafSway:.07,leafSpeed:1.5,cloudBob:3,cloudSpeed:1.7,barPulse:.04};
