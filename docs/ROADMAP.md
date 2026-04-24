# Roadmap — Evolução para Controle de Estoque

Este documento descreve a visão de **longo prazo** para o app Sonho dos Pés.
É um plano, **não código**. Não há nada implementado aqui além do que já existe no repositório.

---

## Sumário

- [Onde estamos hoje](#onde-estamos-hoje)
- [Para onde queremos ir](#para-onde-queremos-ir)
- [Arquitetura proposta](#arquitetura-proposta)
- [Como funcionaria na prática](#como-funcionaria-na-prática)
- [Modelo de dados no Supabase](#modelo-de-dados-no-supabase)
- [Papel do CSV nessa nova arquitetura](#papel-do-csv-nessa-nova-arquitetura)
- [Fases de implementação](#fases-de-implementação)
- [Estimativa de esforço](#estimativa-de-esforço)
- [Tradeoffs e alternativas](#tradeoffs-e-alternativas)
- [Perguntas em aberto](#perguntas-em-aberto)

---

## Onde estamos hoje

**Fase atual: somente consulta (read-only)**

```
Google Sheets (dono edita)
         ↓
   URL pública CSV
         ↓
  Celular baixa e cacheia (IndexedDB)
         ↓
  Vendedora consulta (online/offline)
```

**O que funciona:**
- Consulta por código, nome ou marca
- Grade com cores × tamanhos e quantidades por tamanho
- Stack de múltiplas consultas simultâneas
- 100% offline após primeira carga
- PWA instalável no celular

**Limitações:**
- Vendedora não edita — ela **avisa verbalmente** o que vendeu, alguém atualiza a planilha depois
- Risco de desincronização (vendeu mas não anotou → estoque errado)
- Sem histórico de mudanças
- Dono precisa atualizar manualmente toda vez

---

## Para onde queremos ir

**Visão final: controle de estoque real, com consulta offline**

Regra principal pensada pelo usuário:

> *"Sem internet: a pessoa só consulta. Com internet: pode editar."*

Essa é a arquitetura **offline-first com degradação elegante** — padrão em apps modernos tipo Notion, Linear, etc.

Benefícios esperados:
- **Vendedora vende** um par → tira do estoque pelo celular em 2 toques
- **Estoque real-time** entre celulares (vendedora B vê vendedora A vender)
- **Log de mudanças** — "Maria vendeu 1 par Scarpin 37 às 14:32"
- **Dono administra** pelo celular ou computador sem planilha intermediária
- **Backup automático** na nuvem (não depende de arquivo Google)

---

## Arquitetura proposta

```
┌─────────────────────────────────────────┐
│  SUPABASE (nuvem)                       │
│  • Fonte da verdade                     │
│  • PostgreSQL + Auth + Real-time        │
│  • Dashboard admin embutido             │
└────────────┬────────────────────────────┘
             │
             │ (online: leitura + escrita)
             │ (subscriptions em tempo real)
             ▼
┌─────────────────────────────────────────┐
│  App PWA no celular da vendedora        │
│  ┌───────────────────────────────────┐  │
│  │ Camada de dados                   │  │
│  │  • Tenta Supabase primeiro        │  │
│  │  • Fallback: IndexedDB (offline)  │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ Camada de UI                      │  │
│  │  • Online: células editáveis      │  │
│  │  • Offline: só leitura (avisinho) │  │
│  └───────────────────────────────────┘  │
└────────────┬────────────────────────────┘
             │
             │ (detecta conexão)
             ▼
        navigator.onLine
```

### Detecção online/offline

O navegador já oferece `navigator.onLine` e os eventos `online` / `offline`. O app:

- **Ao abrir com internet:** busca dados do Supabase, cacheia no IndexedDB, habilita edição
- **Ao abrir sem internet:** lê do IndexedDB, bloqueia botões de edição, mostra badge "Modo offline"
- **Transição online → offline:** bloqueia edições novas, mostra toast avisando
- **Transição offline → online:** atualiza dados do Supabase, reabilita edição

### Tempo real (Supabase Realtime)

Supabase oferece *subscriptions* nativas via WebSocket. No código:

```js
supabase
  .channel('estoque')
  .on('postgres_changes', { event: 'UPDATE', table: 'estoque' }, (payload) => {
    atualizarCelula(payload.new);
  })
  .subscribe();
```

Sem esse código, cada vendedora precisaria dar pull a cada X segundos (polling) — ineficiente.

---

## Como funcionaria na prática

### Cenário 1: Vendedora com internet

```
1. Abre o app
2. App conecta no Supabase
3. Baixa dados recentes
4. Atualiza IndexedDB (backup)
5. Mostra grade normal
6. Cada célula de quantidade é TOCÁVEL
7. Vendedora toca célula "37 CAMEL = 3 pares"
8. Popup: [Vender] [Devolver] [Ajustar exato]
9. Toca "Vender" → popup "Quantos?" com -/+ (default 1)
10. Confirma → Supabase atualiza de 3 para 2
11. Evento real-time dispara
12. Outros celulares conectados veem mudar instantaneamente
13. Log de mudança é registrado
```

### Cenário 2: Vendedora sem internet (metrô, sinal ruim)

```
1. Abre o app
2. App tenta Supabase → timeout
3. Detecta offline
4. Lê IndexedDB (última sincronização)
5. Mostra grade com badge: "📡 MODO OFFLINE"
6. Células são CINZAS (não tocáveis)
7. Mensagem: "Conecte-se para editar estoque"
8. Vendedora consulta preços/estoque normalmente
```

### Cenário 3: Transição offline → online (volta o sinal)

```
1. navigator.onLine dispara evento "online"
2. App faz pull do Supabase
3. Atualiza IndexedDB
4. Re-renderiza células como editáveis
5. Toast: "Conectado ✓ Estoque atualizado"
```

### Cenário 4: Dono administra (no computador ou celular)

Opções pro dono:

**A)** Usa o próprio app com conta "admin" — operações em lote (tipo "entrou caixa nova, +10 em tal produto").

**B)** Acessa `supabase.com/dashboard/project/{id}/editor` — interface visual tipo Excel, edita qualquer coisa, importa/exporta CSV, configura automações.

---

## Modelo de dados no Supabase

### Filosofia multi-tenant

O schema já nasce com `empresa_id` em todas as tabelas. Isso custa quase nada agora e evita
uma migração dolorosa quando surgir o segundo cliente. **Não será construída nenhuma interface
de gerenciamento de tenants por enquanto** — só a fundação no banco. A UI multi-tenant vem
quando o segundo cliente for real.

### Tabela `empresas` (fundação multi-tenant)

```
┌───────────┬────────┬─────────────────┬──────────────────────┐
│ id        │ PK     │ uuid            │ auto                 │
│ nome      │        │ text            │ "Sonho dos Pés"      │
│ slug      │        │ text            │ "sonho-dos-pes"      │
│ created_at│        │ timestamptz     │ auto                 │
└───────────┴────────┴─────────────────┴──────────────────────┘
```

### Tabela `produtos`
Informação que não muda por cor.

```
┌───────────┬────────┬─────────────────┬────────────┐
│ empresa_id│ FK →   │ uuid            │ ref        │ ← multi-tenant
│ codigo    │ PK     │ text            │ "37201"    │
│ modelo    │        │ text            │ "SCARPIN..."│
│ categoria │        │ text            │ "SCARPIN"  │
│ grupo     │        │ text            │ "CALCADOS" │
│ referencia│        │ text            │ "491002"   │
│ preco     │        │ numeric(10,2)   │ 259.90     │
│ created_at│        │ timestamptz     │ auto       │
│ updated_at│        │ timestamptz     │ auto       │
└───────────┴────────┴─────────────────┴────────────┘
```

### Tabela `variantes`
Uma linha por combinação produto+cor.

```
┌───────────┬────────┬─────────────────┬────────────┐
│ empresa_id│ FK →   │ uuid            │ ref        │ ← multi-tenant
│ id        │ PK     │ uuid            │ auto       │
│ codigo    │ FK →   │ text            │ "37201"    │
│ cor_nome  │        │ text            │ "PRETO"    │
│ cor_codigo│        │ text            │ "30"       │
│ preco_over│        │ numeric(10,2)   │ null       │ (se varia por cor)
└───────────┴────────┴─────────────────┴────────────┘
```

### Tabela `estoque`
Uma linha por combinação variante+tamanho. É a tabela mais quente.

```
┌───────────┬────────┬─────────────────┬────────────┐
│ empresa_id│ FK →   │ uuid            │ ref        │ ← multi-tenant
│ id        │ PK     │ uuid            │ auto       │
│ variante_id│ FK →  │ uuid            │ ref        │
│ tamanho   │        │ text            │ "37"       │
│ quantidade│        │ integer         │ 3          │
│ updated_at│        │ timestamptz     │ auto       │
└───────────┴────────┴─────────────────┴────────────┘
```

### Tabela `log_mudancas`
Auditoria — crítico pra diagnosticar divergências.

```
┌──────────────┬────────┬─────────────────┬─────────────┐
│ empresa_id   │ FK →   │ uuid            │ ref         │ ← multi-tenant
│ id           │ PK     │ uuid            │ auto        │
│ estoque_id   │ FK →   │ uuid            │ ref         │
│ qtd_anterior │        │ integer         │ 3           │
│ qtd_nova     │        │ integer         │ 2           │
│ operacao     │        │ text            │ "venda"     │
│ usuario_id   │ FK →   │ uuid            │ ref         │
│ observacao   │        │ text            │ null        │
│ created_at   │        │ timestamptz     │ auto        │
└──────────────┴────────┴─────────────────┴─────────────┘
```

### Tabela `usuarios` (Supabase Auth)
Gerenciada automaticamente pelo Supabase. Metadata customizada:

```json
{
  "empresa_id": "uuid-da-empresa",
  "role": "vendedora" | "gerente" | "admin",
  "nome": "Maria da Silva"
}
```

### Regras de segurança (Row Level Security)

Helper function que resolve o `empresa_id` do usuário logado:

```sql
CREATE OR REPLACE FUNCTION get_empresa_id()
RETURNS uuid AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'empresa_id')::uuid;
$$ LANGUAGE sql STABLE;
```

Policies em todas as tabelas:

```sql
-- Isolamento total por empresa (leitura)
CREATE POLICY "empresa lê seus dados" ON produtos
  FOR SELECT USING (empresa_id = get_empresa_id());

CREATE POLICY "empresa lê seus dados" ON variantes
  FOR SELECT USING (empresa_id = get_empresa_id());

CREATE POLICY "empresa lê seus dados" ON estoque
  FOR SELECT USING (empresa_id = get_empresa_id());

-- Permissões por role dentro da empresa
CREATE POLICY "vendedoras vendem" ON estoque
  FOR UPDATE USING (
    empresa_id = get_empresa_id()
    AND auth.jwt() ->> 'role' IN ('vendedora', 'gerente', 'admin')
  );

CREATE POLICY "admin mexe preços" ON produtos
  FOR UPDATE USING (
    empresa_id = get_empresa_id()
    AND auth.jwt() ->> 'role' = 'admin'
  );
```

Sem código no app. **Segurança e isolamento aplicados direto no banco.**

---

## Papel do CSV nessa nova arquitetura

O `produtos.csv` atual **não desaparece** — muda de função:

### Papel 1: Seed inicial (recomendado manter)
- Fica no repo como **dados de demonstração**
- Se alguém clonar o app e rodar sem Supabase configurado, ainda funciona com esses dados
- Útil pra desenvolvimento local

### Papel 2: Formato de importação
- Dono importa CSV existente pro Supabase na migração inicial
- Interface do Supabase aceita CSV direto via upload

### Papel 3: Formato de exportação (backup)
- Dono pode exportar periodicamente o Supabase como CSV
- Salva em Google Drive pra redundância
- Caso Supabase tenha problema, tem o CSV pra restaurar

### Papel 4 (opcional): Fonte híbrida via sincronização
Cenário onde o dono faz questão do Google Sheets:

```
Google Sheets (dono edita catálogo)
         ↓ (sincronização automática)
      Supabase (armazena + vendedoras editam estoque)
         ↓
      Celulares
```

A sincronização seria um Edge Function do Supabase que lê o Google Sheets CSV a cada X horas e atualiza as tabelas `produtos` e `variantes` — mas **não mexe** na tabela `estoque` (que é manipulada em tempo real pelas vendedoras).

**Não recomendo começar por aqui** — complica bastante. Só se o dono insistir depois.

---

## Fases de implementação

### Fase 0 — Validação (atual)
- Deploy do que tem
- Cliente testa por 2-3 semanas
- Descobrir: vendedoras usam? Precisam editar mesmo? Qual tipo de edição?

### Fase 1 — Setup Supabase (1 dia)
- Criar projeto Supabase
- Criar tabela `empresas` + inserir registro "Sonho dos Pés"
- Criar tabelas `produtos`, `variantes`, `estoque`, `log_mudancas` com `empresa_id` em todas
- Criar helper function `get_empresa_id()`
- Configurar Auth (magic link ou email+senha)
- Configurar Row Level Security com isolamento por empresa
- Importar CSV atual via interface Supabase

### Fase 2 — Camada de dados no app (1-2 dias)
- Adicionar `@supabase/supabase-js` via CDN (sem build)
- Criar módulo `data.js` que abstrai origem (Supabase ou IndexedDB)
- Refatorar `app.js` pra usar essa camada
- Manter IndexedDB como cache
- **Nenhuma mudança de UI** nessa fase

### Fase 3 — Autenticação (1 dia)
- Tela de login (email + senha ou magic link)
- Criar usuários iniciais: admin (dono), gerente, vendedoras
- Persistir sessão via Supabase Auth

### Fase 4 — UI de edição (2 dias)
- Células da grade tocáveis quando logado + online
- Popup de ajuste (vendi / devolvi / ajustar)
- Loading state, feedback visual
- Bloqueio offline (com mensagem explicativa)

### Fase 5 — Real-time (meio dia)
- Subscrever mudanças do Supabase
- Atualizar células abertas quando outros editam

### Fase 6 — Log e histórico (meio dia)
- Tela de histórico de mudanças (só admin)
- "Quem vendeu esse produto hoje?"

### Fase 7 — Polish (1 dia)
- Tratamento de erros de rede
- Confirmações de segurança em operações destrutivas
- Testes em dispositivos reais

**Total: 7-10 dias de trabalho dedicado.**

---

## Estimativa de esforço

| Etapa | Horas | Complexidade |
|-------|-------|--------------|
| Setup Supabase | 2h | Baixa |
| Schema + RLS | 3h | Média |
| Importar dados | 1h | Baixa |
| Camada de dados no app | 6-8h | Média |
| Autenticação + login | 4-6h | Média |
| UI de edição | 8-12h | Alta |
| Real-time subscriptions | 3-4h | Média |
| Log de mudanças | 3-4h | Baixa |
| Polish e testes | 6-8h | Média |
| **Total** | **36-48h** | — |

Em dias úteis de 6h produtivas: **6 a 8 dias**.

---

## Tradeoffs e alternativas

### Por que Supabase e não Firebase?
Ambos funcionam. Supabase foi escolhido porque:
- **PostgreSQL** (banco relacional padrão da indústria)
- Open-source (dá pra migrar se precisar)
- Plano grátis generoso (500 MB + 5 GB/mês)
- Dashboard intuitivo pra não-técnicos
- Menos "lock-in" que Firebase

Firebase seria igualmente viável. Diferença: Firestore (NoSQL) é mais "schemaless" mas tem query menos flexível.

### Por que não manter tudo no Google Sheets?
Google Sheets não foi feito pra múltiplos escritores concorrentes. Dá pra usar via Apps Script, mas:
- Latência alta (~2-5s por edição)
- Quotas diárias do Google
- Sem suporte real-time nativo
- Sem RLS (controle de acesso granular)

Google Sheets é **ótimo pra dono editar**, mas **ruim pra vendedoras venderem em tempo real**.

### E se quisermos manter simples com só fila de edições?
Opção mais leve: vendedora registra edições num "rascunho" offline, que é sincronizado quando tem internet. Sem real-time, sem concorrência resolvida.

**Problema:** se duas vendedoras vendem o mesmo último par offline, quando sincronizar vira bagunça. Só vale se **uma loja pequena, uma vendedora**.

### E se usarmos um banco local por celular (sem servidor)?
Não resolve — cada celular teria sua cópia divergente do estoque. A essência do problema é ter **uma fonte centralizada**.

---

## Perguntas em aberto

Itens que precisam de decisão **antes** de começar a Fase 1:

### 1. Quem edita o quê?
- Vendedoras podem editar só "vender" (decrementar) ou podem ajustar qualquer quantidade?
- Gerente tem poderes extras?
- Dono é único que mexe em preço e produtos novos?

### 2. Uma loja ou várias?
- Se forem várias, cada estoque é separado
- Modelo de dados: `estoque` ganha coluna `loja_id` (além do `empresa_id` já previsto)
- Vendedora só vê estoque da sua loja
- **Multi-tenant (múltiplas empresas):** a fundação já está no schema (`empresa_id` em todas as
  tabelas + RLS). A UI de gerenciamento de tenants será construída só quando surgir o segundo cliente.

### 3. Integração com caixa existente?
- A loja tem sistema de PDV que registra vendas?
- Se sim, o ideal é o PDV **automaticamente** tirar do estoque — nosso app só consulta
- Vendedora nem precisa tocar no botão "vendi"

### 4. Qual é o workflow REAL hoje?
- Quem dá baixa no estoque quando vende?
- Quando vem mercadoria nova, quem registra?
- Tem contagem periódica (balanço)?

### 5. Orçamento?
- Supabase grátis aguenta muito (500 MB + 5 GB/mês)
- Mas pra 10+ lojas com muita venda pode precisar do Pro ($25/mês)

---

## Próximos passos concretos

**Agora:**
- ✅ Deploy do app atual no Vercel
- ✅ Cliente usa por 2-3 semanas
- 📋 Coleta feedback: o que tá faltando, o que tá sobrando

**Depois dessa validação:**
- 📋 Revisar este documento com o cliente
- 📋 Decidir: vai pro Supabase ou fica como tá?
- 📋 Se sim: executar Fases 1-7 em sprint dedicado

**Decisões que o cliente precisa tomar** antes da Fase 1:
- Quem edita o quê?
- Uma loja ou várias?
- Integra com PDV ou não?

---

## Tecnologias envolvidas (referência rápida)

| Tech | Propósito | Link |
|------|-----------|------|
| Supabase | Backend (banco + auth + real-time) | https://supabase.com |
| @supabase/supabase-js | Cliente JS oficial | via CDN |
| IndexedDB | Cache local offline | nativo do browser |
| Service Worker | Cache de assets | nativo do browser |
| PWA | Instalação no celular | nativo do browser |

---

## Considerações finais

Este roadmap é **aspiracional**, não um compromisso. Ele existe pra:

1. **Alinhar expectativas** — cliente, você e eu pensando no mesmo modelo mental
2. **Documentar a visão** — pra não perder de vista o "pra onde vamos"
3. **Facilitar decisões** — quando chegar a hora, os tradeoffs já tão mapeados

A única coisa **certa** no momento: a Fase 0 (validação com cliente). Tudo depois é hipótese até o cliente confirmar que a feature tem valor.

**Não implemente nada deste documento sem antes validar com o cliente e revisar o plano.**
