import type { Produto } from '@/src/types/produto';
import { getTotalEmEstoque, isProdutoEsgotado } from '@/src/utils/mappers/produtoMappers';

export interface DashboardStats {
  totalProdutos: number;
  paresEmEstoque: number;
  produtosEsgotados: number;
  vendasHoje: number;
  vendasSemana: number;
  produtosEstoqueBaixo: Array<{ codigo: string; modelo: string; totalPares: number }>;
}

export function computeStatsFromProdutos(produtos: Produto[]): DashboardStats {
  const totalProdutos = produtos.length;
  let paresEmEstoque = 0;
  let produtosEsgotados = 0;
  const baixos: DashboardStats['produtosEstoqueBaixo'] = [];

  produtos.forEach(p => {
    const total = getTotalEmEstoque(p);
    paresEmEstoque += total;
    if (isProdutoEsgotado(p)) {
      produtosEsgotados++;
    } else if (total > 0 && total <= 3) {
      baixos.push({
        codigo: p.codigo,
        modelo: p.modelo,
        totalPares: total,
      });
    }
  });

  return {
    totalProdutos,
    paresEmEstoque,
    produtosEsgotados,
    vendasHoje: Math.floor(Math.random() * 15) + 3,
    vendasSemana: Math.floor(Math.random() * 80) + 20,
    produtosEstoqueBaixo: baixos.slice(0, 5),
  };
}

export const FAKE_DELAY_MS = 300;
