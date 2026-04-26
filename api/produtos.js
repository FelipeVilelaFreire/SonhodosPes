import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME     = process.env.SHEET_NAME || 'Sheet1';
const APP_TOKEN      = process.env.APP_TOKEN;

function getSheets() {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY não configurada');
    const credentials = JSON.parse(raw);
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    return google.sheets({ version: 'v4', auth });
}

function toCSV(rows) {
    return rows.map(row =>
        row.map(cell => {
            const s = String(cell ?? '');
            return s.includes(',') || s.includes('"') || s.includes('\n')
                ? `"${s.replace(/"/g, '""')}"`
                : s;
        }).join(',')
    ).join('\n');
}

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();

    if (APP_TOKEN && req.headers['x-app-token'] !== APP_TOKEN) {
        return res.status(401).json({ error: 'Não autorizado' });
    }

    if (!SPREADSHEET_ID) {
        return res.status(500).json({ error: 'SPREADSHEET_ID não configurado no ambiente' });
    }

    try {
        const sheets = getSheets();
        const { data } = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: SHEET_NAME,
        });

        const rows = data.values;
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'Planilha vazia' });
        }

        const csv = toCSV(rows);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).send(csv);
    } catch (e) {
        return res.status(500).json({ error: 'Erro ao ler planilha', detail: e.message });
    }
}
