# Supabase Setup

## Ordem de execução

Execute os arquivos SQL nesta ordem no SQL Editor do Supabase:

1. **`schema.sql`** — cria tabelas, views, triggers
2. **`rls.sql`** — ativa Row Level Security e cria policies
3. **`seed-from-csv.sql`** — exemplo de carga manual (opcional)

## Criar usuário admin inicial

No painel Supabase:

1. **Authentication → Users → Add User**
2. Preenche email/senha do dono
3. Edita o user, adiciona em `User Metadata`:
   ```json
   {
     "nome": "Marcelo Freire",
     "role": "admin",
     "loja": "Matriz"
   }
   ```

## Importar dados do CSV

TODO: script em `scripts/import-csv-to-supabase.js` (a ser criado) que lê o CSV
do ERP e popula produtos/variantes/estoque automaticamente.

Enquanto isso, dá pra importar direto pela interface:
- Supabase → Table Editor → cada tabela → **Insert → From CSV**
