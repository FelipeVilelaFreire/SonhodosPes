# Design System — Guia de Implementação (Prognum)

Este documento descreve exatamente como o design system foi construído no projeto Sonho dos Pés e como adaptá-lo para a paleta Prognum (azul corporativo + laranja). Siga este guia para reproduzir o mesmo estilo: leve, limpo, moderno — sem tons escuros dominantes.

---

## 1. Filosofia do Design

O sistema é baseado em três princípios:

1. **Surface-first**: o fundo da página é levemente colorido (`--color-bg`), e os cards/painéis são brancos (`--color-surface`). Isso cria hierarquia visual sem usar sombras pesadas.
2. **Primary como sotaque, não como bloco**: a cor primária aparece em borders, ícones e highlights — nunca como fundo de áreas grandes.
3. **Tipografia com dois níveis**: fonte serifada para títulos/headings (sensação premium), sans-serif para corpo e UI.

---

## 2. Tokens de Cor

### 2.1 Sonho dos Pés → Prognum (mapeamento)

| Token | Sonho dos Pés (marrom/ouro) | Prognum (azul/laranja) |
|---|---|---|
| `--color-primary` | `#C8B091` (dourado médio) | `#5B8DD6` (azul médio) |
| `--color-primary-deep` | `#A88B65` (dourado escuro) | `#0054A6` (azul marca) |
| `--color-primary-soft` | `#E8DFD1` (dourado claro) | `#C8DEFF` (azul claro) |
| `--color-primary-whisper` | `#F2EBDF` (creme) | `#EEF4FF` (azul quase branco) |
| `--color-bg` | `#FAF7F2` (creme) | `#F4F7FB` (cinza-azulado muito claro) |
| `--color-surface` | `#FFFFFF` | `#FFFFFF` |
| `--color-surface-warm` | `#FDFAF5` (creme levíssimo) | `#F8FAFD` (azul levíssimo) |
| `--color-text` | `#2B2118` (marrom escuro) | `#0D1B2A` (quase preto azulado) |
| `--color-text-soft` | `#7A6B5C` | `#4A6080` (azul-cinza) |
| `--color-text-muted` | `#B5A794` | `#8CA0B8` (azul-cinza claro) |

**Acento laranja** (Prognum específico — para CTAs primários e destaques):

```css
--color-accent: #F39200;
--color-accent-deep: #D97F00;
--color-accent-soft: #FFE8B8;
--color-accent-whisper: #FFF6E5;
```

Use `--color-accent` nos botões primários de ação (ex: "Salvar", "Confirmar"), e `--color-primary-deep` para navegação ativa, links e ícones de destaque.

