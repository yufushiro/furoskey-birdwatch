import { ack, hello, isNotificationMessage, ping } from "./push_service.mts";
import { decryptNotification } from "./decrypt.mts";
import { loadConfig, loadPushServiceConfig } from "./load_config.mts";
import {
  extractTweetUrl,
  fetchTweetFullTextByStatusId,
  getNotificationUrl,
  TwitterNotificationPayload,
} from "./twitter.mts";
import { createNote, MisskeyRequestCreateNote } from "./misskey.mts";
import { buildNotificationText, shouldSendNotification } from "./bot.mts";

const config = await loadConfig("../config.mts");

const {
  uaid,
  uaPrivateKey,
  uaPublicKeyRaw,
  authSecretRaw,
} = await loadPushServiceConfig(config.pushService);

const ws = new WebSocket("wss://push.services.mozilla.com");

ws.onclose = () => {
  console.log("closed");
  Deno.exit(1);
};

ws.onopen = () => {
  console.log("open");
  ws.send(hello(uaid));
};

setInterval(() => {
  console.log("ping");
  ws.send(ping());
}, 5 * 60 * 1000);

ws.onmessage = async (ev) => {
  try {
    console.log(ev.data);

    const data = JSON.parse(ev.data);
    if (!isNotificationMessage(data)) {
      return;
    }
    const payload = await decryptNotification(
      data,
      uaPrivateKey,
      uaPublicKeyRaw,
      authSecretRaw,
    );
    console.log(payload);

    await processTwitterNotification(payload as TwitterNotificationPayload);

    ws.send(ack({ channelID: data.channelID, version: data.version }));
  } catch (err: unknown) {
    console.error(`[err] ${String(err)}`);
    console.error(err);
    // ack を送ってないので再接続時に再送されるはず
  }
};

async function processTwitterNotification(
  notification: TwitterNotificationPayload,
) {
  const tweetUrl = getNotificationUrl(notification);
  if (!shouldSendNotification(tweetUrl, config.twitter.targetScreenName)) {
    return;
  }

  const fullText = await tryFetchTweetFullText(tweetUrl);
  if (fullText) {
    // 省略されていないツイート本文が取得できたら body を上書きする
    notification.data.body = fullText;
  }

  const params = {
    text: buildNotificationText(notification, tweetUrl),
    visibility: config.misskey.visibility,
    noExtractMentions: true, // mention っぽいものがあっても Fediverse のユーザー宛ではないので無視
    noExtractEmojis: true, // emoji の shortcode っぽいものがあっても意図したものではないだろうから無視
  } satisfies MisskeyRequestCreateNote;

  try {
    await createNote(config.misskey, params);
  } catch (err: unknown) {
    console.warn(`[warn] Failed to create note: ${String(err)}`);
    throw err;
  }
}

async function tryFetchTweetFullText(
  tweetUrl: URL,
): Promise<string | undefined> {
  const { tweetId } = extractTweetUrl(tweetUrl);
  if (!tweetId) {
    return undefined;
  }
  try {
    return await fetchTweetFullTextByStatusId(fetch, tweetId);
  } catch (err: unknown) {
    console.warn("[warn] Failed to fetch tweet full text");
    console.warn(err);
    return undefined;
  }
}
