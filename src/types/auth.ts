export type UserStatus = 'ACTIVE' | 'DISABLED';
export type RoleStatus = 'ACTIVE' | 'DISABLED';

export interface RoleSummary {
  id: string;
  code: string;
  name: string;
}

export interface Principal {
  id: string;
  username: string;
  displayName: string;
  status: UserStatus;
  roles: RoleSummary[];
  permissions: string[];
}

export interface AuthSession {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: Principal;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export interface SystemUser extends Principal {
  mobile?: string;
  email?: string;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface UserCreatePayload {
  username: string;
  displayName: string;
  mobile?: string;
  email?: string;
  initialPassword: string;
  roleIds: string[];
}

export interface UserUpdatePayload {
  displayName: string;
  mobile?: string;
  email?: string;
  status: UserStatus;
  roleIds: string[];
}

export interface SystemRole {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: RoleStatus;
  permissions?: Permission[];
}

export interface RolePayload {
  code: string;
  name: string;
  description?: string;
  status: RoleStatus;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  module?: string;
  action?: string;
  description?: string;
}
