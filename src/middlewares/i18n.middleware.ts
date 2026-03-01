import { Response, NextFunction } from "express";
import AppRequest from "../interfaces_and_types/AppRequest.interface";

export const i18nMiddleware = (req: AppRequest, res: Response, next: NextFunction) => {
    const lang = req.headers["accept-language"] || "bn";
    // Support both full locale and shorthand
    req.lang = lang.includes("en") ? "en" : "bn";
    next();
};
