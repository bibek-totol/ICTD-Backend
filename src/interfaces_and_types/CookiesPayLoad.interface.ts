import { Role } from '@prisma/client';

// const payLoad = {
//   id: user.id,
//   role: user.role,
// };

export interface CookiesAuthPayLoad {
  id: string;
  role?: Role;
}
