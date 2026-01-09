import { getSessionUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getSessionUser()
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
    }

    return new Response(
      JSON.stringify(user),
      { status: 200 }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to fetch user' }), { status: 500 })
  }
}
