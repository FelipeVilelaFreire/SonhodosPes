import type { Produto } from '@/src/types/produto';

const KEY = 'sdp_catalogo';

function buildSearchIndex(p: Omit<Produto, 'searchIndex'>): string {
  return `${p.codigo} ${p.modelo} ${p.categoria} ${p.grupo} ${p.referencia}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export const catalogoService = {
  list(): Produto[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as Produto[]) : [];
    } catch {
      return [];
    }
  },

  seed(produtos: Produto[]): void {
    if (!this.list().length) this._save(produtos);
  },

  upsert(produto: Produto): Produto[] {
    const all = this.list();
    const updated = { ...produto, searchIndex: buildSearchIndex(produto) };
    const idx = all.findIndex(p => p.codigo === produto.codigo);
    if (idx >= 0) all[idx] = updated;
    else all.unshift(updated);
    this._save(all);
    return all;
  },

  remove(codigo: string): Produto[] {
    const all = this.list().filter(p => p.codigo !== codigo);
    this._save(all);
    return all;
  },

  codigoExists(codigo: string, excludeCodigo?: string): boolean {
    return this.list().some(p => p.codigo === codigo && p.codigo !== excludeCodigo);
  },

  _save(produtos: Produto[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEY, JSON.stringify(produtos));
  },
};
