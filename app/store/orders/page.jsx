 'use client'
import { useState, useEffect } from "react"
import Loading from "@/components/Loading"
import OrderItem from '@/components/OrderItem'
import OrderDetailModal from '@/components/OrderDetailModal'

export default function StoreOrders({ params }) {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)

    useEffect(() => {
        const fetchStoreOrders = async () => {
            const storeId = 'default-store'
            try {
                const controller = new AbortController()
                const timeout = setTimeout(() => controller.abort(), 4000) // 4s timeout
                const res = await fetch(`/api/orders?storeId=${storeId}`, { signal: controller.signal })
                clearTimeout(timeout)
                if (!res.ok) {
                    setOrders([])
                    setLoading(false)
                    return
                }
                const data = await res.json()
                // Keep all orders (including cancelled) but sort with active first
                const allOrders = (data || [])
                // Remove duplicates by checking order ID
                const uniqueOrders = Array.from(new Map(allOrders.map(o => [o.id, o])).values())
                // Sort: active orders first, then cancelled
                const sorted = uniqueOrders.sort((a, b) => {
                    const aIsCancelled = a.status && String(a.status).toUpperCase().startsWith('CANCEL')
                    const bIsCancelled = b.status && String(b.status).toUpperCase().startsWith('CANCEL')
                    return aIsCancelled ? 1 : bIsCancelled ? -1 : 0
                })
                setOrders(sorted)
            } catch (err) {
                console.error('Failed to fetch orders:', err)
                setOrders([])
            } finally {
                setLoading(false)
            }
        }

        fetchStoreOrders()
    }, [])

    if (loading) return <Loading />

    return (
        <>
            <h1 className="text-2xl text-slate-500 mb-5">Store <span className="text-slate-800 font-medium">Orders</span></h1>
            {orders.length === 0 ? (
                <p>No orders found</p>
            ) : (
                <div className="my-8 max-w-7xl">
                    <table className="w-full text-slate-500 table-auto border-separate border-spacing-y-8 border-spacing-x-4">
                        <thead>
                            <tr className="text-slate-600">
                                <th className="text-left">Products</th>
                                <th className="text-left">Price</th>
                                <th className="text-left">Address</th>
                                <th className="text-left">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(orders || []).map(order => (
                                <OrderItem order={order} key={order.id} editable={true} onStatusChange={async (orderId, newStatus) => {
                                    try {
                                        // optimistic update
                                        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
                                        const res = await fetch(`/api/admin/orders/${orderId}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ status: newStatus })
                                        })
                                        if (!res.ok) {
                                            // rollback if failed
                                            const data = await res.json().catch(() => ({}))
                                            console.error('Failed to update status', data)
                                            // reload orders to reflect server state
                                            window.location.reload()
                                        }
                                    } catch (err) {
                                        console.error(err)
                                        window.location.reload()
                                    }
                                }} onView={(o)=>{ setSelectedOrder(o); setModalOpen(true) }} />
                            ))}
                        </tbody>
                    </table>
                    <OrderDetailModal open={modalOpen} order={selectedOrder} onClose={() => setModalOpen(false)} />
                </div>
            )}
        </>
    )
}
