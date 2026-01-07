(async () => {
  try {
    const url = 'http://pandcjewellery.com/api/auth/login'
    const payload = { email: 'pandcjewellery@gmail.com', password: 'preetb121106' }
    const fetchFn = global.fetch || (await import('node-fetch')).default
    const res = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    console.log('STATUS', res.status, res.statusText)
    if (res.headers && res.headers.forEach) {
      res.headers.forEach((v, k) => console.log(k + ': ' + v))
    } else if (res.headers && typeof res.headers === 'object') {
      for (const k of Object.keys(res.headers)) console.log(k + ': ' + res.headers[k])
    }

    const text = await res.text()
    console.log('\nBODY:')
    try { console.log(JSON.parse(text)) } catch (e) { console.log(text) }
  } catch (err) {
    console.error('ERROR:', err && err.message ? err.message : err)
    process.exit(1)
  }
})()
