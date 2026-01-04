'use client'
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
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

    const deleteProduct = async (productId) => {
        try {
            const res = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Delete failed')
            const data = await res.json()
            setProducts(prev => prev.filter(p => p.id !== data.id))
            toast.success('Deleted')
        } catch (e) { console.error(e); toast.error('Could not delete product') }
    }

    if (loading) return <Loading />

    return (
        <>
            <h1 className="text-xl sm:text-2xl text-slate-500 mb-5 px-4 sm:px-0">Manage <span className="text-slate-800 font-medium">Products</span></h1>
            <div className="overflow-x-auto px-4 sm:px-0">
                <table className="w-full min-w-max max-w-4xl text-left ring ring-slate-200 rounded overflow-hidden text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-gray-700 uppercase tracking-wider">
                        <tr>
                            <th className="px-3 sm:px-4 py-2 sm:py-3">Name</th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 hidden md:table-cell">Description</th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 hidden md:table-cell">MRP</th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3">Price</th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3">Stock</th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700">
                        {products.length === 0 ? (
                                    <tr>
                                        <td className="px-3 sm:px-4 py-2 sm:py-3">No products available</td>
                                    </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.id} className="border-t border-gray-200 hover:bg-gray-50">
                                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                                        <div className="flex gap-2 items-center">
                                            <Image width={50} height={50} className='rounded object-cover w-8 h-8 sm:w-12 sm:h-12' src={product.images && product.images[0] ? product.images[0] : assets.upload_area} alt={product.name} />
                                            <span className="text-xs sm:text-sm line-clamp-2">{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 max-w-md text-slate-600 hidden md:table-cell truncate text-xs">{product.description}</td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 hidden md:table-cell text-xs">{currency} {(product.mrp || 0).toLocaleString()}</td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs">{currency} {(product.price || 0).toLocaleString()}</td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${product.stock === 'in_stock' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {product.stock === 'in_stock' ? 'In Stock' : 'Out'}
                                        </span>
                                    </td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                                        <div className="flex items-center justify-center gap-1 sm:gap-2 flex-col sm:flex-row">
                                            <button onClick={() => window.location.href = `/store/edit-product/${product.id}`} className="text-blue-500 hover:bg-blue-50 px-2 sm:px-3 py-1 rounded-md text-xs w-full sm:w-auto">
                                                Edit
                                            </button>
                                            <button onClick={() => toast.promise(deleteProduct(product.id), { loading: 'Deleting...' })} className="text-red-500 hover:bg-red-50 px-2 sm:px-3 py-1 rounded-md text-xs w-full sm:w-auto">
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </>
    )
}