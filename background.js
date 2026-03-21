/*!
 * Stock Preview Helper
 * ----------------------------------------
 * Copyright (c) 2026 Takehiko OGASAWARA
 * Released under the MIT License
 *
 * Description:
 *  - Hover stock symbol to preview TradingView chart
 *
 * Author: Takehiko OGASAWARA
 * Version: 0.4.0
 * Last Updated: 2026-03-20
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "mark-stocks",
    title: "日米銘柄をマーキング",
    contexts: ["page"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "mark-stocks") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["siteConfigs.js", "content.js"]
    });
  }
});


/**************
 * Preview UI
 **************/
let tvTabId = null;
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg.action !== "updateSymbol") return;
  let {ticker, theme, interval} = msg;
  console.debug("Backend: ticker: " + ticker);
  console.debug("Backend: theme: " + theme);
  console.debug("Backend: interval: " + interval);

  // 新規tab作成の時は日足へリセット
  if (!tvTabId) {
    interval = "1D";
    chrome.storage.local.set({tv_interval: interval});
    console.log("Backend: Interval save " + interval);

    // ServiceWorkerが2-3分経過すると休止モードとなりグローバル変数をクリアしてしまうためLocalStorageから復元する.
    const data = await chrome.storage.local.get("tvTabId");
    tvTabId = data.tvTabId;
    console.log("get TradingView tab id.");
  }

  const url = `https://jp.tradingview.com/chart/?symbol=${ticker}&interval=${interval}&theme=${theme}`;
  openOrUpdateTab(url, ticker);
});


/**************
 * OpenTab
 **************/
function openOrUpdateTab(url, ticker) {
  // Window作成
  if (!tvTabId) {
    createNewWindow(url)
    return;
  }

  chrome.tabs.get(tvTabId, (tab) => {
    // タブが消えている場合は新規作成
    if (chrome.runtime.lastError || !tab) {
      createNewWindow(url)
      return;
    }

    // タブがある場合は使用する
    chrome.tabs.sendMessage(
      tvTabId,
      { action: "setSymbol", url, ticker },
      (response) => {
        if (chrome.runtime.lastError || !response) {
          chrome.tabs.update(tvTabId, { url });
        }
      }
    );
  });
}


/**************
 * Window作成
 **************/
function createNewWindow(url) {
  chrome.windows.create({ url, type: "normal", focused: true }, (win) => {
    tvTabId = win.tabs[0].id;
    // 次回の起動（2-3分後）のためにストレージにバックアップ
    chrome.storage.local.set({ tvTabId: tvTabId });
    console.log("Backend: Saved Managed Tradingview TabId to storage.");
  });
}


/**************
 * Close Tab
 **************/
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === tvTabId) {
    tvTabId = null;
    chrome.storage.local.remove("tvTabId");
    console.log("Backend: Managed TradingView tab closed.");

  }else{
    // メモリが空(=ServiceWorkerが休止中）の場合、ストレージを確認する。
    // 管理しているTabIDであればCleanUpする。
    chrome.storage.local.get("tvTabId", (data) => {
      if (data.tvTabId === tabId) {
        chrome.storage.local.remove("tvTabId");
        console.log("Backend: Managed TradingView tab closed (detected from storage).");
      }
    });
  }

});