### 2.2 globals.css completo para Prognum

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  /* Cor primária (azul marca) */
  --color-primary: #5B8DD6;
  --color-primary-deep: #0054A6;
  --color-primary-soft: #C8DEFF;
  --color-primary-whisper: #EEF4FF;

  /* Acento laranja */
  --color-accent: #F39200;
  --color-accent-deep: #D97F00;
  --color-accent-soft: #FFE8B8;
  --color-accent-whisper: #FFF6E5;

  /* Superfícies */
  --color-bg: #F4F7FB;
  --color-surface: #FFFFFF;
  --color-surface-warm: #F8FAFD;

  /* Texto */
  --color-text: #0D1B2A;
  --color-text-soft: #4A6080;
  --color-text-muted: #8CA0B8;

  /* Feedback */
  --color-success: #1A8C4E;
  --color-success-soft: #D4F0E2;
  --color-warning: #F39200;
  --color-warning-soft: #FFE8B8;
  --color-danger: #C9303A;
  --color-danger-soft: #FDDFE0;

  /* Tipografia */
  --font-display: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'SF Mono', 'Monaco', 'Menlo', monospace;

  /* Escala tipográfica */
  --font-size-xs: 11px;
  --font-size-sm: 13px;
  --font-size-base: 15px;
  --font-size-md: 17px;
  --font-size-lg: 20px;
  --font-size-xl: 24px;
  --font-size-2xl: 28px;
  --font-size-3xl: 34px;
  --font-size-4xl: 44px;

  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Espaçamento (escala consistente, sempre múltiplos) */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 20px;
  --spacing-2xl: 24px;
  --spacing-3xl: 32px;
  --spacing-4xl: 48px;
  --spacing-5xl: 64px;

  /* Border radius */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-xl: 28px;
  --radius-full: 9999px;

  /* Sombras — sempre com a cor do texto base, nunca preto puro */
  --shadow-sm: 0 1px 2px rgba(13, 27, 42, 0.04);
  --shadow-md: 0 4px 12px rgba(13, 27, 42, 0.06), 0 1px 3px rgba(13, 27, 42, 0.04);
  --shadow-lg: 0 12px 32px rgba(13, 27, 42, 0.08), 0 4px 12px rgba(13, 27, 42, 0.05);
  --shadow-xl: 0 24px 48px rgba(13, 27, 42, 0.12), 0 8px 16px rgba(13, 27, 42, 0.06);

  /* Animação */
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 400ms;

  /* Z-index */
  --z-header: 50;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal: 300;
  --z-toast: 400;
}
```

---

## 3. Gradiente de Fundo (body::before)

O background não é cor sólida — tem um gradiente radial sutil que dá profundidade sem pesar. É feito no `body::before` com `position: fixed; inset: 0; pointer-events: none` para não interferir em nada.

### Sonho dos Pés (original):
```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at top, rgba(200, 176, 145, 0.08), transparent 60%),
    radial-gradient(ellipse at bottom, rgba(168, 139, 101, 0.04), transparent 50%);
  pointer-events: none;
  z-index: 0;
}
```

**Regra**: dois elipses radiais — um no `top`, outro no `bottom`. Opacidade muito baixa (4–8%). A cor é a `--color-primary` com alpha baixo.

### Prognum (adaptado):
```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at top left, rgba(0, 84, 166, 0.07), transparent 55%),
    radial-gradient(ellipse at bottom right, rgba(243, 146, 0, 0.04), transparent 50%);
  pointer-events: none;
  z-index: 0;
}
```

O segundo elipse usa o laranja para criar um sutil aquecimento no canto inferior direito — reforça a identidade visual sem aparecer explicitamente.

---

## 4. Layout Geral (AppShell)

O layout é um flex row: **Sidebar** (fixed no mobile, sticky no desktop) + **Main** (flex-col com Topbar + content).

```
┌─────────────────────────────────────┐
│ Sidebar (260px) │ Main              │
│                 │ ┌──────────────┐  │
│  Logo           │ │ Topbar       │  │
│  User info      │ └──────────────┘  │
│  Nav items      │ ┌──────────────┐  │
│                 │ │ content      │  │
│  Footer         │ │ (flex: 1)    │  │
└─────────────────┴─┴──────────────┘  │
```

```css
/* AppShell.module.css */
.shell {
  display: flex;
  min-height: 100vh;
  min-height: 100dvh; /* mobile viewport correto */
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; /* evita overflow em flex items */
  background: var(--color-bg);
}

.content {
  flex: 1;
  width: 100%;
  padding-inline: var(--spacing-3xl);       /* 32px laterais */
  padding-block-start: var(--spacing-3xl);  /* 32px topo */
  padding-block-end: var(--spacing-2xl);    /* 24px base */
}
```

**Importante**: use `padding-inline` e `padding-block-start/end` (propriedades lógicas) em vez de `padding: top right bottom left`. Screens que precisam de padding próprio (como Configurações) usam apenas `padding-block` para não dobrar o horizontal do AppShell.

---

## 5. Sidebar

### Estrutura
- `position: fixed` no mobile com `transform: translateX(-100%)` → abre com `translateX(0)` + classe `.open`
- `position: sticky; top: 0; height: 100dvh` no desktop (≥ 1024px)
- Backdrop com `backdrop-filter: blur(4px)` cobre o conteúdo quando aberta no mobile
- Largura: 260px desktop, 280px mobile

### Seções internas (ordem top→bottom):

```
.header      → logo + tagline/slogan da empresa
.userBox     → avatar + nome + papel do usuário
.nav         → links de navegação (flex-col, gap: 2px)
.footer      → status online/offline + versão + logout
```

### Nav link
```css
.navLink {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);        /* 12px entre ícone e label */
  padding: var(--spacing-md) var(--spacing-lg); /* 12px top/bottom, 16px laterais */
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-soft);
  transition: all var(--duration-fast) var(--ease);
}

