'use client'
import React from 'react'

export default function ConfirmDialog({ open, title = 'Confirm', message = '', confirmText = 'Yes', cancelText = 'Cancel', onConfirm, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full z-10 p-6">
        <h3 className="text-lg font-medium text-slate-700">{title}</h3>
        {message && <p className="mt-2 text-sm text-slate-500">{message}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-100 text-gray-700">{cancelText}</button>
          <button onClick={() => { onConfirm && onConfirm(); }} className="px-4 py-2 rounded bg-red-600 text-white">{confirmText}</button>
        </div>
      </div>
    </div>
  )
}
