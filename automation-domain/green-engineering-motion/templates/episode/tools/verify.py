import sys,os,json,math,wave,xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse,unquote
R=Path(__file__).resolve().parent.parent
sys.path.insert(0,os.environ.get('MG_PY_PACKAGES',str(R/'tools/python-packages')))
import av,numpy as np
from PIL import Image
O=R/'exports/v1'; timing=json.loads((O/'timing.json').read_text(encoding='utf-8')); dt=1001/60000
results=[]
(O/'decoded').mkdir(exist_ok=True)
def getframe(file,t):
    with av.open(str(file)) as c:
        s=c.streams.video[0];c.seek(max(0,int(t/s.time_base)),stream=s,backward=True)
        for f in c.decode(s):
            if f.time>=t-dt*.6:return f.to_ndarray(format='rgba')
    raise RuntimeError('No frame at '+str(t))
for p in timing['parts']:
    file=O/p['id']/'MG-Transparent-1080p5994.mov'
    if not file.exists() or not (file.parent/'render.json').exists():continue
    with av.open(str(file)) as c:
        s=c.streams.video[0];meta=dict(width=s.width,height=s.height,fps=str(s.average_rate),frames=s.frames,pix_fmt=s.format.name,codec=s.codec_context.name,duration=float(s.duration*s.time_base))
    expect=p['end']-p['start'];assert meta['width']==1920 and meta['height']==1080,meta
    assert meta['fps']=='60000/1001',meta
    assert meta['frames']==expect,(p,meta)
    assert 'yuva' in meta['pix_fmt'],meta
    samples=[]
    for fno in sorted(set([min(expect-1,40),expect//2,max(0,expect-25)])):
        a=getframe(file,fno*dt);alpha=a[:,:,3]
        free=int(alpha[:,1280:].max()) if p['mode']=='left' else int(alpha[:,590:1340].max()) if p['mode']=='center' else None
        if free is not None:assert free<=3,(p['id'],fno,free)
        samples.append(dict(frame=fno,minAlpha=int(alpha.min()),maxAlpha=int(alpha.max()),reservedAreaMaxAlpha=free))
        bg=np.zeros_like(a);bg[:,:,:3]=255 if p['mode']=='left' else [10,34,43];bg[:,:,3]=255
        v=(a[:,:,:3].astype(float)*alpha[:,:,None]/255+bg[:,:,:3]*(1-alpha[:,:,None]/255)).astype(np.uint8)
        Image.fromarray(v).resize((960,540)).save(O/f'decoded/{p["id"]}-{fno}.jpg',quality=93)
    prev=file.parent/'MG-Narration-Preview.mp4'
    with av.open(str(prev)) as c:
        v=c.streams.video[0];audio=c.streams.audio[0]
        assert v.frames==expect,(p['id'],v.frames,expect)
        assert str(v.average_rate)=='60000/1001'
        preview=dict(frames=v.frames,width=v.width,height=v.height,audioRate=audio.rate,audioChannels=audio.channels)
    results.append(dict(id=p['id'],ok=True,metadata=meta,samples=samples,preview=preview))
    print(p['id']+' PASS',flush=True)
full=O/'Episode-002-Full-Narration-Preview.mp4';fullmeta=None
if full.exists():
    with av.open(str(full)) as c:
        s=c.streams.video[0];fullmeta=dict(frames=s.frames,fps=str(s.average_rate),width=s.width,height=s.height,duration=float(s.duration*s.time_base))
        assert s.frames==timing['frames'],fullmeta
        assert str(s.average_rate)=='60000/1001',fullmeta
    with wave.open(str(R/'assets/narration.wav'),'rb') as w:
        source=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).reshape(-1,2).astype(np.float32)/32768
    decoded=[]
    with av.open(str(full)) as c:
        resampler=av.AudioResampler(format='fltp',layout='stereo',rate=48000)
        for frame in c.decode(audio=0):
            for f in resampler.resample(frame):decoded.append(f.to_ndarray().T)
    dest=np.concatenate(decoded,axis=0);correlations=[]
    for start in [5,90,170,340]:
        a=source[start*48000:(start+8)*48000:4,0];b=dest[start*48000:(start+8)*48000:4,0]
        corr=float(np.corrcoef(a,b)[0,1]);assert corr>.98,(start,corr);correlations.append(dict(startSeconds=start,zeroOffsetCorrelation=corr))
    fullmeta['audioSync']=correlations
master=O/'Episode-002-Transparent-1080p5994.mov'
if master.exists():
    with av.open(str(master)) as c:
        s=c.streams.video[0];assert s.frames==timing['frames'];assert str(s.average_rate)=='60000/1001';assert 'yuva' in s.format.name
    for p in timing['parts']:
        n=min(100,p['end']-p['start']-1);a=getframe(master,(p['start']+n)*dt);b=getframe(O/p['id']/'MG-Transparent-1080p5994.mov',n*dt)
        assert np.array_equal(a,b),('master/part mismatch',p['id'])
    if fullmeta is not None:fullmeta['transparentMasterFrames']=timing['frames'];fullmeta['masterMatchesEveryPart']=True
xml=ET.parse(O/'Premiere-第二集-MG對位.xml');paths=[]
for n in xml.findall('.//pathurl'):
    p=unquote(urlparse(n.text).path).lstrip('/')
    exists=Path(p).exists();paths.append(dict(path=p,exists=exists))
    if len(results)==len(timing['parts']):assert exists,p
report=dict(complete=len(results)==len(timing['parts']) and fullmeta is not None,source=timing['source'],parts=results,fullPreview=fullmeta,xmlPaths=paths,notes=['XML syntax and local paths checked; Premiere UI import has not been tested.','Intro preview uses the provided still teacher reference; alpha outputs contain no teacher.'])
(O/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('Verified '+str(len(results))+' parts; complete='+str(report['complete']))
