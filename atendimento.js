// atendimento.js - Fila de Atendimento Circular (Roleta de Vendas)

(function () {
    const APP_TOKEN = 'sdp-4K9mX2rP7nQ1wL5j';
    const API_ENDPOINT = '/api/atendimento';
    
    // Chaves de localStorage para resiliência offline (PWA)
    const STORAGE_KEY_FILA = 'sdp:atendimentoFila:v1';
    const STORAGE_KEY_OPCOES = 'sdp:atendimentoOpcoes:v1';
    const STORAGE_KEY_NEXT_ID = 'sdp:atendimentoNextId:v1';

    // Estado da aplicação
    let state = {
        opcoes: [],
        fila: [],
        proximoIdHistorico: 1,
        vendedoraDaVez: null,
        loading: true
    };

    // Opção selecionada para registrar
    let selectedOption = null;

    // Elementos DOM
    const el = {
        loadingOverlay: document.getElementById('loadingOverlay'),
        dashboardContent: document.getElementById('dashboardContent'),
        cardVez: document.getElementById('cardVez'),
        vezAvatar: document.getElementById('vezAvatar'),
        vezInitial: document.getElementById('vezInitial'),
        vezName: document.getElementById('vezName'),
        actionsGrid: document.getElementById('actionsGrid'),
        queueSection: document.getElementById('queueSection'),
        queueList: document.getElementById('queueList'),
        sellersList: document.getElementById('sellersList'),
        confirmModal: document.getElementById('confirmModal'),
        modalTitle: document.getElementById('modalTitle'),
        selectedOptionName: document.getElementById('selectedOptionName'),
        cancelBtn: document.getElementById('cancelBtn'),
        confirmBtn: document.getElementById('confirmBtn'),
        refreshBtn: document.getElementById('refreshBtn'),
        toast: document.getElementById('toast'),
        modalBackdrop: document.getElementById('modalBackdrop')
    };

    // Inicialização
    window.addEventListener('DOMContentLoaded', init);

    async function init() {
        setupEvents();
        await loadData();
    }

    function setupEvents() {
        el.refreshBtn.addEventListener('click', () => loadData(true));
        el.cancelBtn.addEventListener('click', hideConfirmModal);
        el.confirmBtn.addEventListener('click', handleConfirmRegister);
        el.modalBackdrop.addEventListener('click', hideConfirmModal);
    }

    // Carrega dados da API ou do LocalStorage (fallback)
    async function loadData(forceRefresh = false) {
        showLoading(true);
        try {
            if (!navigator.onLine && !forceRefresh) {
                throw new Error("Offline");
            }

            const res = await fetch(API_ENDPOINT, {
                method: 'GET',
                headers: { 'X-App-Token': APP_TOKEN }
            });

            if (!res.ok) throw new Error('Falha na resposta do servidor: ' + res.status);
            
            const data = await res.json();
            if (data.ok) {
                state.opcoes = data.opcoes;
                state.fila = data.fila.map(seller => {
                    if (!seller.statusDia) seller.statusDia = 'Ativo';
                    return seller;
                });
                state.proximoIdHistorico = data.proximoIdHistorico;
                
                // Salva no localStorage para uso offline posterior
                localStorage.setItem(STORAGE_KEY_OPCOES, JSON.stringify(state.opcoes));
                localStorage.setItem(STORAGE_KEY_FILA, JSON.stringify(state.fila));
                localStorage.setItem(STORAGE_KEY_NEXT_ID, String(state.proximoIdHistorico));
            } else {
                throw new Error(data.error || 'Erro desconhecido');
            }
        } catch (e) {
            console.warn('API indisponível ou offline. Usando cache local.', e);
            loadCachedData();
            showToast('Usando dados salvos localmente', 'warning');
        } finally {
            showLoading(false);
            renderDashboard();
        }
    }

    // Carrega fallback local
    function loadCachedData() {
        const cachedOpcoes = localStorage.getItem(STORAGE_KEY_OPCOES);
        const cachedFila = localStorage.getItem(STORAGE_KEY_FILA);
        const cachedNextId = localStorage.getItem(STORAGE_KEY_NEXT_ID);

        if (cachedOpcoes && cachedFila) {
            state.opcoes = JSON.parse(cachedOpcoes);
            state.fila = JSON.parse(cachedFila).map(seller => {
                if (!seller.statusDia) seller.statusDia = 'Ativo';
                return seller;
            });
            state.proximoIdHistorico = cachedNextId ? parseInt(cachedNextId, 10) : 1;
        } else {
            // Inicializa com dados padrão se não houver cache
            state.opcoes = [
                { id: 1, nome: "💰 Comprou", colunaContador: "💰 Total_Compras" },
                { id: 2, nome: "❌ Desistiu", colunaContador: "❌ Total_Desistencias" },
                { id: 3, nome: "💸 Achou caro", colunaContador: "💸 Total_Achou_Caro" },
                { id: 4, nome: "😶 Não falou nada", colunaContador: "😶 Total_Nao_Falou_Nada" },
                { id: 5, nome: "🚫 Não quis nada", colunaContador: "❌ Total_Desistencias" },
                { id: 6, nome: "❓ Outro", colunaContador: "❓ Total_Outro" }
            ];
            state.fila = [
                { vendedora: "Maria", posicao: 1, statusDia: "Ativo", totalAtendimentos: 0, totalCompras: 0, totalDesistencias: 0, totalAchouCaro: 0, totalNaoFalouNada: 0, totalOutro: 0, taxaConversaoPct: 0 },
                { vendedora: "Renata", posicao: 2, statusDia: "Ativo", totalAtendimentos: 0, totalCompras: 0, totalDesistencias: 0, totalAchouCaro: 0, totalNaoFalouNada: 0, totalOutro: 0, taxaConversaoPct: 0 },
                { vendedora: "Giovana", posicao: 3, statusDia: "Ativo", totalAtendimentos: 0, totalCompras: 0, totalDesistencias: 0, totalAchouCaro: 0, totalNaoFalouNada: 0, totalOutro: 0, taxaConversaoPct: 0 },
                { vendedora: "Joana", posicao: 4, statusDia: "Ativo", totalAtendimentos: 0, totalCompras: 0, totalDesistencias: 0, totalAchouCaro: 0, totalNaoFalouNada: 0, totalOutro: 0, taxaConversaoPct: 0 }
            ];
            state.proximoIdHistorico = 1;
            
            localStorage.setItem(STORAGE_KEY_OPCOES, JSON.stringify(state.opcoes));
            localStorage.setItem(STORAGE_KEY_FILA, JSON.stringify(state.fila));
            localStorage.setItem(STORAGE_KEY_NEXT_ID, "1");
        }
    }

    // Normalização de string idêntica ao backend
    function normalizeHeader(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9_\s-]/g, '')
            .toLowerCase()
            .trim();
    }

    // Mapeia Coluna_Contador para a chave do objeto vendedora
    function mapColumnToProperty(colName) {
        const clean = normalizeHeader(colName);
        const map = {
            'total_atendimentos': 'totalAtendimentos',
            'total_compras': 'totalCompras',
            'total_desistencias': 'totalDesistencias',
            'total_achou_caro': 'totalAchouCaro',
            'total_nao_falou_nada': 'totalNaoFalouNada',
            'total_outro': 'totalOutro'
        };
        return map[clean] || clean;
    }

    // Renderiza a tela baseada no estado
    function renderDashboard() {
        // 1. Identificar vendedora da vez
        const ativas = state.fila.filter(v => v.statusDia === "Ativo");
        ativas.sort((a, b) => Number(a.posicao) - Number(b.posicao));
        
        state.vendedoraDaVez = ativas.length > 0 ? ativas[0] : null;

        // Renderiza card da vez
        if (state.vendedoraDaVez) {
            el.vezName.textContent = state.vendedoraDaVez.vendedora;
            el.vezInitial.textContent = state.vendedoraDaVez.vendedora.charAt(0).toUpperCase();
            el.cardVez.classList.remove('no-sellers');
        } else {
            el.vezName.textContent = "Nenhuma vendedora ativa";
            el.vezInitial.textContent = "-";
            el.cardVez.classList.add('no-sellers');
        }

        // 2. Renderizar botões de ação
        el.actionsGrid.innerHTML = '';
        state.opcoes.forEach(opcao => {
            const btn = document.createElement('button');
            btn.className = 'action-card';
            btn.type = 'button';
            btn.disabled = !state.vendedoraDaVez;
            
            const emojiSpan = document.createElement('span');
            emojiSpan.className = 'action-emoji';
            
            // Extrai o emoji do nome se houver
            const emojiMatch = opcao.nome.match(/^([^\w\s\d]+)\s*(.*)/);
            let emoji = "📝";
            let label = opcao.nome;
            if (emojiMatch) {
                emoji = emojiMatch[1];
                label = emojiMatch[2];
            }
            
            emojiSpan.textContent = emoji;
            
            const labelSpan = document.createElement('span');
            labelSpan.className = 'action-label';
            labelSpan.textContent = label;

            btn.appendChild(emojiSpan);
            btn.appendChild(labelSpan);

            btn.addEventListener('click', () => showConfirmModal(opcao));
            el.actionsGrid.appendChild(btn);
        });

        // 3. Renderizar fila de espera (Próximas vendedoras ativas)
        el.queueList.innerHTML = '';
        if (ativas.length > 1) {
            el.queueSection.hidden = false;
            // Próximas na fila (todas ativas exceto a primeira)
            const proximas = ativas.slice(1);
            proximas.forEach((prox, idx) => {
                const item = document.createElement('div');
                item.className = 'queue-item';
                
                const badge = document.createElement('span');
                badge.className = 'queue-badge';
                badge.textContent = idx + 1;
                
                const name = document.createTextNode(prox.vendedora);
                
                item.appendChild(badge);
                item.appendChild(name);
                el.queueList.appendChild(item);
            });
        } else {
            el.queueSection.hidden = true;
        }

        // 4. Renderizar lista de gerenciamento de vendedores
        el.sellersList.innerHTML = '';
        
        // Ordena por ordem de posição total (incluindo inativas) para exibição estável
        const exibicaoSellers = [...state.fila].sort((a, b) => a.vendedora.localeCompare(b.vendedora));

        exibicaoSellers.forEach(seller => {
            const card = document.createElement('div');
            card.className = 'seller-row-card';

            const mainInfo = document.createElement('div');
            mainInfo.className = 'seller-main-info';

            const profile = document.createElement('div');
            profile.className = 'seller-profile';

            const circle = document.createElement('div');
            circle.className = 'seller-circle';
            circle.textContent = seller.vendedora.charAt(0).toUpperCase();

            const profileDetail = document.createElement('div');
            profileDetail.className = 'seller-profile-detail';

            const nameLbl = document.createElement('span');
            nameLbl.className = 'seller-name-label';
            nameLbl.textContent = seller.vendedora;

            const posTag = document.createElement('span');
            posTag.className = 'seller-pos-tag';
            posTag.textContent = seller.statusDia === 'Ativo' ? `Fila Pos: ${seller.posicao}` : 'Fora da fila';

            profileDetail.appendChild(nameLbl);
            profileDetail.appendChild(posTag);
            profile.appendChild(circle);
            profile.appendChild(profileDetail);

            const selectWrap = document.createElement('div');
            selectWrap.className = 'status-select-wrap';

            const select = document.createElement('select');
            select.className = 'status-select ' + seller.statusDia.toLowerCase();
            select.ariaLabel = `Status da vendedora ${seller.vendedora}`;
            
            const optAtivo = document.createElement('option');
            optAtivo.value = 'Ativo';
            optAtivo.textContent = '🟢 Ativo';
            optAtivo.selected = seller.statusDia === 'Ativo';

            const optInativo = document.createElement('option');
            optInativo.value = 'Inativo';
            optInativo.textContent = '🔴 Inativo';
            optInativo.selected = seller.statusDia === 'Inativo';

            select.appendChild(optAtivo);
            select.appendChild(optInativo);
            selectWrap.appendChild(select);

            mainInfo.appendChild(profile);
            mainInfo.appendChild(selectWrap);

            // Stats grid expandido
            const statsGrid = document.createElement('div');
            statsGrid.className = 'seller-stats-grid';

            const createStatItem = (val, lbl) => {
                const item = document.createElement('div');
                item.className = 'stat-item';
                const v = document.createElement('span');
                v.className = 'stat-val';
                v.textContent = val;
                const l = document.createElement('span');
                l.className = 'stat-lbl';
                l.textContent = lbl;
                item.appendChild(v);
                item.appendChild(l);
                return item;
            };

            const convertLbl = document.createElement('span');
            convertLbl.className = 'stat-lbl';
            convertLbl.textContent = 'Taxa de Conversão';
            
            const convertVal = document.createElement('span');
            convertVal.className = 'stat-val';
            convertVal.textContent = (seller.taxaConversaoPct || 0) + '%';
            
            const conversionHighlight = document.createElement('div');
            conversionHighlight.className = 'stat-item conversion-highlight';
            conversionHighlight.appendChild(convertLbl);
            conversionHighlight.appendChild(convertVal);

            statsGrid.appendChild(createStatItem(seller.totalAtendimentos || 0, 'Atendimentos'));
            statsGrid.appendChild(createStatItem(seller.totalCompras || 0, 'Compras'));
            statsGrid.appendChild(createStatItem(seller.totalDesistencias || 0, 'Desistências'));
            statsGrid.appendChild(createStatItem(seller.totalAchouCaro || 0, 'Caro'));
            statsGrid.appendChild(createStatItem(seller.totalNaoFalouNada || 0, 'Sem Falar'));
            statsGrid.appendChild(createStatItem(seller.totalOutro || 0, 'Outro'));
            statsGrid.appendChild(conversionHighlight);

            card.appendChild(mainInfo);
            card.appendChild(statsGrid);

            // Event listener de mudança de status
            select.addEventListener('change', (e) => handleStatusChange(seller.vendedora, e.target.value));

            el.sellersList.appendChild(card);
        });
    }

    // Modal de Confirmação
    function showConfirmModal(opcao) {
        selectedOption = opcao;
        el.selectedOptionName.textContent = opcao.nome;
        el.confirmModal.hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function hideConfirmModal() {
        el.confirmModal.hidden = true;
        document.body.style.overflow = '';
        selectedOption = null;
    }

    // Sincroniza dados em segundo plano (sem spinner de carregamento)
    async function syncDataSilently() {
        if (!navigator.onLine) return;
        try {
            const res = await fetch(API_ENDPOINT, {
                method: 'GET',
                headers: { 'X-App-Token': APP_TOKEN }
            });
            if (!res.ok) return;
            const data = await res.json();
            if (data.ok) {
                state.opcoes = data.opcoes;
                state.fila = data.fila.map(seller => {
                    if (!seller.statusDia) seller.statusDia = 'Ativo';
                    return seller;
                });
                state.proximoIdHistorico = data.proximoIdHistorico;
                
                localStorage.setItem(STORAGE_KEY_OPCOES, JSON.stringify(state.opcoes));
                localStorage.setItem(STORAGE_KEY_FILA, JSON.stringify(state.fila));
                localStorage.setItem(STORAGE_KEY_NEXT_ID, String(state.proximoIdHistorico));
                
                renderDashboard();
            }
        } catch (e) {
            console.warn('Erro na sincronização em segundo plano:', e);
        }
    }

    // Confirmação e gravação do atendimento
    async function handleConfirmRegister() {
        if (!state.vendedoraDaVez || !selectedOption) return;
        
        const currentVendedora = state.vendedoraDaVez;
        const vendedoraName = currentVendedora.vendedora;
        const attPos = Number(currentVendedora.posicao);
        const optionName = selectedOption.nome;
        const optionCol = selectedOption.colunaContador;

        hideConfirmModal();

        try {
            // 1. Atualizar contadores da vendedora no estado local
            const updatedFila = state.fila.map(seller => {
                const s = { ...seller };
                if (s.vendedora === vendedoraName) {
                    s.totalAtendimentos = (s.totalAtendimentos || 0) + 1;
                    
                    const prop = mapColumnToProperty(optionCol);
                    if (prop && s[prop] !== undefined) {
                        s[prop] = (s[prop] || 0) + 1;
                    }
                    
                    // Recalcula conversão
                    const compras = s.totalCompras || 0;
                    s.taxaConversaoPct = s.totalAtendimentos > 0 ? parseFloat(((compras / s.totalAtendimentos) * 100).toFixed(2)) : 0;
                }

                // 2. Rotacionar Fila Circular
                const currentPos = Number(s.posicao);
                if (s.vendedora === vendedoraName) {
                    s.posicao = 4;
                } else if (currentPos > attPos) {
                    s.posicao = currentPos - 1;
                }
                
                return s;
            });

            // 3. Montar o novo log para o histórico
            const now = new Date();
            const dataHora = now.toLocaleString('pt-BR');
            const newHistorico = {
                id: state.proximoIdHistorico,
                dataHora: dataHora,
                vendedoraAtendeu: vendedoraName,
                resultadoAtendimento: optionName
            };

            // Atualiza estado local instantaneamente para a vendedora da vez mudar na hora!
            state.fila = updatedFila;
            state.proximoIdHistorico += 1;

            // Salva cache local
            localStorage.setItem(STORAGE_KEY_FILA, JSON.stringify(state.fila));
            localStorage.setItem(STORAGE_KEY_NEXT_ID, String(state.proximoIdHistorico));

            // Re-renderiza o painel imediatamente (a vendedora muda instantaneamente)
            renderDashboard();

            // 4. Salvar via API em segundo plano
            if (navigator.onLine) {
                fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-App-Token': APP_TOKEN
                    },
                    body: JSON.stringify({
                        updatedFila,
                        newHistorico
                    })
                }).then(async response => {
                    if (response.ok) {
                        showToast(`Atendimento gravado na nuvem!`, 'success');
                        await syncDataSilently();
                    } else {
                        console.error('API Error response:', response.status);
                        showToast(`Erro ao sincronizar. Gravado localmente.`, 'warning');
                    }
                }).catch(e => {
                    console.error('API network error:', e);
                    showToast(`Salvo localmente (sem internet)`, 'warning');
                });
            } else {
                showToast(`Salvo localmente (modo offline)`, 'warning');
            }

        } catch (err) {
            console.error(err);
            showToast('Erro ao gravar atendimento', 'error');
        }
    }

    // Mudança de status da vendedora
    async function handleStatusChange(vendedoraName, newStatus) {
        try {
            // Atualiza estado local
            const updatedFila = state.fila.map(seller => {
                const s = { ...seller };
                if (s.vendedora === vendedoraName) {
                    s.statusDia = newStatus;
                }
                return s;
            });

            state.fila = updatedFila;
            localStorage.setItem(STORAGE_KEY_FILA, JSON.stringify(state.fila));
            renderDashboard();

            if (navigator.onLine) {
                fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-App-Token': APP_TOKEN
                    },
                    body: JSON.stringify({
                        updatedFila
                    })
                }).then(async response => {
                    if (response.ok) {
                        showToast(`Status atualizado na nuvem`, 'success');
                        await syncDataSilently();
                    }
                }).catch(e => {
                    console.error(e);
                });
            }
        } catch (err) {
            console.error(err);
            showToast('Erro ao atualizar status', 'error');
        }
    }

    // Utilitários UI
    function showLoading(show) {
        state.loading = show;
        if (show) {
            el.loadingOverlay.style.display = 'flex';
            el.dashboardContent.hidden = true;
        } else {
            el.loadingOverlay.style.display = 'none';
            el.dashboardContent.hidden = false;
        }
    }

    function showToast(message, type = 'success') {
        el.toast.textContent = message;
        el.toast.className = 'toast ' + type;
        el.toast.hidden = false;
        el.toast.classList.remove('hiding');
        
        if (navigator.vibrate) {
            if (type === 'error') navigator.vibrate([100, 50, 100]);
            else if (type === 'warning') navigator.vibrate(50);
            else navigator.vibrate(30);
        }

        setTimeout(() => {
            el.toast.classList.add('hiding');
            setTimeout(() => {
                el.toast.hidden = true;
                el.toast.classList.remove('hiding');
            }, 300);
        }, 2500);
    }
})();
