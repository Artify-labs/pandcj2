'use client'
import { dummyAdminDashboardData } from "@/assets/assets"
import Loading from "@/components/Loading"
import OrdersAreaChart from "@/components/OrdersAreaChart"
import { CircleDollarSignIcon, ShoppingBasketIcon, StoreIcon, TagsIcon } from "lucide-react"
import { useEffect, useState } from "react"

export default function AdminDashboard() {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const [loading, setLoading] = useState(true)
    const [dashboardData, setDashboardData] = useState({
        products: 0,
        revenue: 0,
        orders: 0,
        stores: 0,
        cancelled: 0,
        allOrders: [],
    })

    const dashboardCardsData = [
        { title: 'Total Products', value: dashboardData.products, icon: ShoppingBasketIcon },
        { title: 'Total Revenue', value: currency + dashboardData.revenue, icon: CircleDollarSignIcon },
        { title: 'Total Orders', value: dashboardData.orders, icon: TagsIcon },
        { title: 'Total Cancelled', value: dashboardData.cancelled, icon: StoreIcon },
    ]

    const fetchDashboardData = async () => {
        try {
            let products = []
            try { const r = await fetch('/api/products'); if (r.ok) products = await r.json() } catch (e) { products = [] }

            let orders = []
            try { const r = await fetch('/api/orders'); if (r.ok) orders = await r.json() } catch (e) { orders = [] }

            let stores = []
            try { const r = await fetch('/api/admin/stores'); if (r.ok) stores = await r.json() } catch (e) { stores = [] }

            const cancelledOrders = (orders || []).filter(o => (o.status && String(o.status).toUpperCase().startsWith('CANCEL')))
            const visibleOrders = (orders || []).filter(o => !(o.status && String(o.status).toUpperCase().startsWith('CANCEL')))

            const revenue = visibleOrders.reduce((s, o) => s + (Number(o.total) || 0), 0)

            setDashboardData({
                products: (products || []).length,
                revenue,
                orders: visibleOrders.length,
                stores: (stores || []).length,
                cancelled: cancelledOrders.length,
                allOrders: visibleOrders,
            })
        } catch (e) {
            console.error('Failed to load admin dashboard data', e)
            setDashboardData(dummyAdminDashboardData)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    if (loading) return <Loading />

    return (
        <div className="text-slate-500">
            <h1 className="text-2xl">Admin <span className="text-slate-800 font-medium">Dashboard</span></h1>

            {/* Cards */}
            <div className="flex flex-wrap gap-5 my-10 mt-4">
                {
                    dashboardCardsData.map((card, index) => (
                        <div key={index} className="flex items-center gap-10 border border-slate-200 p-3 px-6 rounded-lg">
                            <div className="flex flex-col gap-3 text-xs">
                                <p>{card.title}</p>
                                <b className="text-2xl font-medium text-slate-700">{card.value}</b>
                            </div>
                            <card.icon size={50} className=" w-11 h-11 p-2.5 text-slate-400 bg-slate-100 rounded-full" />
                        </div>
                    ))
                }
            </div>

            {/* Area Chart */}
            <OrdersAreaChart allOrders={dashboardData.allOrders} />
        </div>
    )
}