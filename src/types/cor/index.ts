export interface Cor {
  nome: string;
  codigoCor?: string;
  tamanhos: TamanhosMap;
}

export type TamanhosMap = Record<string, number>;

export interface TamanhoCell {
  tamanho: string;
  quantidade: number;
  status: 'disponivel' | 'baixo' | 'esgotado';
}
