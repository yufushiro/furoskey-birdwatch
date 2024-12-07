## これは何

何らかの事情で API の無償提供が制限されてしまったが WebPush
での通知は対応しているという「とあるSNS」の新着投稿を Misskey
に通知するための実装です

## 仕組み

Firefox で「とあるSNS」の WebPush 通知を有効にした後に、ブラウザと同じ仕組みで
Mozilla Push Service (push.services.mozilla.com)
に接続することでブラウザに送られる通知の内容を読み取っています

探してみたところ同じような仕組みで WebPush
を受信する実装を作った方の解説記事があったため、特に Message Encryption
を復号する実装を作る際に参考にしました
https://blog.nest.moe/posts/receive-latest-tweets-by-web-push/en

## 設定ファイルについて

（あとで書く）
