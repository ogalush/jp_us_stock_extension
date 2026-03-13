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
 * Version: 0.2
 * Last Updated: 2026-03-12
 */


/**************
 * ページ遷移
 **************/
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action !== "setSymbol") return;
  try {
    const {url, ticker} = msg;

    // 現在のURLから「symbol」パラメータを抽出
    const currentParams = new URLSearchParams(window.location.search);
    const currentSymbol = currentParams.get("symbol");

    // 同じtickerなら何もしない
    if (ticker === currentSymbol) {
      sendResponse({ success: true });
      return true;
    }

    // 【重要】足を変えた際に表示される「このページを離れますか？対策」。
    // 戻るボタンの履歴が爆増しないようにlocation.replaceを用いる。
    disableBeforeUnload();
    window.location.replace(url);

  } catch (e) {
    window.location.reload();
  }
  sendResponse({ success: true });
  return true;
});


/**************
 * Interval保存 (TradingViewで足を変更した場合保持する)
 **************/
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-value]");
  if (!btn) return;
  const interval = btn.dataset.value;
  if (!interval) return;
  console.log("Interval: " + interval)
  chrome.storage.local.set({
    tv_interval: interval
  });
});


/**************
 * 離脱ガードの無効化 (追加)
 **************/
// TradingViewが設定する「離脱確認」を力技で黙らせます
const disableBeforeUnload = () => {
  window.addEventListener('beforeunload', (e) => {
    e.stopImmediatePropagation();
  }, true);

  // プロパティ自体をロックして書き換え不能にする
  Object.defineProperty(window, 'onbeforeunload', {
    get: function() { return null; },
    set: function() {}
  });
};
disableBeforeUnload();