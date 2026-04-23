import type { User } from '@/src/types/auth';

export const MOCK_USERS: Array<User & { password: string }> = [
  {
    id: 'mock-admin-1',
    email: 'admin@sonhodospes.com',
    nome: 'Marcelo Freire',
    role: 'admin',
    loja: 'Matriz',
    password: 'admin123',
  },
  {
    id: 'mock-gerente-1',
    email: 'gerente@sonhodospes.com',
    nome: 'Ana Silva',
    role: 'gerente',
    loja: 'Shopping Conjunto Nacional',
    password: 'gerente123',
  },
  {
    id: 'mock-vendedora-1',
    email: 'vendedora@sonhodospes.com',
    nome: 'Maria Santos',
    role: 'vendedora',
    loja: 'Shopping Conjunto Nacional',
    password: 'vendedora123',
  },
  {
    id: 'mock-vendedora-2',
    email: 'joana@sonhodospes.com',
    nome: 'Joana Oliveira',
    role: 'vendedora',
    loja: 'Shopping Conjunto Nacional',
    password: 'joana123',
  },
];

export function findMockUser(email: string, password: string): User | null {
  const u = MOCK_USERS.find(
    x => x.email.toLowerCase() === email.toLowerCase() && x.password === password
  );
  if (!u) return null;
  const { password: _p, ...user } = u;
  return user;
}

export function findMockUserByEmail(email: string): User | null {
  const u = MOCK_USERS.find(x => x.email.toLowerCase() === email.toLowerCase());
  if (!u) return null;
  const { password: _p, ...user } = u;
  return user;
}

export function listMockUsers(): User[] {
  return MOCK_USERS.map(({ password: _p, ...user }) => user);
}
