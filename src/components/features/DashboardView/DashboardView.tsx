'use client';

import Link from 'next/link';
import {
  Package,
  Layers,
  AlertTriangle,
  ShoppingCart,
  ArrowDownToLine,
  ArrowUpFromLine,
  Pencil,
  Search,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import StatsCard from '@/src/components/cards/ui/StatsCard';
import Badge from '@/src/components/ui/Badge';
import type { DashboardStats } from '@/src/mocks/stats';
import type { LogMudanca, OperacaoEstoque } from '@/src/types/estoque';
import type { User } from '@/src/types/auth';
import styles from './DashboardView.module.css';

interface DashboardViewProps {
  user: User;
  stats: DashboardStats | null;
  recentLogs: LogMudanca[];
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

const OPERACAO_META: Record<OperacaoEstoque, { label: string; icon: LucideIcon; className: string }> = {
  venda: { label: 'Venda', icon: ArrowUpFromLine, className: styles.venda },
  entrada: { label: 'Entrada', icon: ArrowDownToLine, className: styles.entrada },
  ajuste: { label: 'Ajuste', icon: Pencil, className: styles.ajuste },
  devolucao: { label: 'Devolução', icon: ArrowDownToLine, className: styles.entrada },
};

export default function DashboardView({ user, stats, recentLogs }: DashboardViewProps) {
  const isVendedora = user.role === 'vendedora';

  if (isVendedora) {
    return (
      <div className={styles.container}>
        <div>
          <h2 className={styles.greeting}>
            {getGreeting()}, {user.nome.split(' ')[0]}!
          </h2>
          <p className={styles.greetingSub}>
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
            })}
          </p>
        </div>

        <div className={styles.heroCard}>
          <h3 className={styles.heroTitle}>Consulta rápida</h3>
          <p className={styles.heroSub}>
            Busque produtos por código, nome ou marca
          </p>
          <Link href="/consulta" className={styles.heroBtn}>
            <Search size={18} />
            Abrir Consulta
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Minhas últimas vendas</h3>
          {recentLogs.filter(l => l.usuarioId === user.id).length === 0 ? (
            <p className={styles.emptySection}>Você ainda não fez vendas hoje.</p>
          ) : (
            <div className={styles.logList}>
              {recentLogs
                .filter(l => l.usuarioId === user.id)
                .slice(0, 5)
                .map(log => {
                  const meta = OPERACAO_META[log.operacao];
                  const Icon = meta.icon;
                  return (
                    <div key={log.id} className={styles.logItem}>
                      <div className={`${styles.logIcon} ${meta.className}`}>
                        <Icon size={18} />
                      </div>
                      <div className={styles.logInfo}>
                        <div className={styles.logTitle}>
                          {meta.label} · {log.qtdAnterior} → {log.qtdNova}
                        </div>
                        <div className={styles.logMeta}>{log.estoqueId}</div>
                      </div>
                      <span className={styles.logTime}>{formatRelativeTime(log.createdAt)}</span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div>
        <h2 className={styles.greeting}>
          {getGreeting()}, {user.nome.split(' ')[0]}!
        </h2>
        <p className={styles.greetingSub}>
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      <div className={styles.statsGrid}>
        <StatsCard
          label="Produtos"
          value={stats?.totalProdutos ?? 0}
          caption="No cadastro"
          icon={<Package size={22} />}
        />
        <StatsCard
          label="Em estoque"
          value={stats?.paresEmEstoque.toLocaleString('pt-BR') ?? 0}
          unit="pares"
          caption={`${stats?.totalProdutos ?? 0} modelos`}
          icon={<Layers size={22} />}
          variant="highlight"
        />
        <StatsCard
          label="Esgotados"
          value={stats?.produtosEsgotados ?? 0}
          caption="Produtos sem estoque"
          icon={<AlertTriangle size={22} />}
          variant={stats && stats.produtosEsgotados > 0 ? 'danger' : 'default'}
        />
        <StatsCard
          label="Vendas hoje"
          value={stats?.vendasHoje ?? 0}
          caption={`${stats?.vendasSemana ?? 0} na semana`}
          icon={<ShoppingCart size={22} />}
        />
      </div>

      <div className={styles.twoColumns}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <span>Últimas movimentações</span>
            <Link href="/historico" className={styles.sectionLink}>
              Ver todas →
            </Link>
          </h3>
          {recentLogs.length === 0 ? (
            <p className={styles.emptySection}>Nenhuma movimentação recente.</p>
          ) : (
            <div className={styles.logList}>
              {recentLogs.map(log => {
                const meta = OPERACAO_META[log.operacao];
                const Icon = meta.icon;
                return (
                  <div key={log.id} className={styles.logItem}>
                    <div className={`${styles.logIcon} ${meta.className}`}>
                      <Icon size={18} />
                    </div>
                    <div className={styles.logInfo}>
                      <div className={styles.logTitle}>
                        {log.usuarioNome ?? 'Sistema'} · {meta.label}
                      </div>
                      <div className={styles.logMeta}>
                        {log.qtdAnterior} → {log.qtdNova}
                      </div>
                    </div>
                    <span className={styles.logTime}>{formatRelativeTime(log.createdAt)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <span>Estoque baixo</span>
            <Link href="/estoque" className={styles.sectionLink}>
              Gerenciar →
            </Link>
          </h3>
          {stats && stats.produtosEstoqueBaixo.length === 0 ? (
            <p className={styles.emptySection}>Nenhum produto com estoque crítico.</p>
          ) : (
            <div className={styles.lowStockList}>
              {stats?.produtosEstoqueBaixo.map(p => (
                <div key={p.codigo} className={styles.lowStockItem}>
                  <span className={styles.lowStockCode}>{p.codigo}</span>
                  <span className={styles.lowStockName}>{p.modelo}</span>
                  <Badge variant="warning" withDot>
                    {p.totalPares} {p.totalPares === 1 ? 'par' : 'pares'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
