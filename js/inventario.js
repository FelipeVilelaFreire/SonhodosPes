/**
 * Sonho dos Pés — Módulo de Inventário & Contagem de Estoque
 * Formato do registro: Data_Hora | SKU | Qtd_Contada
 */

(function () {
    'use strict';

    const APP_TOKEN = 'sdp-4K9mX2rP7nQ1wL5j';

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

    let isEditMode = false;
    const btnEditQuantities = document.getElementById('btnEditQuantities');

    // Configura eventos
    function setupEventListeners() {
        btnOpenScan.addEventListener('click', startCameraScanner);
        qrClose.addEventListener('click', stopCameraScanner);
        qrBackdrop.addEventListener('click', stopCameraScanner);

        btnAddManual.addEventListener('click', handleManualAdd);
        manualSkuInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleManualAdd();
        });

        if (btnEditQuantities) {
            btnEditQuantities.addEventListener('click', toggleEditMode);
        }

        if (btnSyncSheets) btnSyncSheets.addEventListener('click', syncToGoogleSheets);
        btnNewSession.addEventListener('click', createNewSession);
    }

    // Alterna modo de edição direta das quantidades na tabela
    async function toggleEditMode() {
        isEditMode = !isEditMode;

        if (isEditMode) {
            btnEditQuantities.style.background = '#F5F0E8';
            btnEditQuantities.style.borderColor = '#C8B091';
            btnEditQuantities.style.color = '#2B2118';
            btnEditQuantities.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Concluir Edição
            `;
            showToast('Modo de edição ativado. Altere os valores na tabela.');
        } else {
            // Salva as alterações feitas nos inputs
            document.querySelectorAll('.edit-qtd-input').forEach(input => {
                const sku = input.getAttribute('data-sku');
                const val = parseInt(input.value, 10);
                if (sku && activeSessionData.items[sku] && !isNaN(val) && val >= 0) {
                    activeSessionData.items[sku].qtd = val;
                    activeSessionData.items[sku].last_updated = getCurrentDateTimeStr();
                }
            });

            await saveSession(activeSessionData);

            btnEditQuantities.style.background = '#FFFFFF';
            btnEditQuantities.style.borderColor = '#E8DFD1';
            btnEditQuantities.style.color = '#A88B65';
            btnEditQuantities.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Editar Quantidades
            `;
            showToast('Quantidades atualizadas com sucesso!');
        }

        renderTable();
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

    // Limpa todas as sessões locais para espelhar a planilha
    function clearLocalSessions() {
        return new Promise((resolve) => {
            if (!db) return resolve();
            const tx = db.transaction('sessions', 'readwrite');
            const store = tx.objectStore('sessions');
            const req = store.clear();
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
        });
    }

    // Carrega a sessão atual ou cria uma nova espelhando 100% o Google Sheets
    async function loadOrCreateCurrentSession() {
        // Tenta buscar sessões remotas atualizadas direto do Google Sheets
        try {
            const res = await fetch('/api/inventario', {
                headers: { 'x-app-token': APP_TOKEN }
            });
            const data = await res.json();
            if (data.ok && Array.isArray(data.sessions)) {
                // Se a planilha foi limpa ou tem dados novos, substitui o armazenamento local
                await clearLocalSessions();
                for (const remoteSess of data.sessions) {
                    await saveSession(remoteSess);
                }
            }
        } catch (err) {
            console.log('Modo offline: usando sessões locais.');
        }

        let sessions = await getAllSessions();

        if (sessions.length > 0) {
            sessions.sort((a, b) => b.id.localeCompare(a.id));
            activeSessionData = sessions[0];
            activeSessionId = activeSessionData.id;
        } else {
            await createNewSession();
        }
        await renderSessionList();
        renderTable();
    }

    // Cria nova contagem com ID sequencial curto e bonito (CONT-001, CONT-002, etc.)
    async function createNewSession() {
        const dateStr = getCurrentDateTimeStr();
        const sessions = await getAllSessions();
        
        let nextSeq = 1;
        sessions.forEach(s => {
            const sid = s.session_id || s.id || '';
            const match = sid.match(/CONT-(\d+)/i);
            if (match) {
                const num = parseInt(match[1], 10);
                if (!isNaN(num) && num >= nextSeq) {
                    nextSeq = num + 1;
                }
            }
        });

        const seqStr = String(nextSeq).padStart(3, '0');
        const friendlyId = `CONT-${seqStr}`;
        const newId = friendlyId;

        activeSessionData = {
            id: newId,
            session_id: friendlyId,
            name: `Contagem ${friendlyId}`,
            created_at: dateStr,
            items: {}
        };
        activeSessionId = newId;

        await saveSession(activeSessionData);
        await renderSessionList();
        renderTable();
        showToast(`Nova contagem criada: ${friendlyId}`);
    }

    // Adiciona / Incrementa SKU (anota exatamente o código lido, seja de 5, 13, 14 ou 20 caracteres)
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
                    <td colspan="2" style="text-align: center; color: #a8a29e; padding: 20px;">
                        Nenhum item lido ainda nesta contagem.
                    </td>
                </tr>
            `;
            totalItemsBadge.textContent = '0 peças';
            return;
        }

        // Ordena pela última bipagem (mais recente no topo)
        itemsArr.sort((a, b) => b.last_updated.localeCompare(a.last_updated));

        skuTableBody.innerHTML = itemsArr.map(item => {
            totalPecas += item.qtd;
            const isUpdated = item.sku === lastUpdatedSku;
            
            const qtdCell = isEditMode
                ? `<input type="number" class="edit-qtd-input" data-sku="${item.sku}" value="${item.qtd}" min="0" style="width: 70px; text-align: right; font-weight: 700; padding: 4px 6px; border: 1px solid #C8B091; border-radius: 6px; background: #FDFAF5; font-size: 0.95rem;">`
                : `${item.qtd}`;

            return `
                <tr class="${isUpdated ? 'just-updated' : ''}">
                    <td><strong>${item.sku}</strong></td>
                    <td style="text-align: right; font-weight: 700; color: #1c1917;">${qtdCell}</td>
                </tr>
            `;
        }).join('');

        totalItemsBadge.textContent = `${totalPecas} peça${totalPecas !== 1 ? 's' : ''}`;
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
            const displayId = s.session_id || s.id;
            return `
                <div class="session-item ${isActive ? 'active' : ''}" data-id="${s.id}">
                    <div class="session-info">
                        <strong>Contagem ${displayId}</strong>
                        <span>Criada em: ${s.created_at}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                        <span style="font-weight: 600; color: #C8B091; font-size: 0.85rem; white-space: nowrap;">${total} peças</span>
                        <button class="btn-export-csv-icon" data-id="${s.id}" title="Baixar CSV desta contagem">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                        </button>
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
                // Evita disparar se clicou nos botões de ação do card
                if (e.target.closest('.btn-delete-card') || e.target.closest('.btn-export-csv-icon')) return;

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

        // Evento para remover apenas o card da tela usando Modal Customizado da marca
        let sessionToDeleteId = null;
        const confirmDeleteModal = document.getElementById('confirmDeleteModal');
        const deleteBackdrop = document.getElementById('deleteBackdrop');
        const btnCancelDelete = document.getElementById('btnCancelDelete');
        const btnCancelDeleteX = document.getElementById('btnCancelDeleteX');
        const btnConfirmDelete = document.getElementById('btnConfirmDelete');

        function closeDeleteModal() {
            if (confirmDeleteModal) confirmDeleteModal.setAttribute('hidden', '');
            sessionToDeleteId = null;
        }

        if (btnCancelDelete) btnCancelDelete.onclick = closeDeleteModal;
        if (btnCancelDeleteX) btnCancelDeleteX.onclick = closeDeleteModal;
        if (deleteBackdrop) deleteBackdrop.onclick = closeDeleteModal;

        if (btnConfirmDelete) {
            btnConfirmDelete.onclick = async () => {
                if (!sessionToDeleteId) return;
                const targetId = sessionToDeleteId;
                closeDeleteModal();

                await deleteSessionLocal(targetId);
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
            };
        }

        // Evento para baixar CSV direto pelo ícone do card
        document.querySelectorAll('.btn-export-csv-icon').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const sId = btn.getAttribute('data-id');
                const targetSess = sessions.find(x => x.id === sId);
                if (targetSess) {
                    exportToCsvData(targetSess);
                }
            });
        });

        document.querySelectorAll('.btn-delete-card').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                sessionToDeleteId = btn.getAttribute('data-id');
                if (confirmDeleteModal) confirmDeleteModal.removeAttribute('hidden');
            });
        });
    }

    // Exportação em CSV genérica para qualquer sessão
    function exportToCsvData(sessData) {
        const targetSession = sessData || activeSessionData;
        const items = Object.values(targetSession.items || {});
        if (items.length === 0) {
            showToast('Nenhum item nesta contagem para exportar.');
            return;
        }

        let csvContent = 'ID,Data_Hora,SKU,Qtd_Contada\n';
        const sid = targetSession.session_id || targetSession.id;
        items.forEach(item => {
            csvContent += `"${sid}","${item.last_updated}","${item.sku}",${item.qtd}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        const fileName = `inventario_${sid.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('CSV baixado com sucesso!');
    }

    // Envia um único item lido instantaneamente para o Google Sheets em segundo plano
    async function syncSingleItemToSheets(dateStr, sku, qtd) {
        try {
            const sid = activeSessionData.session_id || activeSessionData.id;
            await fetch('/api/inventario', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-app-token': APP_TOKEN
                },
                body: JSON.stringify({
                    items: [{ session_id: sid, last_updated: dateStr, sku: sku, qtd: qtd }]
                })
            });
        } catch (e) {
            // Silencioso em caso de falha de conexão (modos offline)
        }
    }

    // Envio direto para o Google Sheets (aba 'inventarios')
    async function syncToGoogleSheets() {
        const itemsRaw = Object.values(activeSessionData.items || {});
        if (itemsRaw.length === 0) {
            showToast('Nenhum item para salvar na planilha.');
            return;
        }

        btnSyncSheets.disabled = true;
        btnSyncSheets.textContent = 'Enviando...';

        const sid = activeSessionData.session_id || activeSessionData.id;
        const items = itemsRaw.map(it => ({
            session_id: sid,
            last_updated: it.last_updated,
            sku: it.sku,
            qtd: it.qtd
        }));

        try {
            const res = await fetch('/api/inventario', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-app-token': APP_TOKEN
                },
                body: JSON.stringify({ items })
            });

            const data = await res.json();

            if (res.ok && data.ok) {
                showToast(`Sucesso! ${data.count} linhas salvas na aba 'inventarios'.`);
            } else {
                showToast(`Erro ao salvar: ${data.error || data.detail || 'Falha na resposta'}`);
            }
        } catch (err) {
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
                // Anti-bounce: evita bipar repetidamente o mesmo código em menos de 1.2s
                if (decodedText === lastScannedCode && (now - lastScanTime < 1200)) {
                    return;
                }
                lastScannedCode = decodedText;
                lastScanTime = now;

                // Feedback tátil/vibração no celular se disponível
                if (navigator.vibrate) {
                    try { navigator.vibrate(100); } catch (e) {}
                }

                // Soma +1 AUTOMATICAMENTE e instantaneamente
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
