// ffmpeg resolution: MG_FFMPEG (full path) > tools/bin/ffmpeg(.exe) in this project > "ffmpeg" on PATH.
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
export const ffmpegBin=process.env.MG_FFMPEG||['ffmpeg.exe','ffmpeg'].map(n=>path.join(root,'tools/bin',n)).find(existsSync)||'ffmpeg';
