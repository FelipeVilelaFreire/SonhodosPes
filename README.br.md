# Sonho dos Pés — PWA de Consulta de Preços e Estoque

Um Progressive Web Application (PWA) de uso interno projetado para vendedoras das lojas **Sonho dos Pés** consultarem de forma instantânea preços, níveis de estoque, tamanhos e localizações físicas de produtos.

O aplicativo é desenvolvido com foco em funcionamento **offline-first**, garantindo operação contínua dentro das lojas físicas mesmo quando a rede celular ou o Wi-Fi local estiverem instáveis.

---

## Sumário

- [Recursos Principais](#recursos-principais)
- [Arquitetura e Stack Tecnológico](#arquitetura-e-stack-tecnológico)
- [Estrutura de Diretórios](#estrutura-de-diretórios)
- [Configuração de Desenvolvimento Local](#configuração-de-desenvolvimento-local)
- [Esquema das Planilhas do Google (Banco de Dados)](#esquema-das-planilhas-do-google-banco-de-dados)
- [Segurança e Configuração de PIN](#segurança-e-configuração-de-pin)
- [Sistema da Roleta da Sorte (Gamificação)](#sistema-da-roleta-da-sorte-gamificação)
- [Sistema de Fila de Atendimento](#sistema-de-fila-de-atendimento)
- [Conceito de Múltiplas Franquias](#conceito-de-múltiplas-franquias)
- [Deploy e Variáveis de Ambiente](#deploy-e-variáveis-de-ambiente)
- [Convenções do Repositório](#convenções-do-repositório)

---

## Recursos Principais

- 🔍 **Busca Dinâmica por Múltiplos Termos:** Campo de busca inteligente com autocomplete que ignora acentuações e maiúsculas. Busca por modelo, SKU, coleção, categoria ou cores.
- 🔢 **Detecção Automática de SKU (5 Dígitos):** Realiza a busca imediata ao digitar o código exato de 5 dígitos de um produto (ex: `12345`).
- 📚 **Stack de Cards de Produto:** Exibe os resultados em uma pilha interativa de cards comparativos, permitindo que a vendedora consulte e compare vários sapatos ao mesmo tempo.
- 📦 **Grade de Cores e Estoque por Tamanho:** Exibição elegante indicando a disponibilidade do par:
  - **Estoque Suficiente (Verde):** 3 ou mais pares disponíveis.
  - **Baixo Estoque (Amarelo com Ponto Pulsante):** 1 ou 2 pares restantes (indica urgência na venda).
  - **Esgotado (Cinza tracejado e riscado):** 0 pares.
- 🚫 **Selo de Esgotado:** Badge visual destacando quando o modelo está inteiramente zerado no estoque.
- 📍 **Localização Física no Estoque:** Mostra o corredor, armário e prateleira do produto (ex: `Corredor 10 · Armário B · Prateleira 2`). Possui edição protegida por PIN para atualizar os endereços diretamente no celular.
- 📷 **Integração com Código de Barras e Lens:**
  - Leitor de QR Code integrado que extrai códigos de 5 dígitos de códigos de barras longos (padrão EAN).
  - Fallback de pesquisa via Google Lens (fazendo upload de fotos ou usando o portal oficial).
- ✈️ **Offline-First Avançado:** Funciona sem internet após a primeira abertura do app usando o banco de dados IndexedDB e Service Worker no navegador.
- 🎡 **Roleta da Sorte (`/roleta`):** Ferramenta de marketing para sorteio de brindes, com controle de estoque integrado e cores fixas locais por prêmio.
- 👥 **Fila de Atendimento (`/atendimento`):** Controle de rota de vendedoras para gerenciar a vez de atendimento na loja.

---

## Arquitetura e Stack Tecnológico

```
[Google Sheets] ──(Service Account)──> [APIs Serverless no Vercel]
                                                │
                                         (GET /api/produtos)
                                                │
[IndexedDB (Local)] <─────────────────── [Service Worker] <─── [PWA Frontend]
```

### Frontend (Vanilla PWA)
- **Zero Frameworks:** HTML5 nativo, CSS3 com variáveis nativas e JavaScript ES6+ puro. Sem etapas de build ou dependências pesadas de UI.
- **IndexedDB (banco `sonhodospes` v2):** Banco interno do navegador para carregamento e busca instantânea de milhares de linhas de produtos.
- **Service Worker (`service-worker.js`):** Interceptador com estratégia **Network-First** (com fallback de cache local para arquivos estáticos e fontes da Google).
- **Web Crypto API:** Criptografia nativa (`crypto.subtle`) para validação segura de hashes SHA-256 do PIN local.

### Backend (APIs Serverless)
- **Vercel Serverless Functions (`api/`):** Funções em Node.js rodando em infraestrutura serverless na Vercel.
- **Google Sheets API:** Comunicação configurada na biblioteca `googleapis` usando chave de Service Account JSON para ler e escrever dados na planilha.

---

## Estrutura de Diretórios

```
SonhoodosPés/
├── api/                   # Funções backend Node.js (Vercel Serverless)
│   ├── produtos.js        # GET: Lê a planilha do Google e formata em CSV
│   ├── locations.js       # PATCH: Atualiza corredor/armário/prateleira na tabela
│   ├── verify-pin.js      # POST: Valida o PIN de segurança para configurações
│   ├── roleta.js          # GET/POST: Gerencia sorteio e quantidades de prêmios
│   └── atendimento.js     # GET/POST: Controla a fila de vendedoras
│
├── styles.css             # Estilos do app (organizado em 16 seções estruturadas)
├── roleta.css             # Estilos da interface da roleta
├── atendimento.css        # Estilos da fila de vendedoras
├── app.js                 # Lógica do app (busca, indexação IndexedDB, renderização)
├── roleta.js              # Lógica de controle e animações da roleta
├── atendimento.js         # Lógica de controle de fila de atendimento
│
├── index.html             # Arquivo HTML principal do PWA
├── roleta.html            # Interface da roleta (disponível em /roleta)
├── atendimento.html       # Interface da fila (disponível em /atendimento)
├── painel.html            # Dashboard de métricas (disponível em /sdp-metricas-9x7k2m)
│
├── manifest.json          # Manifesto do PWA (ícones, cores de exibição, etc)
├── service-worker.js      # Regras de cache offline e atualizações em segundo plano
│
├── logo.svg               # Logo oficial da marca em formato vetor (SVG)
├── ativos de manifesto    # icon-192.png, icon-512.png, icon.svg
│
├── package.json           # Dependências backend do Node.js (googleapis)
├── vercel.json            # Redirecionamentos e rotas de deploy no Vercel
│
├── [app/], [src/]         # EXPERIMENTAL: Pastas de migração Next.js/TypeScript
│                          # (Não usadas no PWA de produção estático atual)
└── README.md              # Documentação em Inglês
```

> [!NOTE]
> As pastas `app/`, `src/` e os arquivos `tsconfig.tsbuildinfo` e `next-env.d.ts` fazem parte de uma iniciativa futura de migração para Next.js. O PWA de produção atualmente ativo é servido diretamente a partir dos arquivos vanilla (`index.html`, `app.js`, `styles.css`).

---

## Configuração de Desenvolvimento Local

Devido às restrições de segurança do navegador, os Service Workers necessitam de HTTPS ou de servidores de loopback local.

### 1. Servir o Frontend Estático
Navegue até o diretório do projeto e utilize uma das seguintes ferramentas para rodar o app localmente (não use o protocolo `file://` abrindo o `index.html` diretamente):

**Opção A (Node.js - Recomendado):**
```bash
npx serve -l 8000
```
Acesse: `http://localhost:8000`

**Opção B (Python):**
```bash
python -m http.server 8000
```

### 2. Rodar APIs Serverless Localmente
Para testar as rotas da pasta `api/` localmente, é necessário instalar a Vercel CLI e configurar as chaves do ambiente:

```bash
# Instalar dependências de APIs
npm install

# Instalar a CLI da Vercel globalmente
npm install -g vercel

# Iniciar o ambiente de desenvolvimento local das APIs
vercel dev
```

### 3. Validação de Sintaxe
Rode os testes estáticos rápidos para verificar integridade antes de commitar alterações:
```bash
node --check app.js
node --check roleta.js
node --check api/roleta.js
```

---

## Esquema das Planilhas do Google (Banco de Dados)

A planilha configurada na variável `SPREADSHEET_ID` serve como fonte única de verdade dos dados.

### 1. Aba de Produtos (Planilha de Estoque)
A planilha configurada no ambiente como `SHEET_NAME` deve ter os seguintes cabeçalhos exatos na primeira linha:

| Cabeçalho da Coluna | Descrição | Exemplo de Formato |
|---|---|---|
| `codigo` | SKU/Identificador exclusivo (5 dígitos) | `12001`, `03450` |
| `modelo` | Nome do produto ou modelo comercial | `Scarpin Aurora Nude` |
| `marca` | Fabricante ou Marca | `Vizzano`, ` Dakota` |
| `tamanhos` | Matriz serializada de cor e quantidade | `Cor: Preto\|34:2,35:5,36:0` |
| `preco_venda` | Preço de varejo | `199.90` ou `199,90` |
| `corredor` | Corredor físico no estoque | `12` |
| `armario` | Letra do armário ou coluna | `A` |
| `prateleira` | Nível da prateleira | `3` |

### 2. Formato da Coluna de Tamanhos
A célula de `tamanhos` é serializada sob o seguinte padrão de string:
- Estrutura: `Nome_Cor|Tamanho:Quantidade,Tamanho:Quantidade...`
- Suporte a múltiplas cores divididas por ponto e vírgula: `PRETO|34:1,35:2;NUDE|34:0,35:1`
- Formato legado (sem colons) também é reconhecido: `34,35,36` (indica disponibilidade sem quantidade numérica).

---

## Segurança e Configuração de PIN

Para bloquear alterações acidentais de URL de importação ou updates indevidos da localização dos sapatos por parte de terceiros ou clientes, a aplicação conta com um PIN de segurança.

- **PIN de Desenvolvimento:** Configurado localmente em `app.js`:
  ```javascript
  const LOCAL_DEV_PIN = '1357';
  ```
- **PIN de Produção:** Validado pela API `/api/verify-pin` contra a variável de ambiente `SDP_PIN` definida no console da Vercel.
- **PIN Personalizado do Navegador:** O PWA oferece suporte para salvar um hash SHA-256 local no `localStorage` (`sdp:pinHash`). Para ativar a interface que configura esse PIN, remova os comentários de segurança da seção `<div class="setting-group security-group">` no arquivo `index.html`.

---

## Sistema da Roleta da Sorte (Gamification)

A roleta está disponível na rota `/roleta` (aponta para `roleta.html`).

### Regras Mandatórias (ROLETA.md)
1. **Ocular Probabilidade:** A interface **nunca** deve listar chances, quantidades totais, probabilidade percentual ou legendas externas de prêmios. O cliente deve ver apenas o sorteio visual.
2. **Slices Estéticos:** A divisão visual da roda é desenhada de forma equilibrada entre os prêmios ativos. As probabilidades reais são calculadas no backend.
3. **Sorteio no Servidor:** O sorteio ocorre via requisição `POST` em `api/roleta.js` através de cálculo ponderado:
   $$\text{chance} = \frac{\text{Quantidade do Prêmio}}{\text{Soma de Todos os Estoques}}$$
4. **Baixa de Estoque em Tempo Real:** Ao sortear um brinde, a API decrementa `1` na quantidade correspondente diretamente na planilha do Google, evitando problemas de concorrência.
5. **Mapa de Cores Persistente:** Cada prêmio (`VALOR`) recebe uma cor que fica fixa no navegador daquele usuário através da chave `localStorage["sdp:roletaColorMap:v1"]`.
6. **Compensação Conic Gradient:** A parada da rotação visual conta com ajuste de `-90` graus no Javascript para coincidir com a orientação do gradiente cônico CSS. Não modifique essa conta em `roleta.js`.

---

## Sistema de Fila de Atendimento

Disponível em `/atendimento` (`atendimento.html`), este módulo organiza a escala de trabalho:
- Permite que vendedoras alterem seu status entre Ativo/Inativo.
- Utiliza fila sequencial FIFO (First In, First Out) para determinar a "Vendedora da Vez".
- Mostra estatísticas operacionais de atendimento na loja.

---

## Conceito de Múltiplas Franquias

A aplicação possui um planejamento de suporte multiloja (`MULTIFRANCHISE.md`):
- O arquivo `franchises.json` mapeia as lojas ativas:
  ```json
  [
    { "id": "moema", "nome": "Unidade Moema", "csvUrl": "/api/produtos?f=moema" }
  ]
  ```
- A API `/api/produtos?f=moema` realiza o proxy buscando a planilha associada na variável de ambiente correspondente no Vercel (ex: `URL_TABLE_MOEMA`), de forma que o app rode um único deploy global compartilhando configurações locais por navegador.

---

## Deploy e Variáveis de Ambiente

O deploy do PWA é feito automaticamente na **Vercel** ao enviar alterações para o ramo `main` do GitHub:
- Repositório: `FelipeVilelaFreire/SonhodosPes`

### Variáveis necessárias no Vercel
```env
SPREADSHEET_ID              # ID da planilha mestre do Google Sheets
SHEET_NAME                  # Nome da aba de estoque (ex: Planilha1)
GOOGLE_SERVICE_ACCOUNT_KEY  # JSON completo de credenciais da Service Account (string)
APP_TOKEN                   # Token de autenticação correspondente ao header X-App-Token
SDP_PIN                     # PIN de segurança usado no deploy de produção (ex: 1357)
ROLETA_SHEET_NAME          # (Opcional) Nome da aba específica para prêmios da roleta
```

---

## Convenções do Repositório

- **Proteção de Segredos:** Nunca commite chaves privadas, tokens ou arquivos `.env` e `vercel_key.txt`.
- **Controle de Cache do Service Worker:** Ao modificar qualquer arquivo estático (`index.html`, `styles.css`, `app.js`, etc.), você **deve** atualizar a constante `CACHE_NAME` no topo do `service-worker.js` (de `sonhodospes-app-v13` para `sonhodospes-app-v14`) para forçar os dispositivos das vendedoras a baixarem a nova versão.
- **Commits Limpos:** Adicione apenas arquivos relevantes à tarefa. Evite o uso de `git add .` se houver arquivos de dump ou logs locais modificados:
  ```bash
  git status --short --branch
  git diff --cached --stat
  ```
