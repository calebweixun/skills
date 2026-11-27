"""Word timestamps from the actual supplied video audio (Sequence 02), for motion cues.
faster-whisper packages/models: tools/python-packages and tools/models when present (override: MG_PY_PACKAGES, MG_MODELS); otherwise the normal pip install and model cache. Optional vocabulary hint: tools/initial-prompt.txt."""
import sys,os,json,wave
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
pk=Path(os.environ.get('MG_PY_PACKAGES') or ROOT/'tools/python-packages')
md=Path(os.environ.get('MG_MODELS') or ROOT/'tools/models')
sys.path.insert(0,str(pk))
os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING']='1'
from faster_whisper import WhisperModel
import numpy as np
with wave.open(str(ROOT/'assets/narration-asr.wav'),'rb') as w: audio=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768
model=WhisperModel('small',device='cpu',compute_type='int8',cpu_threads=6,download_root=str(md))
segments,info=model.transcribe(audio,language='zh',beam_size=5,word_timestamps=True,vad_filter=False,initial_prompt=(ROOT/'tools/initial-prompt.txt').read_text(encoding='utf-8').strip() if (ROOT/'tools/initial-prompt.txt').exists() else None)
out=[]
for s in segments:
 d={'start':s.start,'end':s.end,'text':s.text,'words':[{'start':w.start,'end':w.end,'word':w.word,'probability':w.probability} for w in s.words]}
 out.append(d);print(json.dumps(d,ensure_ascii=True),flush=True)
(ROOT/'review/narration-word-alignment.json').write_text(json.dumps({'audio':'assets/narration-asr.wav','method':'faster-whisper small int8; actual supplied video audio; word timestamps','duration':info.duration,'segments':out},ensure_ascii=False,indent=2),encoding='utf-8')