.navLink:hover {
  background: var(--color-primary-whisper);
  color: var(--color-text);
}

.navLink.active {
  background: var(--color-primary-whisper);
  color: var(--color-primary-deep);
  font-weight: var(--font-weight-semibold);
}

/* Barra vertical no item ativo */
.navLink.active::before {
  content: '';
  position: absolute;
  left: 0;
  width: 3px;
  height: 20px;
  background: var(--color-primary-deep);
  border-radius: 0 2px 2px 0;
}
```

O `navLink` precisa de `position: relative` no pai para o `::before` funcionar.

### Header da Sidebar — Logo + nome

```tsx
/* Sidebar.tsx */
<div className={styles.header}>
  <img src="/logo.svg" alt="Prognum" className={styles.logoImg} />
  {/* ou só texto: */}
  <span className={styles.brandName}>Prognum</span>
  <span className={styles.tagline}>Sistema de gestão</span>
</div>
```

```css
.logoImg {
  height: 28px;
  width: auto;
}

.brandName {
  font-size: 18px;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary-deep);
  letter-spacing: -0.02em;
}

.tagline {
  font-size: 11px;
  font-weight: var(--font-weight-regular);
  color: var(--color-text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-top: 2px;
  display: block;
}
```

### User Box

```css
.userBox {
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--color-primary-whisper);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.userName {
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.userRole {
  font-size: 11px;
  color: var(--color-text-soft);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 2px;
}
```

---

## 6. Topbar (Header da página)

O topbar é sticky (`top: 0`) e usa `backdrop-filter: blur(16px)` com background semi-transparente — isso cria o efeito "frosted glass" quando o conteúdo rola por baixo.

```css
.topbar {
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  /* Semi-transparente + blur para frosted glass */
  background: rgba(244, 247, 251, 0.92); /* --color-bg com 92% opacidade */
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--color-primary-whisper);
  padding: var(--spacing-md) var(--spacing-xl);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  min-height: 56px;
}

/* Desktop: mais espaço lateral */
@media (min-width: 1024px) {
  .topbar {
    padding: var(--spacing-lg) var(--spacing-3xl); /* 16px / 32px */
  }
  .menuBtn {
    display: none; /* esconde hamburguer no desktop */
  }
}

.title {
  font-family: var(--font-display);
  font-size: var(--font-size-xl); /* 24px mobile */
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  flex: 1;
  letter-spacing: -0.01em;
}

@media (min-width: 1024px) {
  .title {
    font-size: var(--font-size-2xl); /* 28px desktop */
  }
}
```

O `background: rgba(...)` do topbar usa a mesma cor que `--color-bg` mas com 92% de opacidade — assim o blur funciona e a transição entre opaco/transparente é suave.

---

## 7. Dashboard — Cards de Estatística

```css
/* Grid responsivo */
.statsGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 2 colunas mobile */
  gap: var(--spacing-md);
}

@media (min-width: 768px) {
  .statsGrid {
    grid-template-columns: repeat(4, 1fr); /* 4 colunas tablet+ */
    gap: var(--spacing-lg);
  }
}

/* Card base */
.section {
  background: var(--color-surface);
  border-radius: var(--radius-lg);           /* 20px */
  border: 1px solid var(--color-primary-whisper);
  padding: var(--spacing-xl);               /* 20px */
  box-shadow: var(--shadow-sm);
}
```

### Hero Card (card de destaque com gradiente)

```css
.heroCard {
  background: linear-gradient(
    135deg,
    var(--color-primary-whisper),   /* EEF4FF */
    var(--color-surface-warm)       /* F8FAFD */
  );
  border: 1px solid var(--color-primary-soft);
  border-radius: var(--radius-lg);
  padding: var(--spacing-3xl) var(--spacing-xl);
  text-align: center;
  box-shadow: var(--shadow-md);
}
```

**Regra do gradiente linear no hero card**: sempre `135deg` (diagonal), de `--color-primary-whisper` para `--color-surface-warm`. Nunca use a cor primária plena — use apenas os tokens "whisper" e "warm" para manter o visual leve.

### Botão do Hero Card

```css
.heroBtn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-2xl);  /* 12px / 24px */
  background: var(--color-accent);                /* laranja Prognum */
  color: #FFFFFF;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.04em;
  transition: all var(--duration-base) var(--ease);
  box-shadow: 0 2px 8px rgba(243, 146, 0, 0.30);
}

