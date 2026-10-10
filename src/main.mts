import {
  ack,
  connectPushService,
  isNotificationMessage,
} from "./push_service.mts";
import { decryptNotification } from "./decrypt.mts";
import { loadConfig, loadPushServiceConfig } from "./load_config.mts";
import {
  extractTweetUrl,
  fetchTweetById,
  getNotificationUrl,
  getTweetFullText,
  isEditTweet,
  TwitterNotificationPayload,
  TwitterResponse,
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

const RECONNECT_BASE_DELAY = Temporal.Duration.from({ seconds: 1 });
const RECONNECT_MAX_DELAY = Temporal.Duration.from({ minutes: 5 });

function delay(duration: Temporal.Duration): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(() => resolve(), duration.total("milliseconds"));
  return promise;
}

let reconnectAttempt = 0;
while (true) {
  try {
    await connectPushService(uaid, async ({ data, send }) => {
      try {
        // 接続が確立したら再接続試行回数をリセットする
        reconnectAttempt = 0;

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

        send(ack({ channelID: data.channelID, version: data.version }));
      } catch (err: unknown) {
        console.error(`[err] Failed to process message: ${String(err)}`);
        console.error(err);
        // ack を送ってないので再接続時に再送されるはず
      }
    });
  } catch (err: unknown) {
    console.error(`[err] Failed to establish WebSocket: ${String(err)}`);
  }

  // 再接続時の待機時間は exponential backoff で増加させる
  const delayMs = Math.min(
    RECONNECT_BASE_DELAY.total("milliseconds") * 2 ** reconnectAttempt,
    RECONNECT_MAX_DELAY.total("milliseconds"),
  );
  reconnectAttempt++;
  console.warn(`[warn] Reconnecting in ${delayMs}ms`);

  await delay(Temporal.Duration.from({ milliseconds: delayMs }));
}

async function processTwitterNotification(
  notification: TwitterNotificationPayload,
) {
  const tweetUrl = getNotificationUrl(notification);
  if (!shouldSendNotification(tweetUrl, config.twitter.targetScreenName)) {
    return;
  }

  // ツイートの詳細を取得する（失敗しても通知は可能）
  const responseJson = await tryFetchTweet(tweetUrl);
  if (responseJson !== undefined) {
    if (isEditTweet(responseJson)) {
      // 編集ツイートであれば通知しない
      return;
    }
    const fullText = getTweetFullText(responseJson);
    // 省略されていないツイート本文が取得できたら body を上書きする
    notification.body = fullText;
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

async function tryFetchTweet(
  tweetUrl: URL,
): Promise<TwitterResponse | undefined> {
  const { tweetId } = extractTweetUrl(tweetUrl);
  if (!tweetId) {
    return undefined;
  }
  try {
    return await fetchTweetById(fetch, tweetId);
  } catch (err: unknown) {
    console.warn("[warn] Failed to fetch tweet full text");
    console.warn(err);
    return undefined;
  }
}
