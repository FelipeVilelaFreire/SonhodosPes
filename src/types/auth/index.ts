export type UserRole = 'admin' | 'gerente' | 'vendedora';

export interface UserAPI {
  id: string;
  email: string;
  user_metadata?: {
    nome?: string;
    role?: UserRole;
    loja?: string;
  };
}

export interface User {
  id: string;
  email: string;
  nome: string;
  role: UserRole;
  loja?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: Date;
}

export interface LoginInput {
  email: string;
  password: string;
}
