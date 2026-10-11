import type { Request } from 'express';

export interface PublicUser {
  id: number;
  email: string;
  createdAt: Date;
  role: 'USER' | 'ADMIN';
}

export interface AuthenticatedRequest extends Request {
  user?: PublicUser;
}

export interface VerifiedSession {
  sub: number;
  email: string;
}
