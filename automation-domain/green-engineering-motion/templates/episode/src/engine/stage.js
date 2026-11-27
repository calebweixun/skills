// Shared engine: renderer, camera, root group and the generic drawing / text / editable-item helpers (copied unchanged from page 2).
import * as T from '/vendor/three.module.js';
import {WIDTH,HEIGHT,COLORS as C} from '../config.js';
import {textId} from './layout-model.js';
import {registerEditable} from './layout-engine.js';
export const scene=new T.Scene();
export const camera=new T.OrthographicCamera(0,WIDTH,0,HEIGHT,-200,200);camera.position.z=100;
export const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(WIDTH,HEIGHT,false);renderer.setClearColor(0x000000,0);renderer.outputColorSpace=T.SRGBColorSpace;
renderer.domElement.id='mg-canvas';
export const root=new T.Group();scene.add(root);
export const mat=c=>new T.MeshBasicMaterial({color:c,transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide});
let layer=0;
export function mesh(g,geo,c,x=0,y=0){const m=new T.Mesh(geo,mat(c));m.position.set(x,y,0);m.renderOrder=++layer;g.add(m);return m;}
export function group(parent=root,x=0,y=0){const g=new T.Group();g.position.set(x,y,0);parent.add(g);return g;}
export function rect(g,x,y,w,h,c,r=0){if(!r)return mesh(g,new T.PlaneGeometry(w,h),c,x+w/2,y+h/2);const s=new T.Shape();s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return mesh(g,new T.ShapeGeometry(s),c);}
export function poly(g,pts,c){const s=new T.Shape();s.moveTo(...pts[0]);pts.slice(1).forEach(p=>s.lineTo(...p));s.closePath();return mesh(g,new T.ShapeGeometry(s),c);}
export function disk(g,x,y,r,c){return mesh(g,new T.CircleGeometry(r,64),c,x,y);}
export function line(g,pts,c,w=5){const all=group(g);for(let i=1;i<pts.length;i++){const [a,b]=[pts[i-1],pts[i]],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);const m=rect(all,-len/2,-w/2,len,w,c);m.position.set((a[0]+b[0])/2,(a[1]+b[1])/2,0);m.rotation.z=Math.atan2(dy,dx);}return all;}
export function arrow(g,x,y,c){return poly(g,[[x-14,y-11],[x+5,y],[x-14,y+11]],c);}
export function text(g,content,x,y,size=40,color=C.navy,{weight=600,align='center',width=0}={}){
 const m=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide}));
 m.userData={text:content,fontSize:size,weight,tcolor:color};m.scale.y=-1;m.renderOrder=++layer;g.add(m);
 function updateStyle(s){const cv=document.createElement('canvas'),cx=cv.getContext('2d'),dpr=2,font=`${weight} ${s.fontSize*dpr}px "Microsoft JhengHei", "Noto Sans TC", sans-serif`;cx.font=font;
  const natural=Math.max(...s.text.split('\n').map(v=>cx.measureText(v).width/dpr),1)+12,w=Math.max(s.fontSize+12,Math.min(s.boxWidth||natural,1800)),lines=[];
  for(const paragraph of s.text.split('\n')){let line='';for(const c of Array.from(paragraph)){if(line&&cx.measureText(line+c).width>(w-12)*dpr){lines.push(line);line='';}line+=c;}lines.push(line);}
  const lineHeight=s.fontSize*1.35,h=Math.min(8192,Math.ceil(lines.length*lineHeight+s.fontSize*.15));cv.width=Math.ceil(w*dpr);cv.height=Math.ceil(h*dpr);cx.font=font;cx.textAlign=s.textAlign;cx.textBaseline='middle';cx.fillStyle=s.color;
  lines.forEach((v,i)=>cx.fillText(v,(s.textAlign==='left'?6:s.textAlign==='right'?w-6:w/2)*dpr,(s.fontSize*.75+i*lineHeight)*dpr));
  {const px=cx.getImageData(0,0,cv.width,cv.height).data;let x0=cv.width,x1=-1,y0=cv.height,y1=-1;for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++)if(px[(y*cv.width+x)*4+3]>24){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
   // Ink box in plane-local units (used for click targets only, so a lone digit does not hide the circle behind it).
   m.userData.ink=x1<0?null:{x0:x0/dpr-w/2,x1:(x1+1)/dpr-w/2,y0:h/2-(y1+1)/dpr,y1:h/2-y0/dpr};}
  const texture=new T.CanvasTexture(cv);texture.colorSpace=T.SRGBColorSpace;texture.minFilter=T.LinearFilter;m.material.map?.dispose();m.material.map=texture;m.material.needsUpdate=true;m.geometry.dispose();m.geometry=new T.PlaneGeometry(w,h);m.userData.text=s.text;m.userData.fontSize=s.fontSize;m.userData.textOverflow=lines.length*lineHeight>8192;
 }
 const baseStyle={text:content,fontSize:size,boxWidth:width,textAlign:align,color};updateStyle(baseStyle);m.position.set(align==='left'?x+m.geometry.parameters.width/2:x,y,0);
 registerEditable(m,{id:textId(content,x,y),name:content,kind:'text',baseStyle,updateStyle});return m;
}
export function pivot(o){o.updateWorldMatrix(true,true);const inv=o.matrixWorld.clone().invert(),box=new T.Box3();
 o.traverse(m=>{if(!m.geometry)return;if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();box.union(m.geometry.boundingBox.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inv,m.matrixWorld)));});
 if(box.isEmpty())return;const c=box.getCenter(new T.Vector3());
 if(o.isMesh){o.geometry.translate(-c.x,-c.y,0);o.geometry.computeBoundingBox();}else o.children.forEach(ch=>{ch.position.x-=c.x;ch.position.y-=c.y;if(ch.userData.bx!==undefined)ch.userData.bx-=c.x;});
 o.position.x+=c.x;o.position.y+=c.y;}
export function E(o,id,name,{center=true}={}){if(center)pivot(o);registerEditable(o,{id,name,kind:id.startsWith('icon-')?'icon':id.startsWith('line-')?'line':'shape'});return o;}
export const arrowHeads=[];
export function arrowE(g,x,y,c,id,name,list=arrowHeads){const m=E(arrow(g,x,y,c),id,name);m.userData.bx=m.position.x;list.push(m);return m;}
export function opacity(g,a){g.traverse(o=>{if(o.material)o.material.opacity=a;});}
export const clamp=x=>Math.max(0,Math.min(1,x));export const prog=(t,s,d=.8)=>clamp((t-s)/d);export const ease=x=>1-(1-x)**3;
export function arrive(g,t,s,{x=0,y=0,dx=0,dy=45,d=.75}={}){const p=prog(t,s,d),v=ease(p);g.visible=p>0;g.position.set(x+dx*(1-v),y+dy*(1-v),0);g.scale.setScalar(.96+.04*v);opacity(g,v);}

// Generic additions for page 3 (same style as the helpers above).
export function ellipse(g,x,y,rx,ry,c){const sh=new T.Shape();sh.absellipse(0,0,rx,ry,0,Math.PI*2,false);return mesh(g,new T.ShapeGeometry(sh,48),c,x,y);}
export function arc(g,x,y,r1,r2,a0,a1,c){return mesh(g,new T.RingGeometry(r1,r2,40,1,a0,a1-a0),c,x,y);}
export function ring(g,x,y,r,w,c){return mesh(g,new T.RingGeometry(r-w,r,64),c,x,y);}
export const smooth=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};
export const easeIO=x=>{x=clamp(x);return x<.5?4*x*x*x:1-(-2*x+2)**3/2;};
export {T};
