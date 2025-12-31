import fs from 'fs'
import path from 'path'
import os from 'os'

export async function POST(req) {
  try {
    const body = await req.json()
    const { filename, data } = body || {}

    if (!filename || !data) {
      return new Response(JSON.stringify({ error: 'filename and data are required' }), { status: 400 })
    }

    // Data may be a data URL like 'data:image/png;base64,...'
    const matches = data.match(/^data:(image\/\w+);base64,(.+)$/)
    let buffer
    let mimeType = 'application/octet-stream'
    let base64Data = null
    if (matches) {
      mimeType = matches[1]
      base64Data = matches[2]
      buffer = Buffer.from(base64Data, 'base64')
    } else {
      // assume raw base64
      base64Data = data
      buffer = Buffer.from(data, 'base64')
    }

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')

    // If Cloudinary is configured, upload there and return the secure URL.
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET
    if (cloudName && uploadPreset) {
      try {
        const form = new FormData()
        const fileField = `data:${mimeType};base64,${base64Data}`
        form.append('file', fileField)
        form.append('upload_preset', uploadPreset)
        form.append('public_id', path.parse(safeName).name)

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: form
        })
        if (!res.ok) {
          const text = await res.text()
          console.error('Cloudinary upload failed', res.status, text)
          // fall through to local/tmp fallback
        } else {
          const bodyJson = await res.json()
          // return secure URL
          return new Response(JSON.stringify({ url: bodyJson.secure_url, provider: 'cloudinary', raw: bodyJson }), { status: 201 })
        }
      } catch (cloudErr) {
        console.error('Cloudinary upload error', cloudErr)
        // continue to fallback
      }
    }

    // Fallback: try writing to public/uploads, then /tmp if necessary.
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    try {
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
      const filePath = path.join(uploadsDir, safeName)
      fs.writeFileSync(filePath, buffer)
      const publicUrl = `/uploads/${safeName}`
      return new Response(JSON.stringify({ url: publicUrl }), { status: 201 })
    } catch (err) {
      // If filesystem is read-only, fall back to tmp dir
      if (err && err.code === 'EROFS') {
        try {
          const tmpDir = path.join(os.tmpdir(), 'gocart-uploads')
          if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
          const tmpPath = path.join(tmpDir, safeName)
          fs.writeFileSync(tmpPath, buffer)
          // Return the original data URL for client-side preview / re-upload
          const dataUrl = `data:${mimeType};base64,${base64Data}`
          return new Response(JSON.stringify({ url: null, tempPath: tmpPath, dataUrl }), { status: 201 })
        } catch (tmpErr) {
          console.error('Failed to write to tmp dir', tmpErr)
          return new Response(JSON.stringify({ error: 'Upload failed (tmp)' }), { status: 500 })
        }
      }
      throw err
    }
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Upload failed' }), { status: 500 })
  }
}
