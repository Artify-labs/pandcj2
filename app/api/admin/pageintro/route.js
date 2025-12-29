import fs from 'fs'
import path from 'path'

const SETTINGS_PATH = path.join(process.cwd(), 'public', 'pageintro-settings.json')

function readSettings() {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) return null
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch (err) {
    console.error('Failed to read pageintro settings', err)
    return null
  }
}

function writeSettings(obj) {
  try {
    const dir = path.dirname(SETTINGS_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(obj, null, 2), 'utf-8')
    return true
  } catch (err) {
    console.error('Failed to write pageintro settings', err)
    return false
  }
}

export async function GET() {
  const settings = readSettings()
  return new Response(JSON.stringify(settings || {}), { status: 200 })
}

export async function POST(req) {
  try {
    const body = await req.json()
    const ok = writeSettings(body)
    if (!ok) return new Response(JSON.stringify({ error: 'Failed to save' }), { status: 500 })
    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400 })
  }
}
