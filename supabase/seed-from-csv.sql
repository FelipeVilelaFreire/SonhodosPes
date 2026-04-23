-- =========================================================================
-- Seed inicial a partir do CSV de teste
-- =========================================================================
-- Este arquivo é um EXEMPLO. Para carga real, use o script
-- scripts/import-csv-to-supabase.js (a ser criado).
-- =========================================================================

-- Exemplo de inserção manual de um produto:
-- insert into public.produtos (codigo, modelo, categoria, grupo, referencia, preco)
-- values ('37201', 'SCARPIN NAPA MADRID 491002 DOLCCINI', 'SCARPIN', 'CALCADOS', '491002', 259.90)
-- on conflict (codigo) do update set
--   modelo = excluded.modelo,
--   categoria = excluded.categoria,
--   grupo = excluded.grupo,
--   referencia = excluded.referencia,
--   preco = excluded.preco;

-- insert into public.variantes (produto_codigo, cor_nome, cor_codigo)
-- values ('37201', 'PRETO', '10')
-- on conflict (produto_codigo, cor_nome) do nothing;

-- insert into public.estoque (variante_id, tamanho, quantidade)
-- select v.id, '37', 3
-- from public.variantes v
-- where v.produto_codigo = '37201' and v.cor_nome = 'PRETO'
-- on conflict (variante_id, tamanho) do update set quantidade = excluded.quantidade;
