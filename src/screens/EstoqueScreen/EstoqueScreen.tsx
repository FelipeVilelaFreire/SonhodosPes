'use client';

import EstoqueTable from '@/src/components/features/EstoqueTable';
import StockEditModal from '@/src/components/modals/forms/StockEditModal';
import Spinner from '@/src/components/ui/Spinner';
import { useEstoqueScreen } from '@/src/hooks/estoque/useEstoqueScreen';

export default function EstoqueScreen() {
  const {
    rows,
    allSizes,
    loading,
    error,
    query,
    setQuery,
    categoria,
    setCategoria,
    apenasEsgotados,
    setApenasEsgotados,
    categorias,
    editTarget,
    openEdit,
    closeEdit,
    saveEdit,
    saving,
  } = useEstoqueScreen();

  if (loading) return <Spinner size="lg" center />;

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-danger)' }}>
        Erro ao carregar estoque: {error}
      </div>
    );
  }

  return (
    <>
      <EstoqueTable
        rows={rows}
        allSizes={allSizes}
        query={query}
        onQueryChange={setQuery}
        categoria={categoria}
        onCategoriaChange={setCategoria}
        categorias={categorias}
        apenasEsgotados={apenasEsgotados}
        onApenasEsgotadosChange={setApenasEsgotados}
        onEditCell={(row, tamanho, quantidadeAtual) =>
          openEdit({
            produto: row.produto,
            cor: row.cor,
            tamanho,
            quantidadeAtual,
          })
        }
      />

      <StockEditModal
        target={editTarget}
        onClose={closeEdit}
        onSave={saveEdit}
        saving={saving}
      />
    </>
  );
}
