'use client'
import StoreInfo from "@/components/admin/StoreInfo"
import Loading from "@/components/Loading"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

export default function AdminApprove() {

    const [stores, setStores] = useState([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()


    const fetchStores = async () => {
        // Single-store mode: load stores from backend when available.
        setStores([])
        setLoading(false)
    }

    const handleEdit = (storeId) => {
        // Return a Promise so callers using toast.promise get a settled promise
        return new Promise((resolve) => {
            try {
                router.push(`/admin/stores/edit${storeId ? `?id=${storeId}` : ''}`)
            } catch (e) {}
            setTimeout(() => resolve(true), 100)
        })
    }

    useEffect(() => {
        // Approve flow removed — redirect to stores page in single-store model
        router.replace('/admin/stores')
    }, [])

    return !loading ? (
        <div className="text-slate-500 mb-28">
            <h1 className="text-2xl">Edit <span className="text-slate-800 font-medium">Store</span></h1>

            {stores.length ? (
                // Show only the first (own) store in single-store mode
                <div className="flex flex-col gap-4 mt-4">
                    {(() => {
                        const store = stores[0]
                        return (
                            <div key={store.id} className="bg-white border rounded-lg shadow-sm p-6 flex max-md:flex-col gap-4 md:items-end max-w-4xl" >
                                <StoreInfo store={store} />

                                <div className="flex gap-3 pt-2 flex-wrap">
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
                    <h1 className="text-3xl text-slate-400 font-medium">No Store Found</h1>
                </div>
            )}
        </div>
    ) : <Loading />
}