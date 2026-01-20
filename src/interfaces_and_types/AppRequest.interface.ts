import { Request } from "express";

import { Role } from "@prisma/client";

interface AppRequest extends Request {
  user?: {
    role: Role;
    userId: string;
    requestId?: string;
  };
}

export default AppRequest;
