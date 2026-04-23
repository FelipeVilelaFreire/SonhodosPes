export { MOCK_USERS, findMockUser, findMockUserByEmail, listMockUsers } from './users';
export { MOCK_HISTORICO, getMockHistoricoRecentes } from './historico';
export { computeStatsFromProdutos, FAKE_DELAY_MS } from './stats';
export type { DashboardStats } from './stats';

export async function simulateApiDelay(ms = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
