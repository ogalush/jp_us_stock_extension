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

/**************
 * MarkUp stock-code
 **************/
function markDataSymbol() {
  const SITE_CONFIGS = window.STOCK_MARKER.SITE_CONFIGS;
  for (const config of SITE_CONFIGS) {
    const elements = document.querySelectorAll(config.selector);
    if (elements.length === 0) continue;

    let found = false;
    for (const el of elements) {
      const code = config.getCode(el);
      if (!code) continue;

      const target = config.target(el);
      if (!target) continue;

      // 二重処理防止
      if (target.classList.contains("stock-marker")) continue;

      target.classList.add("stock-marker");
      target.dataset.ticker = code;
      if (config.applyStyle) {
        config.applyStyle(target);
      } else {
        target.style.color = "#000000"; // 黒色 (ダークモード時に白色 vs 黄色(背景)のため指定)
        target.style.backgroundColor = "#fff3b0"; // 黄色
        target.style.fontWeight = "bold";
      }

      // CONFIGが合っているとみなして終了.
      found = true;
    }

    if (found) break;
  }
}


/**************
 * Show TradingView
 **************/
let currentTicker = null;
async function showPreview(ticker) {
  if (currentTicker === ticker) return;
  currentTicker = ticker;
  const interval = await getInterval();
  chrome.runtime.sendMessage({
    action: "updateSymbol",
    ticker: ticker,
    theme: getTheme(),
    interval: interval
  });
}


/**************
 * for copy & Paste stock-codes.
 **************/
function getClosestStockMarker(target) {
  if (target instanceof Element) {
    return target.closest(".stock-marker");
  }
  if (target.parentElement) {
    return target.parentElement.closest(".stock-marker");
  }
  return null;
}


/**************
 * MouceOver → TradingView Tab
 **************/
let hoverTimer = null;
document.addEventListener("mouseenter", (e) => {
  const el = getClosestStockMarker(e.target);

  // 新しい要素に入ったら、既存のタイマー(表示予約)をクリアする
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }

  if (!el) return;
  hoverTimer = setTimeout(() => {
    showPreview(el.dataset.ticker);
  }, 120);
}, true);


/**************
 * MouseLeave
 **************/
document.addEventListener("mouseleave", (e) => {
  // 要素から外れた時もタイマーを止める(銘柄表示のタイマー予約が入っている場合はキャンセルする)
  if (getClosestStockMarker(e.target)) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
}, true);


/**************
 * DarkMode対応
 **************/
function isDarkMode() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getTheme() {
  return isDarkMode() ? "dark" : "light";
}


/**************
 * 足取得
 **************/
function getInterval() {
  return new Promise((resolve) => {
    chrome.storage.local.get("tv_interval", (data) => {
      resolve(data.tv_interval || "1D");
    });
  });
}


/**************
 * initialize
 **************/
function initMarking() {
  markDataSymbol();
}


/**************
 * Main
 **************/
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMarking);
} else {
  initMarking();
}
