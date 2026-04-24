'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Columns3, Check, Plus, X, Trash2 } from 'lucide-react';
import Input from '@/src/components/ui/Input';
import type { EstoqueRow } from '@/src/hooks/estoque/useEstoqueScreen';
import { getStockStatus } from '@/src/utils/mappers/produtoMappers';
import styles from './EstoqueTable.module.css';

interface EstoqueTableProps {
  rows: EstoqueRow[];
  allSizes: string[];
  query: string;
  onQueryChange: (v: string) => void;
  categoria: string;
  onCategoriaChange: (v: string) => void;
  categorias: string[];
  apenasEsgotados: boolean;
  onApenasEsgotadosChange: (v: boolean) => void;
  onEditCell: (row: EstoqueRow, tamanho: string, quantidadeAtual: number) => void;
  onFieldChange: (row: EstoqueRow, field: string, value: string | number) => void;
  onAddRow: (codigo: string, corNome: string) => void;
  onDeleteRow: (row: EstoqueRow) => void;
  onDeleteColumn: (tamanho: string) => void;
}

function TextCell({ value, field, row, onChange }: {
  value: string;
  field: string;
  row: EstoqueRow;
  onChange: (row: EstoqueRow, field: string, value: string) => void;
}) {
  return (
    <input
      key={value}
      type="text"
      className={styles.textInput}
      defaultValue={value}
      onFocus={e => e.target.select()}
      onBlur={e => {
        if (e.target.value !== value) onChange(row, field, e.target.value);
      }}
      onKeyDown={e => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') { e.currentTarget.value = value; e.currentTarget.blur(); }
      }}
    />
  );
}

function NumCell({ value, field, row, step = 1, onChange }: {
  value: number;
  field: string;
  row: EstoqueRow;
  step?: number;
  onChange: (row: EstoqueRow, field: string, value: number) => void;
}) {
  return (
    <input
      key={value}
      type="number"
      min={0}
      step={step}
      className={`${styles.qtdInput} ${styles.numCell}`}
      defaultValue={value}
      onFocus={e => e.target.select()}
      onBlur={e => {
        const val = parseFloat(e.target.value);
        if (Number.isFinite(val) && val !== value) onChange(row, field, val);
      }}
      onKeyDown={e => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') { e.currentTarget.value = String(value); e.currentTarget.blur(); }
      }}
    />
  );
}

