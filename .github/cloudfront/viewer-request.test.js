const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "viewer-request.js"), "utf8");
const sandbox = {};

vm.createContext(sandbox);
vm.runInContext(`${source}\nthis.handler = handler;`, sandbox);

function rewrite(uri) {
  const response = sandbox.handler({
    request: {
      uri
    }
  });

  return response.uri;
}

assert.equal(rewrite("/"), "/client-build/index.html");
assert.equal(rewrite("/scores"), "/client-build/index.html");
assert.equal(rewrite("/report?place=abc"), "/client-build/index.html");
assert.equal(rewrite("/_next/static/chunks/app.js"), "/client-build/_next/static/chunks/app.js");
assert.equal(rewrite("/favicon.ico"), "/client-build/favicon.ico");
assert.equal(rewrite("/client-build/index.html"), "/client-build/index.html");
assert.equal(rewrite("/api/summary"), "/api/summary");
assert.equal(rewrite("/api/restaurants/place/report"), "/api/restaurants/place/report");
assert.equal(rewrite("/health"), "/health");

console.log("viewer-request tests passed");
