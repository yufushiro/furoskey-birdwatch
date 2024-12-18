# 温むす新着通知 Bot

## アカウント

2024/12/11 より、以下のアカウントにて「温むす新着通知Bot」を運用しています

- [@onsen_tweet_bot@onsen-musume.fun](https://onsen-musume.fun/@onsen_tweet_bot)

なお、ふろすきー (onsen-musume.fun) の現行の[利用規約](https://cryo.jp/misskey/onsen/tos.php)では Bot の運用が禁止されていますが、当 Bot についてはサーバー管理者の原木しいたけ氏 ([@cryo@onsen-musume.fun](https://onsen-musume.fun/@cryo)) から個別の許可を得た上で運用に当たっています

## 仕様

Twitter から特定のアカウントの新着ツイートを検知して、ツイート URL を本文に含むノートを Misskey に投稿します

通知例: https://onsen-musume.fun/notes/a1ncf5s9xvzj1t6q

通知対象のアカウントは次の通りです:

- 温泉むすめプロジェクト公式アカウント ([@onsen_musume_jp](https://twitter.com/onsen_musume_jp))

新着ツイートのうち RT については通知対象から除外しています

## 運用者

Bot のスクリプトに関しては、ゆふしろ ([@yufushiro@m.yufushiro.dev](https://m.yufushiro.dev/@yufushiro)) が開発および運用を行っています

ソースコードについては GitHub の [yufushiro/furoskey-birdwatch](https://github.com/yufushiro/furoskey-birdwatch) にて公開しているものと同一のものを使用しています

## 運用方針

- 公式アカウントと誤認される振る舞いをしない（**最も重要**）
- 自我を持たせない
    - 機械的な文面のノート投稿のみ行います
- ノートの公開範囲をホーム以下とする
    - Fediverse における Bot 運用の慣習に従い運用します
- ツイート本文の転載をしない
    - 通知対象のツイート本文には著作物性のあるコンテンツを含む場合があり、投稿にあたって個別の判断が必要になるため自動投稿には適さないと考えています
- ノート投稿以外のフォローバックなどのアクションを行わない
    - 運用に関する告知を目的としたリノートを行う場合がありますが、頻度は最小限に留めます

これらの方針は Bot の実装および投稿内容を検討するにあたっての基礎となっているため、Bot に関する機能要望などを送る際などに参考としてください

なお、1 番目の項目以外は運用者の思想や外部環境の変化などによって変更される可能性があります。ただし、3, 4 番目については Bot 運用にあたって原木しいたけ氏から指定されている事項でもあるため、これらは運用者一人の意思のみで変わることはありません

## おことわり

- この Bot による通知の正確性については無保証です
- 通知のリアルタイム性について、通常は数秒以内の遅延で投稿されることが多いですが、Twitter や Mozilla Push Service の WebPush 配信状況および Bot 自体の不具合などの要因によって通知漏れや大幅な遅延が生じる場合があります
    - 運用者が通知漏れに気付いたタイミングで手動でノート投稿を行う場合もありますが、必ずしも補完される保証があるものではありません
- Bot が使用している各種外部サービスの仕様変更の影響により通知を継続できなくなった場合、運用者のやる気次第で予告なく運用を終了する可能性があります

## お問い合わせ先

- Fediverse (Mastodon): [@yufushiro@m.yufushiro.dev](https://m.yufushiro.dev/@yufushiro)
- Twitter: [@yufushiro](https://twitter.com/yufushiro)
- GitHub ([yufushiro/furoskey-birdwatch](https://github.com/yufushiro/furoskey-birdwatch)) の Issue および Discussion でも不具合報告・要望等を受け付けています

## 沿革

- 2024/12/11
    - 本運用を開始
    - ノートの公開範囲を「ホーム」に変更
- 2024/12/7
    - アカウント開設 ([@onsen_tweet_bot@onsen-musume.fun](https://onsen-musume.fun/@onsen_tweet_bot))
    - ノートの公開範囲を「フォロワー」に設定して試験運用を開始
