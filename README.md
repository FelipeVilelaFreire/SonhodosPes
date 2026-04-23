# Sonho dos Pés — Consulta de Preços

App PWA de consulta de preços e estoque para as vendedoras da loja **Sonho dos Pés**.
Funciona **100% offline** no celular após a primeira abertura.

Desenvolvido com HTML, CSS e JavaScript puros — zero dependências, zero build step.

---

## Sumário

- [O que o app faz](#o-que-o-app-faz)
- [Como testar localmente](#como-testar-localmente)
- [Como hospedar online](#como-hospedar-online)
- [Como as vendedoras instalam no celular](#como-as-vendedoras-instalam-no-celular)
- [Como o dono alimenta a tabela](#como-o-dono-alimenta-a-tabela-de-preços)
- [Formato da planilha](#formato-da-planilha)
- [PIN de segurança](#pin-de-segurança)
- [Estrutura de arquivos](#estrutura-de-arquivos)
- [Tecnologias](#tecnologias)
- [Personalização](#personalização)

---

## O que o app faz

### Recursos principais

- 🔍 **Busca por código de 5 dígitos** com auto-pesquisa instantânea
- 📝 **Busca por nome ou marca** com autocomplete (ignora acentos e maiúsculas)
- 📚 **Stack de consultas** — abre vários produtos em cards empilhados simultaneamente
- 📦 **Estoque por tamanho** — cada chip mostra tamanho + quantidade disponível
- 🎨 **Status visual do estoque:**
  - Verde: 3+ pares disponíveis
  - Amarelo (com pontinho pulsante): 1-2 pares (último)
  - Cinza tracejado e riscado: 0 (esgotado)
- 🚫 **Badge "ESGOTADO"** grande quando todos os tamanhos estão em 0
- ✈️ **Offline-first** — funciona sem internet após a primeira abertura
- 🔄 **Atualização automática** em segundo plano quando conectado ao Wi-Fi
- 🔐 **PIN de 4 dígitos** para proteger ações sensíveis (salvar URL da planilha)
- 📱 **PWA instalável** — vira ícone na tela inicial do celular, sem passar por loja de apps
- 🎨 **Identidade visual oficial** da marca (paleta champagne `#C8B091`, logo SVG autêntico)

### Telas

- **Tela principal:** logo + campo de busca + stack de cards de produto
- **Modal de configurações** (engrenagem no topo): URL da planilha, atualizar manualmente, total de produtos
- **Modal de PIN:** aparece ao salvar URL da planilha

---

## Como testar localmente

Service workers não funcionam com `file://`, então precisa de um servidor local.

### Opção 1 — Node.js (recomendado)

```bash
npx serve -l 8000
```

Abra: http://localhost:8000

### Opção 2 — Python

```bash
python -m http.server 8000
```

> ⚠️ No Windows, o comando `python` pode ser só um redirect para a Microsoft Store. Se não funcionar, use a Opção 1.

### Opção 3 — VS Code Live Server

1. Instale a extensão **Live Server**
2. Clique com o botão direito em `index.html`
3. Escolha **"Open with Live Server"**

---

## Como hospedar online

Três opções todas gratuitas:

### Vercel (recomendado se já usa)

Via CLI:
```bash
npm i -g vercel
vercel
```

Ou via dashboard: https://vercel.com — importa do GitHub.

### Netlify Drop (mais simples)

1. Acesse https://app.netlify.com/drop
2. Arraste a pasta do projeto
3. URL gerada instantaneamente

### GitHub Pages

1. Suba o código pro GitHub
2. Em **Settings → Pages**, ative a branch principal
3. URL aparece em ~1 minuto

> Todas fornecem HTTPS automático (necessário pro service worker funcionar em produção).

---

## Como as vendedoras instalam no celular

1. Vendedora abre a URL pública no navegador do celular (**Chrome** no Android, **Safari** no iPhone)
2. Toca no menu:
   - Android: `⋮` → **"Adicionar à tela inicial"** ou **"Instalar app"**
   - iPhone: `⬆️` (ícone de compartilhar) → **"Adicionar à Tela Inicial"**
3. Ícone do Sonho dos Pés aparece na tela inicial
4. A partir daí: toca no ícone para abrir em tela cheia, **sem internet**

---

## Como o dono alimenta a tabela de preços

### Configuração inicial (uma vez)

1. O dono cria uma planilha no **Google Sheets** com as colunas exatamente nesta ordem:
   ```
   codigo, modelo, marca, tamanhos, preco
   ```
2. **Arquivo → Compartilhar → Publicar na Web**
3. Em "Formato", escolhe **Valores separados por vírgula (.csv)**
4. Clica em **Publicar** e copia a URL gerada
5. No app (engrenagem → campo "URL da planilha"), cola a URL e toca em **"Salvar URL"**
6. Digita o PIN (padrão: `1357`) e confirma

### Atualização do dia a dia

O dono simplesmente **edita a planilha do Google Sheets**. O Google salva automaticamente e a URL sempre aponta pra versão mais recente.

O app atualiza:
- **Automaticamente:** toda vez que abre com Wi-Fi, baixa a versão nova em segundo plano
- **Manualmente:** engrenagem → **"Atualizar tabela agora"**

---

## Formato da planilha

| codigo | modelo                | marca     | tamanhos                          | preco  |
|--------|-----------------------|-----------|-----------------------------------|--------|
| 12001  | Scarpin Aurora Nude   | Vizzano   | `34:2,35:3,36:4,37:1,38:0,39:1`   | 199.90 |
| 12002  | Sandália Luna Dourada | Beira Rio | `34:0,35:2,36:4,37:3,38:1`        | 149.90 |

### Regras

- **`codigo`:** 5 dígitos (ex: `12345`). Códigos com menos dígitos são preenchidos com zeros à esquerda automaticamente.
- **`modelo`:** nome descritivo do produto.
- **`marca`:** nome do fabricante (Vizzano, Beira Rio, Dakota, etc).
- **`tamanhos`:** formato `tamanho:quantidade` separado por vírgula.
  - Exemplo: `34:2,35:3,36:0` significa tamanho 34 com 2 pares, 35 com 3 pares, 36 esgotado.
  - Se quiser só listar tamanhos sem quantidade (formato legado), também funciona: `34,35,36`.
  - Como o campo contém vírgulas, o Google Sheets envolve automaticamente em aspas ao exportar CSV.
- **`preco`:** ponto ou vírgula como separador decimal (`199.90` ou `199,90`).
- **Primeira linha:** cabeçalhos com esses nomes exatos, em minúsculas.

---

## PIN de segurança

O PIN protege ações sensíveis como salvar uma nova URL da planilha, evitando que vendedoras alterem a configuração acidentalmente.

### PIN padrão

Definido em `app.js` na constante `DEFAULT_PIN`:

```js
const DEFAULT_PIN = '1357';
```

Para alterar: edite essa linha, salve, e faça redeploy.

### Fluxo

- Toque na engrenagem → abre configurações (sem PIN)
- Cole uma URL de planilha → toque em **"Salvar URL"**
- Aparece modal de PIN
- Digite `1357` → URL salva

### PIN personalizado (funcionalidade oculta)

O código suporta PIN personalizado armazenado com hash SHA-256 no `localStorage`. A interface pra definir/alterar/remover está comentada no `index.html` dentro do modal de configurações (seção "Segurança"). Para reativar:

1. Abra `index.html`
2. Remova os comentários `<!-- ... -->` ao redor do bloco `<div class="setting-group security-group">`
3. Recarregue

---

## Estrutura de arquivos

```
SonhoodosPés/
├── index.html          Estrutura da página (marcação HTML)
├── styles.css          Visual (paleta Sonho dos Pés, layouts, animações)
├── app.js              Lógica (busca, stack, IndexedDB, PIN, atualizações)
├── manifest.json       Configuração PWA (instalação no celular)
├── service-worker.js   Cache offline (estratégia network-first)
├── logo.svg            Logo oficial extraído do site da marca
├── produtos.csv        Dados de exemplo (25 sapatos)
├── .gitignore          Arquivos ignorados pelo Git
└── README.md           Este arquivo
```

---

## Tecnologias

- **HTML5 + CSS3 + JavaScript ES6+** puros — zero dependências npm, zero build step
- **IndexedDB** para armazenar produtos no celular (suporta milhares de itens)
- **Service Worker** com estratégia network-first para offline confiável
- **PWA** (Progressive Web App) via `manifest.json`
- **Web Crypto API** (`crypto.subtle`) para hash SHA-256 do PIN
- **Google Fonts** — `Cormorant Garamond` (títulos) + `Inter` (corpo), cacheadas após primeira carga

---

## Personalização

### Cores

Topo do `styles.css`, seção `:root`. Variáveis CSS bem nomeadas:

```css
--color-primary: #C8B091;       /* Bege/champagne da marca */
--color-primary-deep: #A88B65;  /* Dourado mais saturado */
--color-bg: #FAF7F2;            /* Fundo off-white */
--color-text: #2B2118;          /* Texto principal */
```

### Dados de exemplo

Edite `produtos.csv` seguindo o formato descrito acima.

### Adicionar/remover colunas

1. Ajuste `parseCSV` em `app.js` se precisar de campos novos
2. Atualize `renderCard` em `app.js` pra exibir os novos campos
3. Atualize o `<template id="cardTemplate">` em `index.html` com a nova marcação

### Mudar PIN padrão

Em `app.js`, linha com `const DEFAULT_PIN = '1357';`.

---

## Limitações conhecidas

- **Uso comercial no Vercel Hobby:** tecnicamente os termos do Vercel restringem uso comercial ao plano Pro. Para uso comercial irrestrito, **Netlify Starter** ou **GitHub Pages** são alternativas 100% gratuitas sem essa limitação.
- **Primeira carga exige internet:** service worker + IndexedDB precisam baixar uma vez antes de funcionar offline.
- **Atualização da tabela requer Wi-Fi:** offline o app usa a última versão salva no celular.

---

## Licença

Projeto privado / uso interno da loja Sonho dos Pés.
