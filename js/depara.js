/**
 * Sonho dos Pés — Módulo De-Para (Auditoria de Divergência de Estoque)
 * Cruza o banco IndexedDB 'produtos' (Sistema) com 'sonhodospes_inventario' (Contado)
 */

(function () {
    'use strict';

    let dbProdutos = null;
    let dbInventario = null;

    let produtosMaster = [];
    let produtosByCode = new Map();

    let allSessions = [];
    let activeSession = null;
    let activeTabFilter = 'todos';

    // Elementos DOM
    const sessionSelect = document.getElementById('sessionSelect');
    const valSistema = document.getElementById('valSistema');
    const valContado = document.getElementById('valContado');
    const valDivergencia = document.getElementById('valDivergencia');
    const deparaList = document.getElementById('deparaList');
    const filterTabs = document.querySelectorAll('.tab-btn');
    const toast = document.getElementById('toast');

    document.addEventListener('DOMContentLoaded', async () => {
        await initDBs();
        await loadMasterData();
        await loadSessions();

        setupEvents();
    });

    // Conecta nos bancos IndexedDB
    function initDBs() {
        return Promise.all([
            new Promise((resolve) => {
                const req = indexedDB.open('sonhodospes', 2);
                req.onsuccess = (e) => { dbProdutos = e.target.result; resolve(); };
                req.onerror = () => resolve();
            }),
            new Promise((resolve) => {
                const req = indexedDB.open('sonhodospes_inventario', 1);
                req.onsuccess = (e) => { dbInventario = e.target.result; resolve(); };
                req.onerror = () => resolve();
            })
        ]);
    }

    // Carrega a lista master de produtos do sistema
    function loadMasterData() {
        return new Promise((resolve) => {
            if (!dbProdutos) return resolve();
            const tx = dbProdutos.transaction('produtos', 'readonly');
            const store = tx.objectStore('produtos');
            const req = store.getAll();
            req.onsuccess = () => {
                produtosMaster = req.result || [];
                produtosByCode = new Map();
                produtosMaster.forEach(p => produtosByCode.set(p.codigo, p));
                resolve();
            };
            req.onerror = () => resolve();
        });
    }

    // Carrega o histórico de sessões do inventário
    // Carrega o histórico de sessões do inventário direto da API (planilha) ou banco local
    async function loadSessions() {
        try {
            const res = await fetch('/api/inventario', {
                headers: { 'x-app-token': 'sdp-4K9mX2rP7nQ1wL5j' }
            });
            const data = await res.json();
            if (data.ok && Array.isArray(data.sessions) && data.sessions.length > 0) {
                allSessions = data.sessions;
            }
        } catch (e) {
            console.log('Usando banco local para De-Para.');
        }

        if (allSessions.length === 0 && dbInventario) {
            allSessions = await new Promise((resolve) => {
                const tx = dbInventario.transaction('sessions', 'readonly');
                const store = tx.objectStore('sessions');
                const req = store.getAll();
                req.onsuccess = () => resolve(req.result || []);
                req.onerror = () => resolve([]);
            });
        }

        allSessions.sort((a, b) => b.id.localeCompare(a.id));

        if (allSessions.length > 0) {
            renderSessionSelectOptions();
            activeSession = allSessions[0];
            renderAudit();
        } else {
            sessionSelect.innerHTML = '<option value="">Nenhum inventário encontrado</option>';
            deparaList.innerHTML = '<p style="text-align:center; color:#7A6B5C; padding:30px;">Crie uma contagem na tela de Inventário primeiro.</p>';
        }
    }

    function renderSessionSelectOptions() {
        sessionSelect.innerHTML = allSessions.map(s => {
            const sid = s.session_id || s.id;
            return `<option value="${s.id}">Contagem ${sid} (${s.created_at})</option>`;
        }).join('');
    }

    function setupEvents() {
        sessionSelect.addEventListener('change', (e) => {
            const sId = e.target.value;
            activeSession = allSessions.find(x => x.id === sId);
            if (activeSession) {
                renderAudit();
            }
        });

        filterTabs.forEach(btn => {
            btn.addEventListener('click', () => {
                filterTabs.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeTabFilter = btn.getAttribute('data-tab');
                renderAudit();
            });
        });
    }

    // Processa a comparação De-Para entre o Sistema e o Inventário lido
    function renderAudit() {
        if (!activeSession) return;

        const itemsLidos = activeSession.items || {};
        const auditMap = new Map();

        // 1. Preenche primeiro todos os produtos do Sistema Master com seu estoque total da Coluna F
        produtosMaster.forEach(p => {
            const skuKey = String(p.codigo || '').trim().toUpperCase();
            if (!skuKey) return;

            let totalSistema = 0;
            let corNome = 'N/A';
            if (p.cores && p.cores.length > 0) {
                corNome = p.cores.map(c => c.nome).filter(Boolean).join(' / ') || 'ÚNICA';
                p.cores.forEach(c => {
                    const tamanhosObj = c.tamanhos || {};
                    totalSistema += Object.values(tamanhosObj).reduce((acc, curr) => acc + (parseInt(curr, 10) || 0), 0);
                });
            }

            auditMap.set(skuKey, {
                sku: skuKey,
                modelo: p.modelo || 'PRODUTO CADASTRADO',
                cor: corNome,
                qtdSistema: totalSistema,
                qtdContada: 0,
                diferenca: 0 - totalSistema
            });
        });

        // 2. Cruza com os itens lidos no inventário selecionado
        Object.values(itemsLidos).forEach(item => {
            const rawSku = String(item.sku || '').trim().toUpperCase();
            if (!rawSku) return;
            const qtdContada = parseInt(item.qtd, 10) || 0;

            const cod5 = rawSku.length >= 5 ? rawSku.slice(0, 5) : rawSku;
            
            // Verifica se o SKU lido já está no mapa (por SKU exato ou pelos 5 dígitos)
            let targetKey = rawSku;
            if (!auditMap.has(rawSku) && auditMap.has(cod5)) {
                targetKey = cod5;
            }

            if (auditMap.has(targetKey)) {
                const existing = auditMap.get(targetKey);
                existing.qtdContada += qtdContada;
                existing.diferenca = existing.qtdContada - existing.qtdSistema;
            } else {
                // Se for um item lido que NÃO existe no sistema (Sobra de produto não cadastrado)
                auditMap.set(rawSku, {
                    sku: rawSku,
                    modelo: 'PRODUTO NÃO CADASTRADO',
                    cor: 'N/A',
                    qtdSistema: 0,
                    qtdContada: qtdContada,
                    diferenca: qtdContada
                });
            }
        });

        const auditList = Array.from(auditMap.values());

        // Atualiza Totais nos Cards do Topo
        let sumSistema = 0;
        let sumContado = 0;

        auditList.forEach(item => {
            sumSistema += item.qtdSistema;
            sumContado += item.qtdContada;
        });

        const sumDiff = sumContado - sumSistema;

        valSistema.textContent = sumSistema;
        valContado.textContent = sumContado;
        valDivergencia.textContent = (sumDiff > 0 ? '+' : '') + sumDiff;

        valDivergencia.className = 'summary-card-value ' + (sumDiff < 0 ? 'negativo' : (sumDiff > 0 ? 'positivo' : 'ok'));

        // Aplica o Filtro das Abas (Todos, Faltas, Sobras, Batidos)
        let filteredList = auditList;
        if (activeTabFilter === 'faltas') {
            filteredList = auditList.filter(x => x.diferenca < 0);
        } else if (activeTabFilter === 'sobras') {
            filteredList = auditList.filter(x => x.diferenca > 0);
        } else if (activeTabFilter === 'ok') {
            filteredList = auditList.filter(x => x.diferenca === 0);
        }

        // Renderiza os Cards De-Para
        if (filteredList.length === 0) {
            deparaList.innerHTML = '<p style="text-align:center; color:#7A6B5C; padding:30px;">Nenhum item nesta categoria.</p>';
            return;
        }

        deparaList.innerHTML = filteredList.map(item => {
            let statusBadge = '';
            let diffClass = '';

            if (item.diferenca < 0) {
                statusBadge = `<span class="depara-badge falta">Falta: ${item.diferenca}</span>`;
                diffClass = 'neg';
            } else if (item.diferenca > 0) {
                statusBadge = `<span class="depara-badge sobra">Sobra: +${item.diferenca}</span>`;
                diffClass = 'pos';
            } else {
                statusBadge = `<span class="depara-badge ok">Bateu (0)</span>`;
                diffClass = 'zero';
            }

            return `
                <div class="depara-card">
                    <div class="depara-card-header">
                        <div>
                            <span class="depara-sku">SKU: ${item.sku}</span>
                            <div class="depara-modelo">${item.modelo}</div>
                            <div style="font-size:0.8rem; color:#7A6B5C;">Cor: ${item.cor}</div>
                        </div>
                        ${statusBadge}
                    </div>

                    <table class="depara-grid-table">
                        <thead>
                            <tr>
                                <th>Sistema</th>
                                <th>Contado</th>
                                <th>Diferença</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>${item.qtdSistema}</strong> pçs</td>
                                <td><strong>${item.qtdContada}</strong> pçs</td>
                                <td><span class="diff-tag ${diffClass}">${item.diferenca > 0 ? '+' : ''}${item.diferenca}</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
        }).join('');
    }
})();
