import mongodb from './mongodb'

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
    return { ok: true, provider: 'db', result }
  } catch (e) {
    console.error('PageIntro save failed', e?.message || e)
    return { ok: false, error: e?.message || e }
  }
}
