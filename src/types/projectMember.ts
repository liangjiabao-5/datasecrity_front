import type { UserStatus } from './auth';

export interface ProjectOwner {
  id: string;
  username: string;
  displayName: string;
  roleNames: string[];
}

export interface ProjectMember {
  userId: string;
  username: string;
  displayName: string;
  accessLevel: 'EDITOR';
  status: UserStatus;
  grantedBy?: string;
  grantedAt?: string;
}

export interface ProjectMemberList {
  projectId: string;
  owner: ProjectOwner;
  members: ProjectMember[];
}

export interface ProjectMemberCandidate {
  id: string;
  username: string;
  displayName: string;
  roleNames?: string[];
}