export default function EstoqueTable({
  rows, allSizes,
  query, onQueryChange,
  categoria, onCategoriaChange, categorias,
  apenasEsgotados, onApenasEsgotadosChange,
  onEditCell, onFieldChange,
  onAddRow, onDeleteRow, onDeleteColumn,
}: EstoqueTableProps) {
  const [colPickerOpen, setColPickerOpen] = useState(false);
  const [extraCols, setExtraCols] = useState<Set<string>>(new Set());
  const colPickerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  // Draft row state
  const [showDraft, setShowDraft] = useState(false);
  const [draftCodigo, setDraftCodigo] = useState('');
  const [draftCor, setDraftCor] = useState('');
  const draftCodigoRef = useRef<HTMLInputElement>(null);

  const EXTRA_COLS = [
    { key: 'colecao',    label: 'Coleção' },
    { key: 'corredor',   label: 'Corredor' },
    { key: 'prateleira', label: 'Prateleira' },
    { key: 'grupo',      label: 'Grupo' },
    { key: 'categoria',  label: 'Subgrupo' },
  ];

  function toggleCol(key: string) {
    setExtraCols(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function openDraft() {
    setDraftCodigo('');
    setDraftCor('');
    setShowDraft(true);
  }

  function cancelDraft() {
    setShowDraft(false);
    setDraftCodigo('');
    setDraftCor('');
  }

  function commitDraft() {
    const cod = draftCodigo.trim();
    if (!cod) { cancelDraft(); return; }
    onAddRow(cod, draftCor.trim() || 'ÚNICA');
    cancelDraft();
  }

  useEffect(() => {
    if (showDraft) draftCodigoRef.current?.focus();
  }, [showDraft]);

  useEffect(() => {
    if (!colPickerOpen) return;
    function close(e: MouseEvent) {
      if (colPickerRef.current && !colPickerRef.current.contains(e.target as Node))
        setColPickerOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [colPickerOpen]);

  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;

    function moveTo(el: HTMLInputElement, dr: number, dc: number) {
      const td = el.closest('td');
      const tr = el.closest('tr');
      const tbody = el.closest('tbody');
      if (!td || !tr || !tbody) return;

      const trs = Array.from(tbody.querySelectorAll<HTMLTableRowElement>(':scope > tr'));
      const tds = Array.from(tr.querySelectorAll<HTMLTableCellElement>(':scope > td'));
      let r = trs.indexOf(tr as HTMLTableRowElement);
      let c = tds.indexOf(td as HTMLTableCellElement);
      const isVert = dr !== 0;

      for (let step = 0; step < 30; step++) {
        r += dr; c += dc;
        if (r < 0 || r >= trs.length) return;
        const nextTds = Array.from(trs[r].querySelectorAll<HTMLTableCellElement>(':scope > td'));
        if (c < 0 || c >= nextTds.length) return;
        const input = nextTds[c]?.querySelector<HTMLInputElement>('input');
        if (input) { input.focus(); setTimeout(() => input.select(), 0); return; }
        if (isVert) return;
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      const el = e.target as HTMLInputElement;
      if (el.tagName !== 'INPUT') return;

      switch (e.key) {
        case 'ArrowRight': {
          if (el.type === 'text' && (el.selectionStart ?? 0) < el.value.length) return;
          e.preventDefault(); moveTo(el, 0, 1); break;
        }
        case 'ArrowLeft': {
          if (el.type === 'text' && (el.selectionStart ?? 0) > 0) return;
          e.preventDefault(); moveTo(el, 0, -1); break;
        }
        case 'ArrowDown':  e.preventDefault(); moveTo(el,  1, 0); break;
        case 'ArrowUp':    e.preventDefault(); moveTo(el, -1, 0); break;
        case 'Enter':      e.preventDefault(); moveTo(el,  1, 0); break;
        case 'Tab':        e.preventDefault(); moveTo(el, 0, e.shiftKey ? -1 : 1); break;
      }
    }

    table.addEventListener('keydown', onKeyDown);
    return () => table.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleText = (row: EstoqueRow, field: string, value: string) =>
    onFieldChange(row, field, value);

  const handleNum = (row: EstoqueRow, field: string, value: number) =>
    onFieldChange(row, field, value);

  const totalCols = 1
    + (extraCols.has('colecao') ? 1 : 0)
    + 1 // preco
    + (extraCols.has('corredor') ? 1 : 0)
    + (extraCols.has('prateleira') ? 1 : 0)
    + 1 // qtde
    + allSizes.length
    + 1 // modelo
    + (extraCols.has('grupo') ? 1 : 0)
    + (extraCols.has('categoria') ? 1 : 0)
    + 1; // cor

  return (
    <div className={styles.wrapper}>
      <div className={styles.filters}>
        <div className={styles.filterRow}>
          <label>
            Buscar
            <Input
              placeholder="Código, nome ou marca"
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              leftSlot={<Search size={16} />}
            />
          </label>
          <label>
            Categoria
            <select className={styles.select} value={categoria} onChange={e => onCategoriaChange(e.target.value)}>
              <option value="">Todas</option>
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <button
            type="button"
            className={styles.addRowBtn}
            onClick={openDraft}
            disabled={showDraft}
          >
            <Plus size={14} />
            Nova linha
          </button>

          <div ref={colPickerRef} className={styles.colPickerWrap}>
            <button
              type="button"
              className={`${styles.verMaisBtn} ${colPickerOpen ? styles.verMaisActive : ''}`}
              onClick={() => setColPickerOpen(v => !v)}
            >
              <Columns3 size={14} />
              Colunas {extraCols.size > 0 && <span className={styles.colBadge}>{extraCols.size}</span>}
            </button>

            {colPickerOpen && (
              <div className={styles.colPicker}>
                <p className={styles.colPickerTitle}>Colunas extras</p>
                {EXTRA_COLS.map(col => (
                  <button
                    key={col.key}
                    type="button"
                    className={`${styles.colPickerItem} ${extraCols.has(col.key) ? styles.colPickerItemActive : ''}`}
                    onClick={() => toggleCol(col.key)}
                  >
                    <span className={styles.colPickerCheck}>
                      {extraCols.has(col.key) && <Check size={11} />}
                    </span>
                    {col.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.tableScroll}>
        <table ref={tableRef} className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thFixed}>PRODUTO</th>
              {extraCols.has('colecao') && <th>COLEÇÃO</th>}
              <th>PREÇO</th>
              {extraCols.has('corredor') && <th>CORREDOR</th>}
              {extraCols.has('prateleira') && <th>PRATELEIRA</th>}
              <th className={styles.centered}>QTDE</th>
              {allSizes.map(s => (
                <th key={s} className={`${styles.centered} ${styles.thSize}`}>
                  <span>{s === 'U' || s === 'UN' ? 'UN' : s}</span>
                  <button
                    type="button"
                    className={styles.colDeleteBtn}
                    onClick={() => onDeleteColumn(s)}
                    title={`Excluir coluna ${s}`}
                  >
                    <X size={10} />
                  </button>
                </th>
              ))}
              <th className={styles.thModelo}>DESC_PRODUTO</th>
              {extraCols.has('grupo') && <th>GRUPO</th>}
              {extraCols.has('categoria') && <th>SUBGRUPO</th>}
              <th>COR</th>
            </tr>
          </thead>
          <tbody>
            {/* Draft row — always first */}
            {showDraft && (
              <tr className={styles.draftRow}>
                <td className={styles.codigoCol}>
                  <div className={styles.cellWrap}>
                    <input
                      ref={draftCodigoRef}
                      type="text"
                      className={styles.textInput}
                      placeholder="Código…"
                      value={draftCodigo}
                      onChange={e => setDraftCodigo(e.target.value)}
                      onFocus={e => e.target.select()}
                      onBlur={() => { if (draftCodigo.trim()) commitDraft(); }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); commitDraft(); }
                        if (e.key === 'Escape') cancelDraft();
                      }}
                    />
                    <button type="button" className={`${styles.rowDeleteBtn} ${styles.rowDeleteBtnVisible}`} onClick={cancelDraft} title="Cancelar">
                      <X size={12} />
                    </button>
                  </div>
                </td>
                {extraCols.has('colecao') && <td><span className={styles.indisponivel}>·</span></td>}
                <td className={styles.precoCol}><span className={styles.indisponivel}>·</span></td>
                {extraCols.has('corredor') && <td><span className={styles.indisponivel}>·</span></td>}
                {extraCols.has('prateleira') && <td><span className={styles.indisponivel}>·</span></td>}
                <td className={`${styles.qtdCell} ${styles.readonlyCell}`}><span>0</span></td>
                {allSizes.map(s => (
                  <td key={s} className={styles.qtdCell}><span className={styles.indisponivel}>·</span></td>
                ))}
                <td className={styles.modeloCol}><span className={styles.indisponivel}>·</span></td>
                {extraCols.has('grupo') && <td><span className={styles.indisponivel}>·</span></td>}
                {extraCols.has('categoria') && <td><span className={styles.indisponivel}>·</span></td>}
                <td className={styles.corCol}>
                  <input
                    type="text"
                    className={styles.textInput}
                    placeholder="Cor…"
                    value={draftCor}
                    onChange={e => setDraftCor(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Escape') cancelDraft();
                    }}
                  />
                </td>
              </tr>
            )}

            {rows.length === 0 && !showDraft ? (
              <tr>
                <td colSpan={totalCols} className={styles.emptyState}>
                  Nenhum resultado para os filtros aplicados.
                </td>
              </tr>
            ) : rows.map(row => {
              const qtde = Object.values(row.cor.tamanhos).reduce((a, b) => a + (b || 0), 0);
              return (
                <tr key={row.rowKey}>
                  {/* PRODUTO */}
                  <td className={styles.codigoCol}>
                    <div className={styles.cellWrap}>
                      <TextCell value={row.produto.codigo} field="codigo" row={row} onChange={handleText} />
                      <button
                        type="button"
                        className={styles.rowDeleteBtn}
                        onClick={() => onDeleteRow(row)}
                        title="Excluir linha"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>

                  {/* COLEÇÃO */}
                  {extraCols.has('colecao') && (
                    <td>
                      <TextCell value={row.produto.colecao ?? ''} field="colecao" row={row} onChange={handleText} />
                    </td>
                  )}

                  {/* PREÇO */}
                  <td className={styles.precoCol}>
                    <NumCell value={row.produto.preco} field="preco" row={row} step={0.01} onChange={handleNum} />
                  </td>

                  {/* CORREDOR */}
                  {extraCols.has('corredor') && (
                    <td>
                      <TextCell value={row.produto.corredor ?? ''} field="corredor" row={row} onChange={handleText} />
                    </td>
                  )}

                  {/* PRATELEIRA */}
                  {extraCols.has('prateleira') && (
                    <td>
                      <TextCell value={row.produto.prateleira ?? ''} field="prateleira" row={row} onChange={handleText} />
                    </td>
                  )}

                  {/* QTDE readonly */}
                  <td className={`${styles.qtdCell} ${styles.readonlyCell}`}>
                    <span className={qtde === 0 ? styles.esgotado : ''}>{qtde}</span>
                  </td>

                  {/* Tamanhos */}
                  {allSizes.map(tamanho => {
                    const qty = row.cor.tamanhos[tamanho];
                    const hasSize = tamanho in row.cor.tamanhos;
                    if (!hasSize) {
                      return (
                        <td key={tamanho} className={styles.qtdCell}>
                          <span className={styles.indisponivel}>·</span>
                        </td>
                      );
                    }
                    const status = getStockStatus(qty);
                    const cls = [
                      styles.qtdInput,
                      status === 'baixo' && styles.baixo,
                      status === 'esgotado' && styles.esgotado,
                    ].filter(Boolean).join(' ');
                    return (
                      <td key={tamanho} className={styles.qtdCell}>
                        <input
                          key={qty ?? 0}
                          type="number"
                          min={0}
                          className={cls}
                          defaultValue={qty ?? 0}
                          onFocus={e => e.target.select()}
                          onBlur={e => {
                            const val = parseInt(e.target.value, 10);
                            if (Number.isFinite(val) && val !== (qty ?? 0)) {
                              onFieldChange(row, tamanho, val);
                            }
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                            if (e.key === 'Escape') {
                              e.currentTarget.value = String(qty ?? 0);
                              e.currentTarget.blur();
                            }
                          }}
                        />
                      </td>
                    );
                  })}

                  {/* DESC_PRODUTO */}
                  <td className={styles.modeloCol}>
                    <TextCell value={row.produto.modelo} field="modelo" row={row} onChange={handleText} />
                  </td>

                  {/* GRUPO */}
                  {extraCols.has('grupo') && (
                    <td>
                      <TextCell value={row.produto.grupo ?? ''} field="grupo" row={row} onChange={handleText} />
                    </td>
                  )}

                  {/* SUBGRUPO */}
                  {extraCols.has('categoria') && (
                    <td>
                      <TextCell value={row.produto.categoria ?? ''} field="categoria" row={row} onChange={handleText} />
                    </td>
                  )}

                  {/* COR */}
                  <td className={styles.corCol}>
                    <TextCell value={row.cor.nome} field="corNome" row={row} onChange={handleText} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className={styles.counter}>
          {rows.length === 0 && !showDraft
            ? 'Nenhuma linha'
            : `${rows.length} ${rows.length === 1 ? 'linha' : 'linhas'}`}
        </div>
      </div>
    </div>
  );
}
