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
 * Version: 0.4.1
 * Last Updated: 2026-08-30
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

    const results = detectStockCode(text);
    if (!results) continue;
    console.debug("fallbackDetect: ", results);

    el.dataset.stockMarked = "true";

    // 銘柄コード部分をマーキング
    highlightStockCode(el, results);
  }
}


/**************
* MarkUp stock-code fallback support (2)
 **************/
function detectStockCode(text) {
  // 銘柄名+銘柄コードの場合の対応
  const t = text.replace(/\s+/g, " ").trim();

  // テキスト内に複数銘柄あるため複数マッチ対応
  const results = [];

  // 日本株（部分一致）
  const jpMatches = t.match(/\b\d{3}[0-9A-Z]\b/g);
  if (jpMatches) {
    jpMatches.forEach(code => {
      results.push({ type: "JP", code });
    });
  }

  // 米国株
  const usMatches = t.match(/\b[A-Z]{1,5}(?:[.-][A-Z])?\b/g);
  if (usMatches) {
    usMatches.forEach(code => {
      if (!["USD", "ETF", "ADR", "PER", "EPS"].includes(code)) {
        results.push({ type: "US", code });
      }
    });
  }

  return results.length > 0 ? results : null;
}


/**************
* MarkUp stock-code fallback support (3)
 **************/
function highlightStockCode(el, codelist) {
  if (!codelist || codelist.length === 0) return;

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }

  const pattern = new RegExp(
    `\\b(?:${[...new Set(codelist.map(result => result.code))]
      .sort((a, b) => b.length - a.length)
      .map(code => code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|")})\\b`,
    "g"
);

  for (const node of textNodes) {
    const text = node.nodeValue;

    pattern.lastIndex = 0;
    if (!pattern.test(text)) continue;
    pattern.lastIndex = 0;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    for (const match of text.matchAll(pattern)) {
      if (match.index > lastIndex) {
        fragment.appendChild(
          document.createTextNode(
            text.slice(lastIndex, match.index)
          )
        );
      }

      const code = match[0];
      const span = document.createElement("span");
      span.textContent = code;
      span.style.backgroundColor = "#fff3b0";
      span.style.color = "#000000";
      span.style.fontWeight = "bold";
      span.dataset.ticker = code;
      span.classList.add("stock-marker");

      fragment.appendChild(span);
      lastIndex = match.index + code.length;
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
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
