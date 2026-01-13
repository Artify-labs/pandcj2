import mongodb from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'

export async function GET(req) {
  try {
    // Get user from token (cookie or header)
    let token = null
    let decoded = null
    
    // Try to get from Authorization header first
    const authHeader = req.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7)
      console.log('[API /api/store] Token from Authorization header')
    }
    
    // Fallback to cookies
    if (!token) {
      const cookies = req.headers.get('cookie')
      if (cookies) {
        const cookieArray = cookies.split(';').map(c => c.trim())
        const authCookie = cookieArray.find(c => c.startsWith('pandc_user_token=') || c.startsWith('authToken='))
        if (authCookie) {
          token = authCookie.split('=')[1]
          console.log('[API /api/store] Token from cookie')
        }
      }
    }

    // If no token, return default store
    if (!token) {
      console.log('[API /api/store] No token found, returning default store')
      return new Response(JSON.stringify({ id: 'default-store', name: 'Default Store' }), { status: 200 })
    }

    // Verify and decode token
    try {
      decoded = verifyToken(token)
      if (!decoded || !decoded.userId) {
        console.log('[API /api/store] Token verification returned null, returning default store')
        return new Response(JSON.stringify({ id: 'default-store', name: 'Default Store' }), { status: 200 })
      }

      console.log('[API /api/store] Token verified for user:', decoded.userId)

      // Find store by userId
      console.log('[API /api/store] Looking for store with userId:', decoded.userId)
      const store = await mongodb.store.findByUserId(decoded.userId)
      
      if (store) {
        console.log('[API /api/store] Store found:', store.id)
        return new Response(JSON.stringify(store), { status: 200 })
      }

      console.log('[API /api/store] No store found for user, returning default store')
      return new Response(JSON.stringify({ id: 'default-store', name: 'Default Store' }), { status: 200 })
    } catch (tokenErr) {
      console.log('[API /api/store] Token verification failed:', tokenErr.message, '- returning default store')
      return new Response(JSON.stringify({ id: 'default-store', name: 'Default Store' }), { status: 200 })
    }
  } catch (err) {
    console.error('[API /api/store] Unexpected error:', err)
    // Return default store on error to prevent blocking
    return new Response(JSON.stringify({ id: 'default-store', name: 'Default Store' }), { status: 200 })
  }
}
