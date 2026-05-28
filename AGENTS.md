# Agent Notes

Este repositorio e um PWA vanilla para consulta de produtos da Sonho dos Pes.

## Antes de editar

- Leia `CLAUDE.md` para a arquitetura geral.
- Leia `ROLETA.md` antes de mexer na feature `/roleta`.
- Nao commite segredos. Em especial, nao inclua `vercel_key.txt`, `.env` ou JSONs de service account.
- Existem arquivos locais nao relacionados que podem aparecer como untracked. Nao inclua automaticamente no commit sem confirmar que fazem parte da tarefa.

## Stack

- Frontend: HTML, CSS e JavaScript vanilla.
- Backend: funcoes serverless em `api/` no Vercel.
- Fonte de dados: Google Sheets.
- PWA/offline: `service-worker.js`.

## Arquivos de interesse

| Area | Arquivos |
|---|---|
| App principal | `index.html`, `styles.css`, `app.js` |
| Roleta | `roleta.html`, `roleta.css`, `roleta.js`, `api/roleta.js`, `ROLETA.md` |
| APIs | `api/produtos.js`, `api/locations.js`, `api/verify-pin.js`, `api/roleta.js` |
| PWA | `manifest.json`, `service-worker.js` |
| Config Vercel | `vercel.json` |

## Roleta

A roleta tem regras especificas documentadas em `ROLETA.md`.

Resumo rapido:

- `/roleta` e a rota da tela.
- O sorteio real acontece em `api/roleta.js`.
- A planilha deve ter uma aba `roleta` ou `rotina` com `VALOR` e `QUANTIDADE`.
- A UI nao deve mostrar odds, quantidades ou total de chances.
- Cada `VALOR` recebe cor fixa por navegador via `localStorage["sdp:roletaColorMap:v1"]`.
- A animacao deve parar em uma fatia do valor retornado pela API.

## Validacao comum

Para JS:

```bash
node --check app.js
node --check roleta.js
node --check api/roleta.js
```

Para testar estatico localmente:

```bash
npx serve -l 8000
```

Para testar APIs serverless localmente, use Vercel CLI:

```bash
vercel dev
```

## Commits

- Inclua apenas arquivos da tarefa atual.
- Nao use `git add .` quando houver arquivos untracked nao relacionados.
- Antes de commitar, confira:

```bash
git status --short --branch
git diff --cached --stat
```
