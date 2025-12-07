import { assertEquals } from "@std/assert";
import { extractOnmusuName } from "./onmusu.mts";

Deno.test("extractOnmusuName: text contains multiple names", () => {
  assertEquals(
    extractOnmusuName("鬼怒川日向 玉造彗 別府環綺"),
    ["鬼怒川日向", "玉造彗", "別府環綺"],
  );
});

Deno.test("extractOnmusuName: names must be in order of appearance", () => {
  // 複数の名前が含まれる場合、出現順に抽出されること
  assertEquals(
    extractOnmusuName("別府環綺 鬼怒川日向 玉造彗"),
    ["別府環綺", "鬼怒川日向", "玉造彗"],
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

Deno.test("extractOnmusuName: name with half-width middle dot", () => {
  // 名前に半角中点が含まれている場合も正しく抽出できる
  assertEquals(
    extractOnmusuName("奏･バーデン･由布院"),
    ["奏・バーデン・由布院"],
  );
});
