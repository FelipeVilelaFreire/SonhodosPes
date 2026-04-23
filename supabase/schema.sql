-- =========================================================================
-- Sonho dos Pés — Schema inicial do Supabase
-- =========================================================================
-- Rodar no SQL Editor do Supabase (projeto → SQL Editor → New query)
-- Ou via Supabase CLI: supabase db push
-- =========================================================================

-- Habilitar extensões úteis
create extension if not exists "uuid-ossp";

-- =========================================================================
-- TABELAS
-- =========================================================================

-- Produtos (um por código, independente de cor)
create table if not exists public.produtos (
  codigo text primary key,
  modelo text not null,
  categoria text,
  grupo text,
  referencia text,
  preco numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Variantes (produto + cor)
create table if not exists public.variantes (
  id uuid primary key default uuid_generate_v4(),
  produto_codigo text not null references public.produtos(codigo) on delete cascade,
  cor_nome text not null,
  cor_codigo text,
  preco_override numeric(10, 2),
  created_at timestamptz not null default now(),
  unique (produto_codigo, cor_nome)
);

create index if not exists idx_variantes_produto on public.variantes(produto_codigo);

-- Estoque (variante + tamanho + quantidade)
create table if not exists public.estoque (
  id uuid primary key default uuid_generate_v4(),
  variante_id uuid not null references public.variantes(id) on delete cascade,
  tamanho text not null,
  quantidade integer not null default 0 check (quantidade >= 0),
  updated_at timestamptz not null default now(),
  unique (variante_id, tamanho)
);

create index if not exists idx_estoque_variante on public.estoque(variante_id);

-- Log de mudanças (auditoria)
create table if not exists public.log_mudancas (
  id uuid primary key default uuid_generate_v4(),
  estoque_id uuid not null references public.estoque(id) on delete cascade,
  qtd_anterior integer not null,
  qtd_nova integer not null,
  operacao text not null check (operacao in ('venda', 'devolucao', 'ajuste', 'entrada')),
  usuario_id uuid references auth.users(id),
  observacao text,
  created_at timestamptz not null default now()
);

create index if not exists idx_log_estoque on public.log_mudancas(estoque_id, created_at desc);
create index if not exists idx_log_usuario on public.log_mudancas(usuario_id, created_at desc);

-- =========================================================================
-- VIEWS (facilitam consulta do frontend)
-- =========================================================================

-- produtos_view: produto agregado com cores e tamanhos em JSON
create or replace view public.produtos_view as
select
  p.codigo,
  p.modelo,
  p.categoria,
  p.grupo,
  p.referencia,
  p.preco,
  coalesce(
    json_agg(
      json_build_object(
        'nome', v.cor_nome,
        'codigoCor', v.cor_codigo,
        'tamanhos', (
          select json_object_agg(e.tamanho, e.quantidade)
          from public.estoque e
          where e.variante_id = v.id
        )
      )
    ) filter (where v.id is not null),
    '[]'::json
  ) as cores
from public.produtos p
left join public.variantes v on v.produto_codigo = p.codigo
group by p.codigo;

-- =========================================================================
-- TRIGGERS
-- =========================================================================

-- Atualiza updated_at automaticamente
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_produtos_updated on public.produtos;
create trigger trg_produtos_updated
  before update on public.produtos
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_estoque_updated on public.estoque;
create trigger trg_estoque_updated
  before update on public.estoque
  for each row execute function public.touch_updated_at();

-- Loga mudanças de estoque automaticamente
create or replace function public.log_estoque_change()
returns trigger as $$
begin
  if old.quantidade is distinct from new.quantidade then
    insert into public.log_mudancas (
      estoque_id, qtd_anterior, qtd_nova, operacao, usuario_id
    ) values (
      new.id,
      old.quantidade,
      new.quantidade,
      case
        when new.quantidade < old.quantidade then 'venda'
        when new.quantidade > old.quantidade then 'entrada'
        else 'ajuste'
      end,
      auth.uid()
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_estoque_log on public.estoque;
create trigger trg_estoque_log
  after update on public.estoque
  for each row execute function public.log_estoque_change();
