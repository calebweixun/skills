---
name: dgpa-suspension
description: 使用此技能來查詢行政院人事行政總處 (DGPA) 的停班停課公告。當使用者想知道某個縣市在特定日期（如颱風天）是否停班停課時，請呼叫此技能。此技能會使用 ego-browser 自動化查詢過程。
---

# 查詢行政院人事行政總處停班停課公告

這個技能指導如何使用 `ego-browser` 查詢行政院人事行政總處的天然災害停止辦公及上課情形。

## 查詢步驟

1. 啟動 `ego-browser` 並前往公告列表頁面：`https://www.dgpa.gov.tw/informationlist?uid=374&page=1`
2. 使用 `js()` 抓取頁面上的公告連結（例如包含「停止辦公及上課情形」的 `<a>` 標籤）。
3. 根據使用者想查詢的日期（例如「115年7月」或特定日期），過濾出對應的公告連結。如果第一頁沒有，可能需要前往 `page=2` 等後續頁面。
4. 逐一進入符合條件的公告網址，抓取頁面文字。
5. 在公告內容中搜尋目標縣市（如「高雄市」），判斷是否有宣佈停班停課。
6. 查詢完畢後，確保使用 `completeTaskSpace(task.id, { keep: false })` 關閉任務空間。

## 範例腳本

以下是查詢特定月份與縣市的 `ego-browser` 腳本範例：

```javascript
const task = await useOrCreateTaskSpace('check dgpa suspension');

// 1. 取得目標日期的公告連結
const links = await js(String.raw`(() => {
  const anchors = [...document.querySelectorAll('a')];
  return anchors
    .filter(a => a.innerText.includes('115年7月') && a.innerText.includes('停止辦公及上課情形'))
    .map(a => ({ text: a.innerText, url: a.href }));
})()`);

cliLog('找到 ' + links.length + ' 筆公告');

let foundSuspension = false;

// 2. 進入每一個公告，並嘗試讀取 nds.html 附件中的詳細資訊
for (const link of links) {
  await gotoAndWait(link.url, { wait: true, timeout: 20 });
  const ndsHref = await js(String.raw`(() => {
    const anchors = [...document.querySelectorAll('a')];
    const nds = anchors.find(a => a.innerText.includes('nds.html'));
    return nds ? nds.href : null;
  })()`);
  
  if (ndsHref) {
    const html = await serverFetch(ndsHref);
    const data = await js(`(() => {
      const div = document.createElement('div');
      div.innerHTML = ${JSON.stringify(html)};
      const rows = [...div.querySelectorAll('tr')];
      if (rows.length === 0) return [];
      return rows.map(tr => tr.innerText.replace(/\\s+/g, ' ').trim())
                 .filter(t => t.includes('停止上班') || t.includes('停止上課') || t.includes('停班') || t.includes('停課'));
    })()`);
    
    const targetLines = data.filter(l => l.includes('高雄市'));
    if (targetLines.length > 0) {
      cliLog('在 ' + link.text + ' 找到資訊: \n  ' + targetLines.join('\n  '));
      foundSuspension = true;
    }
  }
}

if (!foundSuspension) {
  cliLog('未找到該縣市的相關資訊。');
}

// 3. 關閉任務空間
await completeTaskSpace(task.id, { keep: false });
```

請注意，實際操作時，請根據使用者的具體需求（特定縣市、特定日期）調整腳本中的過濾條件（如年份、月份與縣市名稱）。
