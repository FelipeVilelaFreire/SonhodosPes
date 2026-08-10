import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const INVENTORY_SHEET_NAME = process.env.INVENTORY_SHEET_NAME || 'inventarios';
const APP_TOKEN = process.env.APP_TOKEN;

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

export default async function handler(req, res) {
    if (!['GET', 'POST'].includes(req.method)) return res.status(405).end();

    const receivedToken = req.headers['x-app-token'];
    if (APP_TOKEN && receivedToken !== APP_TOKEN) {
        return res.status(401).json({ error: 'Não autorizado' });
    }

    if (!SPREADSHEET_ID) {
        return res.status(500).json({ error: 'SPREADSHEET_ID não configurado' });
    }

    try {
        const sheets = getSheets();

        // 1. Busca dinamicamente os nomes de todas as abas da planilha no Google
        const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
        const sheetNames = (meta.data.sheets || []).map(s => s.properties.title);
        const targetSheet = sheetNames.find(n => n.trim().toLowerCase() === 'inventarios') || 'inventarios';

        // LEITURA DO HISTÓRICO DA PLANILHA (GET)
        if (req.method === 'GET') {
            const { data } = await sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: `'${targetSheet}'!A:D`,
            });

            const rows = data.values || [];
            if (rows.length < 2) {
                return res.json({ ok: true, sessions: [] });
            }

            // Agrupa as linhas por ID de Sessão
            const sessionsMap = new Map();
            for (let i = 1; i < rows.length; i++) {
                const [id, dataHora, sku, qtd] = rows[i];
                if (!id || !sku) continue;

                const cleanId = String(id).trim();
                if (!sessionsMap.has(cleanId)) {
                    sessionsMap.set(cleanId, {
                        id: cleanId,
                        session_id: cleanId,
                        name: `Contagem ${dataHora ? dataHora.split(' ')[0] : ''}`,
                        created_at: dataHora || '',
                        items: {}
                    });
                }

                const sess = sessionsMap.get(cleanId);
                const cleanSku = String(sku).trim().toUpperCase();
                const cleanQtd = parseInt(qtd, 10) || 0;

                if (sess.items[cleanSku]) {
                    sess.items[cleanSku].qtd += cleanQtd;
                } else {
                    sess.items[cleanSku] = {
                        sku: cleanSku,
                        qtd: cleanQtd,
                        last_updated: dataHora || ''
                    };
                }
            }

            const sessions = Array.from(sessionsMap.values());
            return res.json({ ok: true, sessions });
        }

        // ESCRITA / ATUALIZAÇÃO INTELIGENTE NA PLANILHA (POST)
        if (req.method === 'POST') {
            const { items } = req.body || {};
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: 'Lista de itens vazia ou inválida' });
            }

            // 1. Lê as linhas atuais da planilha para verificar se o SKU e ID já existem
            const { data } = await sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: `'${targetSheet}'!A:D`,
            });

            const rows = data.values || [];
            const updates = [];
            const appends = [];

            items.forEach(item => {
                const targetId = String(item.session_id || item.sessionId || 'CONT-001').trim();
                const targetSku = String(item.sku || '').trim().toUpperCase();
                const targetQtd = parseInt(item.qtd, 10) || 0;
                const targetDate = item.last_updated || '';

                let foundRowIndex = -1;
                for (let r = 1; r < rows.length; r++) {
                    const [rowId, , rowSku] = rows[r];
                    if (String(rowId).trim() === targetId && String(rowSku).trim().toUpperCase() === targetSku) {
                        foundRowIndex = r;
                        break;
                    }
                }

                if (foundRowIndex !== -1) {
                    // Linha já existe: atualiza a quantidade daquela linha exata (1-based row index)
                    const rowIndex = foundRowIndex + 1;
                    updates.push({
                        range: `'${targetSheet}'!A${rowIndex}:D${rowIndex}`,
                        values: [[targetId, targetDate, targetSku, targetQtd]]
                    });
                } else {
                    // Linha nova: adiciona ao final
                    appends.push([targetId, targetDate, targetSku, targetQtd]);
                }
            });

            if (updates.length > 0) {
                await sheets.spreadsheets.values.batchUpdate({
                    spreadsheetId: SPREADSHEET_ID,
                    requestBody: {
                        valueInputOption: 'USER_ENTERED',
                        data: updates
                    }
                });
            }

            if (appends.length > 0) {
                await sheets.spreadsheets.values.append({
                    spreadsheetId: SPREADSHEET_ID,
                    range: `'${targetSheet}'!A:D`,
                    valueInputOption: 'USER_ENTERED',
                    insertDataOption: 'INSERT_ROWS',
                    requestBody: {
                        values: appends,
                    },
                });
            }

            return res.json({ ok: true, count: items.length });
        }
    } catch (e) {
        console.error('[inventario] API error:', e);
        return res.status(500).json({ error: 'Erro ao processar planilha', detail: e.message });
    }
}
