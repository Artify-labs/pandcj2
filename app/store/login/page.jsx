"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StoreLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: 'SELLER' }),
    })
    const data = await res.json()
    if (!res.ok) return setError(data?.error || 'Login failed')
    router.push('/store')
  }

  return (
    <div className="max-w-md mx-auto py-20">
      <h1 className="text-2xl font-semibold mb-4">Seller Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full p-2 border rounded" />
        <input required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" className="w-full p-2 border rounded" />
        {error && <div className="text-red-600">{error}</div>}
        <button className="w-full bg-black text-white p-2 rounded">Sign in</button>
      </form>
    </div>
  )
}
