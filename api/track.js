const PIXEL_ID = '3315919061943972'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { event_name, event_id, event_source_url, fbp, fbc } = req.body
  if (!event_name || !event_id) return res.status(400).json({ error: 'Missing required fields' })

  const accessToken = process.env.META_CAPI_TOKEN
  if (!accessToken) return res.status(500).json({ error: 'CAPI token not configured' })

  const clientIp =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    ''

  const payload = {
    data: [
      {
        event_name,
        event_time: Math.floor(Date.now() / 1000),
        event_id,
        event_source_url: event_source_url || 'https://www.i88worldcupsgen.com',
        action_source: 'website',
        user_data: {
          client_ip_address: clientIp,
          client_user_agent: req.headers['user-agent'] || '',
          ...(fbp && { fbp }),
          ...(fbc && { fbc }),
        },
      },
    ],
  }

  try {
    const metaRes = await fetch(
      `https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )
    const data = await metaRes.json()
    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
