(() => {
    'use strict';

    const DB_NAME = 'sonhodospes';
    const DB_VERSION = 2;
    const STORE_PRODUTOS = 'produtos';
    const STORE_META = 'meta';
    const LOCAL_CSV_PATH = 'data/produtos.csv';
    const STORAGE_KEY_URL = 'sdp:csvUrl';
    const STORAGE_KEY_PIN = 'sdp:pinHash';
    const MAX_AUTOCOMPLETE = 6;

    const LOCAL_DEV_PIN = '1357';
    const PIN_VERIFY_ENDPOINT = '/api/verify-pin';
    const CONFIG_URL = '/config.json';
    const APP_TOKEN = 'sdp-4K9mX2rP7nQ1wL5j';

    const el = {
        statusIndicator: document.getElementById('statusIndicator'),
        statusText: document.getElementById('statusText'),
        settingsBtn: document.getElementById('settingsBtn'),

        consultaInput: document.getElementById('consultaInput'),
        clearBtn: document.getElementById('clearBtn'),
        scanBtn: document.getElementById('scanBtn'),
        autocomplete: document.getElementById('autocomplete'),

        stack: document.getElementById('stack'),
        stackHeader: document.getElementById('stackHeader'),
        stackCount: document.getElementById('stackCount'),
        btnClearAll: document.getElementById('btnClearAll'),

        introState: document.getElementById('introState'),
        emptySearch: document.getElementById('emptySearch'),
        emptyQuery: document.getElementById('emptyQuery'),
        btnClearSearch: document.getElementById('btnClearSearch'),

        lastSync: document.getElementById('lastSync'),
        settingsModal: document.getElementById('settingsModal'),
        modalBackdrop: document.getElementById('modalBackdrop'),
        modalClose: document.getElementById('modalClose'),
        btnUpdate: document.getElementById('btnUpdate'),
        btnClear: document.getElementById('btnClear'),
        btnSaveUrl: document.getElementById('btnSaveUrl'),
        csvUrl: document.getElementById('csvUrl'),
        tableInfo: document.getElementById('tableInfo'),
        totalProdutos: document.getElementById('totalProdutos'),
        toast: document.getElementById('toast'),

        cardTemplate: document.getElementById('cardTemplate'),

        securityGroup: document.getElementById('securityGroup'),
        pinStatus: document.getElementById('pinStatus'),
        btnSetPin: document.getElementById('btnSetPin'),
        btnChangePin: document.getElementById('btnChangePin'),
        btnRemovePin: document.getElementById('btnRemovePin'),

        pinModal: document.getElementById('pinModal'),
        pinBackdrop: document.getElementById('pinBackdrop'),
        pinClose: document.getElementById('pinClose'),
        pinTitle: document.getElementById('pinTitle'),
        pinSubtitle: document.getElementById('pinSubtitle'),
        pinDots: document.getElementById('pinDots'),
        pinInput: document.getElementById('pinInput'),
        pinError: document.getElementById('pinError'),

        qrModal: document.getElementById('qrModal'),
        qrBackdrop: document.getElementById('qrBackdrop'),
        qrClose: document.getElementById('qrClose'),

        installBtn:     document.getElementById('installBtn'),
        lensBtn:        document.getElementById('lensBtn'),
        lensModal:      document.getElementById('lensModal'),
        lensBackdrop:   document.getElementById('lensBackdrop'),
        lensClose:      document.getElementById('lensClose'),
        lensVideo:      document.getElementById('lensVideo'),
        lensCanvas:     document.getElementById('lensCanvas'),
        lensCaptureBtn: document.getElementById('lensCaptureBtn'),

        filterBtn:      document.getElementById('filterBtn'),
        filterBadge:    document.getElementById('filterBadge'),
        filterModal:    document.getElementById('filterModal'),
        filterBackdrop: document.getElementById('filterBackdrop'),
        filterClose:    document.getElementById('filterClose'),
        filterBody:     document.getElementById('filterBody'),
        filterClear:    document.getElementById('filterClear'),
        filterApply:    document.getElementById('filterApply'),
        filterBrowse:   document.getElementById('filterBrowse'),

        sortBtn:        document.getElementById('sortBtn'),
        sortModal:      document.getElementById('sortModal'),
        sortBackdrop:   document.getElementById('sortBackdrop'),
        sortClose:      document.getElementById('sortClose'),
        sortOptions:    document.getElementById('sortOptions'),
    };

    let produtos = [];
    let produtosByCode = new Map();
    let stack = [];
    let activeFilters = { priceMin: null, priceMax: null, cores: [], categorias: [], colecoes: [] };
    let activeSort = 'default';

    const db = {
        _db: null,
        async open() {
            if (this._db) return this._db;
            return new Promise((resolve, reject) => {
                const req = indexedDB.open(DB_NAME, DB_VERSION);
                req.onerror = () => reject(req.error);
                req.onsuccess = () => { 
                    this._db = req.result; 
                    
                    // Permite que outras abas atualizem o banco sem travar
                    this._db.onversionchange = () => {
                        this._db.close();
                        this._db = null;
                        // Pode recarregar a página se quiser forçar a atualização: window.location.reload();
                    };
                    
                    resolve(this._db); 
                };
                req.onupgradeneeded = (e) => {
                    const database = e.target.result;
                    if (!database.objectStoreNames.contains(STORE_PRODUTOS)) {
                        database.createObjectStore(STORE_PRODUTOS, { keyPath: 'codigo' });
                    }
                    if (!database.objectStoreNames.contains(STORE_META)) {
                        database.createObjectStore(STORE_META, { keyPath: 'key' });
                    }
                };
            });
        },
        async _tx(storeName, mode = 'readonly') {
            const database = await this.open();
            return database.transaction(storeName, mode).objectStore(storeName);
        },
        async getAll(storeName) {
            const store = await this._tx(storeName);
            return new Promise((resolve, reject) => {
                const req = store.getAll();
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
        },
        async getMeta(key) {
            const store = await this._tx(STORE_META);
            return new Promise((resolve, reject) => {
                const req = store.get(key);
                req.onsuccess = () => resolve(req.result ? req.result.value : null);
                req.onerror = () => reject(req.error);
            });
        },
        async setMeta(key, value) {
            const store = await this._tx(STORE_META, 'readwrite');
            return new Promise((resolve, reject) => {
                const req = store.put({ key, value });
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });
        },
        async replaceProdutos(list) {
            const database = await this.open();
            return new Promise((resolve, reject) => {
                const tx = database.transaction(STORE_PRODUTOS, 'readwrite');
                const store = tx.objectStore(STORE_PRODUTOS);
                store.clear();
                for (const p of list) store.put(p);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        },
        async clearAll() {
            const database = await this.open();
            return new Promise((resolve, reject) => {
                const tx = database.transaction([STORE_PRODUTOS, STORE_META], 'readwrite');
                tx.objectStore(STORE_PRODUTOS).clear();
                tx.objectStore(STORE_META).clear();
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        },
    };

    function parseCSV(text) {
        const lines = text.trim().split(/\r?\n/);
        if (lines.length < 2) {
            return [];
        }

        let delimiter = ',';
        const commas = (lines[0].match(/,/g) || []).length;
        const semicolons = (lines[0].match(/;/g) || []).length;
        const tabs = (lines[0].match(/\t/g) || []).length;
        if (tabs > commas && tabs > semicolons) delimiter = '\t';
        else if (semicolons > commas) delimiter = ';';

        let rawHeaders = parseCSVLine(lines[0], delimiter).map(h => h.trim());
        let startIdx = 1;

        if (/^\d+$/.test(rawHeaders[0]) && !rawHeaders.some(h => String(h).toLowerCase() === 'produto')) {
            const defaultHeaderStr = "PRODUTO,COR_PRODUTO,Coleção,QTDE_CONTAGEM,CONTAGEM,DIFERENCA_TOTAL,U,34,35,36,37,38,39,40,P,M,G,GG,Q13,Q14,Q15,Q16,Q17,Q18,Q19,Q20,Q21,Q22,Q23,Q24,Q25,Q26,Q27,Q28,Q29,Q30,Q31,Q32,Q33,Q34,Q35,Q36,Q37,Q38,Q39,Q40,Q41,Q42,Q43,Q44,Q45,Q46,Q47,Q48,S1,S2,S3,S4,S5,S6,S7,S8,S9,S10,S11,S12,S13,S14,S15,S16,S17,S18,S19,S20,S21,S22,S23,S24,S25,S26,S27,S28,S29,S30,S31,S32,S33,S34,S35,S36,S37,S38,S39,S40,S41,S42,S43,S44,S45,S46,S47,S48,DESC_PRODUTO,GRUPO_PRODUTO,SUBGRUPO_PRODUTO,GRADE,UNIDADE,PESO,REVENDA,DESC_COR_PRODUTO,COR_SORTIDA,COR_FABRICANTE,REFER_FABRICANTE,D1,D2,D3,D4,D5,D6,D7,D8,D9,D10,D11,D12,D13,D14,D15,D16,D17,D18,D19,D20,D21,D22,D23,D24,D25,D26,D27,D28,D29,D30,D31,D32,D33,D34,D35,D36,D37,D38,D39,D40,D41,D42,D43,D44,D45,D46,D47,D48,PONTEIRO_PRECO_TAM,VARIA_PRECO_COR,VARIA_PRECO_TAM,CUSTO_REPOSICAO1,CUSTO_REPOSICAO2,CUSTO_REPOSICAO3,CUSTO_REPOSICAO4,CUSTO_MEDIO1,CUSTO_MEDIO2,CUSTO_MEDIO3,CUSTO_MEDIO4,CUSTO4_A_VALORIZAR,CUSTO3_A_VALORIZAR,CUSTO2_A_VALORIZAR,CUSTO1_A_VALORIZAR,VALOR_CONTAGEM_DIFERENCA,ESTOQUE_CONTAGEM,ES1,ES2,ES3,ES4,ES5,ES6,ES7,ES8,ES9,ES10,ES11,ES12,ES13,ES14,ES15,ES16,ES17,ES18,ES19,ES20,ES21,ES22,ES23,ES24,ES25,ES26,ES27,ES28,ES29,ES30,ES31,ES32,ES33,ES34,ES35,ES36,ES37,ES38,ES39,ES40,ES41,ES42,ES43,ES44,ES45,ES46,ES47,ES48,DIFERENCA,PRECO_VENDA";
            rawHeaders = defaultHeaderStr.split(',');
            startIdx = 0;
        }

        const headers = rawHeaders.map(h => h.toLowerCase());

        const sizeColumnIndices = [];
        rawHeaders.forEach((h, idx) => {
            const trimmed = h.trim();
            if (/^(\d{2,3}|P|M|G|GG|XG|U|UN|PP|QTD)$/i.test(trimmed)) {
                sizeColumnIndices.push({ label: trimmed.toUpperCase(), idx });
            }
        });

        function col(row, ...names) {
            for (const name of names) {
                const idx = headers.indexOf(name.toLowerCase());
                if (idx !== -1 && row[idx]) return row[idx].trim();
            }
            return '';
        }

        const byCode = new Map();
        for (let i = startIdx; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = parseCSVLine(line, delimiter);
            if (values.length < 2) continue;

            const produtoCodRaw = col(values, 'produto', 'codigo', 'cod', 'sku');
            if (!produtoCodRaw) continue;

            const codigo = String(produtoCodRaw).padStart(5, '0');
            const corNome = col(values, 'desc_cor_produto', 'cor', 'desc_cor') || 'ÚNICA';

            const tamanhos = {};
            sizeColumnIndices.forEach(({ label, idx }) => {
                const qty = parseInt(values[idx], 10);
                tamanhos[label] = Number.isFinite(qty) ? qty : 0;
            });

            if (!byCode.has(codigo)) {
                byCode.set(codigo, {
                    codigo,
                    modelo: col(values, 'desc_produto', 'modelo', 'nome', 'descricao'),
                    colecao: col(values, 'coleção', 'colecao', 'collection', 'coleção'),
                    categoria: col(values, 'subgrupo_produto', 'subgrupo', 'categoria'),
                    grupo: col(values, 'grupo_produto', 'grupo'),
                    fabricante: col(values, 'fabricante'),
                    unidade: col(values, 'unidade'),
                    referencia: col(values, 'refer_fabricante', 'referencia', 'ref'),
                    corredor:   col(values, 'corredor'),
                    armario:    col(values, 'armario', 'armário'),
                    prateleira: col(values, 'prateleira'),
                    localizacao: (() => {
                        const c = col(values, 'corredor');
                        const a = col(values, 'armario', 'armário');
                        const p = col(values, 'prateleira');
                        const parts = [];
                        if (c) parts.push('Corredor ' + c);
                        if (a) parts.push('Armário ' + a);
                        if (p) parts.push('Prateleira ' + p);
                        return parts.length ? parts.join(' · ') : col(values, 'localizacao', 'local', 'endereco');
                    })(),
                    preco: parseFloat(String(col(values, 'preco_venda', 'preco', 'preço', 'valor') || '0').replace(',', '.')) || 0,
                    cores: [],
                    _search: '',
                });
            }

            const produto = byCode.get(codigo);
            produto.cores.push({ nome: corNome, tamanhos });
        }

        const list = Array.from(byCode.values());
        list.forEach(p => {
            p._search = buildSearchString(p);
        });

        return list;
    }

    function parseCSVLine(line, delimiter = ',') {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
                else { inQuotes = !inQuotes; }
            } else if (char === delimiter && !inQuotes) {
                result.push(current); current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }

    function parseTamanhos(raw) {
        if (!raw) return [];
        return raw.split(/[,;|]/).map(t => {
            const trimmed = t.trim();
            if (!trimmed) return null;
            const [numero, qtyStr] = trimmed.split(':').map(s => s.trim());
            const quantidade = qtyStr !== undefined ? (parseInt(qtyStr, 10) || 0) : null;
            return { numero, quantidade };
        }).filter(t => t && t.numero);
    }

    function ensureTamanhosFormat(tamanhos) {
        if (!Array.isArray(tamanhos) || tamanhos.length === 0) return [];
        const first = tamanhos[0];
        if (first && typeof first === 'object' && 'numero' in first) {
            return tamanhos;
        }
        return tamanhos.map(t => {
            const str = String(t).trim();
            if (str.includes(':')) {
                const [numero, qtyStr] = str.split(':').map(s => s.trim());
                return { numero, quantidade: parseInt(qtyStr, 10) || 0 };
            }
            return { numero: str, quantidade: null };
        });
    }

    function normalize(str) {
        return String(str || '')
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .toLowerCase()
            .trim();
    }

    function buildSearchString(produto) {
        const parts = [
            produto.codigo,
            produto.modelo,
            produto.colecao,
            produto.categoria,
            produto.grupo,
            produto.referencia,
            (produto.cores || []).map(c => c.nome).join(' '),
        ];
        return normalize(parts.filter(Boolean).join(' '));
    }

    function buildIndex(list) {
        const byCode = new Map();
        for (const p of list) byCode.set(p.codigo, p);
        return byCode;
    }

    function isAllDigits(str) {
        return /^\d+$/.test(str);
    }

    function searchProdutos(query) {
        const raw = query.trim();
        if (!raw) return [];

        const normalized = normalize(raw);

        if (isAllDigits(raw)) {
            if (raw.length === 5) {
                const exact = produtosByCode.get(raw);
                return exact ? [exact] : [];
            }
            if (raw.length > 5) {
                const first5 = raw.slice(0, 5);
                const exact = produtosByCode.get(first5);
                if (exact) return [exact];
            }
            return produtos
                .filter(p => p.codigo.startsWith(raw))
                .slice(0, MAX_AUTOCOMPLETE);
        }

        const terms = normalized.split(/\s+/).filter(Boolean);
        const matches = produtos.filter(p => {
            return terms.every(term => p._search.includes(term));
        });

        return matches.slice(0, MAX_AUTOCOMPLETE);
    }

    function formatPrice(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency', currency: 'BRL', minimumFractionDigits: 2,
        }).format(value);
    }

    function formatDate(timestamp) {
        if (!timestamp) return null;
        const d = new Date(timestamp);
        const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
        const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return `${date} às ${time}`;
    }

    function showToast(message, type = '') {
        el.toast.textContent = message;
        el.toast.className = 'toast';
        el.toast.hidden = false;

        requestAnimationFrame(() => {
            el.toast.classList.add('visible');
            if (type) el.toast.classList.add(type);
        });

        clearTimeout(el.toast._timer);
        el.toast._timer = setTimeout(() => {
            el.toast.classList.remove('visible');
            setTimeout(() => { el.toast.hidden = true; }, 300);
        }, 2800);
    }

    // ── Filter ──────────────────────────────────────────────────────────────

    function hasActiveFilters() {
        return activeFilters.priceMin !== null || activeFilters.priceMax !== null ||
               activeFilters.cores.length > 0 || activeFilters.categorias.length > 0 ||
               activeFilters.colecoes.length > 0;
    }

    function countActiveFilters() {
        let n = 0;
        if (activeFilters.priceMin !== null || activeFilters.priceMax !== null) n++;
        if (activeFilters.cores.length) n++;
        if (activeFilters.categorias.length) n++;
        if (activeFilters.colecoes.length) n++;
        return n;
    }

    function applyFilters(list) {
        if (!hasActiveFilters()) return list;
        return list.filter(p => {
            if (activeFilters.priceMin !== null && p.preco < activeFilters.priceMin) return false;
            if (activeFilters.priceMax !== null && p.preco > activeFilters.priceMax) return false;
            if (activeFilters.cores.length) {
                const pCores = (p.cores || []).map(c => c.nome);
                if (!activeFilters.cores.some(fc => pCores.includes(fc))) return false;
            }
            if (activeFilters.categorias.length) {
                const cat = p.categoria || p.grupo || '';
                if (!activeFilters.categorias.includes(cat)) return false;
            }
            if (activeFilters.colecoes.length) {
                if (!activeFilters.colecoes.includes(p.colecao || '')) return false;
            }
            return true;
        });
    }

    function updateFilterBadge() {
        const n = countActiveFilters();
        if (el.filterBadge) {
            el.filterBadge.textContent = n;
            el.filterBadge.hidden = n === 0;
        }
        if (el.filterBtn) el.filterBtn.classList.toggle('filter-active', n > 0);
    }

    function updateFilterApplyCount() {
        if (!el.filterApply) return;
        const count = applyFilters(produtos).length;
        el.filterApply.textContent = count > 0
            ? `Ver ${count} card${count !== 1 ? 's' : ''}`
            : 'Sem resultados';
        el.filterApply.disabled = count === 0;
    }

    function buildFilterUI() {
        if (!el.filterBody) return;
        const body = el.filterBody;
        body.innerHTML = '';

        const coresSet = new Set();
        const catsSet = new Set();
        const colecoesSet = new Set();
        for (const p of produtos) {
            const cat = p.categoria || p.grupo;
            if (cat && !/^\d+$/.test(String(cat).trim())) catsSet.add(cat);
            if (p.colecao) colecoesSet.add(p.colecao);
            for (const c of (p.cores || [])) {
                if (c.nome && c.nome !== 'ÚNICA' && !/^\d+$/.test(c.nome.trim())) coresSet.add(c.nome);
            }
        }

        // Preço
        const priceSection = document.createElement('div');
        const priceTitle = document.createElement('p');
        priceTitle.className = 'filter-section-title';
        priceTitle.textContent = 'Preço';
        const priceRow = document.createElement('div');
        priceRow.className = 'filter-price-row';
        const minInput = document.createElement('input');
        minInput.type = 'number';
        minInput.className = 'filter-price-input';
        minInput.placeholder = 'Mín R$';
        minInput.min = '0';
        minInput.step = '10';
        if (activeFilters.priceMin !== null) minInput.value = activeFilters.priceMin;
        const sep = document.createElement('span');
        sep.className = 'filter-price-sep';
        sep.textContent = '—';
        const maxInput = document.createElement('input');
        maxInput.type = 'number';
        maxInput.className = 'filter-price-input';
        maxInput.placeholder = 'Máx R$';
        maxInput.min = '0';
        maxInput.step = '10';
        if (activeFilters.priceMax !== null) maxInput.value = activeFilters.priceMax;
        priceRow.append(minInput, sep, maxInput);
        priceSection.append(priceTitle, priceRow);
        body.appendChild(priceSection);

        minInput.addEventListener('input', () => {
            activeFilters.priceMin = minInput.value !== '' ? parseFloat(minInput.value) : null;
            updateFilterApplyCount();
        });
        maxInput.addEventListener('input', () => {
            activeFilters.priceMax = maxInput.value !== '' ? parseFloat(maxInput.value) : null;
            updateFilterApplyCount();
        });

        const CHIPS_VISIBLE = 9;

        // Campo de busca de chips
        const searchWrap = document.createElement('div');
        searchWrap.className = 'filter-search-wrap';
        const searchIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        searchIcon.setAttribute('class', 'filter-search-icon');
        searchIcon.setAttribute('width', '14'); searchIcon.setAttribute('height', '14');
        searchIcon.setAttribute('viewBox', '0 0 24 24'); searchIcon.setAttribute('fill', 'none');
        searchIcon.setAttribute('stroke', 'currentColor'); searchIcon.setAttribute('stroke-width', '2.5');
        searchIcon.setAttribute('stroke-linecap', 'round'); searchIcon.setAttribute('stroke-linejoin', 'round');
        searchIcon.innerHTML = '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>';
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'filter-search';
        searchInput.placeholder = 'Buscar cor, categoria ou coleção…';
        searchInput.autocomplete = 'off';
        searchInput.spellcheck = false;
        searchWrap.append(searchIcon, searchInput);
        body.appendChild(searchWrap);

        function buildChipsSection(label, list, activeList, onToggle) {
            if (!list.length) return null;
            const section = document.createElement('div');

            const headerRow = document.createElement('div');
            headerRow.className = 'filter-section-header';

            const titleWrap = document.createElement('div');
            titleWrap.className = 'filter-section-title-wrap';
            const title = document.createElement('p');
            title.className = 'filter-section-title';
            title.textContent = label;
            const countBadge = document.createElement('span');
            countBadge.className = 'filter-section-count';
            const initCount = activeList.length;
            countBadge.textContent = `${initCount} selecionada${initCount !== 1 ? 's' : ''}`;
            countBadge.hidden = initCount === 0;
            titleWrap.append(title, countBadge);

            const collapseBtn = document.createElement('button');
            collapseBtn.type = 'button';
            collapseBtn.className = 'filter-section-collapse';
            collapseBtn.textContent = 'ver menos';
            collapseBtn.hidden = true;
            headerRow.append(titleWrap, collapseBtn);

            const chips = document.createElement('div');
            chips.className = 'filter-chips' + (list.length > CHIPS_VISIBLE ? ' collapsed' : '');

            list.forEach(value => {
                const chip = document.createElement('button');
                chip.type = 'button';
                chip.className = 'filter-chip' + (activeList.includes(value) ? ' active' : '');
                chip.textContent = value;
                chip.addEventListener('click', () => {
                    chip.classList.toggle('active');
                    onToggle(value, chip.classList.contains('active'));
                    const n = activeList.length;
                    countBadge.textContent = `${n} selecionada${n !== 1 ? 's' : ''}`;
                    countBadge.hidden = n === 0;
                    updateFilterApplyCount();
                });
                chips.appendChild(chip);
            });

            section.append(headerRow, chips);

            if (list.length > CHIPS_VISIBLE) {
                const expandBtn = document.createElement('button');
                expandBtn.type = 'button';
                expandBtn.className = 'filter-chips-expand';
                expandBtn.textContent = `+ ${list.length - CHIPS_VISIBLE} mais`;
                expandBtn.addEventListener('click', () => {
                    chips.classList.remove('collapsed');
                    expandBtn.hidden = true;
                    collapseBtn.hidden = false;
                });
                collapseBtn.addEventListener('click', () => {
                    chips.classList.add('collapsed');
                    collapseBtn.hidden = true;
                    expandBtn.hidden = false;
                });
                section.appendChild(expandBtn);
            }

            return section;
        }

        const coresList = [...coresSet].sort();
        const coresSection = buildChipsSection('Cor', coresList, activeFilters.cores, (cor, add) => {
            if (add) { if (!activeFilters.cores.includes(cor)) activeFilters.cores.push(cor); }
            else { activeFilters.cores = activeFilters.cores.filter(v => v !== cor); }
        });
        if (coresSection) body.appendChild(coresSection);

        const catsList = [...catsSet].sort();
        const catsSection = buildChipsSection('Categoria', catsList, activeFilters.categorias, (cat, add) => {
            if (add) { if (!activeFilters.categorias.includes(cat)) activeFilters.categorias.push(cat); }
            else { activeFilters.categorias = activeFilters.categorias.filter(v => v !== cat); }
        });
        if (catsSection) body.appendChild(catsSection);

        const colecoesList = [...colecoesSet].sort();
        const colecoesSection = buildChipsSection('Coleção', colecoesList, activeFilters.colecoes, (col, add) => {
            if (add) { if (!activeFilters.colecoes.includes(col)) activeFilters.colecoes.push(col); }
            else { activeFilters.colecoes = activeFilters.colecoes.filter(v => v !== col); }
        });
        if (colecoesSection) body.appendChild(colecoesSection);

        // Busca em tempo real nos chips
        searchInput.addEventListener('input', () => {
            const query = normalize(searchInput.value);
            const allChipGroups = body.querySelectorAll('.filter-chips');
            const allExpandBtns = body.querySelectorAll('.filter-chips-expand');
            const allCollapseBtns = body.querySelectorAll('.filter-section-collapse');

            if (!query) {
                allChipGroups.forEach(g => {
                    if (g.dataset.wasCollapsed === '1') g.classList.add('collapsed');
                    delete g.dataset.wasCollapsed;
                    g.querySelectorAll('.filter-chip').forEach(c => c.style.display = '');
                });
                allExpandBtns.forEach(btn => { btn.hidden = btn.dataset.wasHidden === '1'; delete btn.dataset.wasHidden; });
                allCollapseBtns.forEach(btn => { btn.hidden = btn.dataset.wasHidden === '1'; delete btn.dataset.wasHidden; });
            } else {
                allChipGroups.forEach(g => {
                    g.dataset.wasCollapsed = g.classList.contains('collapsed') ? '1' : '0';
                    g.classList.remove('collapsed');
                    g.querySelectorAll('.filter-chip').forEach(chip => {
                        chip.style.display = normalize(chip.textContent).includes(query) ? '' : 'none';
                    });
                });
                allExpandBtns.forEach(btn => { btn.dataset.wasHidden = btn.hidden ? '1' : '0'; btn.hidden = true; });
                allCollapseBtns.forEach(btn => { btn.dataset.wasHidden = btn.hidden ? '1' : '0'; btn.hidden = true; });
            }
        });
    }

    function clearActiveFilters() {
        activeFilters = { priceMin: null, priceMax: null, cores: [], categorias: [], colecoes: [] };
        updateFilterBadge();
        if (!el.consultaInput.value.trim()) {
            el.filterBrowse.hidden = true;
            if (!stack.length) el.introState.hidden = false;
        } else {
            handleInput();
        }
    }

    function openFilterModal() {
        buildFilterUI();
        updateFilterApplyCount();
        el.filterModal.hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function closeFilterModal() {
        el.filterModal.hidden = true;
        document.body.style.overflow = '';
    }

    function showFilterBrowse() {
        const results = applyFilters(produtos);

        const header = document.createElement('div');
        header.className = 'filter-browse-header';
        const label = document.createElement('span');
        label.className = 'filter-browse-label';
        label.textContent = `${results.length} produto${results.length !== 1 ? 's' : ''} encontrados`;
        header.appendChild(label);

        const list = document.createElement('div');
        list.className = 'filter-browse-list';

        if (results.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'filter-browse-empty';
            empty.textContent = 'Nenhum produto com esses filtros';
            list.appendChild(empty);
        } else {
            results.forEach(produto => {
                const card = renderCard(produto);
                // close remove the browse card, not from the stack
                const closeBtn = card.querySelector('.card-close');
                const newCloseBtn = closeBtn.cloneNode(true);
                closeBtn.replaceWith(newCloseBtn);
                newCloseBtn.addEventListener('click', () => {
                    card.classList.add('removing');
                    setTimeout(() => card.remove(), 300);
                });
                list.appendChild(card);
            });
        }

        el.filterBrowse.innerHTML = '';
        el.filterBrowse.append(header, list);
        el.filterBrowse.hidden = false;
        el.introState.hidden = true;
    }

    // ── Sort ────────────────────────────────────────────────────────────────

    const SORT_OPTIONS = [
        { key: 'default',    label: 'Padrão',       sub: 'ordem de consulta' },
        { key: 'price-desc', label: 'Maior preço',   sub: 'mais caro primeiro' },
        { key: 'price-asc',  label: 'Menor preço',   sub: 'mais barato primeiro' },
        { key: 'name-asc',   label: 'A → Z',         sub: 'nome do produto' },
        { key: 'name-desc',  label: 'Z → A',         sub: 'nome do produto' },
    ];

    function sortedStack() {
        const s = [...stack];
        switch (activeSort) {
            case 'price-desc': return s.sort((a, b) => b.preco - a.preco);
            case 'price-asc':  return s.sort((a, b) => a.preco - b.preco);
            case 'name-asc':   return s.sort((a, b) => (a.modelo || '').localeCompare(b.modelo || '', 'pt-BR'));
            case 'name-desc':  return s.sort((a, b) => (b.modelo || '').localeCompare(a.modelo || '', 'pt-BR'));
            default:           return s;
        }
    }

    function rerenderStack() {
        const sorted = sortedStack();
        el.stack.innerHTML = '';
        sorted.forEach((p, i) => {
            const card = renderCard(p);
            card.style.opacity = '0';
            card.style.transform = 'translateY(-10px)';
            el.stack.appendChild(card);
            setTimeout(() => {
                card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
                card.style.opacity = '';
                card.style.transform = '';
            }, i * 50);
        });
    }

    function updateSortBtn() {
        if (el.sortBtn) el.sortBtn.classList.toggle('sort-active', activeSort !== 'default');
    }

    function buildSortUI() {
        el.sortOptions.innerHTML = '';
        SORT_OPTIONS.forEach(opt => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'sort-option' + (activeSort === opt.key ? ' active' : '');

            const text = document.createElement('div');
            text.className = 'sort-option-text';
            const lbl = document.createElement('span');
            lbl.className = 'sort-option-label';
            lbl.textContent = opt.label;
            const sub = document.createElement('span');
            sub.className = 'sort-option-sub';
            sub.textContent = opt.sub;
            text.append(lbl, sub);

            const check = document.createElement('span');
            check.className = 'sort-option-check';
            check.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

            btn.append(text, check);
            btn.addEventListener('click', () => {
                activeSort = opt.key;
                const sorted = sortedStack();
                rerenderStack();
                updateSortBtn();
                closeSortModal();
                if (opt.key !== 'default' && sorted.length > 0) {
                    let detail = '';
                    if (opt.key.includes('price')) {
                        const first = sorted[0].preco;
                        const last  = sorted[sorted.length - 1].preco;
                        detail = ` · R$${first.toFixed(0)} → R$${last.toFixed(0)}`;
                    } else {
                        const first = (sorted[0].modelo || '').slice(0, 10);
                        const last  = (sorted[sorted.length - 1].modelo || '').slice(0, 10);
                        detail = ` · ${first} → ${last}`;
                    }
                    showToast(`${opt.label}${detail}`, 'success');
                }
                requestAnimationFrame(() => {
                    el.stack.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            });
            el.sortOptions.appendChild(btn);
        });
    }

    function openSortModal() {
        buildSortUI();
        el.sortModal.hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function closeSortModal() {
        el.sortModal.hidden = true;
        document.body.style.overflow = '';
    }

    // ── End Sort ─────────────────────────────────────────────────────────────

    // ── End Filter ───────────────────────────────────────────────────────────

    function updateStatus(isOnline) {
        el.statusIndicator.classList.remove('online', 'offline');
        el.statusIndicator.classList.add(isOnline ? 'online' : 'offline');
        el.statusText.textContent = isOnline ? 'Online' : 'Offline';
    }

    function getStockClass(quantidade) {
        if (quantidade === null) return 'tamanho-chip';
        if (quantidade === 0) return 'tamanho-chip esgotado';
        if (quantidade <= 2) return 'tamanho-chip baixo';
        return 'tamanho-chip disponivel';
    }

    function isAllSoldOut(produto) {
        if (!produto.cores || !produto.cores.length) return false;
        return produto.cores.every(cor =>
            Object.values(cor.tamanhos || {}).every(q => !q || q === 0)
        );
    }

    function collectAllSizes(produto, onlyWithStock = true) {
        const set = new Set();
        (produto.cores || []).forEach(c => {
            Object.entries(c.tamanhos || {}).forEach(([s, q]) => {
                if (!onlyWithStock || (q && q > 0)) set.add(s);
            });
        });
        return Array.from(set).sort((a, b) => {
            const aNum = parseInt(a, 10);
            const bNum = parseInt(b, 10);
            if (Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum - bNum;
            return a.localeCompare(b);
        });
    }

    function getTotalStock(produto) {
        let total = 0;
        (produto.cores || []).forEach(c => {
            Object.values(c.tamanhos || {}).forEach(q => { total += (q || 0); });
        });
        return total;
    }

    function renderCard(produto) {
        const tpl = el.cardTemplate.content.cloneNode(true);
        const card = tpl.querySelector('.product-card');

        card.dataset.codigo = produto.codigo;

        card.querySelector('.product-codigo').textContent = produto.codigo;

        card.querySelector('.product-modelo').textContent = produto.modelo || 'Sem descrição';

        const colecaoEl = card.querySelector('.product-colecao');
        if (produto.colecao) {
            colecaoEl.querySelector('.product-colecao-text').textContent = produto.colecao;
            colecaoEl.hidden = false;
        }

        // Localização — sempre visível, com edição inline
        const locEl       = card.querySelector('.product-localizacao');
        const locTextEl   = card.querySelector('.product-localizacao-text');
        const locEditBtn  = card.querySelector('.loc-edit-btn');
        const locEditForm = card.querySelector('.loc-edit-form');
        const locCorredorInput   = card.querySelector('.loc-corredor');
        const locArmarioInput    = card.querySelector('.loc-armario');
        const locPrateleiraInput = card.querySelector('.loc-prateleira');
        const locSaveBtn   = card.querySelector('.loc-save-btn');
        const locCancelBtn = card.querySelector('.loc-cancel-btn');

        function renderLocText(loc) {
            if (loc) {
                locTextEl.textContent = loc;
                locTextEl.classList.remove('loc-empty');
            } else {
                locTextEl.textContent = 'Definir localização';
                locTextEl.classList.add('loc-empty');
            }
        }

        renderLocText(produto.localizacao);

        locEditBtn.addEventListener('click', () => {
            locCorredorInput.value   = produto.corredor   || '';
            locArmarioInput.value    = produto.armario    || '';
            locPrateleiraInput.value = produto.prateleira || '';
            locEl.hidden      = true;
            locEditForm.hidden = false;
            locCorredorInput.focus();
        });

        function cancelEdit() {
            locEl.hidden       = false;
            locEditForm.hidden = true;
        }

        async function saveLocation() {
            const corredor   = locCorredorInput.value.trim();
            const armario    = locArmarioInput.value.trim();
            const prateleira = locPrateleiraInput.value.trim();
            const payload = { codigo: produto.codigo, corredor, armario, prateleira };
            locSaveBtn.disabled = true;
            try {
                const res = await fetch('/api/locations', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'X-App-Token': APP_TOKEN },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Falha ao salvar');
                }
                await res.json();
                const locParts = [];
                if (corredor)   locParts.push('Corredor ' + corredor);
                if (armario)    locParts.push('Armário ' + armario);
                if (prateleira) locParts.push('Prateleira ' + prateleira);
                const newLoc = locParts.join(' · ');
                produto.localizacao = newLoc;
                produto.corredor    = corredor;
                produto.armario     = armario;
                produto.prateleira  = prateleira;
                const stored = produtosByCode.get(produto.codigo);
                if (stored) {
                    stored.localizacao = newLoc;
                    stored.corredor    = corredor;
                    stored.armario     = armario;
                    stored.prateleira  = prateleira;
                }
                renderLocText(newLoc);
                cancelEdit();
                showToast('Localização salva ✓', 'success');
            } catch (e) {
                showToast(e.message || 'Erro ao salvar localização', 'error');
            } finally {
                locSaveBtn.disabled = false;
            }
        }

        locSaveBtn.addEventListener('click', saveLocation);
        locCancelBtn.addEventListener('click', cancelEdit);
        locCorredorInput.addEventListener('keydown', e => {
            if (e.key === 'Enter')  { e.preventDefault(); locArmarioInput.focus(); }
            if (e.key === 'Escape') cancelEdit();
        });
        locArmarioInput.addEventListener('keydown', e => {
            if (e.key === 'Enter')  { e.preventDefault(); locPrateleiraInput.focus(); }
            if (e.key === 'Escape') cancelEdit();
        });
        locPrateleiraInput.addEventListener('keydown', e => {
            if (e.key === 'Enter')  { e.preventDefault(); saveLocation(); }
            if (e.key === 'Escape') cancelEdit();
        });

        card.querySelector('.price-value').textContent = formatPrice(produto.preco);

        const fornecedorEl = card.querySelector('.product-fornecedor');
        if (produto.fabricante) {
            card.querySelector('.product-fornecedor-text').textContent = produto.fabricante;
            fornecedorEl.hidden = false;
        }

        const gridWrapper = card.querySelector('.stock-grid-wrapper');
        gridWrapper.innerHTML = '';

        const isPar = !produto.unidade || produto.unidade.toUpperCase() === 'PAR';

        const columns = isPar
            ? collectAllSizes(produto, true).filter(s => s !== 'QTD')
            : ['QTD'];

        const cores = (produto.cores || []).filter(c =>
            columns.some(s => c.tamanhos?.[s] > 0)
        );

        if (!cores.length || !columns.length) {
            gridWrapper.innerHTML = '<p class="grid-empty">Sem estoque</p>';
        } else {
            const table = document.createElement('table');
            table.className = 'stock-grid';

            const thead = document.createElement('thead');
            const headRow = document.createElement('tr');
            const corner = document.createElement('th');
            corner.className = 'stock-corner';
            corner.textContent = isPar ? 'COR / TAM' : 'COR';
            headRow.appendChild(corner);
            columns.forEach(s => {
                const th = document.createElement('th');
                th.textContent = s;
                headRow.appendChild(th);
            });
            thead.appendChild(headRow);
            table.appendChild(thead);

            const tbody = document.createElement('tbody');
            cores.forEach(cor => {
                const row = document.createElement('tr');
                const label = document.createElement('th');
                label.className = 'stock-cor-label';
                label.textContent = cor.nome;
                row.appendChild(label);

                columns.forEach(s => {
                    const cell = document.createElement('td');
                    cell.className = 'stock-cell';
                    const qty = cor.tamanhos?.[s];
                    if (!qty || qty === 0) {
                        cell.classList.add('esgotado');
                        cell.textContent = '—';
                    } else if (qty <= 2) {
                        cell.classList.add('baixo');
                        cell.textContent = qty;
                    } else {
                        cell.classList.add('disponivel');
                        cell.textContent = qty;
                    }
                    row.appendChild(cell);
                });
                tbody.appendChild(row);
            });
            table.appendChild(tbody);
            gridWrapper.appendChild(table);

        }

        if (isAllSoldOut(produto)) {
            const badge = card.querySelector('.card-esgotado-badge');
            if (badge) badge.hidden = false;
            card.classList.add('is-esgotado');
        }

        const siteLink = card.querySelector('.product-site-link');
        if (siteLink) {
            siteLink.href = `https://www.sonhodospesoficial.com.br/${produto.codigo}`;
        }

        card.querySelector('.card-close').addEventListener('click', () => {
            removeFromStack(produto.codigo);
        });

        return card;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }

    function addToStack(produto) {
        const existing = stack.find(p => p.codigo === produto.codigo);
        if (existing) {
            const existingCard = el.stack.querySelector(`[data-codigo="${produto.codigo}"]`);
            if (existingCard) {
                existingCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                existingCard.classList.remove('flash');
                void existingCard.offsetWidth;
                existingCard.classList.add('flash');
            }
            return;
        }

        stack.unshift(produto);
        if (activeSort !== 'default') {
            rerenderStack();
        } else {
            const card = renderCard(produto);
            el.stack.insertBefore(card, el.stack.firstChild);
        }

        updateStackUI();
    }

    function removeFromStack(codigo) {
        stack = stack.filter(p => p.codigo !== codigo);
        const card = el.stack.querySelector(`[data-codigo="${codigo}"]`);
        if (card) {
            card.classList.add('removing');
            setTimeout(() => card.remove(), 300);
        }
        setTimeout(updateStackUI, 310);
    }

    function clearStack() {
        stack = [];
        el.filterBrowse.innerHTML = '';
        el.filterBrowse.hidden = true;
        const cards = el.stack.querySelectorAll('.product-card');
        if (!cards.length) {
            updateStackUI();
            return;
        }
        cards.forEach((c, i) => {
            setTimeout(() => c.classList.add('removing'), i * 40);
        });
        setTimeout(() => {
            el.stack.innerHTML = '';
            updateStackUI();
        }, 400 + cards.length * 40);
    }

    function updateStackUI() {
        const count = stack.length;
        if (count > 0) {
            el.stackHeader.hidden = false;
            el.stackCount.textContent = count === 1 ? '1 consulta' : `${count} consultas`;
            el.introState.hidden = true;
            el.filterBrowse.hidden = true;
        } else {
            el.stackHeader.hidden = true;
            if (!el.consultaInput.value.trim()) {
                if (hasActiveFilters()) {
                    showFilterBrowse();
                } else {
                    el.filterBrowse.innerHTML = '';
                    el.filterBrowse.hidden = true;
                    el.introState.hidden = false;
                }
            }
        }
    }

    function renderAutocomplete(results, query) {
        el.autocomplete.innerHTML = '';

        if (!results.length) {
            el.autocomplete.hidden = true;
            if (query.trim()) {
                el.emptySearch.hidden = false;
                el.emptyQuery.textContent = `"${query}"`;
                el.introState.hidden = true;
            }
            return;
        }

        el.emptySearch.hidden = true;

        results.forEach(produto => {
            const item = document.createElement('button');
            item.className = 'autocomplete-item';
            item.type = 'button';
            item.dataset.codigo = produto.codigo;

            const soldOut = isAllSoldOut(produto);
            if (soldOut) item.classList.add('is-esgotado');

            const leftCol = document.createElement('div');
            leftCol.className = 'ac-left';

            const codigoEl = document.createElement('span');
            codigoEl.className = 'ac-codigo';
            codigoEl.textContent = produto.codigo;
            leftCol.appendChild(codigoEl);

            const modeloEl = document.createElement('span');
            modeloEl.className = 'ac-modelo';
            modeloEl.textContent = produto.modelo;
            leftCol.appendChild(modeloEl);

            const marcaEl = document.createElement('span');
            marcaEl.className = 'ac-marca';
            const cores = (produto.cores || []).map(c => c.nome).join(' · ');
            const cat = produto.categoria || produto.grupo || '';
            marcaEl.textContent = cores ? `${cat} · ${cores}` : cat;
            leftCol.appendChild(marcaEl);

            const rightCol = document.createElement('div');
            rightCol.className = 'ac-right';

            if (soldOut) {
                const tag = document.createElement('span');
                tag.className = 'ac-tag-esgotado';
                tag.textContent = 'Esgotado';
                rightCol.appendChild(tag);
            } else {
                const precoEl = document.createElement('span');
                precoEl.className = 'ac-preco';
                precoEl.textContent = formatPrice(produto.preco);
                rightCol.appendChild(precoEl);
            }

            item.appendChild(leftCol);
            item.appendChild(rightCol);

            item.addEventListener('click', () => {
                addToStack(produto);
                clearInput();
            });

            el.autocomplete.appendChild(item);
        });

        el.autocomplete.hidden = false;
        el.introState.hidden = true;
    }

    function hideAutocomplete() {
        el.autocomplete.hidden = true;
        el.autocomplete.innerHTML = '';
        el.emptySearch.hidden = true;
        if (!stack.length) {
            if (hasActiveFilters()) {
                showFilterBrowse();
            } else {
                el.introState.hidden = false;
            }
        }
    }

    function clearInput() {
        el.consultaInput.value = '';
        el.clearBtn.hidden = true;
        hideAutocomplete();
        el.consultaInput.focus();
    }

    function handleInput() {
        const value = el.consultaInput.value;
        el.clearBtn.hidden = !value;
        el.filterBrowse.hidden = true;

        if (!value.trim()) {
            hideAutocomplete();
            return;
        }

        if (isAllDigits(value.trim()) && value.trim().length === 5) {
            const padded = value.trim().padStart(5, '0');
            const produto = produtosByCode.get(padded);
            if (produto) {
                addToStack(produto);
                clearInput();
                return;
            }
        }

        const results = applyFilters(searchProdutos(value));
        renderAutocomplete(results, value);
    }

    function handleEnter() {
        const value = el.consultaInput.value.trim();
        if (!value) return;

        const results = applyFilters(searchProdutos(value));
        if (results.length > 0) {
            addToStack(results[0]);
            clearInput();
        }
    }

    let html5QrcodeScanner = null;

    function openQrScanner() {
        el.qrModal.hidden = false;
        document.body.style.overflow = 'hidden';

        if (typeof Html5Qrcode === 'undefined') {
            showToast("Leitor não carregado", "error");
            closeQrScanner();
            return;
        }

        if (!html5QrcodeScanner) {
            html5QrcodeScanner = new Html5Qrcode("qr-reader");
        }

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        html5QrcodeScanner.start(
            { facingMode: "environment" },
            config,
            (decodedText, decodedResult) => {
                closeQrScanner();
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                el.consultaInput.value = decodedText;
                handleInput();
                handleEnter();
            },
            (errorMessage) => {
                // ignora erros de scan enquanto busca
            }
        ).catch((err) => {
            showToast("Erro ao abrir a câmera", "error");
            console.error(err);
            closeQrScanner();
        });
    }

    function closeQrScanner() {
        el.qrModal.hidden = true;
        document.body.style.overflow = '';
        if (html5QrcodeScanner && html5QrcodeScanner.isScanning) {
            html5QrcodeScanner.stop().catch(e => console.error(e));
        }
    }

    function openLensSearch() {
        const isAndroid = /android/i.test(navigator.userAgent);
        const isIOS     = /iPad|iPhone|iPod/i.test(navigator.userAgent);

        // iOS: Google Lens não aparece no share sheet — abre lens.google.com diretamente
        if (isIOS) {
            window.open('https://lens.google.com/', '_blank');
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.style.display = 'none';
        document.body.appendChild(input);

        input.onchange = () => {
            const file = input.files?.[0];
            input.remove();
            if (!file) return;

            // Android: share sheet nativo — Google Lens aparece como opção
            if (isAndroid && navigator.canShare?.({ files: [file] })) {
                navigator.share({ files: [file] }).catch(() => {});
                return;
            }

            // Desktop: form POST direto para Google Lens (abre em nova aba com a foto)
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = `https://lens.google.com/upload?ep=ccm&s=csp&st=${Date.now()}`;
            form.enctype = 'multipart/form-data';
            form.target = '_blank';
            form.style.display = 'none';

            const fi = document.createElement('input');
            fi.type = 'file';
            fi.name = 'encoded_image';
            const dt = new DataTransfer();
            dt.items.add(file);
            fi.files = dt.files;

            const ci = document.createElement('input');
            ci.type = 'hidden';
            ci.name = 'image_content';
            ci.value = '';

            form.appendChild(fi);
            form.appendChild(ci);
            document.body.appendChild(form);
            form.submit();
            setTimeout(() => form.remove(), 1000);
        };

        input.click();
    }

    async function loadFromDB() {
        try {
            const list = await db.getAll(STORE_PRODUTOS);
            if (list && list.length) {
                const isOldFormat = !Array.isArray(list[0].cores);
                if (isOldFormat) {
                    await db.clearAll();
                    return false;
                }

                list.forEach(p => { p._search = buildSearchString(p); });
                produtos = list;
                produtosByCode = buildIndex(list);
                await updateSyncInfo();
                return true;
            }
        } catch (e) { console.warn('Erro IndexedDB:', e); }
        return false;
    }

    async function loadFromLocalCSV() {
        try {
            const response = await fetch(LOCAL_CSV_PATH);
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const text = await response.text();
            const list = parseCSV(text);
            if (list.length) {
                await db.replaceProdutos(list);
                await db.setMeta('lastSync', Date.now());
                await db.setMeta('source', 'local');
                produtos = list;
                produtosByCode = buildIndex(list);
                await updateSyncInfo();
                return true;
            }
        } catch (e) { console.warn('Erro CSV local:', e); }
        return false;
    }

    async function loadFromURL(url) {
        const response = await fetch(url, { cache: 'no-cache', headers: { 'X-App-Token': APP_TOKEN } });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const text = await response.text();
        const list = parseCSV(text);
        if (!list.length) throw new Error('CSV vazio');

        await db.replaceProdutos(list);
        await db.setMeta('lastSync', Date.now());
        await db.setMeta('source', 'remote');
        await db.setMeta('url', url);
        produtos = list;
        produtosByCode = buildIndex(list);
        await updateSyncInfo();
        return list.length;
    }

    async function updateSyncInfo() {
        const lastSync = await db.getMeta('lastSync');
        const dateStr = formatDate(lastSync);
        const total = produtos.length;

        if (dateStr) {
            el.lastSync.textContent = `Última atualização: ${dateStr}`;
            el.tableInfo.innerHTML = `Atualizada em <strong>${dateStr}</strong>`;
        } else {
            el.lastSync.textContent = 'Nenhuma tabela carregada';
            el.tableInfo.textContent = 'Nenhuma tabela carregada';
        }

        el.totalProdutos.textContent = `${total} ${total === 1 ? 'produto' : 'produtos'} no cadastro`;
    }

    async function handleUpdate() {
        const savedUrl = localStorage.getItem(STORAGE_KEY_URL);
        if (!savedUrl) { showToast('Configure a URL da planilha antes', 'error'); return; }
        if (!navigator.onLine) { showToast('Sem conexão — impossível atualizar', 'error'); return; }

        el.btnUpdate.disabled = true;
        const originalContent = el.btnUpdate.innerHTML;
        el.btnUpdate.textContent = 'Atualizando...';

        try {
            const count = await loadFromURL(savedUrl);
            showToast(`${count} produtos atualizados ✓`, 'success');
        } catch (e) {
            showToast('Erro ao atualizar tabela', 'error');
            console.error(e);
        } finally {
            el.btnUpdate.disabled = false;
            el.btnUpdate.innerHTML = originalContent;
        }
    }

    async function handleClear() {
        if (!confirm('Remover todos os dados locais? Você precisará reconectar para baixar novamente.')) return;
        await db.clearAll();
        produtos = [];
        produtosByCode = new Map();
        await updateSyncInfo();
        clearStack();
        showToast('Dados removidos', 'success');
    }

    function toCSVUrl(raw) {
        try {
            const u = new URL(raw);
            if (u.hostname === 'docs.google.com' && u.pathname.includes('/spreadsheets/')) {
                // Formato publicado: /d/e/2PACX-.../pubhtml → /pub?output=csv
                if (u.pathname.includes('/d/e/')) {
                    return raw.replace(/\/pubhtml.*$/, '/pub?output=csv')
                               .replace(/\/pub\?.*$/, '/pub?output=csv');
                }
                // Formato de edição/compartilhamento: /d/ID/edit → /pub?output=csv
                const id = u.pathname.match(/\/spreadsheets\/d\/([^/]+)/)?.[1];
                if (id) {
                    const gid = u.searchParams.get('gid') || '0';
                    return `https://docs.google.com/spreadsheets/d/${id}/pub?output=csv&gid=${gid}`;
                }
            }
        } catch (_) { /* deixa passar — validação acontece depois */ }
        return raw;
    }

    function handleSaveUrl() {
        const raw = el.csvUrl.value.trim();
        if (!raw) { showToast('Informe uma URL válida', 'error'); return; }
        let url;
        try { url = toCSVUrl(raw); new URL(url); } catch { showToast('URL inválida', 'error'); return; }

        // Atualiza o campo com a URL já convertida para o usuário ver
        el.csvUrl.value = url;

        showPinModal({
            mode: 'verify',
            title: 'Digite o PIN',
            subtitle: 'Confirme o PIN para salvar a URL',
            onSuccess: () => {
                localStorage.setItem(STORAGE_KEY_URL, url);
                showToast('URL salva neste dispositivo. Para todos os outros, atualize config.json no repositório.', '');
            },
        });
    }

    async function hashPin(pin) {
        const data = new TextEncoder().encode(String(pin));
        const digest = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(digest))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    function hasPin() {
        return true;
    }

    function hasCustomPin() {
        return !!localStorage.getItem(STORAGE_KEY_PIN);
    }

    async function verifyPin(pin) {
        // PIN customizado salvo localmente — compara hash sem chamar API
        const stored = localStorage.getItem(STORAGE_KEY_PIN);
        if (stored) {
            const hash = await hashPin(pin);
            return hash === stored;
        }

        // Sem PIN customizado: tenta a API (Vercel/Next.js); se falhar, usa PIN padrão
        try {
            const response = await fetch(PIN_VERIFY_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: String(pin) }),
            });
            if (response.ok) {
                const data = await response.json();
                return !!data.valid;
            }
        } catch (_) { /* API indisponível (site estático) — cai no fallback */ }

        // Fallback: PIN padrão definido em LOCAL_DEV_PIN (1357)
        return String(pin) === LOCAL_DEV_PIN;
    }

    async function savePin(pin) {
        const hash = await hashPin(pin);
        localStorage.setItem(STORAGE_KEY_PIN, hash);
    }

    function removePinStorage() {
        localStorage.removeItem(STORAGE_KEY_PIN);
    }

    const pinState = {
        mode: 'verify',
        value: '',
        firstEntry: '',
        onSuccess: null,
    };

    function updatePinDots() {
        const dots = el.pinDots.querySelectorAll('.pin-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('filled', i < pinState.value.length);
        });
    }

    function flashPinError(message) {
        el.pinError.textContent = message;
        el.pinError.hidden = false;
        el.pinDots.classList.add('error');
        if (navigator.vibrate) navigator.vibrate(120);
        setTimeout(() => {
            el.pinDots.classList.remove('error');
            pinState.value = '';
            el.pinInput.value = '';
            updatePinDots();
        }, 500);
    }

    function flashPinSuccess() {
        el.pinDots.classList.add('success');
    }

    function showPinModal({ mode, title, subtitle, onSuccess }) {
        pinState.mode = mode;
        pinState.value = '';
        pinState.firstEntry = '';
        pinState.onSuccess = onSuccess;

        el.pinTitle.textContent = title;
        el.pinSubtitle.textContent = subtitle;
        el.pinError.hidden = true;
        el.pinError.textContent = '';
        el.pinInput.value = '';
        updatePinDots();
        el.pinDots.classList.remove('error', 'success');

        el.pinModal.hidden = false;
        document.body.style.overflow = 'hidden';
        setTimeout(() => el.pinInput.focus(), 50);
    }

    function hidePinModal() {
        el.pinModal.hidden = true;
        document.body.style.overflow = '';
        pinState.value = '';
        pinState.firstEntry = '';
        pinState.onSuccess = null;
        el.pinInput.value = '';
    }

    async function handlePinComplete() {
        const entered = pinState.value;

        if (pinState.mode === 'verify') {
            const ok = await verifyPin(entered);
            if (ok) {
                flashPinSuccess();
                setTimeout(() => {
                    hidePinModal();
                    if (pinState.onSuccess) pinState.onSuccess(entered);
                }, 250);
            } else {
                flashPinError('PIN incorreto');
            }
        } else if (pinState.mode === 'create') {
            pinState.firstEntry = entered;
            pinState.value = '';
            el.pinInput.value = '';
            updatePinDots();
            el.pinTitle.textContent = 'Confirme o PIN';
            el.pinSubtitle.textContent = 'Digite os 4 dígitos novamente';
            pinState.mode = 'confirm';
        } else if (pinState.mode === 'confirm') {
            if (entered === pinState.firstEntry) {
                await savePin(entered);
                flashPinSuccess();
                setTimeout(() => {
                    hidePinModal();
                    updateSecurityUI();
                    showToast('PIN definido ✓', 'success');
                    if (pinState.onSuccess) pinState.onSuccess();
                }, 250);
            } else {
                flashPinError('Os PINs não coincidem');
                pinState.mode = 'create';
                el.pinTitle.textContent = 'Crie um PIN';
                el.pinSubtitle.textContent = '4 dígitos para proteger as configurações';
            }
        }
    }

    function handlePinInput(e) {
        const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
        e.target.value = raw;
        pinState.value = raw;
        updatePinDots();

        if (raw.length === 4) {
            setTimeout(handlePinComplete, 120);
        }
    }

    function openSettings() {
        el.settingsModal.hidden = false;
        const savedUrl = localStorage.getItem(STORAGE_KEY_URL);
        if (savedUrl && el.csvUrl) el.csvUrl.value = savedUrl;
        document.body.style.overflow = 'hidden';
        updateSecurityUI();
    }

    function closeSettings() {
        el.settingsModal.hidden = true;
        document.body.style.overflow = '';
    }

    function updateSecurityUI() {
        if (!el.pinStatus) return;
        if (hasCustomPin()) {
            el.pinStatus.innerHTML = '<strong>Protegido:</strong> as configurações exigem o PIN personalizado.';
            if (el.btnSetPin) el.btnSetPin.hidden = true;
            if (el.btnChangePin) el.btnChangePin.hidden = false;
            if (el.btnRemovePin) el.btnRemovePin.hidden = false;
        } else {
            el.pinStatus.innerHTML = '<strong>PIN padrão ativo.</strong> Recomendado trocar por um personalizado.';
            if (el.btnSetPin) el.btnSetPin.hidden = false;
            if (el.btnChangePin) el.btnChangePin.hidden = true;
            if (el.btnRemovePin) el.btnRemovePin.hidden = true;
        }
    }

    function handleSetPin() {
        showPinModal({
            mode: 'create',
            title: 'Crie um PIN',
            subtitle: '4 dígitos para proteger as configurações',
            onSuccess: null,
        });
    }

    function handleChangePin() {
        showPinModal({
            mode: 'verify',
            title: 'PIN atual',
            subtitle: 'Digite o PIN atual para alterar',
            onSuccess: () => {
                setTimeout(() => {
                    showPinModal({
                        mode: 'create',
                        title: 'Novo PIN',
                        subtitle: 'Escolha um novo PIN de 4 dígitos',
                        onSuccess: null,
                    });
                }, 100);
            },
        });
    }

    function handleRemovePin() {
        showPinModal({
            mode: 'verify',
            title: 'Remover PIN',
            subtitle: 'Digite o PIN atual para confirmar',
            onSuccess: () => {
                removePinStorage();
                updateSecurityUI();
                showToast('PIN removido', 'success');
            },
        });
    }

    function setupEvents() {
        el.consultaInput.addEventListener('input', handleInput);

        el.consultaInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleEnter(); }
            else if (e.key === 'Escape') { clearInput(); }
        });

        el.clearBtn.addEventListener('click', clearInput);
        if (el.scanBtn) el.scanBtn.addEventListener('click', openQrScanner);
        el.btnClearSearch.addEventListener('click', clearInput);

        el.btnClearAll.addEventListener('click', () => {
            if (stack.length > 1 && !confirm(`Remover as ${stack.length} consultas da tela?`)) return;
            activeFilters = { priceMin: null, priceMax: null, cores: [], categorias: [], colecoes: [] };
            updateFilterBadge();
            el.consultaInput.value = '';
            el.clearBtn.hidden = true;
            hideAutocomplete();
            el.emptySearch.hidden = true;
            el.filterBrowse.hidden = true;
            clearStack();
        });

        // settings desativado
        // el.settingsBtn.addEventListener('click', openSettings);
        // el.modalClose.addEventListener('click', closeSettings);
        // el.modalBackdrop.addEventListener('click', closeSettings);
        // el.btnUpdate.addEventListener('click', handleUpdate);
        // el.btnSaveUrl?.addEventListener('click', handleSaveUrl);

        if (el.btnClear) el.btnClear.addEventListener('click', handleClear);
        if (el.btnSetPin) el.btnSetPin.addEventListener('click', handleSetPin);
        if (el.btnChangePin) el.btnChangePin.addEventListener('click', handleChangePin);
        if (el.btnRemovePin) el.btnRemovePin.addEventListener('click', handleRemovePin);

        el.pinInput.addEventListener('input', handlePinInput);
        el.pinClose.addEventListener('click', hidePinModal);
        el.pinBackdrop.addEventListener('click', hidePinModal);

        if (el.qrClose) el.qrClose.addEventListener('click', closeQrScanner);
        if (el.qrBackdrop) el.qrBackdrop.addEventListener('click', closeQrScanner);

        if (el.installBtn) el.installBtn.addEventListener('click', async () => {
            if (!deferredInstallPrompt) return;
            deferredInstallPrompt.prompt();
            const { outcome } = await deferredInstallPrompt.userChoice;
            if (outcome === 'accepted') {
                deferredInstallPrompt = null;
                el.installBtn.hidden = true;
            }
        });

        if (el.lensBtn) el.lensBtn.addEventListener('click', openLensSearch);

        if (el.sortBtn) el.sortBtn.addEventListener('click', openSortModal);
        if (el.sortClose) el.sortClose.addEventListener('click', closeSortModal);
        if (el.sortBackdrop) el.sortBackdrop.addEventListener('click', closeSortModal);

        if (el.filterBtn) el.filterBtn.addEventListener('click', openFilterModal);
        if (el.filterClose) el.filterClose.addEventListener('click', closeFilterModal);
        if (el.filterBackdrop) el.filterBackdrop.addEventListener('click', closeFilterModal);
        if (el.filterClear) el.filterClear.addEventListener('click', () => {
            clearActiveFilters();
            closeFilterModal();
        });
        if (el.filterApply) el.filterApply.addEventListener('click', () => {
            closeFilterModal();
            updateFilterBadge();
            if (!el.consultaInput.value.trim() && !stack.length) {
                showFilterBrowse();
            } else if (el.consultaInput.value.trim()) {
                handleInput();
            }
        });

        el.pinModal.addEventListener('click', (e) => {
            if (e.target === el.pinModal || e.target.closest('.pin-content')) {
                el.pinInput.focus();
            }
        });

        document.addEventListener('click', (e) => {
            if (!el.autocomplete.hidden &&
                !el.autocomplete.contains(e.target) &&
                !el.consultaInput.contains(e.target)) {
                hideAutocomplete();
            }
        });

        window.addEventListener('online', async () => {
            updateStatus(true);
            if (!produtos.length) {
                const url = localStorage.getItem(STORAGE_KEY_URL);
                if (url) {
                    try { await loadFromURL(url); showToast('Dados carregados', 'success'); }
                    catch (_) { showToast('Conectado à internet', 'success'); }
                    return;
                }
            }
            showToast('Conectado à internet', 'success');
        });
        window.addEventListener('offline', () => {
            updateStatus(false);
            showToast('Modo offline', '');
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (!el.sortModal.hidden) closeSortModal();
                else if (!el.filterModal.hidden) closeFilterModal();
                else if (!el.pinModal.hidden) hidePinModal();
                // else if (!el.settingsModal.hidden) closeSettings();
            }
        });
    }

    async function init() {
        setupEvents();
        updateStatus(navigator.onLine);

        let sharedUrl = null;
        try {
            const cfgRes = await fetch(CONFIG_URL, { cache: 'no-cache' });
            if (cfgRes.ok) {
                const cfg = await cfgRes.json();
                if (cfg.csvUrl) sharedUrl = cfg.csvUrl;
            }
        } catch (_) { /* config.json indisponível */ }

        const savedUrl = sharedUrl || localStorage.getItem(STORAGE_KEY_URL);
        if (sharedUrl) {
            localStorage.setItem(STORAGE_KEY_URL, sharedUrl);
            if (el.csvUrl) el.csvUrl.value = sharedUrl;
        }

        let loaded = false;

        if (navigator.onLine) {
            try {
                if (savedUrl) {
                    await loadFromURL(savedUrl);
                    loaded = true;
                } else {
                    loaded = await loadFromLocalCSV();
                }
            } catch (e) {
                console.warn('Falha no carregamento remoto, usando cache local:', e.message);
            }
        }

        if (!loaded) {
            loaded = await loadFromDB();
        }

        if (!loaded) {
            el.lastSync.textContent = 'Abra as configurações para carregar a tabela';
        }

        updateStackUI();

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js').catch(err => {
                console.warn('Service worker falhou:', err);
            });
        }

        if (el.lensBtn) {
            let lensFabCollapsed = false;
            window.addEventListener('scroll', () => {
                const shouldCollapse = window.scrollY > 60;
                if (shouldCollapse !== lensFabCollapsed) {
                    lensFabCollapsed = shouldCollapse;
                    el.lensBtn.classList.toggle('lens-fab--collapsed', shouldCollapse);
                }
            }, { passive: true });
        }
    }

    let deferredInstallPrompt = null;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        if (el.installBtn) el.installBtn.hidden = false;
    });

    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        if (el.installBtn) el.installBtn.hidden = true;
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
