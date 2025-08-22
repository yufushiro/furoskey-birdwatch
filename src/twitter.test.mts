import { assertEquals } from "@std/assert";
import { fetchTweetFullTextByStatusId } from "./twitter.mts";

Deno.test("fetchTweetFullTextByStatusId: fetch full text from note_tweet", async () => {
  // fetch 関数のモック
  const mockFetch: typeof globalThis.fetch = (input, init) => {
    if (typeof input === "string" && input.startsWith("https://twitter.com/")) {
      // guest_token 取得
      return Promise.resolve(new Response("gt=mocked_guest_token;"));
    }
    if (
      typeof input === "string" &&
      input.startsWith("https://api.x.com/graphql/") &&
      input.includes("TweetResultByRestId")
    ) {
      // ツイート取得
      const headers = init?.headers as Record<string, string>;
      assertEquals(headers["x-guest-token"], "mocked_guest_token");

      // レスポンスに note_tweet が含まれるパターン
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              tweetResult: {
                result: {
                  note_tweet: {
                    note_tweet_results: {
                      result: {
                        text: "tweet text (note_tweet)",
                      },
                    },
                  },
                  legacy: {
                    full_text: "tweet text (full_text)",
                  },
                },
              },
            },
          }),
          { status: 200 },
        ),
      );
    }
    throw new Error("Unexpected fetch input");
  };

  assertEquals(
    await fetchTweetFullTextByStatusId(mockFetch, "1234567890123456789"),
    "tweet text (note_tweet)",
  );
});

Deno.test("fetchTweetFullTextByStatusId: fetch full text from full_text", async () => {
  // fetch 関数のモック
  const mockFetch: typeof globalThis.fetch = (input, init) => {
    if (typeof input === "string" && input.startsWith("https://twitter.com/")) {
      // guest_token 取得
      return Promise.resolve(new Response("gt=mocked_guest_token;"));
    }
    if (
      typeof input === "string" &&
      input.startsWith("https://api.x.com/graphql/") &&
      input.includes("TweetResultByRestId")
    ) {
      // ツイート取得
      const headers = init?.headers as Record<string, string>;
      assertEquals(headers["x-guest-token"], "mocked_guest_token");

      // レスポンスに note_tweet が含まれないパターン
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              tweetResult: {
                result: {
                  legacy: {
                    full_text: "tweet text (full_text)",
                  },
                },
              },
            },
          }),
          { status: 200 },
        ),
      );
    }
    throw new Error("Unexpected fetch input");
  };

  assertEquals(
    await fetchTweetFullTextByStatusId(mockFetch, "1234567890123456789"),
    "tweet text (full_text)",
  );
});
