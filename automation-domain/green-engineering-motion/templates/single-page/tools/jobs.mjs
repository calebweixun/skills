import {existsSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
// Resolves the render job folder: CLI argument > MG_EXPORT_DIR > latest finished exports/renders/<jobId>/.
export function jobDir(root=new URL('../',import.meta.url),argv=process.argv.slice(2)){
 const base=fileURLToPath(root),arg=argv.find(a=>!a.startsWith('--'))||process.env.MG_EXPORT_DIR;
 if(arg)return path.resolve(arg);
 const renders=path.join(base,'exports/renders');
 const ids=existsSync(renders)?readdirSync(renders,{withFileTypes:true}).filter(d=>d.isDirectory()&&/^\d{8}T\d{6}-[a-f0-9]{8}$/.test(d.name)&&existsSync(path.join(renders,d.name,'Energy-Transition-Teacher-Sync-Preview.mp4'))).map(d=>d.name).sort():[];
 if(!ids.length)throw new Error('找不到已完成的輸出資料夾。請先在編輯器按「輸出影片」，或指定資料夾：node tools/verify.mjs <資料夾>');
 return path.join(renders,ids.at(-1));
}