.heroBtn:hover {
  background: var(--color-accent-deep);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(243, 146, 0, 0.40);
}
```

---

## 8. Buttons — Sistema de Variantes

```css
/* Base */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);  /* 8px / 16px */
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease);
  border: 1px solid transparent;
}

/* Primary — usa acento laranja para CTAs */
.btnPrimary {
  background: var(--color-accent);
  color: #FFFFFF;
  border-color: var(--color-accent);
  box-shadow: 0 1px 4px rgba(243, 146, 0, 0.20);
}
.btnPrimary:hover {
  background: var(--color-accent-deep);
  border-color: var(--color-accent-deep);
  box-shadow: 0 2px 8px rgba(243, 146, 0, 0.30);
}

/* Secondary — usa cor primária azul */
.btnSecondary {
  background: var(--color-primary-whisper);
  color: var(--color-primary-deep);
  border-color: var(--color-primary-soft);
}
.btnSecondary:hover {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
}

/* Ghost */
.btnGhost {
  background: transparent;
  color: var(--color-text-soft);
  border-color: transparent;
}
.btnGhost:hover {
  background: var(--color-primary-whisper);
  color: var(--color-text);
}
```

---

## 9. Inputs e Selects

```css
.input {
  width: 100%;
  height: 42px;
  padding: 0 var(--spacing-md);
  background: var(--color-surface);
  border: 1px solid var(--color-primary-soft);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-family: var(--font-body);
  color: var(--color-text);
  transition: border-color var(--duration-fast) var(--ease),
              box-shadow var(--duration-fast) var(--ease);
}

.input:hover { border-color: var(--color-primary); }

.input:focus {
  outline: none;
  border-color: var(--color-primary-deep);
  box-shadow: 0 0 0 3px rgba(0, 84, 166, 0.12); /* azul com 12% opacidade */
}
```

**Focus ring**: `box-shadow: 0 0 0 3px rgba(COR_PRIMARY_DEEP, 0.12)`. Nunca `outline`. Para Prognum o azul é `rgba(0, 84, 166, 0.12)`.

### Select com chevron customizado

```css
.select {
  appearance: none;
  -webkit-appearance: none;
  padding: 0 36px 0 var(--spacing-md);
  height: 42px;
  background: var(--color-surface)
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%230054A6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")
    no-repeat right 10px center;
  border: 1px solid var(--color-primary-soft);
  border-radius: var(--radius-md);
}
```

A cor do SVG no `url()` precisa estar em hex **sem o `#`** e com os caracteres especiais escapados (`%23` = `#`). Para Prognum use `stroke='%230054A6'` (o azul da marca).

---

## 10. Tabela Estilo Excel

```css
.tableScroll {
  background: var(--color-surface);
  border: 1px solid var(--color-primary-whisper);
  border-radius: var(--radius-md);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.table thead {
  background: var(--color-primary-whisper); /* fundo levíssimo no header */
}

.table th {
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-soft);
  padding: var(--spacing-md) var(--spacing-sm);
  white-space: nowrap;
}

.table tbody tr:hover {
  background: var(--color-surface-warm);
}

.table td {
  padding: var(--spacing-sm);
  vertical-align: middle;
  border-bottom: 1px solid var(--color-primary-whisper);
}

/* Coluna sticky (esquerda) */
.stickyCol {
  position: sticky;
  left: 0;
  background: var(--color-surface);
  z-index: 1;
}
.table tbody tr:hover .stickyCol {
  background: var(--color-surface-warm); /* mantém consistente no hover */
}
```

---

## 11. Modais

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(13, 27, 42, 0.5);  /* --color-text com 50% */
  backdrop-filter: blur(8px);
  z-index: var(--z-modal);
  display: flex;
  align-items: flex-end;   /* mobile: bottom sheet */
  justify-content: center;
  padding: var(--spacing-lg);
}

@media (min-width: 640px) {
  .overlay {
    align-items: center;   /* desktop: centro */
  }
}

