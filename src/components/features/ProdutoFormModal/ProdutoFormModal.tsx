'use client';

import { useState, useId } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Modal from '@/src/components/ui/Modal';
import Button from '@/src/components/ui/Button';
import FormField from '@/src/components/ui/FormField';
import Input from '@/src/components/ui/Input';
import type { Produto } from '@/src/types/produto';
import type { Cor } from '@/src/types/cor';
import styles from './ProdutoFormModal.module.css';

const TAMANHOS_PADRAO = ['33','34','35','36','37','38','39','40','41','42','43'];

interface CorForm {
  _id: string;
  nome: string;
  codigoCor: string;
  tamanhos: Record<string, string>;
}

interface FormErrors {
  codigo?: string;
  modelo?: string;
  preco?: string;
}

function coresToForm(cores: Cor[]): CorForm[] {
  return cores.map((c, i) => ({
    _id: String(i),
    nome: c.nome,
    codigoCor: c.codigoCor ?? '',
    tamanhos: Object.fromEntries(
      TAMANHOS_PADRAO.map(t => [t, String(c.tamanhos[t] ?? 0)])
    ),
  }));
}

function newCorForm(): CorForm {
  return {
    _id: String(Date.now()),
    nome: '',
    codigoCor: '',
    tamanhos: Object.fromEntries(TAMANHOS_PADRAO.map(t => [t, '0'])),
  };
}

interface Props {
  produto: Produto | null;
  existingCodigos?: string[];
  onSave: (p: Produto) => void;
  onClose: () => void;
}

