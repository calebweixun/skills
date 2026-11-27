import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const python=process.env.MG_PYTHON||'python';
const child=spawn(python,['tools/verify.py'],{cwd:fileURLToPath(new URL('../',import.meta.url)),windowsHide:true,stdio:'inherit'});
child.on('error',e=>{console.error(e.message);process.exitCode=1;});child.on('close',c=>process.exitCode=c??1);
