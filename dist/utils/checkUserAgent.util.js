"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ua_parser_js_1 = require("ua-parser-js");
function checkUserAgent(req) {
    const userAgent = req.headers["user-agent"];
    if (!userAgent)
        return false;
    const parser = new ua_parser_js_1.UAParser(userAgent);
    const result = parser.getResult();
    const browserName = result.browser?.name?.toLowerCase();
    const deviceType = result.device?.type; // "mobile" | "tablet" | undefined
    const isBrowser = browserName !== undefined &&
        ["chrome", "firefox", "safari", "edge", "opera"].includes(browserName) &&
        !deviceType;
    return isBrowser;
}
exports.default = checkUserAgent;
