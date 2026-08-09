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
    if (req.method !== 'POST') return res.status(405).end();

    const receivedToken = req.headers['x-app-token'];
    console.log('[API inventario] Token recebido:', receivedToken, '| APP_TOKEN esperado:', APP_TOKEN);

    if (APP_TOKEN && receivedToken !== APP_TOKEN) {
        console.error('[API inventario] Autenticação falhou: token incompatível');
        return res.status(401).json({ error: 'Não autorizado', receivedToken, expectedToken: APP_TOKEN });
    }

    const { items } = req.body || {};
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Lista de itens vazia ou inválida' });
    }

    if (!SPREADSHEET_ID) {
        return res.status(500).json({ error: 'SPREADSHEET_ID não configurado' });
    }

    try {
        const sheets = getSheets();

        // Prepara as linhas no formato: Data_Hora | SKU | Qtd_Contada
        const rowsToAppend = items.map(item => [
            item.last_updated || '',
            item.sku || '',
            item.qtd || 0
        ]);

        // Adiciona as novas linhas ao final da aba 'inventarios'
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `'${INVENTORY_SHEET_NAME}'!A:C`,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: rowsToAppend,
            },
        });

        return res.json({ ok: true, count: rowsToAppend.length });
    } catch (e) {
        console.error('[inventario] Sheets API error:', e);
        return res.status(500).json({ error: 'Erro ao salvar na planilha', detail: e.message });
    }
}
