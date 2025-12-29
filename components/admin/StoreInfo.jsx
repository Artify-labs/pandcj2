'use client'
import Image from "next/image"
import { MapPin, Mail, Phone } from "lucide-react"
import { assets } from "@/assets/assets"

const StoreInfo = ({ store }) => {
    const safeStore = store || {}
    const logoSrc = safeStore.logo || assets.gs_logo
    const name = safeStore.name || 'Unnamed Store'
    const username = safeStore.username || ''
    const status = safeStore.status || 'approved'
    const description = safeStore.description || ''
    const address = safeStore.address || ''
    const contact = safeStore.contact || ''
    const email = safeStore.email || ''
    const createdAt = safeStore.createdAt ? new Date(safeStore.createdAt).toLocaleDateString() : ''
    const user = safeStore.user || { name: 'Store Owner', email: '', image: assets.gs_logo }

    return (
        <div className="flex-1 space-y-2 text-sm">
            <Image width={100} height={100} src={logoSrc} alt={name} className="max-w-20 max-h-20 object-contain shadow rounded-full max-sm:mx-auto" />
            <div className="flex flex-col sm:flex-row gap-3 items-center">
                <h3 className="text-xl font-semibold text-slate-800"> {name} </h3>
                {username && <span className="text-sm">@{username}</span>}

                <span
                    className={`text-xs font-semibold px-4 py-1 rounded-full ${status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                >
                    {status}
                </span>
            </div>

            {description && <p className="text-slate-600 my-5 max-w-2xl">{description}</p>}
            {address && <p className="flex items-center gap-2"> <MapPin size={16} /> {address}</p>}
            {contact && <p className="flex items-center gap-2"><Phone size={16} /> {contact}</p>}
            {email && <p className="flex items-center gap-2"><Mail size={16} />  {email}</p>}
            {createdAt && <p className="text-slate-700 mt-5">Created on <span className="text-xs">{createdAt}</span></p>}

            {/* Owner info removed for single-store (sole business) model */}
        </div>
    )
}

export default StoreInfo