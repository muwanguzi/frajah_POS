import { Role } from '../enums/role.enum';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  branchId: string | null;
  isActive: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UserProfile extends User {
  fullName: string;
  branch?: {
    id: string;
    name: string;
  } | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
  requiresTwoFactor?: boolean;
}
