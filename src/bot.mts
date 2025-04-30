import { extractOnmusuName } from "./onmusu.mts";
import { extractTweetUrl, TwitterNotificationPayload } from "./twitter.mts";

export function shouldSendNotification(
  tweetUrl: URL,
  targetScreenName: string[],
): boolean {
  const { screenName } = extractTweetUrl(tweetUrl);
  if (screenName === undefined) {
    return false;
  }
  return targetScreenName.includes(screenName);
}

export function buildNotificationText(
  notification: TwitterNotificationPayload,
  tweetUrl: URL,
): string {
  const textLines = [
    `${notification.title} の新着ツイート`,
    String(tweetUrl),
  ];

  const onmusuNames = extractOnmusuName(notification.body);
  if (onmusuNames.length > 0) {
    textLines.push(""); // ハッシュタグの前に空行を挟む
    textLines.push(onmusuNames.map((name) => `#${name}`).join(" "));
  }

  return textLines.join("\n");
}
