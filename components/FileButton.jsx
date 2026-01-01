'use client'
import React, { useRef } from 'react'

export default function FileButton({ accept = '*', onChange, label = 'Choose file', className = '', previewUrl }) {
  const ref = useRef()

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <input ref={ref} type="file" accept={accept} onChange={onChange} className="hidden" />
      <button type="button" onClick={() => ref.current && ref.current.click()} className="px-3 py-2 bg-slate-800 text-white rounded">
        {label}
      </button>
      {previewUrl && <img src={previewUrl} alt="preview" className="w-28 h-16 object-cover rounded border" />}
    </div>
  )
}
