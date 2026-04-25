import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME     = process.env.SHEET_NAME || 'Sheet1';
const APP_TOKEN      = process.env.APP_TOKEN;

function getSheets() {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
}

/** Converte índice numérico de coluna (0-based) para letra(s): 0→A, 25→Z, 26→AA */
function colLetter(idx) {
    let letter = '';
    let n = idx;
    while (n >= 0) {
        letter = String.fromCharCode((n % 26) + 65) + letter;
        n = Math.floor(n / 26) - 1;
    }
    return letter;
}

export default async function handler(req, res) {
    // Só aceita PATCH
    if (req.method !== 'PATCH') return res.status(405).end();

    // Autenticação pelo mesmo token da API de produtos
    if (APP_TOKEN && req.headers['x-app-token'] !== APP_TOKEN) {
        return res.status(401).json({ error: 'Não autorizado' });
    }

    const { codigo, corredor, armario, prateleira } = req.body || {};
    if (!codigo) return res.status(400).json({ error: 'codigo obrigatório' });

    if (!SPREADSHEET_ID) {
        return res.status(500).json({ error: 'SPREADSHEET_ID não configurado no ambiente' });
    }

    try {
        const sheets = getSheets();

        // 1. Lê todos os valores da aba para encontrar colunas e linhas
        const { data } = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: SHEET_NAME,
        });

        const rows = data.values;
        if (!rows || rows.length < 2) {
            return res.status(404).json({ error: 'Planilha vazia ou sem dados' });
        }

        const headers = rows[0].map(h => String(h).toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, ''));

        // Encontra índices das colunas necessárias
        const produtoIdx    = headers.findIndex(h => ['produto', 'codigo', 'cod', 'sku'].includes(h));
        const corredorIdx   = headers.findIndex(h => h === 'corredor');
        const armarioIdx    = headers.findIndex(h => ['armario', 'armário'].includes(h));
        const prateleiraIdx = headers.findIndex(h => h === 'prateleira');

        if (produtoIdx === -1) {
            return res.status(400).json({ error: 'Coluna PRODUTO não encontrada na planilha' });
        }
        if (corredorIdx === -1 && armarioIdx === -1 && prateleiraIdx === -1) {
            return res.status(400).json({ error: 'Nenhuma coluna de localização encontrada na planilha.' });
        }

        const paddedCodigo = String(codigo).trim().padStart(5, '0');

        // 2. Encontra todas as linhas com esse código (pode ter várias — uma por cor)
        const updates = [];
        rows.forEach((row, rowIdx) => {
            if (rowIdx === 0) return; // pula cabeçalho
            const rowCodigo = String(row[produtoIdx] || '').trim().padStart(5, '0');
            if (rowCodigo !== paddedCodigo) return;

            const sheetRow = rowIdx + 1; // Sheets usa base 1

            if (corredorIdx !== -1) {
                updates.push({
                    range: `${SHEET_NAME}!${colLetter(corredorIdx)}${sheetRow}`,
                    values: [[corredor ?? '']],
                });
            }
            if (armarioIdx !== -1) {
                updates.push({
                    range: `${SHEET_NAME}!${colLetter(armarioIdx)}${sheetRow}`,
                    values: [[armario ?? '']],
                });
            }
            if (prateleiraIdx !== -1) {
                updates.push({
                    range: `${SHEET_NAME}!${colLetter(prateleiraIdx)}${sheetRow}`,
                    values: [[prateleira ?? '']],
                });
            }
        });

        if (!updates.length) {
            return res.status(404).json({ error: `Produto ${paddedCodigo} não encontrado na planilha` });
        }

        // 3. Atualiza tudo em lote (uma única chamada para todas as linhas)
        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
                valueInputOption: 'RAW',
                data: updates,
            },
        });

        const colsUpdated = (corredorIdx !== -1 ? 1 : 0) + (armarioIdx !== -1 ? 1 : 0) + (prateleiraIdx !== -1 ? 1 : 0);
        const rowsUpdated = colsUpdated ? updates.length / colsUpdated : 0;
        return res.json({ ok: true, rowsUpdated });

    } catch (e) {
        console.error('[locations] Sheets API error:', e);
        return res.status(500).json({ error: 'Erro ao atualizar planilha', detail: e.message });
    }
}
