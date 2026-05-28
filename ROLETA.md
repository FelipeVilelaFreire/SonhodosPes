# Roleta da Sorte

Esta documentacao explica a feature `/roleta` para proximos agentes Codex/Claude.

## Arquivos principais

| Arquivo | Funcao |
|---|---|
| `roleta.html` | Tela estatica da roleta |
| `roleta.css` | Visual, animacoes, modal de resultado e responsividade |
| `roleta.js` | Carregamento dos premios, sorteio via API, animacao da roda |
| `api/roleta.js` | API Vercel que le/atualiza a aba da planilha |
| `roleta.csv` | Fallback local para teste quando a API nao estiver disponivel |
| `vercel.json` | Rewrite `/roleta` -> `/roleta.html` |
| `service-worker.js` | Precaching da tela/arquivos da roleta |

## Rota

A URL publica da tela e:

```txt
/roleta
```

No Vercel, isso e servido por `roleta.html` via rewrite em `vercel.json`.

## Planilha

A roleta usa a mesma planilha Google Sheets ja configurada para o app principal.
Nao precisa criar outro `SPREADSHEET_ID`.

A API tenta ler as abas nesta ordem:

1. `ROLETA_SHEET_NAME`, se existir no ambiente
2. `ROULETTE_SHEET_NAME`, se existir no ambiente
3. `roleta`
4. `rotina`

Formato recomendado da aba:

```csv
VALOR,QUANTIDADE
10%,65
20%,15
30%,10
50%,7
sapato,2
bolsa,1
```

`VALOR` e o premio exibido quando sorteado.
`QUANTIDADE` e o estoque/peso restante daquele premio.

A API tambem aceita alguns aliases de coluna:

| Campo | Aliases aceitos |
|---|---|
| Premio | `VALOR`, `item`, `premio`, `produto`, `nome`, `descricao` |
| Quantidade | `QUANTIDADE`, `qtd`, `qty`, `estoque`, `chances` |

## Probabilidade

O sorteio real acontece no servidor, em `api/roleta.js`.

O calculo e ponderado por quantidade:

```txt
chance = quantidade_do_item / soma_de_todas_as_quantidades
```

Depois que um item e sorteado, a API diminui `1` da quantidade diretamente na planilha.

Exemplo:

```txt
10% = 65
20% = 15
total = 80
```

Se sair `10%`, a planilha passa para:

```txt
10% = 64
20% = 15
total = 79
```

Isso evita que cada celular tenha um estoque separado. Todos consomem a mesma planilha central.

## API

Endpoint:

```txt
/api/roleta
```

Metodos:

| Metodo | Uso |
|---|---|
| `GET` | Le a aba da planilha e retorna os itens disponiveis |
| `POST` | Sorteia um premio, decrementa `QUANTIDADE` e retorna o resultado |

Autenticacao:

```txt
X-App-Token: APP_TOKEN
```

Variaveis usadas:

```txt
SPREADSHEET_ID
GOOGLE_SERVICE_ACCOUNT_KEY
APP_TOKEN
ROLETA_SHEET_NAME          # opcional
ROULETTE_SHEET_NAME        # opcional
```

Como o `POST` atualiza a planilha, `api/roleta.js` usa escopo Google Sheets de escrita.

## Comportamento visual

A tela nao mostra:

- odds
- porcentagens de chance
- quantidades
- total de chances
- lista/legenda de premios abaixo da roleta

O usuario ve apenas:

- a roleta
- o botao de girar
- o modal de resultado

## Cores por valor

Cada `VALOR` da planilha recebe uma cor propria.

Exemplo conceitual:

```txt
10%    -> verde
20%    -> dourado
sapato -> vinho
bolsa  -> azul queimado
```

A cor e persistida no navegador em:

```txt
localStorage["sdp:roletaColorMap:v1"]
```

Consequencia:

- No mesmo aparelho/navegador, `10%` continua sempre com a mesma cor.
- Em outro aparelho, a combinacao pode ser diferente, porque o mapa e local.
- Enquanto houver cores disponiveis, valores diferentes tentam usar cores diferentes.

A paleta fica em `roleta.js` na constante `VALUE_COLORS`. Ela foi escolhida para seguir o design system do app:

- champagne
- areia
- dourado queimado
- verde oliva
- azul queimado
- vinho
- terracota
- tons neutros quentes

## Fatias da roleta

A roda visual e decorativa, mas cada fatia pertence a um `VALOR`.

Pontos importantes:

- A UI nao desenha fatias proporcionais a `QUANTIDADE`.
- A probabilidade real continua sendo feita pela API/planilha.
- A roda monta varias fatias misturadas usando os valores ativos.
- Todas as fatias de um mesmo `VALOR` usam a mesma cor.
- Quando a API retorna um premio, a animacao mira uma fatia daquele mesmo `VALOR`.

Detalhe tecnico importante:

O CSS usa:

```css
conic-gradient(from -90deg, ...)
```

Por isso, ao calcular o alvo do giro, `roleta.js` compensa com:

```js
targetAngle = normalizeDegree(segment.mid - 90 + jitter)
```

Nao remova essa compensacao sem revisar visualmente a parada da roleta.

## Modal de resultado

O resultado aparece em um overlay centralizado sobre a roleta.

Caracteristicas:

- texto `Parabens`
- fundo branco/champagne
- backdrop escuro transludico
- blur
- brilho/animacao de festejo
- cor de acento baseada na cor do premio sorteado
- confetes via `.celebration-layer`

Nao existe mais toast de sucesso `Saiu: ...`; o proprio modal e o feedback principal.

## Fallback local

Se a API falhar, `roleta.js` tenta carregar `roleta.csv`.

Esse fallback e util para desenvolvimento local, mas nao deve ser tratado como fonte de verdade em producao.
No fallback local, a reducao de quantidade acontece apenas na memoria do navegador.

## PWA/cache

Sempre que alterar `roleta.html`, `roleta.css`, `roleta.js` ou `roleta.csv`, atualize o `CACHE_NAME` em `service-worker.js`.

Sem isso, celulares com o PWA instalado podem continuar vendo CSS/JS antigo.

## Cuidados para futuros agentes

- Nao mostrar quantidade, chance ou total de chances na UI da roleta.
- Nao transformar a roda visual em grafico proporcional ao estoque; a roleta e uma experiencia de sorteio.
- Nao fazer o sorteio real no cliente quando a API estiver disponivel.
- Nao remover o decremento da planilha apos o sorteio.
- Nao expor `APP_TOKEN`, Service Account ou arquivos como `vercel_key.txt`.
- Se mudar a paleta, manter uma lista grande em `VALUE_COLORS` e preservar a logica de cor fixa por `VALOR`.
- Se mexer na animacao de parada, testar se o ponteiro para na cor/valor sorteado.
