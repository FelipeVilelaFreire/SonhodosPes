'use client';

import HistoricoTable from '@/src/components/features/HistoricoTable';
import { useHistoricoScreen } from '@/src/hooks/historico/useHistoricoScreen';

export default function HistoricoScreen() {
  const state = useHistoricoScreen();

  return (
    <HistoricoTable
      logs={state.logs}
      total={state.total}
      query={state.query}
      onQueryChange={state.setQuery}
      operacao={state.operacao}
      onOperacaoChange={state.setOperacao}
      usuarioId={state.usuarioId}
      onUsuarioChange={state.setUsuarioId}
      usuarios={state.usuarios}
      pagina={state.pagina}
      totalPaginas={state.totalPaginas}
      onPaginaChange={state.setPagina}
      onExport={state.exportCsv}
    />
  );
}
