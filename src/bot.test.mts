import { assertEquals } from "@std/assert";
import { shouldSendNotification } from "./bot.mts";

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
