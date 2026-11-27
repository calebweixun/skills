# usage: sheet2.py out.jpg cols label1=file1 label2=file2 ... (each tile 640x360)
import sys,os
sys.path.insert(0,os.environ.get('MG_PY_PACKAGES',os.path.join(os.path.dirname(os.path.abspath(__file__)),'python-packages')))
sys.path.insert(0,os.path.dirname(__file__))
from PIL import Image,ImageDraw
from mg_fonts import cjk_font
out,cols=sys.argv[1],int(sys.argv[2]);items=[a.split('=',1) for a in sys.argv[3:]]
W,H=int(os.environ.get('TW',640)),int(os.environ.get('TH',360));rows=(len(items)+cols-1)//cols
sh=Image.new('RGB',(W*cols,(H+0)*rows),'#222');d=ImageDraw.Draw(sh);f=cjk_font(18)
for i,(lab,fp) in enumerate(items):
    im=Image.open(fp).convert('RGB').resize((W,H),Image.LANCZOS);x,y=i%cols*W,i//cols*H;sh.paste(im,(x,y))
    d.rectangle([x,y,x+len(lab)*11+14,y+24],fill='#000');d.text((x+6,y+2),lab,font=f,fill='#fff')
sh.save(out,quality=90)
