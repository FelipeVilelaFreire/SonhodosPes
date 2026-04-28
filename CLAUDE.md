# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

**Sonho dos Pés — Consulta de Preços**: PWA para vendedoras de loja de sapatos consultarem preços, estoque e localização de produtos. Funciona offline após o primeiro carregamento.

Stack: HTML5 + CSS3 + JavaScript ES6+ vanilla, zero dependências de frontend. Backend: funções serverless Node.js no Vercel. Banco de dados master: Google Sheets.

## Desenvolvimento local

Sem build step — arquivos servidos diretamente:

```bash
npx serve -l 8000
# ou
python -m http.server 8000
```

Para testar as funções serverless da pasta `api/` localmente é necessário a Vercel CLI:

```bash
npm i -g vercel
vercel dev
```

A única dependência Node.js é `googleapis` (usada pelas funções serverless). Instalar com `npm install` se for testar o backend.

## Arquitetura

### Frontend (sem framework, sem build)

`index.html` → `styles.css` + `app.js` — tudo em arquivos únicos e planos.

`app.js` (~1.300 linhas) contém toda a lógica dentro de um IIFE. O fluxo de dados é:

```
/api/produtos (CSV) → parseCSV() → IndexedDB → searchProdutos() → renderCard()
```

1. **Inicialização**: tenta carregar de `/api/produtos` se online, senão lê do IndexedDB
2. **parseCSV()**: detecta delimitador, mapeia colunas por nome (não por índice), agrupa cores por código de produto, constrói `p._search` para busca normalizada
3. **searchProdutos()**: busca exata por código (5 dígitos), prefixo numérico (usado pelo QR scanner — pega os 5 primeiros dígitos de códigos longos), ou busca textual multi-termo
4. **renderCard()**: clona `#cardTemplate`, popula DOM, monta grid de tamanhos/estoque

### Funções serverless (`api/`)

| Arquivo | Método | Função |
|---|---|---|
| `api/produtos.js` | GET | Lê planilha Google Sheets via Service Account, retorna CSV |
| `api/locations.js` | PATCH | Atualiza corredor/armário/prateleira na planilha |
| `api/verify-pin.js` | POST | Valida PIN contra `SDP_PIN` env var |

Todas exigem header `X-App-Token` com o valor do `APP_TOKEN` env var.

### Armazenamento

- **IndexedDB** (`sonhodospes` v2): stores `produtos` e `meta` (última sync, URL salva)
- **LocalStorage**: `sdp:csvUrl` (URL customizada), `sdp:pinHash` (PIN em SHA-256)
- **Google Sheets**: fonte de verdade — preços, estoque, localizações

### Offline

Service worker (`service-worker.js`) usa network-first com fallback para cache. Cache version: `sonhodospes-app-v3`. Google Docs/Sheets são excluídos do cache (sempre busca ao vivo).

## Variáveis de ambiente (Vercel)

```
SPREADSHEET_ID              # ID da planilha Google Sheets
SHEET_NAME                  # Nome da aba (ex: Planilha1)
GOOGLE_SERVICE_ACCOUNT_KEY  # JSON da Service Account (stringificado)
APP_TOKEN                   # Token de autenticação da API
SDP_PIN                     # PIN para /api/verify-pin
```

## Convenções importantes

### Mapeamento de colunas CSV

`parseCSV()` sempre busca colunas **por nome**, nunca por índice — exceto quando a planilha não tem cabeçalho (primeira célula é número puro), onde usa um header padrão hardcoded em ordem fixa. Isso significa que adicionar/remover colunas com cabeçalho é seguro; sem cabeçalho, a ordem importa.

### Localização do produto

Armazenada em três campos separados (`produto.corredor`, `produto.armario`, `produto.prateleira`) e exibida com rótulo: `"Corredor 100 · Armário A · Prateleira 2"`. Os inputs de edição recebem apenas o valor (sem o prefixo).

### Busca por QR code

Códigos numéricos mais longos que 5 dígitos tentam match exato nos primeiros 5 dígitos antes de qualquer outra lógica — isso suporta QR codes de EAN/barcode que contêm o código do produto nos primeiros dígitos.

### Google Lens

Usa `navigator.share({ files })` no Android Chrome (abre share sheet nativo onde o Lens aparece). Fallback: form POST para `https://lens.google.com/upload` submetido do documento principal com `target` nomeado.

### PWA Install

O botão `#installBtn` no header fica oculto por padrão e só aparece quando o browser dispara `beforeinstallprompt` (Android/Chrome). Não aparece no iOS.

## Deployment

Push para `main` no GitHub → deploy automático no Vercel. Repositório: `FelipeVilelaFreire/SonhodosPes`.
