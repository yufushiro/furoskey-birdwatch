import { assertEquals } from "@std/assert";
import { fetchTweetById, getTweetFullText, isEditTweet } from "./twitter.mts";

Deno.test("fetchTweetById: fetch tweet", async () => {
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

      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              tweetResult: {
                result: {
                  rest_id: "1234567890123456789",
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

  const responseJson = await fetchTweetById(
    mockFetch,
    "1234567890123456789",
  );
  assertEquals(
    responseJson.data.tweetResult.result.rest_id,
    "1234567890123456789",
  );
});

Deno.test("getTweetFullText: get full text from note_tweet", () => {
  // レスポンスに note_tweet が含まれるパターン
  const responseJson = {
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
  };

  assertEquals(
    getTweetFullText(responseJson),
    "tweet text (note_tweet)",
  );
});

Deno.test("getTweetFullText: get full text from full_text", () => {
  const responseJson = {
    data: {
      tweetResult: {
        result: {
          legacy: {
            full_text: "tweet text (full_text)",
          },
        },
      },
    },
  };

  assertEquals(
    getTweetFullText(responseJson),
    "tweet text (full_text)",
  );
});

Deno.test("isEditTweet: when tweet is edit tweet", () => {
  const editTweetResponse = {
    data: {
      tweetResult: {
        result: {
          rest_id: "1111111111111111112",
          edit_control: {
            initial_tweet_id: "1111111111111111111",
          },
        },
      },
    },
  };
  assertEquals(isEditTweet(editTweetResponse), true);
});

Deno.test("isEditTweet: when tweet is initial tweet", () => {
  const editTweetResponse = {
    data: {
      tweetResult: {
        result: {
          rest_id: "1111111111111111111",
          edit_control: {
            edit_tweet_ids: ["1111111111111111111", "1111111111111111112"],
          },
        },
      },
    },
  };
  assertEquals(isEditTweet(editTweetResponse), false);
});
