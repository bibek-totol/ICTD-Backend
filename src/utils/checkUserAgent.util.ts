import { Request } from "express";
import { UAParser } from "ua-parser-js";

function checkUserAgent(req: Request): boolean {
  const userAgent = req.headers["user-agent"];
  if (!userAgent) return false;

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const browserName = result.browser?.name?.toLowerCase();
  const deviceType = result.device?.type; // "mobile" | "tablet" | undefined

  const isBrowser =
    browserName !== undefined &&
    ["chrome", "firefox", "safari", "edge", "opera"].includes(browserName) &&
    !deviceType;

  return isBrowser;
}

export default checkUserAgent;
