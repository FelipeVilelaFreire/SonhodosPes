export default async function handler(req, res) {
    console.log('[API/produtos] Iniciando request');
    if (req.method !== 'GET') return res.status(405).end();

    const token = process.env.APP_TOKEN;
    if (token && req.headers['x-app-token'] !== token) {
        console.error('[API/produtos] Token inválido ou ausente:', req.headers['x-app-token']);
        return res.status(401).json({ error: 'Não autorizado' });
    }

    let csvUrl = process.env.URL_TABLE;
    console.log('[API/produtos] URL_TABLE configurada:', !!csvUrl);
    if (!csvUrl) return res.status(500).json({ error: 'URL_TABLE não configurada no ambiente' });

    try {
        const u = new URL(csvUrl);
        if (u.pathname.endsWith('/pubhtml') || u.searchParams.get('output') !== 'csv') {
            u.pathname = u.pathname.replace(/\/pubhtml$/, '/pub');
            u.search = '?output=csv';
            csvUrl = u.toString();
        }
    } catch (_) { /* URL inválida — vai falhar no fetch abaixo */ }

    try {
        console.log('[API/produtos] Fazendo fetch para a url convertida...');
        const upstream = await fetch(csvUrl, { cache: 'no-store' });
        console.log('[API/produtos] Resposta do Google Sheets status:', upstream.status);
        if (!upstream.ok) return res.status(502).json({ error: `Sheets retornou ${upstream.status}` });

        const text = await upstream.text();
        console.log('[API/produtos] Tamanho do CSV recebido:', text.length);

        if (text.trimStart().startsWith('<')) {
            return res.status(502).json({
                error: 'Google Sheets retornou HTML em vez de CSV',
                hint: 'Verifique se a planilha está publicada em Arquivo → Publicar na web → formato CSV',
                url: csvUrl,
            });
        }

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).send(text);
    } catch (e) {
        res.status(502).json({ error: 'Falha ao buscar planilha', detail: e.message });
    }
}
