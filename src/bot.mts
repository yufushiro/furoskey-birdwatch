import { extractTweetUrl } from "./twitter.mts";

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
