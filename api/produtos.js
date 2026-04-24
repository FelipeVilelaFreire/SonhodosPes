export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();

    const csvUrl = process.env.URL_TABLE;
    if (!csvUrl) return res.status(500).json({ error: 'URL_TABLE não configurada no ambiente' });

    try {
        const upstream = await fetch(csvUrl, { cache: 'no-store' });
        if (!upstream.ok) return res.status(502).json({ error: `Sheets retornou ${upstream.status}` });

        const text = await upstream.text();
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).send(text);
    } catch (e) {
        res.status(502).json({ error: 'Falha ao buscar planilha', detail: e.message });
    }
}
