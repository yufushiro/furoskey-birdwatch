import { assertEquals } from "@std/assert";
import { buildNotificationText, shouldSendNotification } from "./bot.mts";
import { TwitterNotificationPayload } from "./twitter.mts";

Deno.test("shouldSendNotification: match user", () => {
  const tweetUrl = new URL(
    "https://twitter.com/onsen_musume_jp/status/1890053329973117164",
  );
  const targetScreenName = ["onsen_musume_jp"];
  const result = shouldSendNotification(tweetUrl, targetScreenName);
  assertEquals(result, true);
});

Deno.test("shouldSendNotification: does not match user", () => {
  const tweetUrl = new URL(
    "https://twitter.com/BBCNews/status/1865109020542894378",
  );
  const targetScreenName = ["onsen_musume_jp"];
  const result = shouldSendNotification(tweetUrl, targetScreenName);
  assertEquals(result, false);
});

Deno.test("buildNotificationText: text with hashtags", () => {
  const payload: TwitterNotificationPayload = {
    registration_ids: [
      "https://updates.push.services.mozilla.com/wpush/v2/gAAAAABnWLGxDakKklB7smaWeJnHdABJ9DZiULqZunUprugxXVOjOt8mP3MLtEPpgq3FWdaX0pLDiBnkyjs7aX4llF4sybvH-LaQHxgPAe6QKYI57lXhum6o9IRIA9ok4CQryZQY0eC523KLhHD_i-I__B-q1xFGcJFYyPsSXkEyk5piNhNOthc",
    ],
    title: "温泉むすめプロジェクト 公式",
    body: "【メディア掲載】\n" +
      "「温泉むすめ」相乗効果　上諏訪雫音－下諏訪綿音　長野県(長野日報)\n" +
      "#Yahooニュース\n" +
      "news.yahoo.co.jp/articles/b7857…\n" +
      "#温泉むすめ #温むす",
    icon:
      "https://pbs.twimg.com/profile_images/1450784424149147650/3ZU69gmj_reasonably_small.jpg",
    timestamp: "1736379343858",
    tag: "tweet-1877137136853381208",
    data: {
      lang: "en",
      bundle_text:
        "{num_total, number} new {num_total, plural, one {interaction} other {interactions}}",
      type: "tweet",
      uri: "/onsen_musume_jp/status/1877137136853381208",
      impression_id: "1866487288865476608-1077385428",
      title: "温泉むすめプロジェクト 公式",
      body: "【メディア掲載】\n" +
        "「温泉むすめ」相乗効果　上諏訪雫音－下諏訪綿音　長野県(長野日報)\n" +
        "#Yahooニュース\n" +
        "news.yahoo.co.jp/articles/b7857…\n" +
        "#温泉むすめ #温むす",
      tag: "tweet-1877137136853381208",
      scribe_target: "tweet",
    },
  };
  const tweetUrl = new URL(
    "https://twitter.com/onsen_musume_jp/status/1877137136853381208",
  );

  const expectedText = "温泉むすめプロジェクト 公式 の新着ツイート\n" +
    "https://twitter.com/onsen_musume_jp/status/1877137136853381208\n" +
    "\n" +
    "#上諏訪雫音 #下諏訪綿音";
  assertEquals(buildNotificationText(payload, tweetUrl), expectedText);
});
