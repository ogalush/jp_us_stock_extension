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
 * Version: 0.3.2
 * Last Updated: 2026-03-15
 */

/**************
 * MarkUp stock-code
 **************/
function markDataSymbol() {
  document.querySelectorAll("tr[data-symbol]").forEach(tr => {
    const ticker = tr.dataset.symbol;
    if (!ticker) return;

    const td = tr.querySelector("td");
    if (!td) return;

    // 二重処理防止
    if (td.classList.contains("stock-marker")) return;

    td.classList.add("stock-marker");
    td.dataset.ticker = ticker;
    td.style.backgroundColor = "#fff3b0"; // 薄い黄色
    td.style.fontWeight = "bold";
  });
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
