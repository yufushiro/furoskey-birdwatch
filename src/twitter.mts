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

export interface TwitterResponse {
  // deno-lint-ignore no-explicit-any
  data: any;
}

/** Twitter の tweetId からツイートを取得する */
export async function fetchTweetById(
  fetch: typeof globalThis.fetch,
  tweetId: string,
): Promise<TwitterResponse> {
  // guest_tokenを取得（レスポンス本文から "gt=..." を抽出）
  const guestTokenRes = await fetch("https://twitter.com/");
  const body = await guestTokenRes.text();
  const guestTokenMatch = body.match(/gt=([^;]+);/);
  if (!guestTokenMatch) {
    throw new Error("Failed to get guestToken");
  }
  const guestToken = guestTokenMatch[1];

  // ツイート本文を取得
  const endpoint =
    "https://api.x.com/graphql/qxWQxcMLiTPcavz9Qy5hwQ/TweetResultByRestId";
  const variables = {
    "tweetId": tweetId,
    "withCommunity": false,
    "includePromotedContent": false,
    "withVoice": false,
  };
  const features = {
    "creator_subscriptions_tweet_preview_api_enabled": true,
    "premium_content_api_read_enabled": false,
    "communities_web_enable_tweet_community_results_fetch": true,
    "c9s_tweet_anatomy_moderator_badge_enabled": true,
    "responsive_web_grok_analyze_button_fetch_trends_enabled": false,
    "responsive_web_grok_analyze_post_followups_enabled": false,
    "responsive_web_jetfuel_frame": true,
    "responsive_web_grok_share_attachment_enabled": true,
    "articles_preview_enabled": true,
    "responsive_web_edit_tweet_api_enabled": true,
    "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
    "view_counts_everywhere_api_enabled": true,
    "longform_notetweets_consumption_enabled": true,
    "responsive_web_twitter_article_tweet_consumption_enabled": true,
    "tweet_awards_web_tipping_enabled": false,
    "responsive_web_grok_show_grok_translated_post": false,
    "responsive_web_grok_analysis_button_from_backend": false,
    "creator_subscriptions_quote_tweet_preview_enabled": false,
    "freedom_of_speech_not_reach_fetch_enabled": true,
    "standardized_nudges_misinfo": true,
    "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled":
      true,
    "longform_notetweets_rich_text_read_enabled": true,
    "longform_notetweets_inline_media_enabled": true,
    "payments_enabled": false,
    "rweb_xchat_enabled": false,
    "profile_label_improvements_pcf_label_in_post_enabled": true,
    "rweb_tipjar_consumption_enabled": true,
    "verified_phone_label_enabled": false,
    "responsive_web_grok_image_annotation_enabled": true,
    "responsive_web_grok_imagine_annotation_enabled": true,
    "responsive_web_grok_community_note_auto_translation_is_enabled": false,
    "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
    "responsive_web_graphql_timeline_navigation_enabled": true,
    "responsive_web_enhance_cards_enabled": false,
  };
  const params = new URLSearchParams({
    variables: JSON.stringify(variables),
    features: JSON.stringify(features),
  });
  const url = `${endpoint}?${params.toString()}`;

  const bearerToken = "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xn" +
    "Zz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "authorization": `Bearer ${bearerToken}`,
      "x-guest-token": guestToken,
      "content-type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Twitter API error: ${res.status} ${res.statusText}`);
  }

  const responseJson: unknown = await res.json();
  if (
    !(responseJson !== null && typeof responseJson === "object" &&
      "data" in responseJson)
  ) {
    throw new Error(`Twitter API error: InvalidResponse ${res.statusText}`);
  }

  return responseJson;
}

/** Twitter のレスポンスからツイート本文を取得する */
export function getTweetFullText(
  responseJson: TwitterResponse,
): string {
  try {
    const noteTweetText = responseJson.data?.tweetResult?.result?.note_tweet
      ?.note_tweet_results?.result?.text;
    if (noteTweetText) {
      return noteTweetText;
    }
    const fullText = responseJson.data?.tweetResult?.result?.legacy?.full_text;
    if (fullText) {
      return fullText;
    }
    throw new Error("Tweet not found in API response");
  } catch (err) {
    throw new Error("Failed to parse tweet text: " + String(err));
  }
}

/** 過去のツイートを編集するツイートであるかどうかを判定する */
export function isEditTweet(
  responseJson: TwitterResponse,
): boolean {
  const tweetId: string | undefined = responseJson.data?.tweetResult
    ?.result?.rest_id;
  const initialTweetId: string | undefined = responseJson.data
    ?.tweetResult?.result?.edit_control?.initial_tweet_id;
  return initialTweetId !== undefined && initialTweetId !== tweetId;
}
