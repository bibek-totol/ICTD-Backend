import * as cookieOptions from "../configs/options/cookies.option";
export function assignAuthCookie(res, jwtToken) {
    res.cookie("auth_token", jwtToken, cookieOptions.assignCookieOptions);
}
