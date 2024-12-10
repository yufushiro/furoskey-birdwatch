import config from "../config.mts";
import { ack, hello, isNotificationMessage, ping } from "./push_service.mts";
import { decryptNotification } from "./decrypt.mts";
import { loadPushServiceConfig } from "./load_config.mts";
import {
  extractTweetUrl,
  getNotificationUrl,
  TwitterNotificationPayload,
} from "./twitter.mts";
import { createNote, MisskeyRequestCreateNote } from "./misskey.mts";

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
};

async function processTwitterNotification(
  notification: TwitterNotificationPayload,
) {
  const tweetUrl = getNotificationUrl(notification);
  const { screenName } = extractTweetUrl(tweetUrl);

  if (screenName === undefined) {
    return;
  }
  if (!config.twitter.targetScreenName.includes(screenName)) {
    return;
  }

  const params = {
    text: `${notification.title} の新着ツイート\n${String(tweetUrl)}`,
    visibility: config.misskey.visibility,
    noExtractMentions: true, // mention っぽいものがあっても Fediverse のユーザー宛ではないので無視
    noExtractEmojis: true, // emoji の shortcode っぽいものがあっても意図したものではないだろうから無視
  } satisfies MisskeyRequestCreateNote;

  try {
    await createNote(config.misskey, params);
  } catch (err: unknown) {
    console.warn(`[warn] Failed to create note: ${String(err)}`);
  }
}
