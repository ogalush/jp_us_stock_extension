window.STOCK_MARKER = window.STOCK_MARKER || {};
window.STOCK_MARKER.SITE_CONFIGS = [
  {
    name: "PeakFinder",
    selector: "tr[data-symbol]",
    getCode: el => el.dataset.symbol,
    target: el => el.querySelector("td"),
    applyStyle: (target) => {
      target.style.color = "#000000"; // 黒色 (ダークモード時に白色 vs 黄色(背景)のため指定)
      target.style.backgroundColor = "#fff3b0"; // 黄色
      target.style.fontWeight = "bold";
    }
  },
  {
    name: "discover-stocks_vote",
    selector: 'input[type="checkbox"][aria-label]',
    getCode: el => el.getAttribute("aria-label"),
    target: el => el.closest('[data-testid="stCheckbox"]'), 
    applyStyle: (target) => {
      // チェックボックスの文字がpタグ
      const p = target.querySelector('[data-testid="stMarkdownContainer"] p');
      if (p) {
        p.style.color = "#000000"; // 黒色 (ダークモード時に白色 vs 黄色(背景)のため指定)
      }
      target.style.backgroundColor = "#fff3b0"; // 黄色
    }
  },
  {
    name: "discover-stocks_result",
    selector: "[data-stock-code]",
    getCode: el => el.dataset.stockCode,
    target: el => el,
    applyStyle: (target) => {
      target.style.color = "#000000"; // 黒色 (ダークモード時に白色 vs 黄色(背景)のため指定)
      target.style.backgroundColor = "#fff3b0"; // 黄色
    }
  }
];
