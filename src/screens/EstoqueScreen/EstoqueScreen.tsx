'use client';

import EstoqueTable from '@/src/components/features/EstoqueTable';
import StockEditModal from '@/src/components/modals/forms/StockEditModal';
import Spinner from '@/src/components/ui/Spinner';
import { useEstoqueScreen } from '@/src/hooks/estoque/useEstoqueScreen';

export default function EstoqueScreen() {
  const {
    rows, allSizes, loading, error,
    query, setQuery,
    categoria, setCategoria,
    categorias,
    apenasEsgotados, setApenasEsgotados,
    editTarget, openEdit, closeEdit, saveEdit, saving,
    updateField, addRow, deleteRow, deleteColumn,
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
          openEdit({ produto: row.produto, cor: row.cor, tamanho, quantidadeAtual })
        }
        onFieldChange={(row, field, value) =>
          updateField(row.produto.codigo, row.cor.nome, field, value)
        }
        onAddRow={addRow}
        onDeleteRow={(row) => deleteRow(row.produto.codigo, row.cor.nome)}
        onDeleteColumn={deleteColumn}
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
