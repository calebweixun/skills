"""Set up user-supplied inputs for a new episode project.

usage: python tools/prepare.py <slides.pptx> <narration.(mp4|wav|m4a|...)>

- review/source-slides.json : text and speaker notes of every slide (for planning cues; never published)
- assets/narration.mp4      : copy of the supplied narration (the editor's <audio> source)
- assets/narration.wav      : 48 kHz stereo 16-bit PCM (render/verify reference)
- assets/narration-asr.wav  : 16 kHz mono 16-bit PCM (transcribe.py input)
ffmpeg is taken from MG_FFMPEG, tools/bin/ffmpeg(.exe), or PATH.
"""
import sys, os, json, shutil, subprocess, zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
R=Path(__file__).resolve().parent.parent
if len(sys.argv)<3:sys.exit(__doc__)
pptx,narration=Path(sys.argv[1]),Path(sys.argv[2])
for d in ['assets','review','exports','layouts']:(R/d).mkdir(parents=True,exist_ok=True)
ns={'a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
z=zipfile.ZipFile(pptx);names=set(z.namelist());slides=[]
for f in sorted(names):
    if f.startswith('ppt/slides/slide') and f.endswith('.xml'):
        n=int(Path(f).stem.replace('slide',''))
        texts=[t.text for t in ET.fromstring(z.read(f)).findall('.//a:t',ns) if t.text]
        note=f'ppt/notesSlides/notesSlide{n}.xml';notes=[t.text for t in ET.fromstring(z.read(note)).findall('.//a:t',ns) if t.text] if note in names else []
        slides.append(dict(page=n,text=texts,notes=notes))
(R/'review/source-slides.json').write_text(json.dumps(sorted(slides,key=lambda s:s['page']),ensure_ascii=False,indent=2),encoding='utf-8')
shutil.copy2(narration,R/'assets/narration.mp4')
ff=os.environ.get('MG_FFMPEG') or next((str(p) for p in [R/'tools/bin/ffmpeg.exe',R/'tools/bin/ffmpeg'] if p.exists()),shutil.which('ffmpeg'))
if not ff:sys.exit('ffmpeg not found: put it in tools/bin or set MG_FFMPEG. Then re-run.')
for out,extra in [('assets/narration.wav',['-ar','48000','-ac','2']),('assets/narration-asr.wav',['-ar','16000','-ac','1'])]:
    subprocess.run([ff,'-hide_banner','-y','-i',str(narration),'-vn',*extra,'-c:a','pcm_s16le',str(R/out)],check=True)
print('Prepared slide text and narration audio (assets/narration*.wav, narration.mp4).')
