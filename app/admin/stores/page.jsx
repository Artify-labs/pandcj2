'use client'
import StoreInfo from "@/components/admin/StoreInfo"
import Loading from "@/components/Loading"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

export default function AdminStores() {

    const [stores, setStores] = useState([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const fetchStores = async () => {
        // Single-store mode: load only the current store when available from API
        try {
            const res = await fetch('/api/admin/stores')
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            // API returns either a single store object or an array
            if (Array.isArray(data)) {
                setStores(data)
            } else if (data && data.id) {
                setStores([data])
            } else {
                setStores([])
            }
        } catch (err) {
            console.error(err)
            setStores([])
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (storeId) => {
        // Ensure a Promise is returned so toast.promise can settle correctly
        return new Promise((resolve) => {
            // router.push may be sync/async depending on Next version; trigger navigation then resolve
            try {
                router.push(`/admin/stores/edit${storeId ? `?id=${storeId}` : ''}`)
            } catch (e) {
                // ignore navigation error here
            }
            // resolve on next tick
            setTimeout(() => resolve(true), 100)
        })
    }

    useEffect(() => {
        fetchStores()
    }, [])

    return !loading ? (
        <div className="text-slate-500 mb-28">
            <h1 className="text-2xl">My <span className="text-slate-800 font-medium">Store</span></h1>

            {stores.length ? (
                <div className="flex flex-col gap-4 mt-4">
                    {(() => {
                        const store = stores[0]
                        return (
                            <div key={store.id} className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 flex max-md:flex-col gap-4 md:items-end max-w-4xl" >
                                <StoreInfo store={store} />

                                <div className="flex items-center gap-3 pt-2 flex-wrap">
                                    <button onClick={() => toast.promise(handleEdit(store.id), { loading: 'Opening editor...' })} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm" >
                                        Edit Store
                                    </button>
                                </div>
                            </div>
                        )
                    })()}

                </div>
            ) : (
                <div className="flex items-center justify-center h-80">
                    <h1 className="text-3xl text-slate-400 font-medium">No store configured</h1>
                </div>
            )
            }
        </div>
    ) : <Loading />
}