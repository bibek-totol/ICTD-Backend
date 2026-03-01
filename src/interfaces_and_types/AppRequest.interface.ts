import { Request } from "express";
import { Role } from "@prisma/client";

interface AppRequest extends Request {
  user?: {
    role: Role;
    userId: string;
    requestId?: string;
    // Jurisdiction fields — populated by AuthorizationMiddleware
    division?: string | null;
    district?: string | null;
    upazila?: string | null;
    email?: string | null;
  };
  lang?: string;
}

export default AppRequest;
