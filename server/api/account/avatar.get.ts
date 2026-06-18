import axios from 'axios'

const ALLOWED_DOMAINS = ['instagram.com', 'cdninstagram.com', 'fbcdn.net', 'fbsbx.com']

export default defineEventHandler(async (event) => {
  const { url } = getQuery(event) as { url?: string }

  if (!url) throw createError({ statusCode: 400, message: 'url is required' })

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid URL' })
  }

  const allowed = ALLOWED_DOMAINS.some(d => parsed.hostname === d || parsed.hostname.endsWith('.' + d))
  if (!allowed) throw createError({ statusCode: 403, message: 'URL not allowed' })

  try {
    const res = await axios.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
      timeout: 10000,
    })

    const contentType = (res.headers['content-type'] as string | undefined) ?? 'image/jpeg'
    setResponseHeader(event, 'Content-Type', contentType)
    setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
    return send(event, Buffer.from(res.data), contentType)
  } catch {
    throw createError({ statusCode: 502, message: 'Failed to fetch image' })
  }
})
