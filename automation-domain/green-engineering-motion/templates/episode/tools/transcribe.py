import sys, os, json, wave
from pathlib import Path
R=Path(__file__).resolve().parent.parent
sys.path.insert(0,os.environ.get('MG_PY_PACKAGES',str(R/'tools/python-packages')))
from faster_whisper import WhisperModel
import numpy as np
with wave.open(str(R/'assets/narration-asr.wav'),'rb') as w:
    a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768
# Vocabulary hint for the recogniser: edit tools/initial-prompt.txt for your course (terms only, not narration).
PF=R/'tools/initial-prompt.txt';PROMPT=PF.read_text(encoding='utf-8').strip() if PF.exists() else None
m=WhisperModel('small',device='cpu',compute_type='int8',cpu_threads=8,download_root=os.environ.get('MG_MODELS',str(R/'tools/models')),local_files_only=os.environ.get('MG_OFFLINE')=='1')
ss,info=m.transcribe(a,language='zh',beam_size=5,word_timestamps=True,vad_filter=True,initial_prompt=PROMPT)
out=[]
for s in ss:
    d=dict(start=s.start,end=s.end,text=s.text,words=[dict(start=w.start,end=w.end,word=w.word,probability=w.probability) for w in s.words])
    out.append(d)
    (R/'review/alignment.partial.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'{s.start:.2f}–{s.end:.2f} {s.text}',flush=True)
(R/'review/alignment.json').write_text(json.dumps(dict(duration=info.duration,segments=out),ensure_ascii=False,indent=2),encoding='utf-8')
