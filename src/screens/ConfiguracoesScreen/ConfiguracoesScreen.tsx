'use client';

import { useState } from 'react';
import { Save, ExternalLink, UserPlus, RefreshCw } from 'lucide-react';
import Input from '@/src/components/ui/Input';
import Button from '@/src/components/ui/Button';
import FormField from '@/src/components/ui/FormField';
import Badge from '@/src/components/ui/Badge';
import Avatar from '@/src/components/ui/Avatar';
import { useAuth } from '@/src/contexts/AuthContext';
import { useToast } from '@/src/contexts/ToastContext';
import { useOnlineStatus } from '@/src/hooks/shared/useOnlineStatus';
import { produtoService } from '@/src/services/produtoService';
import { cacheService } from '@/src/services/cacheService';
import { listMockUsers } from '@/src/mocks/users';
import type { UserRole } from '@/src/types/auth';
import styles from './ConfiguracoesScreen.module.css';

type Tab = 'perfil' | 'integracoes' | 'usuarios';

const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Admin',
  gerente: 'Gerente',
  vendedora: 'Vendedora',
};

const ROLE_VARIANT: Record<UserRole, 'danger' | 'warning' | 'default'> = {
  admin: 'danger',
  gerente: 'warning',
  vendedora: 'default',
};

export default function ConfiguracoesScreen() {
  const { user, mockMode, isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();
  const isOnline = useOnlineStatus();
  const [tab, setTab] = useState<Tab>('perfil');

  const [nome, setNome] = useState(user?.nome ?? '');
  const [csvUrl, setCsvUrl] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(() => cacheService.getLastSync());

  async function handleSync() {
    setSyncing(true);
    try {
      const { total } = await produtoService.syncNow();
      const now = new Date();
      setLastSync(now);
      showSuccess(`Cache atualizado — ${total} produtos sincronizados`);
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Erro ao sincronizar');
    } finally {
      setSyncing(false);
    }
  }

  function formatLastSync(date: Date | null): string {
    if (!date) return 'Nunca sincronizado';
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `Há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Há ${hours}h`;
    return date.toLocaleDateString('pt-BR');
  }

  if (!user) return null;

  const allTabs: Array<{ id: Tab; label: string; visible: boolean }> = [
    { id: 'perfil', label: 'Perfil', visible: true },
    { id: 'integracoes', label: 'Integrações', visible: isAdmin },
    { id: 'usuarios', label: 'Usuários', visible: isAdmin },
  ];
  const tabs = allTabs.filter(t => t.visible);

  const users = listMockUsers();

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs}>
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            className={`${styles.tab} ${tab === t.id ? styles.active : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'perfil' && (
        <div className={styles.card}>
          <div>
            <h3 className={styles.cardTitle}>Meu perfil</h3>
            <p className={styles.cardSub}>Informações da sua conta</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar name={user.nome} size="xl" />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500 }}>
                {user.nome}
              </div>
              <div style={{ color: 'var(--color-text-soft)', fontSize: 13 }}>
                {user.email}
              </div>
              <div style={{ marginTop: 8 }}>
                <Badge variant={ROLE_VARIANT[user.role]} withDot>
                  {ROLE_LABEL[user.role]}
                </Badge>
                {user.loja && (
                  <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--color-text-soft)' }}>
                    {user.loja}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.row}>
            <FormField label="Nome">
              <Input value={nome} onChange={e => setNome(e.target.value)} disabled={mockMode} />
            </FormField>
            <FormField label="Email">
              <Input value={user.email} disabled />
            </FormField>
          </div>

          {mockMode && (
            <div className={styles.info}>
              <strong>Modo demo:</strong> edição de perfil desabilitada.
              Quando o Supabase estiver configurado, será possível atualizar esses dados.
            </div>
          )}

          <div className={styles.actions}>
            <Button
              variant="primary"
              leftIcon={<Save size={14} />}
              disabled={mockMode}
              onClick={() => showSuccess('Perfil atualizado ✓')}
            >
              Salvar alterações
            </Button>
          </div>
        </div>
      )}

      {tab === 'integracoes' && (
        <div className={styles.card}>
          <div>
            <h3 className={styles.cardTitle}>Integrações</h3>
            <p className={styles.cardSub}>Configure fontes de dados externas</p>
          </div>

          <FormField
            label="URL da planilha (Google Sheets CSV)"
            hint="Cole o link público da planilha publicada como CSV"
          >
            <Input
              value={csvUrl}
              onChange={e => setCsvUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/..."
            />
          </FormField>

          <div className={styles.row}>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Última sincronização</span>
              <span className={styles.infoValue}>{formatLastSync(lastSync)}</span>
            </div>
            <div className={styles.infoBlock}>
              <span className={styles.infoLabel}>Produtos em cache</span>
              <span className={styles.infoValue}>
                {cacheService.hasCache() ? `${cacheService.getMeta()?.total ?? 0} produtos` : 'Sem cache'}
              </span>
            </div>
          </div>

          <div className={styles.actions}>
            <Button
              variant="primary"
              leftIcon={<RefreshCw size={14} />}
              onClick={handleSync}
              disabled={!isOnline || syncing}
            >
              {syncing ? 'Sincronizando...' : 'Sincronizar tabela'}
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Save size={14} />}
              onClick={() => showSuccess('URL salva ✓')}
              disabled={!csvUrl}
            >
              Salvar URL
            </Button>
            <Button
              variant="ghost"
              rightIcon={<ExternalLink size={14} />}
              onClick={() => window.open('https://docs.google.com/spreadsheets', '_blank')}
            >
              Abrir Google Sheets
            </Button>
          </div>

          {!isOnline && (
            <div className={styles.info}>
              <strong>Offline:</strong> usando dados do cache local. Conecte-se para sincronizar.
            </div>
          )}

          {isOnline && (
            <div className={styles.info}>
              <strong>Dica:</strong> publique a planilha em <em>Arquivo → Compartilhar → Publicar na Web</em>,
              escolha <em>Valores separados por vírgula (.csv)</em> e cole a URL aqui.
            </div>
          )}
        </div>
      )}

      {tab === 'usuarios' && (
        <div className={styles.card}>
          <div>
            <h3 className={styles.cardTitle}>Usuários do sistema</h3>
            <p className={styles.cardSub}>Vendedoras, gerentes e administradores cadastrados</p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className={styles.userTable}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Permissão</th>
                  <th>Loja</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar name={u.nome} size="sm" />
                      <span style={{ fontWeight: 600 }}>{u.nome}</span>
                    </td>
                    <td style={{ color: 'var(--color-text-soft)' }}>{u.email}</td>
                    <td>
                      <Badge variant={ROLE_VARIANT[u.role]}>
                        {ROLE_LABEL[u.role]}
                      </Badge>
                    </td>
                    <td style={{ color: 'var(--color-text-soft)', fontSize: 12 }}>
                      {u.loja ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.actions}>
            <Button
              variant="primary"
              leftIcon={<UserPlus size={14} />}
              disabled={mockMode}
              onClick={() => showSuccess('Funcionalidade disponível com Supabase ativo')}
            >
              Adicionar usuário
            </Button>
          </div>

          {mockMode && (
            <div className={styles.info}>
              <strong>Modo demo:</strong> usuários acima são fixos (mock).
              Com Supabase ativo, você poderá adicionar, editar e remover usuários de verdade.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
