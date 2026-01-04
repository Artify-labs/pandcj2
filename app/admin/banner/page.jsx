"use client"
import { useEffect, useState, useRef } from "react"
import toast from "react-hot-toast"
import Image from "next/image"
import Loading from "@/components/Loading"
import FileButton from '@/components/FileButton'

export default function AdminBanner() {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const autoSaveTimeoutRef = useRef(null)

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/admin/banner?ts=${Date.now()}`, { credentials: 'include' })
      const data = await res.json()
      setSettings(data || {})
      setHasUnsavedChanges(false)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      console.log('[AdminBanner] Saving:', settings)
      const res = await fetch('/api/admin/banner', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) })
      const json = await res.json()
      console.log('[AdminBanner] Save response:', json)
      if (!res.ok) throw new Error('Failed')
      toast.success('Saved')
      setHasUnsavedChanges(false)
    } catch (err) {
      toast.error('Save failed')
      console.error(err)
    } finally { setLoading(false) }
  }

  // Auto-save after 2 seconds of no changes
  const autoSave = (newSettings) => {
    setSettings(newSettings)
    setHasUnsavedChanges(true)
    
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current)
    
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('[AdminBanner] Auto-saving:', newSettings)
        const res = await fetch('/api/admin/banner', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSettings) })
        const json = await res.json()
        if (res.ok) {
          console.log('[AdminBanner] Auto-save successful')
          setHasUnsavedChanges(false)
        }
      } catch (err) {
        console.error('[AdminBanner] Auto-save failed:', err)
      }
    }, 2000)
  }

  useEffect(() => { 
    fetchSettings()

    // Set up EventSource for real-time updates - only when no unsaved changes
    let mounted = true
    let es
    let pollInterval

    const fetchLatest = async () => {
      // Don't poll if user is actively editing
      if (hasUnsavedChanges) return

      try {
        const res = await fetch(`/api/admin/banner?ts=${Date.now()}`, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (mounted && data && !hasUnsavedChanges) {
            console.log('[AdminBanner] Poll fetched:', data)
            setSettings(data)
          }
        }
      } catch (e) {
        console.error('[AdminBanner] Poll error:', e)
      }
    }

    // Poll every 3 seconds for updates as fallback - but only if no unsaved changes
    pollInterval = setInterval(fetchLatest, 3000)

    try {
      es = new EventSource('/api/settings/stream?key=banner')
      console.log('[AdminBanner] EventSource connected')
      
      es.addEventListener('update', (ev) => {
        try {
          const msg = JSON.parse(ev.data)
          console.log('[AdminBanner] EventSource update received:', msg)
          // Only update if no unsaved changes
          if (mounted && msg && msg.data && !hasUnsavedChanges) {
            setSettings(msg.data)
          }
        } catch (e) {
          console.error('[AdminBanner] Parse error:', e)
        }
      })

      es.onerror = () => {
        console.error('[AdminBanner] EventSource error')
        if (es) es.close()
      }
    } catch (e) {
      console.error('[AdminBanner] EventSource setup error:', e)
    }

    return () => {
      mounted = false
      if (es) es.close()
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

  const handleSave = async () => {
    try {
      setLoading(true)
      console.log('[AdminBanner] Saving:', settings)
      const res = await fetch('/api/admin/banner', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) })
      const json = await res.json()
      console.log('[AdminBanner] Save response:', json)
      if (!res.ok) throw new Error('Failed')
      toast.success('Saved')
    } catch (err) {
      toast.error('Save failed')
      console.error(err)
    } finally { setLoading(false) }
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

        <div className="flex gap-3">
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
        </div>
      </div>
    </div>
  )
}
