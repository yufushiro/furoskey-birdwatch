export interface TwitterNotificationPayload {
  registration_ids: string[];
  title: string;
  body: string;
  icon: string;
  timestamp: string;
  tag: string;
  data: {
    lang: string;
    bundle_text: string;
    type: string;
    uri: string;
    impression_id: string;
    title: string;
    body: string;
    tag: string;
    scribe_target: string;
  };
}

export function getNotificationUrl(payload: TwitterNotificationPayload) {
  return new URL(payload.data.uri, "https://twitter.com/");
}

export function extractTweetUrl(url: URL) {
  const match = url.pathname.match(/^\/([^\/]+)\/status\/([0-9]+)$/);
  return {
    screenName: match?.[1],
    tweetId: match?.[2],
  };
}
