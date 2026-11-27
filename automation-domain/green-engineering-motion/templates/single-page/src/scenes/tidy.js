// Page-specific "整理對齊" (tidy) preset: server default and editor preset. Items are text patches keyed by textId(content,x,y) of scenes/page.js.
import {textId,emptyLayout} from '../engine/layout-model.js';
export function tidyLayout(){const d=emptyLayout(),put=(t,x,y,p)=>d.items[textId(t,x,y)]=p;
 put('以「天然氣」及生質燃料\n取代燃煤與燃油',80,837,{textAlign:'left'});
 return d;}
