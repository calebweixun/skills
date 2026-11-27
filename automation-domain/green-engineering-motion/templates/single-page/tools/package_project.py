"""Create a portable authoring project, excluding movies and ASR caches."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
ROOT=Path(__file__).resolve().parent.parent
target=ROOT/'exports/MG-Project.zip'
review_keep={'verification.json','render.json','storyboard.jpg','narration-word-alignment.json','player.png','corner-clearance.jpg','corner-clearance.json'}
with ZipFile(target,'w',compression=ZIP_DEFLATED,compresslevel=3) as z:
 for p in ROOT.rglob('*'):
  if not p.is_file(): continue
  rel=p.relative_to(ROOT)
  if rel.parts[0] in {'exports','versions','.codebase-memory'}: continue
  if rel.parts[0]=='review' and (len(rel.parts)!=2 or p.name not in review_keep):continue
  if len(rel.parts)>1 and rel.parts[0]=='tools' and rel.parts[1] in {'python-packages','models'}:continue
  if p.suffix=='.gz' or '__pycache__' in rel.parts:continue
  z.write(p,Path('Threejs-Net-Zero-Project')/rel)
print(str(target),target.stat().st_size)
