import type { Produto } from '@/src/types/produto';

const CACHE_KEY = 'sdp_produtos_cache';
const META_KEY = 'sdp_produtos_cache_meta';

interface CacheMeta {
  updatedAt: string;
  total: number;
}

export const cacheService = {
  get(): Produto[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? (JSON.parse(raw) as Produto[]) : [];
    } catch {
      return [];
    }
  },

  set(produtos: Produto[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CACHE_KEY, JSON.stringify(produtos));
    const meta: CacheMeta = { updatedAt: new Date().toISOString(), total: produtos.length };
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  },

  getMeta(): CacheMeta | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(META_KEY);
      return raw ? (JSON.parse(raw) as CacheMeta) : null;
    } catch {
      return null;
    }
  },

  getLastSync(): Date | null {
    const meta = this.getMeta();
    return meta ? new Date(meta.updatedAt) : null;
  },

  hasCache(): boolean {
    return this.get().length > 0;
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(META_KEY);
  },
};
