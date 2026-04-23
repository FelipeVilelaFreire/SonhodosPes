-- =========================================================================
-- Row Level Security (RLS) — Sonho dos Pés
-- =========================================================================
-- Rodar DEPOIS do schema.sql
-- =========================================================================

-- Habilitar RLS em todas as tabelas
alter table public.produtos enable row level security;
alter table public.variantes enable row level security;
alter table public.estoque enable row level security;
alter table public.log_mudancas enable row level security;

-- =========================================================================
-- POLÍTICAS DE LEITURA
-- =========================================================================

-- Todos os autenticados podem ler tudo (produto, variante, estoque)
create policy "Auth users read produtos"
  on public.produtos for select
  to authenticated
  using (true);

create policy "Auth users read variantes"
  on public.variantes for select
  to authenticated
  using (true);

create policy "Auth users read estoque"
  on public.estoque for select
  to authenticated
  using (true);

-- Admin lê log completo; outros só próprios logs
create policy "Admin reads all log"
  on public.log_mudancas for select
  to authenticated
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    or usuario_id = auth.uid()
  );

-- =========================================================================
-- POLÍTICAS DE ESCRITA
-- =========================================================================

-- Apenas admin cria/edita/remove produtos
create policy "Admin manage produtos"
  on public.produtos for all
  to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

create policy "Admin manage variantes"
  on public.variantes for all
  to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Vendedora, gerente e admin atualizam estoque (mas não criam/deletam)
create policy "Staff updates estoque"
  on public.estoque for update
  to authenticated
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('vendedora', 'gerente', 'admin')
  )
  with check (
    (auth.jwt() -> 'user_metadata' ->> 'role') in ('vendedora', 'gerente', 'admin')
  );

-- Apenas admin cria/remove entradas de estoque
create policy "Admin creates estoque"
  on public.estoque for insert
  to authenticated
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

create policy "Admin deletes estoque"
  on public.estoque for delete
  to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Log é só insert (trigger cuida), ninguém edita ou apaga manualmente
create policy "System inserts log"
  on public.log_mudancas for insert
  to authenticated
  with check (usuario_id = auth.uid());
