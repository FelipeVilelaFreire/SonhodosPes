import type { Produto } from '@/src/types/produto';
import { parseErpCsv } from '@/src/utils/parsers/csvErp';
import { APP_CONFIG } from '@/src/constants/config';

export const csvService = {
  async loadFromPath(path: string = APP_CONFIG.CSV.LOCAL_PATH): Promise<Produto[]> {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Falha ao carregar CSV: HTTP ${response.status}`);
    const text = await response.text();
    return parseErpCsv(text);
  },

  async loadFromUrl(url: string): Promise<Produto[]> {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Falha ao carregar URL: HTTP ${response.status}`);
    const text = await response.text();
    const produtos = parseErpCsv(text);
    if (!produtos.length) throw new Error('CSV vazio ou inválido');
    return produtos;
  },

  parse(text: string): Produto[] {
    return parseErpCsv(text);
  },
};
