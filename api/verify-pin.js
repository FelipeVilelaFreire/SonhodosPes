export default function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const { pin } = req.body || {};
    const correctPin = process.env.SDP_PIN || '1357';

    const valid = String(pin).trim() === String(correctPin).trim();

    res.status(200).json({ valid });
}
