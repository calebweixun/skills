import * as T from '/vendor/three.module.js';
import {emptyLayout,validateLayout} from './layout-model.js';
const registry=new Map();let layout=emptyLayout(),frame=[];
export function registerEditable(object,{id,name,kind,baseStyle,updateStyle}){if(registry.has(id))throw new Error(`Duplicate editable id: ${id}`);object.userData.editableId=id;registry.set(id,{object,id,name,kind,baseStyle,updateStyle,styleKey:''});}
export function getLayout(){return structuredClone(layout);}
export function setLayout(value){layout=validateLayout(value);return getLayout();}
export function beforeLayoutFrame(){for(const e of frame){e.object.position.copy(e.position);e.object.scale.copy(e.scale);e.object.quaternion.copy(e.quaternion);e.object.visible=e.visible;}frame=[];}
export function applyLayoutFrame(scene){
 scene.updateMatrixWorld(true);
 for(const e of registry.values())frame.push({object:e.object,position:e.object.position.clone(),scale:e.object.scale.clone(),quaternion:e.object.quaternion.clone(),visible:e.object.visible});
 const depth=o=>{let d=0;while(o.parent){d++;o=o.parent;}return d;};
 for(const e of [...registry.values()].sort((a,b)=>depth(a.object)-depth(b.object))){
  const p=layout.items[e.id]||{},o=e.object;
  if(e.updateStyle){const style={...e.baseStyle};for(const k of ['text','fontSize','boxWidth','textAlign','color'])if(p[k]!==undefined)style[k]=p[k];const key=JSON.stringify(style);if(key!==e.styleKey){e.updateStyle(style);e.styleKey=key;}}
  if(p.x||p.y){const inv=o.parent.matrixWorld.clone().invert(),zero=new T.Vector3().applyMatrix4(inv),delta=new T.Vector3(p.x||0,p.y||0,0).applyMatrix4(inv).sub(zero);o.position.add(delta);}
  if(p.scale!==undefined)o.scale.multiplyScalar(p.scale);
  if(p.rotation)o.rotateZ(p.rotation*Math.PI/180);
  if(p.hidden)o.visible=false;
  o.updateMatrixWorld(true);
 }
}
function boxOf(object,visibleOnly){const result=new T.Box3();object.traverse(o=>{if(!o.geometry)return;let v=o;while(v){if(!v.visible&&visibleOnly)return;v=v.parent;}const materials=Array.isArray(o.material)?o.material:[o.material];if(visibleOnly&&!materials.some(m=>m&&m.opacity>.025))return;if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();result.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));});if(result.isEmpty())return null;return {x:result.min.x,y:result.min.y,width:result.max.x-result.min.x,height:result.max.y-result.min.y};}
// Click-target box: tight glyph ink for text, otherwise the visible bounds.
function hitBox(object,visible){const ink=object.userData.ink;if(!visible||!ink||!object.userData.text)return visible;const pad=6,b=new T.Box3();for(const [x,y] of [[ink.x0,ink.y0],[ink.x1,ink.y0],[ink.x0,ink.y1],[ink.x1,ink.y1]])b.expandByPoint(new T.Vector3(x,y,0).applyMatrix4(object.matrixWorld));return {x:b.min.x-pad,y:b.min.y-pad,width:b.max.x-b.min.x+pad*2,height:b.max.y-b.min.y+pad*2};}
export function getItems(){return [...registry.values()].map(e=>{const p=layout.items[e.id]||{};let parent=e.object.parent,parentId=null;while(parent){if(parent.userData.editableId){parentId=parent.userData.editableId;break;}parent=parent.parent;}const visible=boxOf(e.object,true);let layoutScale=1;for(let o=e.object;o;o=o.parent){const id=o.userData.editableId;if(id)layoutScale*=layout.items[id]?.scale??1;}let depth=0;for(let o=e.object.parent;o;o=o.parent)if(o.userData.editableId)depth++;return {id:e.id,depth,hit:hitBox(e.object,visible),role:e.object.userData.role||null,layoutScale,name:p.text??e.name,originalName:e.name,kind:e.kind,parentId,bounds:visible||boxOf(e.object,false),active:!!visible,hidden:!!p.hidden,locked:!!p.locked,overflow:!!e.object.userData.textOverflow,style:e.baseStyle?{...e.baseStyle,...p}:null,patch:{...p}};});}
export function getItem(id){return getItems().find(e=>e.id===id);}