.modal {
  background: var(--color-surface);
  border-radius: var(--radius-xl);    /* 28px — bem arredondado */
  width: 100%;
  max-width: 480px;
  box-shadow: var(--shadow-xl);
  padding: var(--spacing-2xl);
  animation: slideUp var(--duration-base) var(--ease-out);
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
```

---

## 12. Toasts / Notificações

Posicionamento: `position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%)`. Centralizado na tela.

```css
.toast {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-full);   /* pílula */
  font-size: 13px;
  font-weight: var(--font-weight-medium);
  box-shadow: var(--shadow-lg);
  animation: fadeIn var(--duration-fast) var(--ease);
}

.toastSuccess {
  background: var(--color-text);       /* fundo escuro */
  color: var(--color-surface);
}

.toastError {
  background: var(--color-danger);
  color: #FFFFFF;
}
```

---

## 13. Escala de Espaçamento — Quando Usar Cada Token

| Token | Valor | Uso típico |
|---|---|---|
| `--spacing-xs` | 4px | Gap entre ícone e badge, margem mínima |
| `--spacing-sm` | 8px | Gap interno de botões, entre items em lista densa |
| `--spacing-md` | 12px | Padding de inputs, gap padrão entre elementos |
| `--spacing-lg` | 16px | Padding de nav links, gap entre cards menores |
| `--spacing-xl` | 20px | Padding de cards, seções do sidebar |
| `--spacing-2xl` | 24px | Padding de modal, gap entre seções |
| `--spacing-3xl` | 32px | Padding lateral do content, gaps grandes |
| `--spacing-4xl` | 48px | Empty states, seções de destaque |
| `--spacing-5xl` | 64px | Hero sections |

---

## 14. Border Radius — Quando Usar

| Token | Valor | Uso típico |
|---|---|---|
| `--radius-xs` | 4px | Badges de código (`<code>`), tags pequenas |
| `--radius-sm` | 6px | Inputs inline de tabela, chips pequenos |
| `--radius-md` | 12px | Inputs, selects, botões, nav links |
| `--radius-lg` | 20px | Cards, painéis, dropdowns |
| `--radius-xl` | 28px | Modais |
| `--radius-full` | 9999px | Toasts, avatares, botões pílula |

---

## 15. Sombras — Hierarquia

As sombras usam `rgba(--color-text, alpha)` — nunca `rgba(0,0,0,...)`. Isso mantém a sombra "aquecida" (ou no caso Prognum, levemente azulada).

| Token | Uso |
|---|---|
| `--shadow-sm` | Cards em repouso, borders sutis |
| `--shadow-md` | Cards com hover, hero cards |
| `--shadow-lg` | Dropdowns, popovers |
| `--shadow-xl` | Modais, sidebar mobile aberta |

---

## 16. Animações

```css
--ease: cubic-bezier(0.22, 1, 0.36, 1);      /* spring suave — padrão */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);   /* slide out rápido */
--duration-fast: 150ms;   /* hover states, micro-interações */
--duration-base: 250ms;   /* transições de componente (modal, sidebar) */
--duration-slow: 400ms;   /* animações de entrada de página */
```

Regra: use sempre `var(--ease)` com `var(--duration-fast)` para hovers. `var(--ease-out)` com `var(--duration-base)` para elementos que entram/saem da tela.

---

## 17. Checklist de Implementação

- [ ] Copiar os tokens de cor Prognum para `globals.css`
- [ ] Substituir `body::before` pelo gradiente azul + laranja
- [ ] Importar fontes (`Inter` + `Plus Jakarta Sans`) no `globals.css`
- [ ] Criar `AppShell` com flex row + sidebar sticky desktop / fixed mobile
- [ ] `Topbar` com `backdrop-filter: blur(16px)` e `background: rgba(--color-bg, 0.92)`
- [ ] Nav links com `::before` para a barra vertical no item ativo
- [ ] Focus ring de inputs: `box-shadow: 0 0 0 3px rgba(0, 84, 166, 0.12)`
- [ ] Select com chevron SVG embutido (cor `%230054A6`)
- [ ] Hero card com `linear-gradient(135deg, --whisper, --surface-warm)`
- [ ] Botão CTA primário com `--color-accent` (laranja)
- [ ] Toasts centralizados com `position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%)`
