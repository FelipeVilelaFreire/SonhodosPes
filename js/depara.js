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

        // 1. Processa itens lidos no inventário selecionado
        Object.values(itemsLidos).forEach(item => {
            const rawSku = String(item.sku).trim().toUpperCase();
            const qtdContada = item.qtd;

            // Busca produto master (primeiro por código exato de SKU, depois pelos 5 primeiros dígitos)
            const cod5 = rawSku.length >= 5 ? rawSku.slice(0, 5) : rawSku;
            const pMaster = produtosByCode.get(rawSku) || produtosByCode.get(cod5);

            let qtdSistema = 0;
            let nomeProduto = 'PRODUTO NÃO CADASTRADO';
            let corNome = 'N/A';

            if (pMaster) {
                nomeProduto = pMaster.modelo || 'SEM NOME';
                if (pMaster.cores && pMaster.cores.length > 0) {
                    corNome = pMaster.cores.map(c => c.nome).filter(Boolean).join(' / ') || 'ÚNICA';
                    // Tenta achar a quantidade exata do tamanho se o código for completo, senão pega a soma do modelo
                    pMaster.cores.forEach(c => {
                        const tamanhosObj = c.tamanhos || {};
                        // Se o SKU lido terminar com o tamanho (ex: 37221-36 ou 3722136)
                        let foundExactSize = false;
                        Object.keys(tamanhosObj).forEach(tam => {
                            if (rawSku.endsWith(tam)) {
                                qtdSistema += (parseInt(tamanhosObj[tam], 10) || 0);
                                foundExactSize = true;
                            }
                        });
                        if (!foundExactSize) {
                            qtdSistema += Object.values(tamanhosObj).reduce((acc, curr) => acc + (parseInt(curr, 10) || 0), 0);
                        }
                    });
                }
            }

            auditMap.set(rawSku, {
                sku: rawSku,
                modelo: nomeProduto,
                cor: corNome,
                qtdSistema: qtdSistema,
                qtdContada: qtdContada,
                diferenca: qtdContada - qtdSistema
            });
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
