import { UserRole } from '../../users/user.entity';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}
