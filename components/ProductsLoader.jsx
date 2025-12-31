'use client'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setProduct } from '@/lib/features/product/productSlice'

export default function ProductsLoader() {
  const dispatch = useDispatch()

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch('/api/products')
        if (!res.ok) return
        const data = await res.json()
        if (mounted && Array.isArray(data)) dispatch(setProduct(data))
      } catch (e) {
        console.error('Failed to load /api/products', e)
      }
    }
    load()
    return () => { mounted = false }
  }, [dispatch])

  return null
}
