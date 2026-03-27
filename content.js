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
  let site_found = false;
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
      if (target.classList.contains("stock-marker")){
        found = true;
        continue;
      }

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
    if (found){
      console.log("markDataSymbol ConfigSelector: " + config.name);
      site_found = true;
      break;
    }
  }

  // CONFIGが合っていないサイトの場合
  if(!site_found){
    console.log("markDataSymbol ConfigSelector: FallBackDetect");
    // FallBack処理 (最後は正規表現でマッチングさせる)
    fallbackDetect();
  }
}


/**************
* MarkUp stock-code fallback support (1)
 **************/
function fallbackDetect() {
  const elements = document.querySelectorAll("table *, div *");

  for (const el of elements) {
    if (el.dataset.stockMarked) continue;

    const text = el.textContent;
    if (!text) continue;

    const result = detectStockCode(text);
    if (!result) continue;
    console.debug("fallbackDetect TYPE:", result.type, "CODE:", result.code);

    el.dataset.stockMarked = "true";

    //銘柄コード部分をマーキング
    highlightStockCode(el, result.code);
  }
}


/**************
* MarkUp stock-code fallback support (2)
 **************/
function detectStockCode(text) {
  // 銘柄名+銘柄コードの場合の対応
  const t = text.replace(/\s+/g, " ").trim();

  // 日本株（部分一致）
  const jpMatch = t.match(/\b\d{3}[0-9A-Z]\b/);
  if (jpMatch) {
    return { type: "JP", code: jpMatch[0] };
  }

  // 米国株
  const usMatch = t.match(/\b[A-Z]{1,5}([.-][A-Z])?\b/);
  if (usMatch) {
    const code = usMatch[0];
    if (["USD", "ETF", "ADR", "PER", "EPS"].includes(code)) return null;
    return { type: "US", code };
  }
  return null;
}


/**************
* MarkUp stock-code fallback support (3)
 **************/
function highlightStockCode(el, code) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node;
  while (node = walker.nextNode()) {
    if (!node.nodeValue.includes(code)) continue;

    const span = document.createElement("span");
    span.textContent = code;
    span.style.backgroundColor = "#fff3b0";
    span.style.color = "#000000";
    span.style.fontWeight = "bold";
    span.dataset.ticker = code; //TradingView用
    span.classList.add("stock-marker"); //TradingView用

    const parts = node.nodeValue.split(code);
    const fragment = document.createDocumentFragment();

    parts.forEach((part, index) => {
      if (part) {
        fragment.appendChild(document.createTextNode(part));
      }
      if (index < parts.length - 1) {
        fragment.appendChild(span.cloneNode(true));
      }
    });
    node.parentNode.replaceChild(fragment, node);
  }
}


/**************
 * Show TradingView
 **************/
async function showPreview(ticker) {
  const state = window.STOCK_MARKER.contentState;
  if (state.currentTicker === ticker) return;
  state.currentTicker = ticker;

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
document.addEventListener("mouseenter", (e) => {
  const el = getClosestStockMarker(e.target);

  // 新しい要素に入ったら、既存のタイマー(表示予約)をクリアする
  const state = window.STOCK_MARKER.contentState;
  if (state.hoverTimer) {
    clearTimeout(state.hoverTimer);
    state.hoverTimer = null;
  }

  if (!el) return;
  state.hoverTimer = setTimeout(() => {
    showPreview(el.dataset.ticker);
  }, 120);
}, true);


/**************
 * MouseLeave
 **************/
document.addEventListener("mouseleave", (e) => {
  const state = window.STOCK_MARKER.contentState;
  // 要素から外れた時もタイマーを止める(銘柄表示のタイマー予約が入っている場合はキャンセルする)
  if (getClosestStockMarker(e.target)) {
    clearTimeout(state.hoverTimer);
    state.hoverTimer = null;
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
