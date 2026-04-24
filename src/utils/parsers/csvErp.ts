import type { Produto } from '@/src/types/produto';
import type { Cor, TamanhosMap } from '@/src/types/cor';
import { padCodigo, normalizeText } from '../normalize';
import { parseCurrency } from '../formatters/currency';

const SIZE_COLUMN_REGEX = /^(\d{2,3}|P|M|G|GG|XG|U|UN|PP)$/i;

const COLUMN_ALIASES = {
  codigo: ['produto', 'codigo', 'cod', 'sku'],
  modelo: ['desc_produto', 'modelo', 'nome', 'descricao'],
  cor: ['desc_cor_produto', 'cor', 'desc_cor'],
  corCode: ['cor_produto', 'cor_code'],
  categoria: ['subgrupo_produto', 'subgrupo', 'categoria'],
  grupo: ['grupo_produto', 'grupo'],
  referencia: ['refer_fabricante', 'referencia', 'ref'],
  preco: ['preco', 'preco_venda', 'valor'],
  colecao: ['colecao', 'coleção', 'collection'],
  corredor: ['corredor', 'aisle', 'local'],
  prateleira: ['prateleira', 'shelf'],
} as const;

type CSVRow = Record<string, string>;

function detectDelimiter(firstLine: string): string {
  const commas = (firstLine.match(/,/g) || []).length;
  const semis = (firstLine.match(/;/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;
  if (tabs > commas && tabs > semis) return '\t';
  if (semis > commas) return ';';
  return ',';
}

function parseLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function findColumn(row: CSVRow, aliases: readonly string[]): string {
  for (const alias of aliases) {
    const value = row[alias];
    if (value !== undefined && value !== '') return String(value).trim();
  }
  return '';
}

export function parseErpCsv(text: string): Produto[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines[0]);
  const rawHeaders = parseLine(lines[0], delimiter).map(h => h.trim());
  const headersLower = rawHeaders.map(h =>
    h.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  );

  const sizeColumns: Array<{ label: string; idx: number }> = [];
  rawHeaders.forEach((h, idx) => {
    if (SIZE_COLUMN_REGEX.test(h.trim())) {
      sizeColumns.push({ label: h.trim().toUpperCase(), idx });
    }
  });

  const produtosByCode = new Map<string, Produto>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseLine(line, delimiter);
    if (values.length < 2) continue;

    const row: CSVRow = {};
    headersLower.forEach((h, idx) => {
      row[h] = (values[idx] ?? '').trim();
    });

    const codigoRaw = findColumn(row, COLUMN_ALIASES.codigo);
    if (!codigoRaw) continue;

    const codigo = padCodigo(codigoRaw);
    const corNome = findColumn(row, COLUMN_ALIASES.cor) || 'ÚNICA';

    const tamanhos: TamanhosMap = {};
    sizeColumns.forEach(({ label, idx }) => {
      const qty = parseInt(values[idx] ?? '0', 10);
      tamanhos[label] = Number.isFinite(qty) ? qty : 0;
    });

    if (!produtosByCode.has(codigo)) {
      const colecao = findColumn(row, COLUMN_ALIASES.colecao) || undefined;
      const corredor = findColumn(row, COLUMN_ALIASES.corredor) || undefined;
      const prateleira = findColumn(row, COLUMN_ALIASES.prateleira) || undefined;
      produtosByCode.set(codigo, {
        codigo,
        modelo: findColumn(row, COLUMN_ALIASES.modelo),
        categoria: findColumn(row, COLUMN_ALIASES.categoria),
        grupo: findColumn(row, COLUMN_ALIASES.grupo),
        referencia: findColumn(row, COLUMN_ALIASES.referencia),
        preco: parseCurrency(findColumn(row, COLUMN_ALIASES.preco)),
        ...(colecao && { colecao }),
        ...(corredor && { corredor }),
        ...(prateleira && { prateleira }),
        cores: [],
        searchIndex: '',
      });
    }

    const produto = produtosByCode.get(codigo)!;
    const cor: Cor = {
      nome: corNome,
      codigoCor: findColumn(row, COLUMN_ALIASES.corCode) || undefined,
      tamanhos,
    };
    produto.cores.push(cor);
  }

  const produtos = Array.from(produtosByCode.values());
  produtos.forEach(p => {
    p.searchIndex = normalizeText(
      [p.codigo, p.modelo, p.categoria, p.grupo, p.referencia, p.cores.map(c => c.nome).join(' ')]
        .filter(Boolean)
        .join(' ')
    );
  });

  return produtos;
}
