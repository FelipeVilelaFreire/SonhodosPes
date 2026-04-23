'use client';

import { useEffect, useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import Modal from '@/src/components/ui/Modal';
import Button from '@/src/components/ui/Button';
import type { EditTarget } from '@/src/hooks/estoque/useEstoqueScreen';
import styles from './StockEditModal.module.css';

interface StockEditModalProps {
  target: EditTarget | null;
  onClose: () => void;
  onSave: (novaQuantidade: number, observacao?: string) => Promise<void>;
  saving: boolean;
}

type Operacao = 'venda' | 'entrada' | 'ajuste';

export default function StockEditModal({ target, onClose, onSave, saving }: StockEditModalProps) {
  const [quantidade, setQuantidade] = useState(0);
  const [operacao, setOperacao] = useState<Operacao>('ajuste');

  useEffect(() => {
    if (target) {
      setQuantidade(target.quantidadeAtual);
      setOperacao('ajuste');
    }
  }, [target]);

  if (!target) return null;

  const delta = quantidade - target.quantidadeAtual;
  const deltaClass = delta > 0 ? styles.plus : delta < 0 ? styles.minus : styles.zero;
  const deltaText = delta > 0 ? `+${delta}` : `${delta}`;

  const handleQuickAction = (type: 'vender' | 'devolver' | 'entrada') => {
    if (type === 'vender') {
      setQuantidade(Math.max(0, target.quantidadeAtual - 1));
      setOperacao('venda');
    } else if (type === 'devolver') {
      setQuantidade(target.quantidadeAtual + 1);
      setOperacao('entrada');
    } else if (type === 'entrada') {
      setOperacao('entrada');
    }
  };

  return (
    <Modal
      open={Boolean(target)}
      onClose={onClose}
      title="Ajustar estoque"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={() => onSave(quantidade)}
            loading={saving}
            disabled={quantidade === target.quantidadeAtual}
          >
            Salvar
          </Button>
        </>
      }
    >
      <div className={styles.context}>
        <div className={styles.contextProduct}>{target.produto.modelo}</div>
        <div className={styles.contextDetails}>
          <span>{target.produto.codigo}</span>
          <span>{target.cor.nome}</span>
          <span>Tam {target.tamanho}</span>
        </div>
      </div>

      <div className={styles.stepper}>
        <button
          type="button"
          className={styles.stepperBtn}
          onClick={() => setQuantidade(Math.max(0, quantidade - 1))}
          disabled={quantidade === 0}
          aria-label="Diminuir"
        >
          <Minus size={20} />
        </button>

        <input
          type="number"
          min={0}
          className={styles.stepperInput}
          value={quantidade}
          onChange={e => {
            const v = parseInt(e.target.value, 10);
            setQuantidade(Number.isFinite(v) ? Math.max(0, v) : 0);
          }}
          aria-label="Quantidade"
        />

        <button
          type="button"
          className={styles.stepperBtn}
          onClick={() => setQuantidade(quantidade + 1)}
          aria-label="Aumentar"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className={styles.delta}>
        <span>Diferença</span>
        <span className={`${styles.deltaValue} ${deltaClass}`}>
          {delta === 0 ? 'sem alteração' : deltaText}
        </span>
      </div>

      <div className={styles.operacoes}>
        <label className={styles.operacaoLabel}>
          <input
            type="radio"
            name="operacao"
            value="venda"
            checked={operacao === 'venda'}
            onChange={() => handleQuickAction('vender')}
          />
          <div className={styles.operacaoInfo}>
            <span className={styles.operacaoTitle}>Vendi um par</span>
            <span className={styles.operacaoDesc}>Decrementa em 1 pra registrar venda</span>
          </div>
        </label>

        <label className={styles.operacaoLabel}>
          <input
            type="radio"
            name="operacao"
            value="entrada"
            checked={operacao === 'entrada'}
            onChange={() => setOperacao('entrada')}
          />
          <div className={styles.operacaoInfo}>
            <span className={styles.operacaoTitle}>Entrada de mercadoria</span>
            <span className={styles.operacaoDesc}>Aumenta a quantidade (caixa nova)</span>
          </div>
        </label>

        <label className={styles.operacaoLabel}>
          <input
            type="radio"
            name="operacao"
            value="ajuste"
            checked={operacao === 'ajuste'}
            onChange={() => setOperacao('ajuste')}
          />
          <div className={styles.operacaoInfo}>
            <span className={styles.operacaoTitle}>Ajustar valor exato</span>
            <span className={styles.operacaoDesc}>Define diretamente a quantidade</span>
          </div>
        </label>
      </div>
    </Modal>
  );
}
