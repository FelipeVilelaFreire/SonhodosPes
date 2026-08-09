/**
 * Sonho dos Pés — Módulo de Inventário & Contagem de Estoque
 * Formato do registro: Data_Hora | SKU | Qtd_Contada
 */

(function () {
    'use strict';

    // Banco de Dados IndexedDB para inventário
    const DB_NAME = 'sonhodospes_inventario';
    const DB_VERSION = 1;
    let db = null;

    let activeSessionId = null;
    let activeSessionData = {
        id: null,
        name: '',
        created_at: '',
        items: {} // { "SKU_CODE": { sku: "SKU_CODE", qtd: 5, last_updated: "09/08/2026 18:55" } }
    };

    let html5QrcodeScanner = null;

    // Elementos DOM
    const btnOpenScan = document.getElementById('btnOpenScan');
    const qrModal = document.getElementById('qrModal');
    const qrClose = document.getElementById('qrClose');
    const qrBackdrop = document.getElementById('qrBackdrop');
    const manualSkuInput = document.getElementById('manualSkuInput');
    const btnAddManual = document.getElementById('btnAddManual');
    const skuTableBody = document.getElementById('skuTableBody');
    const currentSessionTitle = document.getElementById('currentSessionTitle');
    const totalItemsBadge = document.getElementById('totalItemsBadge');
    const btnExportCsv = document.getElementById('btnExportCsv');
    const btnSyncSheets = document.getElementById('btnSyncSheets');
    const btnNewSession = document.getElementById('btnNewSession');
    const sessionList = document.getElementById('sessionList');
    const toast = document.getElementById('toast');

    // Inicialização
    document.addEventListener('DOMContentLoaded', async () => {
        await initDB();
        await loadOrCreateCurrentSession();
        renderSessionList();

        setupEventListeners();
    });

    function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (e) => {
                const database = e.target.result;
                if (!database.objectStoreNames.contains('sessions')) {
                    database.createObjectStore('sessions', { keyPath: 'id' });
                }
            };

            request.onsuccess = (e) => {
                db = e.target.result;
                resolve();
            };

            request.onerror = (e) => {
                console.error('Erro IndexedDB:', e);
                reject(e);
            };
        });
    }

    // Configura eventos
    function setupEventListeners() {
        btnOpenScan.addEventListener('click', startCameraScanner);
        qrClose.addEventListener('click', stopCameraScanner);
        qrBackdrop.addEventListener('click', stopCameraScanner);

        btnAddManual.addEventListener('click', handleManualAdd);
        manualSkuInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleManualAdd();
        });

        btnExportCsv.addEventListener('click', exportToCsv);
        if (btnSyncSheets) btnSyncSheets.addEventListener('click', syncToGoogleSheets);
        btnNewSession.addEventListener('click', createNewSession);
    }

    // Formata Data e Hora atual (DD/MM/AAAA HH:mm)
    function getCurrentDateTimeStr() {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

    // Carrega a sessão atual ou cria uma nova para o mês/dia se não existir
    async function loadOrCreateCurrentSession() {
        const sessions = await getAllSessions();
        if (sessions.length > 0) {
            // Pega a mais recente
            sessions.sort((a, b) => new Date(b.id) - new Date(a.id));
            activeSessionData = sessions[0];
            activeSessionId = activeSessionData.id;
        } else {
            await createNewSession();
        }
        renderTable();
    }

    // Cria nova contagem
    async function createNewSession() {
        const dateStr = getCurrentDateTimeStr();
        const newId = new Date().toISOString();
        const sessionName = `Contagem ${dateStr.split(' ')[0]}`;

        activeSessionData = {
            id: newId,
            name: sessionName,
            created_at: dateStr,
            items: {}
        };
        activeSessionId = newId;

        await saveSession(activeSessionData);
        await renderSessionList();
        renderTable();
        showToast(`Nova contagem criada: ${sessionName}`);
    }

    // Adiciona / Incrementa SKU
    async function addSkuItem(skuCode) {
        if (!skuCode) return;

        const cleanSku = String(skuCode).trim().toUpperCase();
        if (!cleanSku) return;

        const nowStr = getCurrentDateTimeStr();

        if (activeSessionData.items[cleanSku]) {
            activeSessionData.items[cleanSku].qtd += 1;
            activeSessionData.items[cleanSku].last_updated = nowStr;
        } else {
            activeSessionData.items[cleanSku] = {
                sku: cleanSku,
                qtd: 1,
                last_updated: nowStr
            };
        }

        await saveSession(activeSessionData);
        renderTable(cleanSku);
        showToast(`+1 lido: ${cleanSku} (Total: ${activeSessionData.items[cleanSku].qtd})`);

        // Envia dinamicamente para o Google Sheets em segundo plano
        syncSingleItemToSheets(nowStr, cleanSku, activeSessionData.items[cleanSku].qtd);
    }

    function handleManualAdd() {
        const sku = manualSkuInput.value;
        if (sku) {
            addSkuItem(sku);
            manualSkuInput.value = '';
            manualSkuInput.focus();
        }
    }

    // Renderiza a Tabela das 3 Colunas: Data_Hora, SKU, Qtd_Contada
    function renderTable(lastUpdatedSku = null) {
        currentSessionTitle.textContent = activeSessionData.name || 'Contagem de Estoque';

        const itemsArr = Object.values(activeSessionData.items || {});
        let totalPecas = 0;

        if (itemsArr.length === 0) {
            skuTableBody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; color: #a8a29e; padding: 20px;">
                        Nenhum item lido ainda nesta contagem.
                    </td>
                </tr>
            `;
            totalItemsBadge.textContent = '0 peças lidas';
            return;
        }

        // Ordena pela última bipagem (mais recente no topo)
        itemsArr.sort((a, b) => b.last_updated.localeCompare(a.last_updated));

        skuTableBody.innerHTML = itemsArr.map(item => {
            totalPecas += item.qtd;
            const isUpdated = item.sku === lastUpdatedSku;
            return `
                <tr class="${isUpdated ? 'just-updated' : ''}">
                    <td style="color: #78716c;">${item.last_updated}</td>
                    <td><strong>${item.sku}</strong></td>
                    <td style="text-align: right; font-weight: 700; color: #1c1917;">${item.qtd}</td>
                </tr>
            `;
        }).join('');

        totalItemsBadge.textContent = `${totalPecas} peças lidas (${itemsArr.length} SKUs)`;
    }

    // Renderiza o Histórico de Sessões/Meses
    async function renderSessionList() {
        const sessions = await getAllSessions();
        if (sessions.length === 0) {
            sessionList.innerHTML = '<p style="color: #78716c; font-size: 0.9rem;">Nenhuma contagem anterior salva.</p>';
            return;
        }

        sessions.sort((a, b) => new Date(b.id) - new Date(a.id));

        sessionList.innerHTML = sessions.map(s => {
            const total = Object.values(s.items || {}).reduce((acc, curr) => acc + curr.qtd, 0);
            const isActive = s.id === activeSessionId;
            return `
                <div class="session-item ${isActive ? 'active' : ''}" data-id="${s.id}">
                    <div class="session-info">
                        <strong>${s.name} ${isActive ? ' (Ativa)' : ''}</strong>
                        <span>Criada em: ${s.created_at}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-weight: 600; color: #C8B091; font-size: 0.88rem;">${total} peças</span>
                        <button class="btn-delete-card" data-id="${s.id}" title="Remover card da tela">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Evento para selecionar sessão
        document.querySelectorAll('.session-item').forEach(el => {
            el.addEventListener('click', async (e) => {
                // Evita disparar se clicou na lixeira
                if (e.target.closest('.btn-delete-card')) return;

                const sId = el.getAttribute('data-id');
                const selected = sessions.find(x => x.id === sId);
                if (selected) {
                    activeSessionData = selected;
                    activeSessionId = selected.id;
                    await renderSessionList();
                    renderTable();
                }
            });
        });

        // Evento para remover apenas o card da tela (IndexedDB local)
        document.querySelectorAll('.btn-delete-card').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const sId = btn.getAttribute('data-id');
                if (confirm('Remover este card de inventário da tela? (Os dados já enviados para a planilha continuam salvos lá normalmente).')) {
                    await deleteSessionLocal(sId);
                    const remaining = await getAllSessions();
                    if (remaining.length > 0) {
                        activeSessionData = remaining[0];
                        activeSessionId = remaining[0].id;
                    } else {
                        await createNewSession();
                    }
                    await renderSessionList();
                    renderTable();
                    showToast('Card removido com sucesso.');
                }
            });
        });
    }

    // Exportação em CSV no formato exato: Data_Hora, SKU, Qtd_Contada
    function exportToCsv() {
        const items = Object.values(activeSessionData.items || {});
        if (items.length === 0) {
            showToast('Nenhum item nesta contagem para exportar.');
            return;
        }

        let csvContent = 'Data_Hora,SKU,Qtd_Contada\n';
        items.forEach(item => {
            csvContent += `"${item.last_updated}","${item.sku}",${item.qtd}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        const fileName = `inventario_${activeSessionData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('CSV baixado com sucesso!');
    }

    // Envia um único item lido instantaneamente para o Google Sheets em segundo plano
    async function syncSingleItemToSheets(dateStr, sku, qtd) {
        try {
            await fetch('/api/inventario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: [{ last_updated: dateStr, sku: sku, qtd: qtd }]
                })
            });
        } catch (e) {
            console.log('Gravado offline. Será sincronizado posteriormente.', e);
        }
    }

    // Envio direto para o Google Sheets (aba 'inventarios')
    async function syncToGoogleSheets() {
        const items = Object.values(activeSessionData.items || {});
        if (items.length === 0) {
            showToast('Nenhum item para salvar na planilha.');
            return;
        }

        btnSyncSheets.disabled = true;
        btnSyncSheets.textContent = 'Enviando...';

        try {
            const res = await fetch('/api/inventario', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ items })
            });

            const data = await res.json();
            if (res.ok && data.ok) {
                showToast(`Sucesso! ${data.count} linhas salvas na aba 'inventarios'.`);
            } else {
                showToast(`Erro ao salvar: ${data.error || 'Falha na resposta'}`);
            }
        } catch (err) {
            console.error('Erro ao enviar inventário:', err);
            showToast('Erro de conexão ao enviar para a planilha.');
        } finally {
            btnSyncSheets.disabled = false;
            btnSyncSheets.textContent = 'Salvar na Planilha';
        }
    }

    // Scanner de Câmera (HTML5 QRCode)
    let lastScannedCode = null;
    let lastScanTime = 0;

    function startCameraScanner() {
        qrModal.removeAttribute('hidden');
        if (!html5QrcodeScanner) {
            html5QrcodeScanner = new Html5Qrcode("qr-reader");
        }

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        html5QrcodeScanner.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
                const now = Date.now();
                // Anti-bounce: evita bipar 10x o mesmo código no mesmo segundo
                if (decodedText === lastScannedCode && (now - lastScanTime < 1500)) {
                    return;
                }
                lastScannedCode = decodedText;
                lastScanTime = now;

                addSkuItem(decodedText);
            },
            () => {}
        ).catch(err => {
            console.error("Erro na câmera:", err);
            showToast("Não foi possível acessar a câmera.");
            stopCameraScanner();
        });
    }

    function stopCameraScanner() {
        if (html5QrcodeScanner && html5QrcodeScanner.isScanning) {
            html5QrcodeScanner.stop().then(() => {
                qrModal.setAttribute('hidden', '');
            }).catch(() => {
                qrModal.setAttribute('hidden', '');
            });
        } else {
            qrModal.setAttribute('hidden', '');
        }
    }

    // Helpers IndexedDB
    function deleteSessionLocal(sessionId) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction('sessions', 'readwrite');
            const store = tx.objectStore('sessions');
            store.delete(sessionId);
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e);
        });
    }

    function saveSession(sessionObj) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction('sessions', 'readwrite');
            const store = tx.objectStore('sessions');
            store.put(sessionObj);
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e);
        });
    }

    function getAllSessions() {
        return new Promise((resolve, reject) => {
            const tx = db.transaction('sessions', 'readonly');
            const store = tx.objectStore('sessions');
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = (e) => reject(e);
        });
    }

    function showToast(msg) {
        toast.textContent = msg;
        toast.removeAttribute('hidden');
        toast.classList.add('visible');
        setTimeout(() => {
            toast.classList.remove('visible');
            toast.setAttribute('hidden', '');
        }, 2200);
    }
})();
