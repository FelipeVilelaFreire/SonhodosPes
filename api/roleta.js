import { randomInt } from 'crypto';
import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const CONFIGURED_SHEET_NAME = process.env.ROLETA_SHEET_NAME || process.env.ROULETTE_SHEET_NAME;
const SHEET_NAMES = Array.from(new Set([CONFIGURED_SHEET_NAME, 'roleta', 'rotina'].filter(Boolean)));
const APP_TOKEN = process.env.APP_TOKEN;

function getSheets() {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY nao configurada');

    let credentials;
    try {
        credentials = JSON.parse(raw);
    } catch (e) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY JSON invalido: ' + e.message);
    }

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return google.sheets({ version: 'v4', auth });
}

function quoteSheetName(name) {
    return `'${String(name).replace(/'/g, "''")}'`;
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
        .toLowerCase()
        .trim();
}

function parseQuantity(value) {
    const raw = String(value ?? '').trim();
    if (!raw) return 0;

    const normalized = raw.replace(/\./g, '').replace(',', '.');
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) return 0;

    return Math.max(0, Math.floor(parsed));
}

function findColumns(rows) {
    const firstRow = rows[0] || [];
    const headers = firstRow.map(normalizeHeader);

    let itemIdx = headers.findIndex(h => ['item', 'valor', 'premio', 'produto', 'nome', 'descricao'].includes(h));
    let qtyIdx = headers.findIndex(h => ['quantidade', 'qtd', 'qty', 'estoque', 'chances'].includes(h));
    let startIdx = 1;

    if (itemIdx === -1 && qtyIdx === -1) {
        itemIdx = 0;
        qtyIdx = 1;
        startIdx = 0;
    } else {
        if (itemIdx === -1) itemIdx = 0;
        if (qtyIdx === -1) qtyIdx = itemIdx === 0 ? 1 : 0;
    }

    if (itemIdx === qtyIdx || itemIdx < 0 || qtyIdx < 0) {
        throw new Error('A aba roleta precisa ter as colunas item e quantidade');
    }

    return { itemIdx, qtyIdx, startIdx };
}

async function readPrizeRowsFromSheet(sheets, sheetName) {
    const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${quoteSheetName(sheetName)}!A:ZZ`,
    });

    const rows = data.values || [];
    if (!rows.length) throw new Error(`Aba ${sheetName} vazia`);

    const { itemIdx, qtyIdx, startIdx } = findColumns(rows);
    const prizes = [];

    for (let i = startIdx; i < rows.length; i++) {
        const row = rows[i] || [];
        const item = String(row[itemIdx] ?? '').trim();
        if (!item) continue;

        prizes.push({
            item,
            quantidade: parseQuantity(row[qtyIdx]),
            rowNumber: i + 1,
            quantityColumnIndex: qtyIdx,
        });
    }

    return prizes;
}

async function readPrizeRows(sheets) {
    const errors = [];

    for (const sheetName of SHEET_NAMES) {
        try {
            const prizes = await readPrizeRowsFromSheet(sheets, sheetName);
            return { sheetName, prizes };
        } catch (e) {
            errors.push(`${sheetName}: ${e.message}`);
        }
    }

    throw new Error(errors.join(' | '));
}

function publicPrize(prize) {
    return {
        item: prize.item,
        quantidade: prize.quantidade,
    };
}

function totalQuantity(prizes) {
    return prizes.reduce((sum, prize) => sum + Math.max(0, prize.quantidade), 0);
}

function pickPrize(prizes) {
    const total = totalQuantity(prizes);
    if (total <= 0) return null;

    const ticket = randomInt(1, total + 1);
    let accumulated = 0;

    for (const prize of prizes) {
        accumulated += Math.max(0, prize.quantidade);
        if (ticket <= accumulated) return prize;
    }

    return null;
}

export default async function handler(req, res) {
    if (!['GET', 'POST'].includes(req.method)) return res.status(405).end();

    if (APP_TOKEN && req.headers['x-app-token'] !== APP_TOKEN) {
        return res.status(401).json({ error: 'Nao autorizado' });
    }

    if (!SPREADSHEET_ID) {
        return res.status(500).json({ error: 'SPREADSHEET_ID nao configurado no ambiente' });
    }

    res.setHeader('Cache-Control', 'no-store');

    try {
        const sheets = getSheets();
        const { sheetName, prizes } = await readPrizeRows(sheets);

        if (req.method === 'GET') {
            return res.status(200).json({
                ok: true,
                sheet: sheetName,
                total: totalQuantity(prizes),
                items: prizes.map(publicPrize),
            });
        }

        const picked = pickPrize(prizes);
        if (!picked) {
            return res.status(409).json({ error: 'Roleta sem itens disponiveis' });
        }

        const nextQuantity = Math.max(0, picked.quantidade - 1);
        const range = `${quoteSheetName(sheetName)}!${colLetter(picked.quantityColumnIndex)}${picked.rowNumber}`;

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range,
            valueInputOption: 'RAW',
            requestBody: {
                values: [[nextQuantity]],
            },
        });

        const updatedPrizes = prizes.map(prize => {
            if (prize.rowNumber !== picked.rowNumber) return prize;
            return { ...prize, quantidade: nextQuantity };
        });

        return res.status(200).json({
            ok: true,
            prize: {
                item: picked.item,
                quantidadeAntes: picked.quantidade,
                quantidadeDepois: nextQuantity,
            },
            total: totalQuantity(updatedPrizes),
            items: updatedPrizes.map(publicPrize),
        });
    } catch (e) {
        return res.status(500).json({ error: 'Erro na roleta', detail: e.message });
    }
}
