export default async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(400).json({ error: 'Missing Authorization header' });
        }
        const response = await fetch('https://oauth.deriv.com/oauth2/legacy/tokens', {
            method: 'POST',
            headers: { Authorization: authHeader },
        });
        const data = await response.json();
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
        res.status(response.status).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
