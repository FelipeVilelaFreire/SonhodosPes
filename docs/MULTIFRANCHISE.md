# Visão: Suporte a Múltiplas Franquias

## Conceito

Cada franquia mantém seu próprio Google Sheets (CSV). O app é único — uma URL, um deploy — mas cada vendedora seleciona sua unidade no primeiro acesso e passa a ver apenas o estoque daquela franquia.

## Como funcionaria

### 1. `franchises.json` no repositório
Lista todas as unidades cadastradas:

```json
[
  { "id": "moema",  "nome": "Unidade Moema",  "csvUrl": "/api/produtos?f=moema" },
  { "id": "centro", "nome": "Unidade Centro", "csvUrl": "/api/produtos?f=centro" }
]
```

### 2. Proxy dinâmico
`/api/produtos?f=moema` lê a env var `URL_TABLE_MOEMA` no Vercel e retorna o CSV daquela unidade. Cada franquia tem sua planilha própria, gerenciada de forma independente.

### 3. No app
- Tela de seleção de franquia no primeiro acesso
- Franquia selecionada salva em `localStorage`
- Troca de franquia limpa o IndexedDB e recarrega os dados
- Nome da franquia visível no header

## Tradeoff

**Vantagem:** um único deploy serve todas as unidades.  
**Limitação:** cada nova franquia exige atualização manual do `franchises.json` e criação da env var correspondente no Vercel pelo administrador — não é self-service para os donos das unidades.
