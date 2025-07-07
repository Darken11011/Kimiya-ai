// Simple health check endpoint for Vercel
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Call Flow Weaver API'
  });
}
