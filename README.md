# Sonho dos Pés — Consulta de Preços

App de consulta de preços offline para vendedoras da loja Sonho dos Pés.
Funciona 100% no celular sem internet após a primeira abertura.

## Como testar rapidamente (no PC)

Precisa de um servidor local — service workers não funcionam com `file://`.
Escolha uma opção:

**Opção 1 — Python (já vem no Windows/Mac):**
```bash
python -m http.server 8000
```
Abra: http://localhost:8000

**Opção 2 — Node.js:**
```bash
npx serve
```

**Opção 3 — VS Code:** instale a extensão **Live Server**, clique com o botão direito no `index.html` e escolha "Open with Live Server".

## Como colocar no celular das vendedoras

### Passo 1 — Publicar online (grátis, uma vez só)

Escolha uma das opções, todas gratuitas:

- **Netlify Drop** (mais fácil): acesse https://app.netlify.com/drop e arraste a pasta do projeto inteira. Pronto, você recebe uma URL tipo `seu-app.netlify.app`.
- **GitHub Pages**: crie um repositório no GitHub, faça upload dos arquivos, ative Pages nas configurações.
- **Vercel**: similar ao Netlify.

### Passo 2 — Instalar no celular

1. Vendedora abre a URL no navegador do celular (Chrome no Android, Safari no iPhone)
2. Aparece um banner "Adicionar à tela inicial" — ela toca em **Instalar**
3. Ícone aparece na tela inicial igual um app normal
4. **A partir daqui funciona sem internet**

## Como atualizar a tabela de preços

### Configuração inicial (uma vez)

1. O dono cria uma planilha no **Google Sheets** com as colunas exatamente nesta ordem:
   ```
   codigo, modelo, marca, tamanhos, preco
   ```
2. No Google Sheets: **Arquivo → Compartilhar → Publicar na Web**
3. Em "Formato", escolhe **Valores separados por vírgula (.csv)**
4. Clica em **Publicar**. Copia a URL que aparece.
5. Na primeira abertura do app, vendedora toca no ícone de engrenagem (canto superior direito), cola a URL no campo "URL da planilha" e toca em **Salvar URL**

### Atualização do dia a dia

- **Automática:** sempre que a vendedora abre o app com Wi-Fi, ele atualiza a tabela em segundo plano.
- **Manual:** engrenagem → **Atualizar tabela agora**.

Quando o dono edita a planilha e salva, a URL já aponta pra versão nova automaticamente — não precisa fazer mais nada.

## Formato da planilha

| codigo | modelo                | marca    | tamanhos              | preco  |
|--------|-----------------------|----------|-----------------------|--------|
| 12001  | Scarpin Aurora Nude   | Vizzano  | 34,35,36,37,38,39     | 199.90 |
| 12002  | Sandália Luna Dourada | Beira Rio| 34,35,36,37,38        | 149.90 |

**Regras:**
- `codigo`: 5 dígitos (12345). Se começar com zero, tudo bem — o app preenche sozinho.
- `tamanhos`: separados por vírgula. Se tiver vírgula na célula, o Google Sheets coloca aspas automaticamente ao exportar — funciona certinho.
- `preco`: pode usar ponto ou vírgula como separador decimal (199.90 ou 199,90).
- A primeira linha tem que ser os cabeçalhos com esses nomes exatos.

## Estrutura de arquivos

```
SonhoodosPés/
├── index.html          Estrutura da página
├── styles.css          Visual (paleta Sonho dos Pés)
├── app.js              Lógica (busca, IndexedDB, atualização)
├── manifest.json       Configuração PWA (instalação no celular)
├── service-worker.js   Cache offline
├── logo.svg            Logo oficial da marca
├── produtos.csv        Dados de exemplo (25 sapatos)
└── README.md           Este arquivo
```

## Tecnologias

- **HTML + CSS + JavaScript** puro, zero dependências.
- **IndexedDB** para armazenar a tabela no celular.
- **Service Worker** para funcionar offline.
- **PWA** (Progressive Web App) pra instalação no celular.
- **Google Fonts** (Cormorant Garamond + Inter) — cacheadas localmente após primeira carga.

## Personalização

- **Cores:** topo do `styles.css`, seção `:root`. Variáveis CSS bem documentadas.
- **Dados de exemplo:** edite `produtos.csv`.
- **Colunas diferentes:** ajustar `app.js` (função `renderProduct`) e `index.html` (bloco `.product-info`).
"# SonhodosPes" 