export default function ProdutoFormModal({ produto, existingCodigos = [], onSave, onClose }: Props) {
  const uid = useId();
  const isEditing = produto !== null;

  const [codigo, setCodigo] = useState(produto?.codigo ?? '');
  const [modelo, setModelo] = useState(produto?.modelo ?? '');
  const [categoria, setCategoria] = useState(produto?.categoria ?? '');
  const [grupo, setGrupo] = useState(produto?.grupo ?? '');
  const [referencia, setReferencia] = useState(produto?.referencia ?? '');
  const [preco, setPreco] = useState(produto ? String(produto.preco) : '');
  const [cores, setCores] = useState<CorForm[]>(
    produto?.cores.length ? coresToForm(produto.cores) : [newCorForm()]
  );
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): boolean {
    const e: FormErrors = {};
    if (!codigo.trim()) e.codigo = 'Obrigatório';
    else if (!isEditing && existingCodigos.includes(codigo.trim())) e.codigo = 'Código já existe';
    if (!modelo.trim()) e.modelo = 'Obrigatório';
    const p = parseFloat(preco.replace(',', '.'));
    if (!preco.trim() || isNaN(p) || p < 0) e.preco = 'Preço inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const coresFormatted: Cor[] = cores
      .filter(c => c.nome.trim())
      .map(c => ({
        nome: c.nome.trim().toUpperCase(),
        codigoCor: c.codigoCor.trim() || undefined,
        tamanhos: Object.fromEntries(
          Object.entries(c.tamanhos)
            .map(([t, v]) => [t, parseInt(v) || 0])
        ),
      }));

    const p: Produto = {
      codigo: codigo.trim(),
      modelo: modelo.trim(),
      categoria: categoria.trim(),
      grupo: grupo.trim(),
      referencia: referencia.trim(),
      preco: parseFloat(preco.replace(',', '.')),
      cores: coresFormatted,
      searchIndex: '',
    };
    onSave(p);
  }

  function updateCor(id: string, field: keyof Omit<CorForm, '_id' | 'tamanhos'>, val: string) {
    setCores(prev => prev.map(c => c._id === id ? { ...c, [field]: val } : c));
  }

  function updateTamanho(id: string, tam: string, val: string) {
    const n = val.replace(/\D/g, '');
    setCores(prev => prev.map(c =>
      c._id === id ? { ...c, tamanhos: { ...c.tamanhos, [tam]: n } } : c
    ));
  }

  function addCor() {
    setCores(prev => [...prev, newCorForm()]);
  }

  function removeCor(id: string) {
    setCores(prev => prev.length > 1 ? prev.filter(c => c._id !== id) : prev);
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEditing ? `Editar produto · ${produto.codigo}` : 'Adicionar produto'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave}>
            {isEditing ? 'Salvar alterações' : 'Adicionar produto'}
          </Button>
        </>
      }
    >
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Informações</p>

        <div className={styles.row}>
          <FormField label="Código" htmlFor={`${uid}-codigo`} error={errors.codigo} required>
            <Input
              id={`${uid}-codigo`}
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
              placeholder="ex: 37201"
              invalid={Boolean(errors.codigo)}
              disabled={isEditing}
            />
          </FormField>
          <FormField label="Preço (R$)" htmlFor={`${uid}-preco`} error={errors.preco} required>
            <Input
              id={`${uid}-preco`}
              value={preco}
              onChange={e => setPreco(e.target.value)}
              placeholder="ex: 259,90"
              invalid={Boolean(errors.preco)}
            />
          </FormField>
        </div>

        <FormField label="Modelo" htmlFor={`${uid}-modelo`} error={errors.modelo} required>
          <Input
            id={`${uid}-modelo`}
            value={modelo}
            onChange={e => setModelo(e.target.value)}
            placeholder="ex: Scarpin Aurora Nude"
            invalid={Boolean(errors.modelo)}
          />
        </FormField>

        <div className={styles.row}>
          <FormField label="Categoria" htmlFor={`${uid}-cat`}>
            <Input
              id={`${uid}-cat`}
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              placeholder="ex: SCARPIN"
            />
          </FormField>
          <FormField label="Grupo" htmlFor={`${uid}-grupo`}>
            <Input
              id={`${uid}-grupo`}
              value={grupo}
              onChange={e => setGrupo(e.target.value)}
              placeholder="ex: CALÇADOS"
            />
          </FormField>
        </div>

        <FormField label="Referência do fabricante" htmlFor={`${uid}-ref`}>
          <Input
            id={`${uid}-ref`}
            value={referencia}
            onChange={e => setReferencia(e.target.value)}
            placeholder="ex: 491002"
          />
        </FormField>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>Cores &amp; Estoque</p>

        {cores.map((cor, i) => (
          <div key={cor._id} className={styles.corCard}>
            <div className={styles.corHeader}>
              <div className={styles.corHeaderFields}>
                <div>
                  <span className={styles.corLabel}>Nome da cor</span>
                  <input
                    className={styles.inlineInput}
                    value={cor.nome}
                    onChange={e => updateCor(cor._id, 'nome', e.target.value)}
                    placeholder="ex: PRETO"
                  />
                </div>
                <div>
                  <span className={styles.corLabel}>Código</span>
                  <input
                    className={styles.inlineInput}
                    value={cor.codigoCor}
                    onChange={e => updateCor(cor._id, 'codigoCor', e.target.value)}
                    placeholder="ex: 30"
                    style={{ width: 80 }}
                  />
                </div>
              </div>
              <button
                type="button"
                className={styles.removeCorBtn}
                onClick={() => removeCor(cor._id)}
                disabled={cores.length === 1}
                title="Remover cor"
              >
                <Trash2 size={15} />
              </button>
            </div>

            <div>
              <span className={styles.tamanhosLabel}>Quantidade por tamanho</span>
              <div className={styles.tamanhosGrid} style={{ marginTop: 8 }}>
                {TAMANHOS_PADRAO.map(tam => {
                  const val = cor.tamanhos[tam] ?? '0';
                  return (
                    <div key={tam} className={styles.tamanhoCell}>
                      <span className={styles.tamanhoKey}>{tam}</span>
                      <input
                        type="number"
                        min={0}
                        className={`${styles.tamanhoInput} ${parseInt(val) > 0 ? styles.hasValue : ''}`}
                        value={val}
                        onChange={e => updateTamanho(cor._id, tam, e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        <button type="button" className={styles.addCorBtn} onClick={addCor}>
          <Plus size={16} />
          Adicionar cor
        </button>
      </div>
    </Modal>
  );
}
