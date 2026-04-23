import type { Cor } from '../cor';

/**
 * Nível 1: shape bruto do ERP (CSV) ou Supabase.
 * Colunas em UPPER_CASE/snake_case como o ERP gera.
 */
export interface ProdutoAPI {
  PRODUTO: string;
  COR_PRODUTO?: string;
  DESC_PRODUTO: string;
  DESC_COR_PRODUTO: string;
  SUBGRUPO_PRODUTO?: string;
  GRUPO_PRODUTO?: string;
  REFER_FABRICANTE?: string;
  PRECO_VENDA: string | number;
  [sizeKey: string]: string | number | undefined;
}

/**
 * Nível 2: tipo interno da aplicação.
 * Uma entrada por código único (PRODUTO), agrupando todas as cores.
 */
export interface Produto {
  codigo: string;
  modelo: string;
  categoria: string;
  grupo: string;
  referencia: string;
  preco: number;
  cores: Cor[];
  searchIndex: string;
}

/**
 * Nível 3: tipo otimizado pra exibição em card/autocomplete.
 */
export interface ProdutoCardData {
  codigo: string;
  modelo: string;
  categoria: string;
  precoFormatted: string;
  cores: Cor[];
  tamanhosDisponiveis: string[];
  totalEmEstoque: number;
  esgotado: boolean;
}

export interface ProdutoAutocompleteItem {
  codigo: string;
  modelo: string;
  resumoCategoria: string;
  precoFormatted: string;
  esgotado: boolean;
}
