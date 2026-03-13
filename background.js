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
 * Version: 0.3
 * Last Updated: 2026-03-14
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
      files: ["content.js"]
    });
  }
});


/**************
 * Preview UI
 **************/
let tvTabId = null;
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action !== "updateSymbol") return;
  let {ticker, theme, interval} = msg;

  // 新規tab作成の時は日足へリセット
  if (!tvTabId) {
    interval = "1D";
    chrome.storage.local.set({
      tv_interval: interval
    });
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
    chrome.windows.create({
      url: url,
      type: "normal",
      focused: true
    }, (win) => {
      if (win.tabs && win.tabs.length > 0) {
        tvTabId = win.tabs[0].id;
      } else {
        // win.tabs が空だった場合のフォールバック
        chrome.tabs.query({ windowId: win.id, active: true }, (tabs) => {
          tvTabId = tabs[0].id;
          console.log("Tab ID acquired via query:", tvTabId);
        });
      }
    });
    return;
  }

  chrome.tabs.get(tvTabId, (tab) => {
    if (chrome.runtime.lastError) {
      chrome.windows.create({
        url: url,
        type: "normal",
        focused: true
      }, (win) => {
        if (win.tabs && win.tabs.length > 0) {
          tvTabId = win.tabs[0].id;
        } else {
          // win.tabs が空だった場合のフォールバック
          chrome.tabs.query({ windowId: win.id, active: true }, (tabs) => {
            tvTabId = tabs[0].id;
            console.log("Tab ID acquired via query:", tvTabId);
          });
        }
    });
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
 * Close Tab
 **************/
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === tvTabId) {
    tvTabId = null;
  }
});