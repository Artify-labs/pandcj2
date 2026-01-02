'use client'
import { useState, useEffect } from 'react'
import { XIcon } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EditOrderModal({ open, order, onClose, onSave }) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    landmark: '',
    alternateContact: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India'
  })

  const [loading, setLoading] = useState(false)
  const [pincodeError, setPincodeError] = useState('')

  useEffect(() => {
    if (open && order) {
      // Map order address fields to form
      setForm({
        fullName: order.address?.name || '',
        email: order.address?.email || '',
        phone: order.address?.phone || '',
        address: order.address?.street || order.address?.address || '',
        landmark: order.address?.landmark || '',
        alternateContact: order.address?.alternatePhone || '',
        city: order.address?.city || '',
        state: order.address?.state || '',
        pincode: order.address?.zip || order.address?.pincode || '',
        country: order.address?.country || 'India'
      })
      setPincodeError('')
    }
  }, [open, order])

  const handleChange = (e) => {
    let value = e.target.value
    const name = e.target.name

    // Strip leading zeros from phone
    if (name === 'phone' || name === 'alternateContact') {
      value = value.replace(/^0+/, '')
    }

    // Only allow digits for pincode
    if (name === 'pincode') {
      value = value.replace(/\D/g, '').slice(0, 6)
    }

    setForm(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear pincode error when user starts typing
    if (name === 'pincode') {
      setPincodeError('')
    }
  }

  const validatePincode = async () => {
    if (!form.pincode) {
      setPincodeError('Pincode is required')
      return false
    }

    // Only validate if city or state is empty (Shiprocket needs all three)
    if (!form.city || !form.state) {
      try {
        setLoading(true)
        const res = await fetch(`/api/shiprocket/validate-pincode?pincode=${form.pincode}`)
        
        if (res.ok) {
          const data = await res.json()
          if (data.city && data.state) {
            setForm(prev => ({
              ...prev,
              city: data.city,
              state: data.state
            }))
            setPincodeError('')
            return true
          } else {
            setPincodeError('City/State not found for this pincode')
            return false
          }
        } else {
          setPincodeError('City/State not found for this pincode')
          return false
        }
      } catch (err) {
        console.error('Pincode validation error:', err)
        setPincodeError('Error validating pincode')
        return false
      } finally {
        setLoading(false)
      }
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.fullName || !form.email || !form.phone || !form.pincode || !form.city || !form.state) {
      toast.error('Please fill all required fields')
      return
    }

    // Validate pincode
    const isValid = await validatePincode()
    if (!isValid) return

    try {
      setLoading(true)
      
      const updatedOrder = {
        ...order,
        address: {
          name: form.fullName,
          email: form.email,
          phone: form.phone,
          street: form.address,
          landmark: form.landmark,
          alternatePhone: form.alternateContact,
          city: form.city,
          state: form.state,
          zip: form.pincode,
          country: form.country
        }
      }

      // Update order via API
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: updatedOrder.address })
      })

      if (res.ok) {
        toast.success('Order details updated')
        if (typeof onSave === 'function') {
          onSave(updatedOrder)
        }
        onClose()
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Failed to update order')
      }
    } catch (err) {
      console.error('Error updating order:', err)
      toast.error('Error updating order details')
    } finally {
      setLoading(false)
    }
  }

  if (!open || !order) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">Edit Order Details <span className="text-sm text-slate-500">#{order.id?.slice(0, 8)}</span></h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <XIcon size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Customer Details */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Customer Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-600 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="Preet Biswas"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-2">Mobile Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="7439316373"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs text-slate-600 mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="preetbiswas2006@gmail.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-2">Alternate Contact Number (Optional)</label>
                  <input
                    type="tel"
                    name="alternateContact"
                    value={form.alternateContact}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="Enter alternate contact no."
                  />
                </div>
              </div>
            </div>

            {/* Address Details */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Complete Address</h3>
              <div>
                <label className="block text-xs text-slate-600 mb-2">Address *</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 text-sm mb-4"
                  placeholder="Address"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-2">Landmark (Optional)</label>
                <input
                  type="text"
                  name="landmark"
                  value={form.landmark}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 text-sm mb-4"
                  placeholder="N/A"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-600 mb-2">Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    className={`w-full border rounded px-3 py-2 text-sm ${pincodeError ? 'border-red-500 bg-red-50' : ''}`}
                    placeholder="201300"
                    required
                  />
                  {pincodeError && <p className="text-xs text-red-600 mt-1">{pincodeError}</p>}
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-2">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="City"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-2">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="State"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs text-slate-600 mb-2">Country *</label>
                  <input
                    type="text"
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 text-sm bg-slate-50"
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-8 border-t pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
