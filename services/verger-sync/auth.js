import { timingSafeEqual } from "node:crypto";

export function readToken(requestUrl, host = "localhost") {
  try {
    return new URL(requestUrl || "/", `http://${host}`).searchParams.get("token") || "";
  } catch {
    return "";
  }
}

export function requestPath(requestUrl, host = "localhost") {
  try {
    return new URL(requestUrl || "/", `http://${host}`).pathname;
  } catch {
    return "/";
  }
}

export function tokenMatches(provided, expected) {
  if (!provided || !expected) return false;
  const left = Buffer.from(String(provided));
  const right = Buffer.from(String(expected));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
