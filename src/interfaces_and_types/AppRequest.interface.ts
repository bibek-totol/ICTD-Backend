import { Request } from 'express';
import { Role } from '@prisma/client';

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
  // Ensure query and params are explicitly recognized if inheritance fails for some reason
  query: Request['query'];
  params: Request['params'];
}

export default AppRequest;
