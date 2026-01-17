import mongodb from './mongodb'
import { globalCache, CACHE_KEYS } from './cache'

export async function getPageIntro() {
  try {
    const setting = await mongodb.setting.get('pageintro')
    console.log('[PageIntro] getPageIntro result:', setting?.value)
    return setting ? setting.value : null
  } catch (e) {
    console.warn('PageIntro DB read failed', e?.message || e)
    return null
  }
}

export async function savePageIntro(obj) {
  try {
    console.log('[PageIntro] Saving pageintro:', obj)
    const result = await mongodb.setting.set('pageintro', obj)
    console.log('[PageIntro] Save successful:', result)
    // Clear cache so next fetch gets fresh data
    globalCache.clear(CACHE_KEYS.PAGEINTRO_SETTINGS)
    return { ok: true, provider: 'db', result }
  } catch (e) {
    console.error('PageIntro save failed', e?.message || e)
    return { ok: false, error: e?.message || e }
  }
}
