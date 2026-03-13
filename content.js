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
    td.style.cursor = "text";
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
  if (!el) return;
  hoverTimer = setTimeout(() => {
    showPreview(el.dataset.ticker);
  }, 120);
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
 * Style
 **************/
const style = document.createElement("style");
style.textContent = `
#stock-preview {
  position: fixed;
  top: 80px;
  left: 500px;
  width: 420px;
  height: 360px;
  background: #fff;
  border: 1px solid #ccc;
  box-shadow: 0 4px 16px rgba(0,0,0,.3);
  z-index: 999999;
  display: flex;
  flex-direction: column;
  pointer-events: auto;
}

#stock-preview .header {
  height: 32px;
  background: #f5f5f5;
  cursor: move;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  font-size: 12px;
  user-select: none;
}

#stock-preview iframe {
  flex: 1;
  border: none;
}

#stock-preview .close {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
}

#stock-preview .resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
}

.stock-marker {
  user-select: text;
  cursor: text;
}
`;

// DarkMode対応
const dark = isDarkMode();
style.textContent += dark ? `
#stock-preview {
  background: #1e1e1e;
  border-color: #444;
  color: #ddd;
}
#stock-preview .header {
  background: #2b2b2b;
}
` : "";
document.head.appendChild(style);


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
