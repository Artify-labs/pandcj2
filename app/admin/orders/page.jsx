'use client'
import { useState, useEffect } from 'react'
import Loading from '@/components/Loading'
import EditOrderModal from '@/components/admin/EditOrderModal'
import { EditIcon } from 'lucide-react'

export default function AdminOrders() {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders')
        if (res.ok) {
          const data = await res.json()
          setOrders(data || [])
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const handleEdit = (order) => {
    setSelectedOrder(order)
    setModalOpen(true)
  }

  const handleSave = (updatedOrder) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o))
  }

  if (loading) return <Loading />

  return (
    <div>
      <h1 className="text-2xl text-slate-500 mb-5">
        All <span className="text-slate-800 font-medium">Orders</span>
      </h1>

      {orders.length === 0 ? (
        <p className="text-slate-400">No orders found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-slate-600 text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3">Order ID</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">Address</th>
                <th className="text-center px-4 py-3">Total</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-center px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map(order => {
                const isCancelled = order.status && String(order.status).toUpperCase().startsWith('CANCEL')
                return (
                  <tr key={order.id} className={`hover:bg-slate-50 ${isCancelled ? 'opacity-60 bg-red-50' : ''}`}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs">{order.id?.slice(0, 8)}</span>
                    </td>
                    <td className="px-4 py-3">{order.address?.name || 'N/A'}</td>
                    <td className="px-4 py-3">{order.address?.phone || 'N/A'}</td>
                    <td className="px-4 py-3 text-xs max-w-xs truncate">
                      {order.address?.city || order.address?.state ? 
                        `${order.address.city || ''} ${order.address.state || ''}` 
                        : 'N/A'}
                    </td>
                    <td className={`px-4 py-3 text-center font-medium ${isCancelled ? 'line-through text-red-600' : ''}`}>
                      {currency}{Number(order.total || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        isCancelled
                          ? 'bg-red-600 text-white'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {String(order.status || 'pending').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleEdit(order)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition text-sm"
                      >
                        <EditIcon size={16} />
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <EditOrderModal
          open={modalOpen}
          order={selectedOrder}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
