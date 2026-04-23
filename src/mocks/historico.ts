import type { LogMudanca, OperacaoEstoque } from '@/src/types/estoque';
import { MOCK_USERS } from './users';

const PRODUTOS_DEMO = [
  { codigo: '37221', nome: 'TENIS KNIT 26171 THEORIA', cor: 'ROSA BALLET', tamanho: '37' },
  { codigo: '37221', nome: 'TENIS KNIT 26171 THEORIA', cor: 'PRETO', tamanho: '36' },
  { codigo: '37201', nome: 'SCARPIN NAPA MADRID', cor: 'PRETO', tamanho: '37' },
  { codigo: '37201', nome: 'SCARPIN NAPA MADRID', cor: 'NUDE', tamanho: '36' },
  { codigo: '48001', nome: 'BOLSA COURO FLY', cor: 'PRETA', tamanho: 'U' },
  { codigo: '48001', nome: 'BOLSA COURO FLY', cor: 'CAMEL', tamanho: 'U' },
  { codigo: '55001', nome: 'CINTO COURO LORENA', cor: 'PRETO', tamanho: 'M' },
  { codigo: '37210', nome: 'RASTEIRA TRASEIRO NAPA', cor: 'CAMEL', tamanho: '35' },
  { codigo: '65001', nome: 'CARTEIRA COURO MARJU', cor: 'PRETA', tamanho: 'U' },
  { codigo: '37220', nome: 'TENIS NAPA CAMURCA SAME', cor: 'BRANCO', tamanho: '37' },
];

const OPERACOES: OperacaoEstoque[] = ['venda', 'venda', 'venda', 'venda', 'entrada', 'ajuste'];

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

function minutesAgo(m: number): Date {
  return new Date(Date.now() - m * 60 * 1000);
}

function generateLog(id: number, minutesBack: number): LogMudanca {
  const produto = pickRandom(PRODUTOS_DEMO);
  const user = pickRandom(MOCK_USERS);
  const op = pickRandom(OPERACOES);

  const qtdAnterior = Math.floor(Math.random() * 10) + 1;
  let qtdNova = qtdAnterior;
  if (op === 'venda') qtdNova = Math.max(0, qtdAnterior - Math.ceil(Math.random() * 2));
  else if (op === 'entrada') qtdNova = qtdAnterior + Math.ceil(Math.random() * 10);
  else qtdNova = Math.floor(Math.random() * 15);

  return {
    id: `log-${id}`,
    estoqueId: `estoque-${produto.codigo}-${produto.cor}-${produto.tamanho}`,
    qtdAnterior,
    qtdNova,
    operacao: op,
    usuarioId: user.id,
    usuarioNome: user.nome,
    observacao: op === 'entrada' ? `Caixa #${Math.floor(Math.random() * 100) + 1}` : undefined,
    createdAt: minutesAgo(minutesBack),
  };
}

export const MOCK_HISTORICO: LogMudanca[] = (() => {
  const logs: LogMudanca[] = [];
  let id = 1;
  for (let m = 2; m < 60 * 24 * 7; m += Math.floor(Math.random() * 90) + 10) {
    logs.push(generateLog(id++, m));
  }
  return logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
})();

export function getMockHistoricoRecentes(limit = 5): LogMudanca[] {
  return MOCK_HISTORICO.slice(0, limit);
}
