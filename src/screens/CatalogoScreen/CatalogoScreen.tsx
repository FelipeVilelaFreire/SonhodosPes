'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import Button from '@/src/components/ui/Button';
import { catalogoService } from '@/src/services/catalogoService';
import { produtoService } from '@/src/services/produtoService';
import ProdutoFormModal from '@/src/components/features/ProdutoFormModal';
import type { Produto } from '@/src/types/produto';
import styles from './CatalogoScreen.module.css';

export default function CatalogoScreen() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editando, setEditando] = useState<Produto | 'novo' | null>(null);
  const [deletando, setDeletando] = useState<Produto | null>(null);

  useEffect(() => {
    async function load() {
      let cached = catalogoService.list();
      if (!cached.length) {
        try {
          const fromService = await produtoService.list();
          catalogoService.seed(fromService);
          cached = catalogoService.list();
        } catch {}
      }
      setProdutos(cached);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return produtos;
    const q = search.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return produtos.filter(p =>
      (p.searchIndex ?? '').includes(q) ||
      p.codigo.includes(q) ||
      p.modelo.toLowerCase().includes(q)
    );
  }, [produtos, search]);

  const totalVariantes = useMemo(() =>
    produtos.reduce((a, p) => a + p.cores.length, 0), [produtos]);

  const totalPares = useMemo(() =>
    produtos.reduce((a, p) =>
      a + p.cores.reduce((b, c) =>
        b + Object.values(c.tamanhos).reduce((s, n) => s + n, 0), 0), 0),
    [produtos]);

  function handleSave(produto: Produto) {
    setProdutos(catalogoService.upsert(produto));
    setEditando(null);
  }

  function handleDelete() {
    if (!deletando) return;
    setProdutos(catalogoService.remove(deletando.codigo));
    setDeletando(null);
  }

  const existingCodigos = useMemo(() => produtos.map(p => p.codigo), [produtos]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{produtos.length}</span>
          <span className={styles.statLabel}>Produtos</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totalVariantes}</span>
          <span className={styles.statLabel}>Variantes de cor</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{totalPares}</span>
          <span className={styles.statLabel}>Pares em estoque</span>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Buscar por código, modelo ou categoria..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setEditando('novo')}>
          Adicionar produto
        </Button>
      </div>

      {loading ? (
        <div className={styles.emptyState}>
          <p>Carregando catálogo...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <Package size={48} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>
            {search ? 'Nenhum produto encontrado' : 'Catálogo vazio'}
          </p>
          {!search && (
            <Button variant="primary" leftIcon={<Plus size={14} />} onClick={() => setEditando('novo')}>
              Adicionar primeiro produto
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Produto</th>
                <th>Preço</th>
                <th>Cores</th>
                <th>Estoque</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const pares = p.cores.reduce((a, c) =>
                  a + Object.values(c.tamanhos).reduce((s, n) => s + n, 0), 0);
                return (
                  <tr key={p.codigo}>
                    <td><code className={styles.code}>{p.codigo}</code></td>
                    <td>
                      <div className={styles.modelName}>{p.modelo}</div>
                      <div className={styles.modelMeta}>
                        {[p.categoria, p.grupo].filter(Boolean).join(' · ')}
                      </div>
                    </td>
                    <td className={styles.price}>
                      {p.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td>
                      <span className={styles.coresCount}>{p.cores.length}</span>
                    </td>
                    <td>
                      <span className={pares === 0 ? styles.estoqueZero : styles.estoqueOk}>
                        {pares} {pares === 1 ? 'par' : 'pares'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => setEditando(p)}
                          title="Editar"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.danger}`}
                          onClick={() => setDeletando(p)}
                          title="Excluir"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {deletando && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmBox}>
            <p>
              Excluir <strong>{deletando.modelo}</strong>?<br />
              <span style={{ fontSize: 13, color: 'var(--color-text-soft)' }}>
                Esta ação não pode ser desfeita.
              </span>
            </p>
            <div className={styles.confirmActions}>
              <Button variant="ghost" onClick={() => setDeletando(null)}>Cancelar</Button>
              <Button variant="dangerSolid" onClick={handleDelete}>Excluir</Button>
            </div>
          </div>
        </div>
      )}

      {editando !== null && (
        <ProdutoFormModal
          produto={editando === 'novo' ? null : editando}
          existingCodigos={existingCodigos}
          onSave={handleSave}
          onClose={() => setEditando(null)}
        />
      )}
    </div>
  );
}
