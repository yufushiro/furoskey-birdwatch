import { assertEquals } from "@std/assert";
import { extractOnmusuName } from "./onmusu.mts";

Deno.test("extractOnmusuName: text contains multiple names", () => {
  // 要素の順序は不定なため sort 後の結果で比較する
  assertEquals(
    extractOnmusuName("鬼怒川日向 玉造彗 別府環綺").sort(),
    ["鬼怒川日向", "玉造彗", "別府環綺"].sort(),
  );
});

Deno.test("extractOnmusuName: text contains duplicated names", () => {
  // 同じ名前が複数回登場しても結果の要素は重複させない
  assertEquals(
    extractOnmusuName("草津結衣奈 草津結衣奈"),
    ["草津結衣奈"],
  );
});

Deno.test("extractOnmusuName: text contains space-separated names", () => {
  // スペースで区切られた名前が含まれている場合も正しく抽出できる
  assertEquals(
    extractOnmusuName("草津 結衣奈"),
    ["草津結衣奈"],
  );
  assertEquals(
    extractOnmusuName("草津　結衣奈"),
    ["草津結衣奈"],
  );
});
