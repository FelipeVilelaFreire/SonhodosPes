import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const APP_TOKEN      = process.env.APP_TOKEN;

function getSheets() {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY não configurada');
    let credentials;
    try {
        credentials = JSON.parse(raw);
    } catch (e) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY JSON inválido: ' + e.message);
    }
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
}

function colLetter(idx) {
    let letter = '';
    let n = idx;
    while (n >= 0) {
        letter = String.fromCharCode((n % 26) + 65) + letter;
        n = Math.floor(n / 26) - 1;
    }
    return letter;
}

function normalizeHeader(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_\s-]/g, '')
        .toLowerCase()
        .trim();
}

const opcoesKeyMap = {
    'id_opcao': 'id',
    'nome_opcao': 'nome',
    'coluna_contador': 'colunaContador'
};

const filaKeyMap = {
    'vendedora': 'vendedora',
    'posicao': 'posicao',
    'status_dia': 'statusDia',
    'status_diario': 'statusDia',
    'total_atendimentos': 'totalAtendimentos',
    'total_compras': 'totalCompras',
    'total_desistencias': 'totalDesistencias',
    'total_achou_caro': 'totalAchouCaro',
    'total_nao_falou_nada': 'totalNaoFalouNada',
    'total_outro': 'totalOutro',
    'taxa_conversao_pct': 'taxaConversaoPct'
};

const historicoKeyMap = {
    'id': 'id',
    'data': 'data',
    'hora': 'hora',
    'vendedora_atendeu': 'vendedoraAtendeu',
    'resultado_atendimento': 'resultadoAtendimento'
};

function parseRows(rows, keyMap) {
    if (!rows || rows.length < 2) return [];
    const headers = rows[0].map(normalizeHeader);
    const parsed = [];
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const obj = {};
        headers.forEach((header, idx) => {
            const key = keyMap[header] || header;
            let val = row[idx] ?? '';
            
            // Converte colunas numéricas conhecidas
            if ([
                'id', 'posicao', 'total_atendimentos', 'total_compras', 
                'total_desistencias', 'total_achou_caro', 'total_nao_falou_nada', 
                'total_outro', 'taxa_conversao_pct'
            ].includes(header)) {
                val = String(val).trim();
                if (val === '') {
                    val = 0;
                } else {
                    val = Number(val.replace('%', '').replace(',', '.'));
                    if (isNaN(val)) val = 0;
                }
            }
            
            // Se for status e estiver vazio, define como Ativo por padrão
            if (key === 'statusDia') {
                val = String(val).trim();
                if (!val) val = 'Ativo';
            }
            
            obj[key] = val;
        });
        parsed.push(obj);
    }
    return parsed;
}

function objectsToRows(objects, headers, keyMap) {
    return objects.map(obj => {
        return headers.map(header => {
            const cleanHeader = normalizeHeader(header);
            const key = keyMap[cleanHeader] || cleanHeader;
            const val = obj[key];
            return val !== undefined ? String(val) : '';
        });
    });
}

