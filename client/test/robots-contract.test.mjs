import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("public robots.txt welcomes search crawlers", async () => {
  const robots = await readFile("public/robots.txt", "utf8");

  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.doesNotMatch(robots, /^Disallow:/m);
});
