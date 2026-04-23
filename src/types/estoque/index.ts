export interface EstoqueEntryAPI {
  id: string;
  variante_id: string;
  tamanho: string;
  quantidade: number;
  updated_at: string;
}

export interface EstoqueEntry {
  id: string;
  varianteId: string;
  tamanho: string;
  quantidade: number;
  updatedAt: Date;
}

export type OperacaoEstoque = 'venda' | 'devolucao' | 'ajuste' | 'entrada';

export interface AtualizarEstoqueInput {
  estoqueId: string;
  operacao: OperacaoEstoque;
  delta?: number;
  quantidadeAbsoluta?: number;
  observacao?: string;
}

export interface LogMudancaAPI {
  id: string;
  estoque_id: string;
  qtd_anterior: number;
  qtd_nova: number;
  operacao: OperacaoEstoque;
  usuario_id: string;
  observacao?: string;
  created_at: string;
}

export interface LogMudanca {
  id: string;
  estoqueId: string;
  qtdAnterior: number;
  qtdNova: number;
  operacao: OperacaoEstoque;
  usuarioId: string;
  usuarioNome?: string;
  observacao?: string;
  createdAt: Date;
}
