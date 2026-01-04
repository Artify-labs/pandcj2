"use client"
import { useEffect, useState, useRef } from "react"
import toast from "react-hot-toast"
import Image from "next/image"
import Loading from "@/components/Loading"
import FileButton from '@/components/FileButton'

export default function AdminBanner() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({})
  const autoSaveTimeoutRef = useRef(null)
  const hasUnsavedChangesRef = useRef(false)

  const fetchSettings = async () => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000) // 5s timeout
      
      const res = await fetch(`/api/admin/banner?ts=${Date.now()}`, { credentials: 'include', signal: controller.signal })
      clearTimeout(timeout)
      
      const data = await res.json()
      setSettings(data || {})
      hasUnsavedChangesRef.current = false
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[AdminBanner] Fetch error:', err?.message || err)
      }
    } finally {
      setLoading(false)
    }
  }

  // Auto-save after 2 seconds of no changes
  const autoSave = (newSettings) => {
    setSettings(newSettings)
    hasUnsavedChangesRef.current = true
    
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current)
    
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('[AdminBanner] Auto-saving:', newSettings)
        
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 3000) // 3s timeout for save
        
        const res = await fetch('/api/admin/banner', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSettings), signal: controller.signal })
        clearTimeout(timeout)
        
        const json = await res.json()
        if (res.ok) {
          console.log('[AdminBanner] Auto-save successful')
          hasUnsavedChangesRef.current = false
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('[AdminBanner] Auto-save failed:', err?.message || err)
        }
      }
    }, 2000)
  }

  useEffect(() => { 
    fetchSettings()

    // Set up EventSource for real-time updates - only when no unsaved changes
    let mounted = true
    let es
    let esTimeout
    let pollInterval

    const fetchLatest = async () => {
      // Don't poll if user is actively editing
      if (hasUnsavedChangesRef.current) return

      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 2000) // 2s timeout for polling
        
        const res = await fetch(`/api/admin/banner?ts=${Date.now()}`, { credentials: 'include', signal: controller.signal })
        clearTimeout(timeout)
        
        if (res.ok) {
          const data = await res.json()
          if (mounted && data && !hasUnsavedChangesRef.current) {
            console.log('[AdminBanner] Poll fetched:', data)
            setSettings(data)
          }
        }
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.error('[AdminBanner] Poll error:', e?.message || e)
        }
      }
    }

    // Poll every 5 seconds for updates as fallback - but only if no unsaved changes
    pollInterval = setInterval(fetchLatest, 5000)

    try {
      es = new EventSource('/api/settings/stream?key=banner')
      console.log('[AdminBanner] EventSource connected')
      
      // Close EventSource if it doesn't establish connection after 3 seconds (fail fast)
      esTimeout = setTimeout(() => {
        console.warn('[AdminBanner] EventSource timeout (3s), closing and relying on polling')
        if (es) {
          es.close()
          es = null
        }
      }, 3000)
      
      es.addEventListener('update', (ev) => {
        try {
          // Clear timeout once we get a message
          if (esTimeout) {
            clearTimeout(esTimeout)
            esTimeout = null
          }
          const msg = JSON.parse(ev.data)
          console.log('[AdminBanner] EventSource update received:', msg)
          // Only update if no unsaved changes
          if (mounted && msg && msg.data && !hasUnsavedChangesRef.current) {
            setSettings(msg.data)
          }
        } catch (e) {
          console.error('[AdminBanner] Parse error:', e)
        }
      })

      es.onerror = () => {
        console.error('[AdminBanner] EventSource error, closing connection and relying on polling')
        if (es) {
          es.close()
          es = null
        }
        if (esTimeout) clearTimeout(esTimeout)
      }
    } catch (e) {
      console.error('[AdminBanner] EventSource setup error:', e)
    }

    return () => {
      mounted = false
      if (es) es.close()
      if (esTimeout) clearTimeout(esTimeout)
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [])

  const handleFile = async (file) => {
    if (!file) return ''
    const reader = new FileReader()
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          // upload via existing upload API
          const b64 = reader.result.split(',')[1]
          const res = await fetch('/api/admin/stores/upload', { method: 'POST', credentials: 'include', body: JSON.stringify({ data: b64, name: file.name }), headers: { 'Content-Type': 'application/json' } })
          const json = await res.json()
          resolve(json.url || '')
        } catch (e) { reject(e) }
      }
      reader.readAsDataURL(file)
    })
  }

  const onFileChange = async (e, path) => {
    const file = e.target.files?.[0]
    if (!file) return

    // immediate preview: read data URL and set it in UI while upload runs
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result
      const newSettings = (() => {
        const copy = JSON.parse(JSON.stringify(settings || {}))
        const parts = path.split('.')
        let cur = copy
        for (let i=0;i<parts.length-1;i++) { cur[parts[i]] = cur[parts[i]] || {}; cur = cur[parts[i]] }
        cur[parts[parts.length-1]] = dataUrl
        return copy
      })()
      autoSave(newSettings)

      try {
        const uploadedUrl = await handleFile(file)
        if (uploadedUrl) {
          const finalSettings = (() => {
            const copy = JSON.parse(JSON.stringify(settings || {}))
            const parts = path.split('.')
            let cur = copy
            for (let i=0;i<parts.length-1;i++) { cur[parts[i]] = cur[parts[i]] || {}; cur = cur[parts[i]] }
            cur[parts[parts.length-1]] = uploadedUrl
            return copy
          })()
          autoSave(finalSettings)
        }
      } catch (err) {
        console.error('Upload failed', err)
      }
    }
    reader.readAsDataURL(file)
  }

  if (loading) return <Loading />

  return (
    <div className="text-slate-500 mb-40">
      <h2 className="text-2xl">Banner <span className="text-slate-800 font-medium">Settings</span></h2>

      <div className="mt-6 space-y-6 max-w-3xl">
        <section className="bg-white p-4 rounded border">
          <h3 className="font-semibold">Left (Big) Box</h3>
          <label className="block mt-2">News Label <span className="text-xs text-gray-500">(e.g., "NEWS" - the orange badge)</span>
            <input value={settings.left?.newsLabel||''} onChange={e=>autoSave({...settings,left:{...(settings.left||{}),newsLabel:e.target.value}})} className="w-full p-2 border rounded" />
          </label>
          <label className="block mt-2">News Description <span className="text-xs text-gray-500">(e.g., "Free Shipping..." - text next to NEWS badge)</span>
            <input value={settings.left?.newsDescription||''} onChange={e=>autoSave({...settings,left:{...(settings.left||{}),newsDescription:e.target.value}})} className="w-full p-2 border rounded" />
          </label>
          <label className="block mt-2">Main Title <span className="text-xs text-gray-500">(e.g., "Gadgets you'll love. Prices you'll trust." - big heading)</span>
            <input value={settings.left?.title||''} onChange={e=>autoSave({...settings,left:{...(settings.left||{}),title:e.target.value}})} className="w-full p-2 border rounded" />
          </label>
          <label className="block mt-2">Price Label <span className="text-xs text-gray-500">(e.g., "Starts from" - label above price)</span>
            <input value={settings.left?.priceLabel||''} onChange={e=>autoSave({...settings,left:{...(settings.left||{}),priceLabel:e.target.value}})} className="w-full p-2 border rounded" />
          </label>
          <label className="block mt-2">Price <span className="text-xs text-gray-500">(e.g., "3000" - just the number)</span>
            <input value={settings.left?.price||''} onChange={e=>autoSave({...settings,left:{...(settings.left||{}),price:e.target.value}})} className="w-full p-2 border rounded" />
          </label>
          <label className="block mt-2">Redirect Link <span className="text-xs text-gray-500">(URL for BUY NOW button)</span>
            <input value={settings.left?.learnMoreLink||''} onChange={e=>autoSave({...settings,left:{...(settings.left||{}),learnMoreLink:e.target.value}})} className="w-full p-2 border rounded" />
          </label>
          <label className="block mt-2">Background Image
            <FileButton accept="image/*" label="Choose image" onChange={(e)=>onFileChange(e,'left.bgImage')} previewUrl={settings.left?.bgImage} />
          </label>
          <label className="block mt-2">Background Color
            <input type="color" value={settings.left?.bgColor||"#DCFCE7"} onChange={e=>autoSave({...settings,left:{...(settings.left||{}),bgColor:e.target.value}})} className="w-24 h-10 p-1 border rounded" />
          </label>
          <label className="block mt-2">Model/Image
            <FileButton accept="image/*" label="Choose image" onChange={(e)=>onFileChange(e,'left.modelImage')} previewUrl={settings.left?.modelImage} />
          </label>
        </section>

        <section className="bg-white p-4 rounded border">
          <h3 className="font-semibold">Top Right Box</h3>
          <label className="block mt-2">Title <span className="text-xs text-gray-500">(e.g., "Best products")</span>
            <input value={settings.topRight?.title||''} onChange={e=>autoSave({...settings,topRight:{...(settings.topRight||{}),title:e.target.value}})} className="w-full p-2 border rounded" />
          </label>
          <label className="block mt-2">Link <span className="text-xs text-gray-500">(URL for "View more" link)</span>
            <input value={settings.topRight?.link||''} onChange={e=>autoSave({...settings,topRight:{...(settings.topRight||{}),link:e.target.value}})} className="w-full p-2 border rounded" />
          </label>
          <label className="block mt-2">Product Image <span className="text-xs text-gray-500">(right side image)</span>
            <FileButton accept="image/*" label="Choose image" onChange={(e)=>onFileChange(e,'topRight.image')} previewUrl={settings.topRight?.image} />
          </label>
          <label className="block mt-2">Background Image
            <FileButton accept="image/*" label="Choose image" onChange={(e)=>onFileChange(e,'topRight.bgImage')} previewUrl={settings.topRight?.bgImage} />
          </label>
          <label className="block mt-2">Background Color
            <input type="color" value={settings.topRight?.bgColor||"#FED7AA"} onChange={e=>autoSave({...settings,topRight:{...(settings.topRight||{}),bgColor:e.target.value}})} className="w-24 h-10 p-1 border rounded" />
          </label>
        </section>

        <section className="bg-white p-4 rounded border">
          <h3 className="font-semibold">Bottom Right Box</h3>
          <label className="block mt-2">Title <span className="text-xs text-gray-500">(e.g., "20% discounts")</span>
            <input value={settings.bottomRight?.title||''} onChange={e=>autoSave({...settings,bottomRight:{...(settings.bottomRight||{}),title:e.target.value}})} className="w-full p-2 border rounded" />
          </label>
          <label className="block mt-2">Link <span className="text-xs text-gray-500">(URL for "View more" link)</span>
            <input value={settings.bottomRight?.link||''} onChange={e=>autoSave({...settings,bottomRight:{...(settings.bottomRight||{}),link:e.target.value}})} className="w-full p-2 border rounded" />
          </label>
          <label className="block mt-2">Product Image <span className="text-xs text-gray-500">(right side image)</span>
            <FileButton accept="image/*" label="Choose image" onChange={(e)=>onFileChange(e,'bottomRight.image')} previewUrl={settings.bottomRight?.image} />
          </label>
          <label className="block mt-2">Background Image
            <FileButton accept="image/*" label="Choose image" onChange={(e)=>onFileChange(e,'bottomRight.bgImage')} previewUrl={settings.bottomRight?.bgImage} />
          </label>
          <label className="block mt-2">Background Color
            <input type="color" value={settings.bottomRight?.bgColor||"#DBEAFE"} onChange={e=>autoSave({...settings,bottomRight:{...(settings.bottomRight||{}),bgColor:e.target.value}})} className="w-24 h-10 p-1 border rounded" />
          </label>
        </section>

        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button onClick={() => {
            // Force immediate save before refresh
            if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current)
            const saveImmediate = async () => {
              try {
                setSaving(true)
                console.log('[AdminBanner] Manual save:', settings)
                const res = await fetch('/api/admin/banner', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) })
                if (res.ok) {
                  toast.success('Saved')
                  hasUnsavedChangesRef.current = false
                }
              } catch (err) {
                toast.error('Save failed')
              } finally {
                setSaving(false)
              }
            }
            saveImmediate()
          }} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 active:scale-95 active:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 text-sm font-medium transition-all duration-150 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100">{saving ? 'Saving...' : 'Save Now'}</button>
        </div>
      </div>
    </div>
  )
}
