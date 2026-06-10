# Sonho dos Pés — Stock & Price Query PWA

An internal Progressive Web Application (PWA) designed for store associates of the Brazilian footwear brand **Sonho dos Pés** to instantly search prices, stock levels, sizes, and store locations. 

The application is built to be **offline-first**, allowing seamless operations inside physical stores where cellular reception or Wi-Fi might be unstable.

---

## Table of Contents

- [Core Features](#core-features)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Directory Structure](#directory-structure)
- [Local Development Setup](#local-development-setup)
- [Google Sheets Schema (Database)](#google-sheets-schema-database)
- [Security & PIN Configuration](#security--pin-configuration)
- [Lucky Roulette System (Gamification)](#lucky-roulette-system-gamification)
- [Attendance Queue System](#attendance-queue-system)
- [Multi-Franchise Concept](#multi-franchise-concept)
- [Deployment & Environment Variables](#deployment--environment-variables)
- [Repository Conventions](#repository-conventions)

---

## Core Features

- 🔍 **Dynamic Multi-Term Search:** Autocomplete search ignoring accents and letter casing. Matches product names, SKU codes, collections, categories, or colors.
- 🔢 **5-Digit SKU Matching:** Instant auto-query when typing a 5-digit product code (e.g. `12345`).
- 📚 **Product Cards Stack:** Displays query results in an interactive comparative stack, allowing sales associates to check and compare multiple shoes simultaneously.
- 📦 **Color & Size Stock Grid:** Beautiful grids showing available pairs by shoe size.
  - **Sufficient Stock (Green):** 3+ pairs available.
  - **Low Stock (Yellow with Pulse Dot):** 1-2 pairs (notifies urgency).
  - **Out of Stock (Dashed Grey Strikethrough):** 0 pairs.
- 🚫 **"Sold Out" Overlay:** Big visual badge indicating when a product is completely out of stock across all sizes.
- 📍 **Stock Location Display:** Tells associates exactly where to find the product in the store (e.g. `Corredor 10 · Armário B · Prateleira 2`). Includes a PIN-secured edit interface to update locations directly on the sales floor.
- 📷 **Barcode & Lens Integration:** 
  - QR Code scanner that extracts product IDs from long barcodes (e.g. EAN barcodes).
  - Google Lens search fallback (sharing a photo or submitting to Lens upload portal).
- ✈️ **Offline-First Capabilities:** Works 100% offline using locally cached assets and IndexedDB storage. Syncs automatically in the background when connected to Wi-Fi.
- 🎡 **Lucky Roulette (`/roleta`):** A customer engagement game to draw prizes, with server-side stock-decrementing logic and browser-locked prize coloring.
- 👥 **Attendance Queue (`/atendimento`):** A custom rota control to manage the customer service queue for store sales associates.

---

## Architecture & Tech Stack

```
[Google Sheets] ──(Service Account)──> [Vercel Serverless APIs]
                                               │
                                         (GET /api/produtos)
                                               │
[IndexedDB (Local Storage)] <──────────── [Service Worker] <─── [PWA Frontend]
```

### Frontend (Vanilla PWA)
- **Zero Frontend Frameworks:** Native HTML5, CSS3 CSS Variables, and ES6+ Vanilla JavaScript. Zero bundlers or build steps.
- **IndexedDB (`sonhodospes` v2 database):** Local browser database capable of storing and querying thousands of product entries instantly.
- **Service Worker (`service-worker.js`):** Intercepts network requests using a **Network-First** strategy with a Cache-First fallback for fonts and static files (`sonhodospes-app-v3` cache version).
- **Web Crypto API:** Native browser cryptography (`crypto.subtle`) for hashing the configuration PIN locally in SHA-256.

### Backend (Serverless APIs)
- **Vercel Serverless Functions (`api/` folder):** Node.js functions running on Vercel's edge network.
- **Google Sheets API:** Integrated via `googleapis` library using a Google Service Account JSON key string to read and write master data.

---

## Directory Structure

```
SonhoodosPés/
├── api/                   # Vercel Serverless Node.js backend functions
│   ├── produtos.js        # GET: Pulls Sheets data and parses into CSV
│   ├── locations.js       # PATCH: Updates corridor/closet/shelf location in Sheets
│   ├── verify-pin.js      # POST: Validates security PIN for config changes
│   ├── roleta.js          # GET/POST: Handles roulette prize listing & server-side draw
│   └── atendimento.js     # GET/POST: Manages sales queue lists
│
├── styles.css             # Main application stylesheet (structured in 16 sections)
├── roleta.css             # Lucky Roulette UI stylesheet
├── atendimento.css        # Attendance queue stylesheet
├── app.js                 # Main application logic (IIFE scope, IndexedDB, search stack)
├── roleta.js              # Lucky Roulette logic (animations, color maps)
├── atendimento.js         # Attendance queue rota logic
│
├── index.html             # Main application template
├── roleta.html            # Lucky Roulette template (served at /roleta)
├── atendimento.html       # Attendance queue template (served at /atendimento)
├── painel.html            # Metrics dashboard template (served at /sdp-metricas-9x7k2m)
│
├── manifest.json          # PWA Manifest (app icon, coloring, full-screen behavior)
├── service-worker.js      # Cache precaching roster and offline synchronization rules
│
├── logo.svg               # Authentic brand asset (SVG format)
├── manifest assets        # icon-192.png, icon-512.png, icon.svg
│
├── package.json           # Backend node dependencies (googleapis)
├── vercel.json            # Vercel deployment routes mapping
│
├── [app/], [src/]         # EXPERIMENTAL: Next.js/TypeScript folders
│                          # (Unused in the active production static PWA)
└── README.md              # English documentation
```

> [!NOTE]
> The folders `app/`, `src/` and files `tsconfig.tsbuildinfo`, `next-env.d.ts` are part of an experimental/planned migration to Next.js. The current active production app is served directly from the root-level vanilla files (`index.html`, `app.js`, `styles.css`).

---

## Local Development Setup

To test offline behaviors, service workers require a secure context (HTTPS) or a local loopback server.

### 1. Serving static files locally
Ensure you are in the project root directory. Do not open `index.html` via double-click (`file://` protocol), use one of the following:

**Option A (Node.js - Recommended):**
```bash
npx serve -l 8000
```
Open: `http://localhost:8000`

**Option B (Python):**
```bash
python -m http.server 8000
```

### 2. Testing Serverless APIs locally
To run serverless endpoints inside the `api/` directory locally, you must install the Vercel CLI and load environment variables:

```bash
# Install Node dependencies
npm install

# Install Vercel CLI globally
npm install -g vercel

# Run development server (loads mock environment or pulls live keys from Vercel account)
vercel dev
```

### 3. File validation check
Run the standard syntax integrity checks before pushing code changes:
```bash
node --check app.js
node --check roleta.js
node --check api/roleta.js
```

---

## Google Sheets Schema (Database)

The spreadsheet configured under Vercel's `SPREADSHEET_ID` serves as the primary relational database.

### 1. Products Spreadsheet Tab
The main sheet (usually configured as `SHEET_NAME`) must contain the following columns in the header row:

| Column Header | Description | Format Example |
|---|---|---|
| `codigo` | 5-Digit Unique Identifier | `12001`, `03450` |
| `modelo` | Description/Design Name | `Scarpin Aurora Nude` |
| `marca` | Supplier or Sub-Brand | `Vizzano`, `Dakota` |
| `tamanhos` | Color & stock availability matrix | `Cor: Preto\|34:2,35:5,36:0` |
| `preco_venda` | Retail Price | `199.90` or `199,90` |
| `corredor` | Closet corridor position | `12` |
| `armario` | Closet shelf column | `A` |
| `prateleira` | Closet shelf level | `3` |

### 2. Sizes/Colors Parsing format
The `tamanhos` cell content uses a serialization syntax:
- Format: `Color_Name|Size:Qty,Size:Qty,...`
- Multi-color listing support (comma-separated): `PRETO|34:1,35:2,36:0;NUDE|34:0,35:1,36:1`
- If no colon is present (legacy behavior), sizes are parsed as listed without quantities: `34,35,36` (showing fallback available states).

---

## Security & PIN Configuration

To prevent sales associates or customers from accidentally altering the configuration URL (Spreadsheet CSV location) or changing physical warehouse locations, a security PIN lock is implemented.

- **Default Code:** Defined in `app.js` under the constant:
  ```javascript
  const LOCAL_DEV_PIN = '1357';
  ```
- **Live Check:** The production app submits validation requests to `/api/verify-pin` which validates against the server-side environment variable `SDP_PIN`.
- **Hashed Custom PIN:** The application supports saving a custom hashed PIN. This feature can be activated by uncommenting the block inside `<div class="setting-group security-group">` in `index.html`. Once enabled, it saves a SHA-256 hash representation of the custom PIN inside the browser's `localStorage` (`sdp:pinHash`).

---

## Lucky Roulette System (Gamification)

The Lucky Roulette is located at the `/roleta` route (rewritten from `roleta.html`). 

### Key Rules (Do Not Violate)
1. **Hidden Odds:** The user interface **must never** display remaining quantities, win probabilities, chances, or total tickets.
2. **Dynamic Segments:** The visual slices of the wheel are created dynamically based on currently available prizes. However, slice sizes are purely illustrative; probabilities are not calculated on the client.
3. **Server-Side Draw:** The winning index is computed on the Vercel server (`api/roleta.js`) using a quantity-weighted formula:
   $$\text{probability} = \frac{\text{Quantity of Item}}{\sum \text{All Quantities}}$$
4. **Instant Decrement:** When a prize is successfully drawn, the server instantly decrements the item's quantity by `1` in the Google Sheet tab (`roleta` or `rotina`), preventing race conditions.
5. **Locked Browser Colors:** Colors are dynamically assigned to each unique `VALOR` (Prize Name) and cached in the browser's `localStorage` (`sdp:roletaColorMap:v1`). This guarantees that a prize (e.g. `10%`) retains the same color on consecutive spins within that browser instance.
6. **Compensated Angle Stop:** The wheel's stopping rotation contains a `-90` degree compensation factor matching the CSS conic-gradient rotation. Do not alter this formula in `roleta.js`.

---

## Attendance Queue System

Accessible at `/atendimento` (mapped to `atendimento.html`), this module tracks store attendants.
- Associates can toggle their status (Active vs Inactive) inside a roster list.
- Rota uses a FIFO (First In, First Out) queue sequence to display the "Vendedora da Vez" (current employee to serve next).
- Automatically updates store conversion stats (Active attendants, total queue count).

---

## Multi-Franchise Concept

Designed for scalability, the system plans support for multi-franchise operations (described in `MULTIFRANCHISE.md`):
- A master `franchises.json` listing stores:
  ```json
  [
    { "id": "moema", "nome": "Unidade Moema", "csvUrl": "/api/produtos?f=moema" }
  ]
  ```
- A proxy rewrite mapping `/api/produtos?f=moema` to read dynamic environment variables (e.g., `URL_TABLE_MOEMA`) corresponding to that location's Google Sheet database.
- Roster selection saved inside the browser's `localStorage`.

---

## Deployment & Environment Variables

The project deploys automatically to **Vercel** when commits are pushed to the `main` branch:
- Repository: `FelipeVilelaFreire/SonhodosPes`

### Required Environment Variables on Vercel
```env
SPREADSHEET_ID              # The ID of the Google Sheets document
SHEET_NAME                  # Tab name containing product data (e.g. "Planilha1")
GOOGLE_SERVICE_ACCOUNT_KEY  # Complete stringified JSON credential of the Service Account
APP_TOKEN                   # Authentication token matching header `X-App-Token`
SDP_PIN                     # 4-Digit production security PIN (e.g. "1357")
ROLETA_SHEET_NAME          # (Optional) Specific sheet name for roulette data
```

---

## Repository Conventions

- **No Secret Commits:** Do not commit `.env`, `vercel_key.txt`, or Service Account JSON files.
- **Service Worker Versioning:** When editing static files (`index.html`, `styles.css`, `app.js`, etc.), you **must** update the `CACHE_NAME` constant at the top of `service-worker.js` (e.g. from `sonhodospes-app-v13` to `sonhodospes-app-v14`) so installed PWA clients fetch updated code.
- **Git Hygiene:** Only stage files belonging to the current task. Verify status before committing:
  ```bash
  git status --short --branch
  git diff --cached --stat
  ```
