// Side-by-side: left = original slide 4 screenshot (static reference, there is no teacher slide video), right = MG preview (with narration). 1920x540.
import {spawn} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {jobDir} from './jobs.mjs';
import {ffmpegBin} from './ffmpeg-path.mjs';
import {DURATION} from '../src/config.js';
const root=new URL('../',import.meta.url),file=s=>fileURLToPath(new URL(s,root));
const dir=jobDir(root);
const args=['-hide_banner','-y','-loop','1','-framerate','60000/1001','-i',file('assets/source-slide-004.png'),'-i',path.join(dir,'Energy-Transition-Teacher-Sync-Preview.mp4'),'-filter_complex','[0:v]scale=960:540:flags=lanczos,setsar=1,format=yuv420p[l];[1:v]scale=960:540:flags=lanczos,setsar=1[r];[l][r]hstack=shortest=1[v]','-map','[v]','-map','1:a','-t',String(DURATION),'-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-r','60000/1001','-c:a','aac','-b:a','192k','-movflags','+faststart','-threads','4',path.join(dir,'Energy-Transition-Original-vs-MG-Sync.mp4')];
const p=spawn(ffmpegBin,args,{windowsHide:true});let log='';p.stderr.on('data',d=>log+=d);p.on('error',e=>{throw e;});p.on('close',async code=>{await writeFile(file('review/compare-source.log'),log);console.log(code===0?'Side-by-side original slide / MG comparison completed.':log.slice(-2500));process.exitCode=code;});
