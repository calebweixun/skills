import os,sys
from pathlib import Path
sys.path.insert(0,os.environ.get('MG_PY_PACKAGES',str(Path(__file__).resolve().parent/'python-packages')))
from PIL import Image,ImageDraw,ImageFont
from mg_fonts import cjk_font
R=Path(__file__).resolve().parent.parent
times=['36','50','101','120','130','147','155','174','210','260','290','320','330','355','361']
font=cjk_font(20)
sheet=Image.new('RGB',(1440,5*300),'#dbe4e9')
for i,t in enumerate(times):
    p=R/f'review/stills/{t}.png'
    if not p.exists():continue
    im=Image.open(p).convert('RGBA');bg=Image.new('RGBA',im.size,'#0a222b' if float(t)<59.45 or float(t)>=357 else 'white')
    if t=='36':
        teacher=Image.open(R/'assets/reference-01.png').convert('RGBA').resize(im.size)
        bg=teacher
    bg.alpha_composite(im);bg=bg.convert('RGB').resize((480,270));sheet.paste(bg,(i%3*480,i//3*300));ImageDraw.Draw(sheet).text((i%3*480+10,i//3*300+273),t+' s',font=font,fill='#163e69')
sheet.save(R/'review/storyboard.jpg',quality=94)