export default async function handler(req, res) {
    if (!['GET', 'POST'].includes(req.method)) return res.status(405).end();

    if (APP_TOKEN && req.headers['x-app-token'] !== APP_TOKEN) {
        return res.status(401).json({ error: 'Não autorizado' });
    }

    if (!SPREADSHEET_ID) {
        return res.status(500).json({ error: 'SPREADSHEET_ID não configurada' });
    }

    try {
        const sheets = getSheets();

        if (req.method === 'GET') {
            const ranges = [
                'opcoes_atendimento!A:C',
                'controle_fila!A:J',
                'historico_atendimentos!A:E'
            ];

            const { data } = await sheets.spreadsheets.values.batchGet({
                spreadsheetId: SPREADSHEET_ID,
                ranges,
            });

            const valueRanges = data.valueRanges || [];
            
            const opcoesRows = valueRanges[0]?.values || [];
            const filaRows = valueRanges[1]?.values || [];
            const historicoRows = valueRanges[2]?.values || [];

            const opcoes = parseRows(opcoesRows, opcoesKeyMap);
            const fila = parseRows(filaRows, filaKeyMap);
            const parsedHist = parseRows(historicoRows, historicoKeyMap);

            // 1. Recalcula as estatísticas de controle_fila com base em historico_atendimentos
            const recalculados = fila.map(v => ({
                ...v,
                totalAtendimentos: 0,
                totalCompras: 0,
                totalDesistencias: 0,
                totalAchouCaro: 0,
                totalNaoFalouNada: 0,
                totalOutro: 0,
                taxaConversaoPct: '0%'
            }));

            // Mapeamento de nome de opção para coluna/propriedade
            const opcaoToColProperty = {};
            opcoes.forEach(opt => {
                const prop = mapColumnToProperty(opt.colunaContador);
                opcaoToColProperty[normalizeHeader(opt.nome)] = prop;
            });

            parsedHist.forEach(log => {
                const sellerName = String(log.vendedoraAtendeu || '').toLowerCase().trim();
                const seller = recalculados.find(v => String(v.vendedora || '').toLowerCase().trim() === sellerName);
                if (seller) {
                    seller.totalAtendimentos += 1;
                    
                    const cleanResultName = normalizeHeader(log.resultadoAtendimento);
                    const prop = opcaoToColProperty[cleanResultName];
                    if (prop && seller[prop] !== undefined) {
                        seller[prop] += 1;
                    }
                }
            });

            // Recalcula taxas de conversão (%)
            recalculados.forEach(seller => {
                const compras = seller.totalCompras || 0;
                const pct = seller.totalAtendimentos > 0 ? Math.round((compras / seller.totalAtendimentos) * 100) : 0;
                seller.taxaConversaoPct = pct + '%';
            });

            // 2. Compara se houve qualquer mudança (seja por inserção, edição ou limpeza no histórico)
            let hasChanges = false;
            for (let i = 0; i < fila.length; i++) {
                const original = fila[i];
                const recalculated = recalculados[i];
                
                if (
                    original.totalAtendimentos !== recalculated.totalAtendimentos ||
                    original.totalCompras !== recalculated.totalCompras ||
                    original.totalDesistencias !== recalculated.totalDesistencias ||
                    original.totalAchouCaro !== recalculated.totalAchouCaro ||
                    original.totalNaoFalouNada !== recalculated.totalNaoFalouNada ||
                    original.totalOutro !== recalculated.totalOutro ||
                    original.taxaConversaoPct !== recalculated.taxaConversaoPct
                ) {
                    hasChanges = true;
                    break;
                }
            }

            // Se o histórico foi limpo, também resetamos as posições para o padrão (Maria 1, Renata 2...)
            if (parsedHist.length === 0 && fila.some(v => v.posicao !== 1 && v.posicao !== 2 && v.posicao !== 3 && v.posicao !== 4)) {
                hasChanges = true;
            }

            if (hasChanges) {
                // Se o histórico estiver totalmente zerado, restaura a ordem inicial das posições
                if (parsedHist.length === 0) {
                    const defaultPositions = {
                        'maria': 1,
                        'renata': 2,
                        'giovana': 3,
                        'joana': 4
                    };
                    recalculados.forEach(v => {
                        const nameLower = String(v.vendedora || '').toLowerCase().trim();
                        v.posicao = defaultPositions[nameLower] || 4;
                    });
                } else {
                    // Mantém as posições atuais se houver histórico para não bagunçar a fila
                    recalculados.forEach((v, idx) => {
                        v.posicao = fila[idx].posicao;
                    });
                }

                // Salva a nova fila corrigida no Google Sheets
                const rangesCheck = ['controle_fila!A1:J1'];
                const { data: headerData } = await sheets.spreadsheets.values.batchGet({
                    spreadsheetId: SPREADSHEET_ID,
                    ranges: rangesCheck,
                });
                const controleFilaHeaders = headerData.valueRanges[0]?.values?.[0] || [];
                if (controleFilaHeaders.length > 0) {
                    const filaValues = objectsToRows(recalculados, controleFilaHeaders, filaKeyMap);
                    const endCol = colLetter(controleFilaHeaders.length - 1);
                    await sheets.spreadsheets.values.update({
                        spreadsheetId: SPREADSHEET_ID,
                        range: `controle_fila!A2:${endCol}${recalculados.length + 1}`,
                        valueInputOption: 'RAW',
                        requestBody: {
                            values: filaValues
                        }
                    });
                }
                
                // Sincroniza o objeto fila para o retorno
                fila.forEach((v, idx) => {
                    Object.assign(v, recalculados[idx]);
                });
            }

            let proximoIdHistorico = 1;
            if (parsedHist.length > 0) {
                const maxId = parsedHist.reduce((max, h) => Math.max(max, h.id || 0), 0);
                proximoIdHistorico = maxId + 1;
            }

            return res.status(200).json({
                ok: true,
                opcoes,
                fila,
                proximoIdHistorico
            });
        }

        if (req.method === 'POST') {
            const { updatedFila, newHistorico } = req.body || {};

            if (!updatedFila && !newHistorico) {
                return res.status(400).json({ error: 'Nenhum dado fornecido para atualização' });
            }

            // 1. Para remapear os objetos de volta ao formato da planilha, primeiro precisamos ler os cabeçalhos atuais
            const ranges = [
                'controle_fila!A1:J1',
                'historico_atendimentos!A1:E1'
            ];

            const { data } = await sheets.spreadsheets.values.batchGet({
                spreadsheetId: SPREADSHEET_ID,
                ranges,
            });

            const valueRanges = data.valueRanges || [];
            const controleFilaHeaders = valueRanges[0]?.values?.[0] || [];
            const historicoHeaders = valueRanges[1]?.values?.[0] || [];

            const batchUpdates = [];

            if (updatedFila && updatedFila.length > 0) {
                if (controleFilaHeaders.length === 0) {
                    return res.status(400).json({ error: 'Cabeçalhos de controle_fila não encontrados na planilha' });
                }

                const filaValues = objectsToRows(updatedFila, controleFilaHeaders, filaKeyMap);
                const endCol = colLetter(controleFilaHeaders.length - 1);
                
                batchUpdates.push({
                    range: `controle_fila!A2:${endCol}${updatedFila.length + 1}`,
                    values: filaValues
                });
            }

            if (batchUpdates.length > 0) {
                await sheets.spreadsheets.values.batchUpdate({
                    spreadsheetId: SPREADSHEET_ID,
                    requestBody: {
                        valueInputOption: 'RAW',
                        data: batchUpdates
                    }
                });
            }

            if (newHistorico) {
                if (historicoHeaders.length === 0) {
                    return res.status(400).json({ error: 'Cabeçalhos de historico_atendimentos não encontrados na planilha' });
                }

                const historicoValue = objectsToRows([newHistorico], historicoHeaders, historicoKeyMap)[0];
                
                await sheets.spreadsheets.values.append({
                    spreadsheetId: SPREADSHEET_ID,
                    range: 'historico_atendimentos!A:E',
                    valueInputOption: 'RAW',
                    requestBody: {
                        values: [historicoValue]
                    }
                });
            }

            return res.status(200).json({ ok: true });
        }

    } catch (e) {
        console.error('[atendimento] Sheets API error:', e);
        return res.status(500).json({ error: 'Erro ao processar requisição', detail: e.message });
    }
}
