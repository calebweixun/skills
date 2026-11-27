import sys,os
from pathlib import Path
R=Path(__file__).resolve().parent.parent
sys.path.insert(0,os.environ.get('MG_PY_PACKAGES',str(R/'tools/python-packages')))
from mg_fonts import cjk_font
import av
from PIL import Image,ImageDraw,ImageFont
file=R/'exports/v1/Episode-002-Full-Narration-Preview.mp4'
times=[36,155,210,290,330,355];sheet=Image.new('RGB',(1280,3*395),'#e6edf1');draw=ImageDraw.Draw(sheet);font=cjk_font(21)
for i,t in enumerate(times):
    with av.open(str(file)) as c:
        s=c.streams.video[0];c.seek(int(t/s.time_base),stream=s)
        for f in c.decode(s):
            if f.time>=t:
                im=f.to_image().resize((640,360));sheet.paste(im,(i%2*640,i//2*395));break
    draw.text((i%2*640+12,i//2*395+365),f'{t} s · 實際完整預覽解碼',font=font,fill='#163e69')
sheet.save(R/'review/actual-output.jpg',quality=94)
