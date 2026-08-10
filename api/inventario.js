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

        // ESCRITA NA PLANILHA (POST)
        if (req.method === 'POST') {
            const { items } = req.body || {};
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: 'Lista de itens vazia ou inválida' });
            }

            const rowsToAppend = items.map(item => [
                item.session_id || item.sessionId || 'CONT-001',
                item.last_updated || '',
                item.sku || '',
                item.qtd || 0
            ]);

            await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: `'${targetSheet}'!A:D`,
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                requestBody: {
                    values: rowsToAppend,
                },
            });

            return res.json({ ok: true, count: rowsToAppend.length });
        }
    } catch (e) {
        console.error('[inventario] API error:', e);
        return res.status(500).json({ error: 'Erro ao processar planilha', detail: e.message });
    }
}
