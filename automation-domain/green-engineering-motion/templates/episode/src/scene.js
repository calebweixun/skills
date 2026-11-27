// Scene entry (page 6 only; the transition scene of the page-3 project was removed). Shared engine: ./engine/*. Page-specific content: ./scenes/page.js
import {renderer,scene,camera} from './engine/stage.js';
import {beforeLayoutFrame,applyLayoutFrame} from './engine/layout-engine.js';
import {SCENE,DURATION,CLIP} from './config.js';
import {posePage} from './scenes/page.js';
export const mode=SCENE;
export function renderAt(seconds){
 beforeLayoutFrame();
 const state=posePage(seconds);
 applyLayoutFrame(scene);renderer.render(scene,camera);
 return state;
}
export {renderer,scene,camera,CLIP,DURATION};
