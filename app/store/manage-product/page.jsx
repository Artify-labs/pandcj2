'use client'
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import ConfirmDialog from '@/components/ConfirmDialog'
import Image from "next/image"
import Loading from "@/components/Loading"
import { assets } from '@/assets/assets'

export default function StoreManageProducts() {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const [loading, setLoading] = useState(false)
    const [products, setProducts] = useState([])

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true)
            try {
                const res = await fetch('/api/products')
                if (!res.ok) { setProducts([]); return }
                const data = await res.json()
                setProducts(data || [])
            } catch (e) { console.error(e); setProducts([]) }
            finally { setLoading(false) }
        }
        fetchProducts()
    }, [])

    // stock toggle removed per request

    const [confirmOpen, setConfirmOpen] = useState(false)
    const [pendingDelete, setPendingDelete] = useState(null)

    const confirmDelete = (productId) => {
        setPendingDelete(productId)
        setConfirmOpen(true)
    }

    const deleteProduct = async (productId) => {
        try {
            const res = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Delete failed')
            const data = await res.json()
            setProducts(prev => prev.filter(p => p.id !== data.id))
            toast.success('Deleted')
        } catch (e) { console.error(e); toast.error('Could not delete product') }
        finally { setConfirmOpen(false); setPendingDelete(null) }
    }

    if (loading) return <Loading />

    return (
        <>
            <h1 className="text-2xl text-slate-500 mb-5">Manage <span className="text-slate-800 font-medium">Products</span></h1>
            <table className="w-full max-w-4xl text-left  ring ring-slate-200  rounded overflow-hidden text-sm">
                <thead className="bg-slate-50 text-gray-700 uppercase tracking-wider">
                    <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3 hidden md:table-cell">Description</th>
                        <th className="px-4 py-3 hidden md:table-cell">MRP</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-slate-700">
                    {products.length === 0 ? (
                        <tr><td className="px-4 py-6 text-slate-500" colSpan={5}>No products available</td></tr>
                    ) : (
                        products.map((product) => (
                            <tr key={product.id} className="border-t border-gray-200 hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <div className="flex gap-2 items-center">
                                        <Image width={40} height={40} className='p-1 shadow rounded cursor-pointer' src={product.images && product.images[0] ? product.images[0] : assets.upload_area} alt={product.name} />
                                        {product.name}
                                    </div>
                                </td>
                                <td className="px-4 py-3 max-w-md text-slate-600 hidden md:table-cell truncate">{product.description}</td>
                                <td className="px-4 py-3 hidden md:table-cell">{currency} {(product.mrp || 0).toLocaleString()}</td>
                                <td className="px-4 py-3">{currency} {(product.price || 0).toLocaleString()}</td>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-4">
                                        <button onClick={() => toast.promise(deleteProduct(product.id), { loading: 'Deleting...' })} className="text-red-500 hover:bg-red-50 px-3 py-1 rounded-md">
                                            {/* keep the old immediate delete for compatibility, but also support confirm flow */}
                                            Delete
                                        </button>
                                        <button onClick={() => confirmDelete(product.id)} className="text-red-500 hover:bg-red-50 px-3 py-1 rounded-md">
                                            Delete (confirm)
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            <ConfirmDialog
                open={confirmOpen}
                title="Delete product"
                message="Delete this product? This cannot be undone."
                confirmText="Delete"
                cancelText="Keep"
                onClose={() => setConfirmOpen(false)}
                onConfirm={() => deleteProduct(pendingDelete)}
            />
        </>
    )
}