import type { Produto, ProdutoCardData, ProdutoAutocompleteItem } from '@/src/types/produto';
import type { TamanhoCell, TamanhosMap } from '@/src/types/cor';
import { formatCurrency } from '../formatters/currency';

export function getStockStatus(qty: number): TamanhoCell['status'] {
  if (!qty || qty === 0) return 'esgotado';
  if (qty <= 2) return 'baixo';
  return 'disponivel';
}

export function isProdutoEsgotado(produto: Produto): boolean {
  if (!produto.cores || !produto.cores.length) return false;
  return produto.cores.every(cor =>
    Object.values(cor.tamanhos || {}).every(q => !q || q === 0)
  );
}

export function getTotalEmEstoque(produto: Produto): number {
  let total = 0;
  produto.cores.forEach(cor => {
    Object.values(cor.tamanhos || {}).forEach(q => {
      total += q || 0;
    });
  });
  return total;
}

export function collectAllSizes(produto: Produto, onlyWithStock = true): string[] {
  const set = new Set<string>();
  produto.cores.forEach(cor => {
    Object.entries(cor.tamanhos).forEach(([size, qty]) => {
      if (!onlyWithStock || (qty && qty > 0)) set.add(size);
    });
  });
  return Array.from(set).sort(compareSizes);
}

export function filterCoresWithStock(produto: Produto) {
  return produto.cores.filter(cor =>
    Object.values(cor.tamanhos || {}).some(q => q && q > 0)
  );
}

function compareSizes(a: string, b: string): number {
  const aNum = parseInt(a, 10);
  const bNum = parseInt(b, 10);
  if (Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum - bNum;
  return a.localeCompare(b);
}

export function mapProdutoCardData(produto: Produto): ProdutoCardData {
  return {
    codigo: produto.codigo,
    modelo: produto.modelo,
    categoria: produto.categoria || produto.grupo || '',
    precoFormatted: formatCurrency(produto.preco),
    cores: filterCoresWithStock(produto),
    tamanhosDisponiveis: collectAllSizes(produto, true),
    totalEmEstoque: getTotalEmEstoque(produto),
    esgotado: isProdutoEsgotado(produto),
  };
}

export function mapProdutoAutocompleteItem(produto: Produto): ProdutoAutocompleteItem {
  const coresNames = produto.cores.map(c => c.nome).join(' · ');
  const categoria = produto.categoria || produto.grupo || '';
  return {
    codigo: produto.codigo,
    modelo: produto.modelo,
    resumoCategoria: coresNames ? `${categoria} · ${coresNames}` : categoria,
    precoFormatted: formatCurrency(produto.preco),
    esgotado: isProdutoEsgotado(produto),
  };
}

export function mapTamanhoCells(tamanhos: TamanhosMap, allSizes: string[]): TamanhoCell[] {
  return allSizes.map(size => {
    const qty = tamanhos[size] || 0;
    return {
      tamanho: size,
      quantidade: qty,
      status: getStockStatus(qty),
    };
  });
}
