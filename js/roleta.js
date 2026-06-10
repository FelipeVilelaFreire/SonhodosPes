(() => {
    'use strict';

    const API_URL = '/api/roleta';
    const LOCAL_CSV_PATH = 'data/roleta.csv';
    const APP_TOKEN = 'sdp-4K9mX2rP7nQ1wL5j';
    const SPIN_DURATION_MS = 4300;
    const WHEEL_SEGMENT_COUNT = 40;
    const WHEEL_SEPARATOR_COLOR = '#FFF7EA';
    const COLOR_MAP_STORAGE_KEY = 'sdp:roletaColorMap:v1';

    const VALUE_COLORS = [
        '#C8B091',
        '#A88B65',
        '#D9C5AA',
        '#BDA17D',
        '#C89B5E',
        '#B89168',
        '#9B7B58',
        '#7B9063',
        '#66775B',
        '#879970',
        '#A4B08B',
        '#2F5D62',
        '#4E7478',
        '#6E8F92',
        '#4A6F8A',
        '#6F879A',
        '#5C5266',
        '#7A6F82',
        '#7F2D3A',
        '#9B4050',
        '#B5574A',
        '#C86B5F',
        '#8A4D42',
        '#A76555',
        '#C07F68',
        '#B68B66',
        '#94785E',
        '#D7B46A',
        '#E1C589',
        '#B7A28F',
        '#8D8175',
        '#A99682',
        '#D7CEC1',
        '#E8DFD1',
        '#F2EBDF',
        '#F7F0E6',
        '#A36A6F',
        '#866B73',
        '#6D7B68',
        '#8C955E',
        '#536C5F',
        '#365C68',
        '#71605A',
        '#B78373',
    ];

    const el = {
        refreshBtn: document.getElementById('refreshBtn'),
        wheelArea: document.getElementById('wheelArea'),
        wheel: document.getElementById('wheel'),
        spinBtn: document.getElementById('spinBtn'),
        spinBtnText: document.getElementById('spinBtnText'),
        resultPanel: document.getElementById('resultPanel'),
        resultPrize: document.getElementById('resultPrize'),
        celebrationLayer: document.getElementById('celebrationLayer'),
        toast: document.getElementById('rouletteToast'),
    };

    let prizes = [];
    let source = '';
    let wheelRotation = 0;
    let wheelGradient = '';
    let wheelSegments = [];
    let valueColorMap = new Map();
    let isLoading = false;
    let isSpinning = false;

    function normalize(str) {
        return String(str || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function parseCSVLine(line, delimiter = ',') {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === delimiter && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current);
        return result;
    }

    function detectDelimiter(headerLine) {
        const commas = (headerLine.match(/,/g) || []).length;
        const semicolons = (headerLine.match(/;/g) || []).length;
        const tabs = (headerLine.match(/\t/g) || []).length;
        if (tabs > commas && tabs > semicolons) return '\t';
        if (semicolons > commas) return ';';
        return ',';
    }

    function parseQuantity(value) {
        const raw = String(value ?? '').trim();
        if (!raw) return 0;

        const parsed = Number(raw.replace(/\./g, '').replace(',', '.'));
        if (!Number.isFinite(parsed)) return 0;
        return Math.max(0, Math.floor(parsed));
    }

    function sanitizeItems(items) {
        if (!Array.isArray(items)) return [];

        return items
            .map(item => ({
                item: String(item.item ?? item.valor ?? item.nome ?? item.premio ?? '').trim(),
                quantidade: parseQuantity(item.quantidade ?? item.qtd ?? item.qty),
            }))
            .filter(item => item.item);
    }

    function parseCSV(text) {
        const lines = text.trim().split(/\r?\n/).filter(Boolean);
        if (!lines.length) return [];

        const delimiter = detectDelimiter(lines[0]);
        const firstRow = parseCSVLine(lines[0], delimiter);
        const headers = firstRow.map(normalize);

        let itemIdx = headers.findIndex(h => ['item', 'valor', 'premio', 'produto', 'nome', 'descricao'].includes(h));
        let qtyIdx = headers.findIndex(h => ['quantidade', 'qtd', 'qty', 'estoque', 'chances'].includes(h));
        let startIdx = 1;

        if (itemIdx === -1 && qtyIdx === -1) {
            itemIdx = 0;
            qtyIdx = 1;
            startIdx = 0;
        } else {
            if (itemIdx === -1) itemIdx = 0;
            if (qtyIdx === -1) qtyIdx = itemIdx === 0 ? 1 : 0;
        }

        return lines.slice(startIdx)
            .map(line => parseCSVLine(line, delimiter))
            .map(row => ({
                item: String(row[itemIdx] ?? '').trim(),
                quantidade: parseQuantity(row[qtyIdx]),
            }))
            .filter(item => item.item);
    }

    function totalQuantity(list = prizes) {
        return list.reduce((sum, prize) => sum + Math.max(0, prize.quantidade), 0);
    }

    function activePrizes(list = prizes) {
        return list.filter(prize => prize.quantidade > 0);
    }

    function hashString(value) {
        let hash = 0;
        const str = normalize(value);
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    function readStoredColorMap() {
        try {
            const raw = localStorage.getItem(COLOR_MAP_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : {};
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (_) {
            return {};
        }
    }

    function writeStoredColorMap(mapObj) {
        try {
            localStorage.setItem(COLOR_MAP_STORAGE_KEY, JSON.stringify(mapObj));
        } catch (_) {
            // Se o navegador bloquear storage, a cor ainda fica estavel nesta sessao.
        }
    }

    function prizeColorMap(active) {
        const stored = readStoredColorMap();
        const used = new Set();
        const map = new Map();

        active
            .map(prize => prize.item)
            .filter(Boolean)
            .sort((a, b) => normalize(a).localeCompare(normalize(b), 'pt-BR'))
            .forEach(item => {
                const key = normalize(item);
                let color = stored[key];

                if (!VALUE_COLORS.includes(color) || used.has(color)) {
                    let index = hashString(item) % VALUE_COLORS.length;
                    let attempts = 0;

                    while (used.has(VALUE_COLORS[index]) && attempts < VALUE_COLORS.length) {
                        index = (index + 1) % VALUE_COLORS.length;
                        attempts++;
                    }

                    color = VALUE_COLORS[index];
                    stored[key] = color;
                }

                used.add(color);
                map.set(item, color);
            });

        writeStoredColorMap(stored);
        return map;
    }

    function balancedPrizeSegments(active) {
        if (!active.length) return [];

        const segments = [];
        for (let i = 0; i < WHEEL_SEGMENT_COUNT; i++) {
            segments.push(active[i % active.length]);
        }

        for (let i = segments.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = segments[i];
            segments[i] = segments[j];
            segments[j] = tmp;
        }

        for (let i = 1; i < segments.length; i++) {
            if (segments[i].item !== segments[i - 1].item) continue;
            const swapIdx = segments.findIndex((segment, index) => index > i && segment.item !== segments[i - 1].item);
            if (swapIdx !== -1) {
                const tmp = segments[i];
                segments[i] = segments[swapIdx];
                segments[swapIdx] = tmp;
            }
        }

        return segments;
    }

    function wheelVisualSegmentsFromPrizes(active) {
        const prizesForSegments = balancedPrizeSegments(active);
        const colorsByPrize = prizeColorMap(active);
        valueColorMap = colorsByPrize;
        return prizesForSegments.map(prize => ({
            item: prize.item,
            color: colorsByPrize.get(prize.item) || VALUE_COLORS[0],
        }));
    }

    function fallbackWheelSegments() {
        const segments = [];
        for (let i = 0; i < WHEEL_SEGMENT_COUNT; i++) {
            segments.push({
                item: '',
                color: VALUE_COLORS[i % VALUE_COLORS.length],
            });
        }
        return segments;
    }

    function buildDecorativeWheel() {
        const active = activePrizes();
        const visualSegments = active.length ? wheelVisualSegmentsFromPrizes(active) : fallbackWheelSegments();
        const weights = visualSegments.map(() => 0.82 + Math.random() * 0.36);
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        const separatorDeg = 0.9;
        let start = 0;
        const targetSegments = [];

        const pieces = visualSegments.flatMap((segment, index) => {
            const end = index === visualSegments.length - 1 ? 360 : start + (weights[index] / totalWeight) * 360;
            const colorEnd = Math.max(start, end - separatorDeg);
            targetSegments.push({
                item: segment.item,
                color: segment.color,
                start,
                end: colorEnd,
                mid: start + ((colorEnd - start) / 2),
                span: Math.max(0, colorEnd - start),
            });
            const piece = [
                `${segment.color} ${start.toFixed(4)}deg ${colorEnd.toFixed(4)}deg`,
                `${WHEEL_SEPARATOR_COLOR} ${colorEnd.toFixed(4)}deg ${end.toFixed(4)}deg`,
            ];
            start = end;
            return piece;
        });

        return {
            gradient: `conic-gradient(from -90deg, ${pieces.join(', ')})`,
            segments: targetSegments,
        };
    }

    function setFreshWheel() {
        const wheel = buildDecorativeWheel();
        wheelGradient = wheel.gradient;
        wheelSegments = wheel.segments;
        el.wheel.style.setProperty('--wheel-gradient', wheelGradient);
    }

    function ensureWheel() {
        if (!wheelGradient) setFreshWheel();
        else el.wheel.style.setProperty('--wheel-gradient', wheelGradient);
    }

    function showToast(message, type = '') {
        if (!el.toast) return;

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

    async function readError(response) {
        try {
            const data = await response.json();
            return data.detail || data.error || `HTTP ${response.status}`;
        } catch (_) {
            return `HTTP ${response.status}`;
        }
    }

    async function loadFromApi() {
        const response = await fetch(`${API_URL}?t=${Date.now()}`, {
            cache: 'no-store',
            headers: { 'X-App-Token': APP_TOKEN },
        });

        if (!response.ok) throw new Error(await readError(response));

        const data = await response.json();
        return sanitizeItems(data.items);
    }

    async function loadFromLocalCSV() {
        const response = await fetch(`${LOCAL_CSV_PATH}?t=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return parseCSV(await response.text());
    }

    async function loadPrizes({ silent = false } = {}) {
        if (isSpinning) return;

        isLoading = true;
        source = '';
        el.refreshBtn.disabled = true;
        el.spinBtn.disabled = true;
        el.spinBtnText.textContent = 'Carregando';
        clearResult();

        try {
            prizes = await loadFromApi();
            source = 'api';
            setFreshWheel();
            if (!silent) showToast('Roleta atualizada', 'success');
        } catch (apiError) {
            try {
                prizes = await loadFromLocalCSV();
                source = 'local';
                setFreshWheel();
                if (!silent) showToast('Lista local carregada', '');
                console.warn('API da roleta indisponivel:', apiError);
            } catch (localError) {
                prizes = [];
                source = '';
                setFreshWheel();
                showToast('Erro ao carregar roleta', 'error');
                console.error(apiError, localError);
            }
        } finally {
            isLoading = false;
            el.refreshBtn.disabled = false;
            updateUI();
        }
    }

    function updateUI() {
        const total = totalQuantity();

        ensureWheel();

        el.wheelArea.classList.toggle('is-spinning', isSpinning);
        el.spinBtn.classList.toggle('is-spinning', isSpinning);
        el.spinBtn.disabled = isLoading || isSpinning || total <= 0;

        if (isLoading) {
            el.spinBtnText.textContent = 'Carregando';
        } else if (isSpinning) {
            el.spinBtnText.textContent = 'Girando';
        } else if (total <= 0) {
            el.spinBtnText.textContent = 'Sorteio encerrado';
        } else {
            el.spinBtnText.textContent = 'Girar roleta';
        }
    }

    function normalizeDegree(degree) {
        return ((degree % 360) + 360) % 360;
    }

    function targetSegmentForPrize(item) {
        const normalized = normalize(item);
        const matches = wheelSegments.filter(segment => normalize(segment.item) === normalized && segment.span > 0);
        if (matches.length) return matches[Math.floor(Math.random() * matches.length)];

        const drawable = wheelSegments.filter(segment => segment.span > 0);
        return drawable.length ? drawable[Math.floor(Math.random() * drawable.length)] : { mid: Math.random() * 360, span: 360 };
    }

    function spinWheel(item) {
        const segment = targetSegmentForPrize(item);
        const jitter = (Math.random() - 0.5) * Math.min(12, segment.span * 0.42);
        const targetAngle = normalizeDegree(segment.mid - 90 + jitter);
        const targetRotationMod = normalizeDegree(360 - targetAngle);
        const extraTurns = 5 + Math.floor(Math.random() * 3);
        const base = Math.floor(wheelRotation / 360) * 360;

        let nextRotation = base + extraTurns * 360 + targetRotationMod;
        while (nextRotation <= wheelRotation + 720) nextRotation += 360;

        wheelRotation = nextRotation;
        el.wheel.style.setProperty('--wheel-rotation', `${wheelRotation}deg`);

        return new Promise(resolve => {
            window.setTimeout(resolve, SPIN_DURATION_MS);
        });
    }

    function pickLocalPrize() {
        const total = totalQuantity();
        if (total <= 0) return null;

        let ticket = Math.floor(Math.random() * total) + 1;
        for (let index = 0; index < prizes.length; index++) {
            const quantity = Math.max(0, prizes[index].quantidade);
            if (!quantity) continue;

            ticket -= quantity;
            if (ticket <= 0) return { index, prize: prizes[index] };
        }

        return null;
    }

    async function requestSpin() {
        if (source === 'api') {
            const response = await fetch(API_URL, {
                method: 'POST',
                cache: 'no-store',
                headers: { 'X-App-Token': APP_TOKEN },
            });

            if (!response.ok) throw new Error(await readError(response));

            const data = await response.json();
            return {
                item: data.prize?.item,
                items: sanitizeItems(data.items),
            };
        }

        const picked = pickLocalPrize();
        if (!picked) throw new Error('Roleta sem itens disponiveis');

        const nextItems = prizes.map((prize, index) => {
            if (index !== picked.index) return { ...prize };
            return { ...prize, quantidade: Math.max(0, prize.quantidade - 1) };
        });

        return {
            item: picked.prize.item,
            items: nextItems,
        };
    }

    async function handleSpin() {
        if (isSpinning || isLoading || totalQuantity() <= 0) return;

        isSpinning = true;
        clearResult();
        updateUI();

        try {
            const result = await requestSpin();
            await spinWheel(result.item);

            prizes = result.items;
            showResult(result.item);
            updateUI();
            launchCelebration();
        } catch (e) {
            showToast(e.message || 'Erro ao girar roleta', 'error');
            console.error(e);
        } finally {
            isSpinning = false;
            updateUI();
        }
    }

    function clearResult() {
        el.resultPrize.textContent = '';
        el.resultPanel.hidden = true;
        el.resultPanel.classList.remove('is-revealed');
    }

    function showResult(item) {
        el.resultPrize.textContent = item || '';
        el.resultPanel.style.setProperty('--result-color', valueColorMap.get(item) || VALUE_COLORS[0]);
        el.resultPanel.hidden = !item;
        el.resultPanel.classList.remove('is-revealed');
        void el.resultPanel.offsetWidth;
        if (item) el.resultPanel.classList.add('is-revealed');
    }

    function launchCelebration() {
        if (!el.celebrationLayer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const fragment = document.createDocumentFragment();
        const colors = ['#F5C04A', '#B23A48', '#2F8F83', '#4A6FA5', '#E76F51', '#8E5A9F', '#C8B091', '#FFFFFF'];
        const pieces = 42;

        for (let i = 0; i < pieces; i++) {
            const piece = document.createElement('span');
            const angle = Math.random() * Math.PI * 2;
            const distance = 110 + Math.random() * 260;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance - 90;
            const rot = (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 620);
            const delay = Math.random() * 120;

            piece.className = 'confetti-piece';
            piece.style.setProperty('--piece-color', colors[i % colors.length]);
            piece.style.setProperty('--tx', `${tx.toFixed(1)}px`);
            piece.style.setProperty('--ty', `${ty.toFixed(1)}px`);
            piece.style.setProperty('--rot', `${rot.toFixed(1)}deg`);
            piece.style.setProperty('--delay', `${delay.toFixed(0)}ms`);
            fragment.appendChild(piece);
        }

        el.celebrationLayer.replaceChildren(fragment);
        window.setTimeout(() => {
            el.celebrationLayer.replaceChildren();
        }, 1500);
    }

    function bindEvents() {
        el.refreshBtn.addEventListener('click', () => loadPrizes());
        el.spinBtn.addEventListener('click', handleSpin);

        window.addEventListener('online', () => {
            if (source !== 'api') loadPrizes({ silent: true });
        });
    }

    function init() {
        bindEvents();
        setFreshWheel();
        loadPrizes({ silent: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
