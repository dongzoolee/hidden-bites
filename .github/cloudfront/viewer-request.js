var CLIENT_PREFIX = "/client-build";
var INDEX_PATH = CLIENT_PREFIX + "/index.html";

function hasFileExtension(uri) {
  return /\/[^/]+\.[^/]+$/.test(uri);
}

function handler(event) {
  var request = event.request;
  var uri = request.uri || "/";

  if (uri.indexOf("/api/") === 0 || uri === "/health") {
    return request;
  }

  if (uri.indexOf(CLIENT_PREFIX + "/") === 0) {
    return request;
  }

  if (uri === "/" || !hasFileExtension(uri)) {
    request.uri = INDEX_PATH;
    return request;
  }

  request.uri = CLIENT_PREFIX + uri;
  return request;
}
