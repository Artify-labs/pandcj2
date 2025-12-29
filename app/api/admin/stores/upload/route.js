import fs from 'fs'
import path from 'path'

export async function POST(req) {
  try {
    const body = await req.json()
    const { filename, data } = body || {}

    if (!filename || !data) {
      return new Response(JSON.stringify({ error: 'filename and data are required' }), { status: 400 })
    }

    // Ensure uploads dir exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

    // Data may be a data URL like 'data:image/png;base64,...'
    const matches = data.match(/^data:(image\/\w+);base64,(.+)$/)
    let buffer
    if (matches) {
      buffer = Buffer.from(matches[2], 'base64')
    } else {
      // assume raw base64
      buffer = Buffer.from(data, 'base64')
    }

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = path.join(uploadsDir, safeName)
    fs.writeFileSync(filePath, buffer)

    const publicUrl = `/uploads/${safeName}`
    return new Response(JSON.stringify({ url: publicUrl }), { status: 201 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Upload failed' }), { status: 500 })
  }
}
