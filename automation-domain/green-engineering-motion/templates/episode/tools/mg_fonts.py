import os
from pathlib import Path
from PIL import ImageFont

def cjk_font(size):
    if os.environ.get('MG_FONT'):
        return ImageFont.truetype(os.environ['MG_FONT'], size)
    roots = [Path(os.environ.get('WINDIR', 'C:/Windows')) / 'Fonts', Path('/usr/share/fonts'), Path('/usr/local/share/fonts'), Path('/System/Library/Fonts'), Path('/Library/Fonts')]
    names = ['msjh.ttc', 'NotoSansTC-Regular.otf', 'NotoSansCJK-Regular.ttc', 'NotoSansTC-VF.ttf', 'NotoSansCJKtc-Regular.otf', 'Microsoft YaHei.ttf', 'msyh.ttc', 'simsun.ttc', 'PingFang.ttc']
    for name in names:
        for root in roots:
            if root.exists():
                for file in root.rglob(name):
                    try: return ImageFont.truetype(str(file), size)
                    except OSError: pass
    raise RuntimeError('找不到中文字型，請設定 MG_FONT 為 CJK 字型檔案。')
