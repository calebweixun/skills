import { chromium } from 'playwright';

export async function openBrowser() {
  const args=['--enable-webgl','--ignore-gpu-blocklist'];
  for(const channel of ['msedge','chrome',undefined]) {
    try {return await chromium.launch({channel,headless:true,args});}
    catch(err) {if(channel===undefined)throw new Error(`找不到可用瀏覽器。請安裝 Edge / Chrome，或執行 npx playwright install chromium。\n${err.message}`);}
  }
}
export const previewUrl=process.env.MG_URL || 'http://127.0.0.1:4206';
