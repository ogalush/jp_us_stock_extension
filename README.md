# jp_us_stock_extension
JP/US Stock Checker for PeakFinder  

[日本株/米国株 銘柄チェッカー](https://chromewebstore.google.com/detail/%E6%97%A5%E6%9C%AC%E6%A0%AA%E7%B1%B3%E5%9B%BD%E6%A0%AA-%E9%8A%98%E6%9F%84%E3%83%81%E3%82%A7%E3%83%83%E3%82%AB%E3%83%BC/jajcbbhfdckikdhpgfjdaedndiolelkp?authuser=0&hl=ja)

# 使い方
1. 拡張機能をダウンロードする  
https://github.com/ogalush/jp_us_stock_extension/archive/refs/heads/main.zip  
→ ダウンロード後、zipファイルを解凍する。  

2. 拡張機能を入れる
```
Chrome 拡張のインストール方法:
1. chrome://extensions/ を開く
2. 画面右上のデベロッパーモードを有効化
3. 「パッケージ化されていない拡張機能を読み込む」を開く。
4. ダウンロードした「jp_us_stock_extension」フォルダを選択する。
5. 拡張機能ウィンドウに「日本株/米国株 銘柄チェッカー」が表示されればOK.
```
3. PeakFinderで銘柄を取得する  
4. 「右クリック」→ 「日米銘柄をマーキングする」を押す。  
<img width="206" height="433" alt="image" src="https://github.com/user-attachments/assets/90a8e8b0-ff24-4248-9d41-fb6378a914a1" />  

  
5. ティッカーコードが黒い太字になるので、マウスポインタを合わせる。  
→ TradingViewのPC版ウィンドウが表示される。
<img width="600" height="639" alt="image" src="https://github.com/user-attachments/assets/7728ef2f-9710-48c2-8ecf-acc3bd016742" />
  
6. 足調整  
デフォルト: 日足  
TradingViewの足を調整するとウィンドウを閉じるまで保持します。  
使い方:  
表示されたTradingViewウィンドウで足を押す。  
<img width="427" height="196" alt="image" src="https://github.com/user-attachments/assets/b2714189-c8f4-4012-8cf9-1a35df714282" />
  
PeakFinderで、別な銘柄を選ぶと足を維持した状態で次の銘柄が表示されます。  
<img width="554" height="138" alt="image" src="https://github.com/user-attachments/assets/c624f2d2-e92c-41c3-8311-d493ad7ebdaa" />
  
9. TradingViewのウィンドウを閉じる場合  
→ ブラウザのウィンドウを閉じるのと同じ。  
  
# その他
## ChromeStoreの更新方法
### ローカルで開発する。
vscodeで編集、その後、Chomeブラウザで表示確認。

### パッケージング
提出用のzipファイルを用意する。  
 `manifest.json` が直下にあること。
```
% cd jp_us_stock_extension_main
zip -vr ../jp_us_stock_extension_main.zip . \
  -x "README.md" \
  -x ".git/*" \
  -x ".DS_Store"
```
### 審査へ提出
* [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) へログイン
```
•	Google アカウントでログイン
•	既存の拡張機能が一覧に表示される
```
* 「アイテムを更新」する
```
1.	対象の拡張をクリック
2.	［パッケージ］ or ［Store listing］画面へ
3.	「新しいパッケージをアップロード」
4.	v0.2 の ZIP をアップロード
```
* 審査用の変更内容を書く
変更内容を簡潔に記載する。
* プライバシー関連
個人情報は収集していないので、その旨記載。
* 審査に提出
「審査に送信」ボタンを押す。

### バージョンタグ付け
公開されたら、codefreezeさせるため、バージョンタグを付与する。
```
$ git clone git@github.com:ogalush/jp_us_stock_extension.git
$ VER='v0.3'
$ git tag -a ${VER:?} -m "Release ${VER:?}
- We can preview JP and US stocks.
- WE use TradingView for PC site."
$ git push origin ${VER:?}
```
修正をして改めてtag打ちしたい場合は、remote tagを削除して再度tag付与することで対応可能。
```
$ git push origin --delete ${VER:?}
```
以上
