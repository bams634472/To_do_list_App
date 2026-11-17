import { configureWebPush } from '../../server/push.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    return res.status(200).json({ publicKey: configureWebPush() });
  } catch (error) {
    console.error('Push key configuration error:', error);
    return res.status(503).json({ error: 'Background notifications are not configured on the server.' });
  }
}
