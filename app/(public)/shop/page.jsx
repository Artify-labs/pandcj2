'use client'
import { Suspense } from "react"
import ProductCard from "@/components/ProductCard"
import { MoveLeftIcon } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSelector } from "react-redux"

 function ShopContent() {

    // get query params ?search=abc
    const searchParams = useSearchParams()
    const search = searchParams.get('search')
    const router = useRouter()

    const products = useSelector(state => state.product.list || [])

    const filteredProducts = (search
        ? products.filter(product =>
            product.name.toLowerCase().includes(search.toLowerCase())
        )
        : products
    )

    return (
        <div className="min-h-[70vh] mx-3 sm:mx-6">
            <div className="max-w-7xl mx-auto">
                <h1 onClick={() => router.push('/shop')} className="text-xl sm:text-2xl text-slate-500 my-4 sm:my-6 flex items-center gap-2 cursor-pointer hover:text-slate-700 transition"> 
                    {search && <MoveLeftIcon size={18} className="sm:size-[20px]" />}  All <span className="text-slate-700 font-medium">Products</span>
                </h1>
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 xl:gap-8 mx-auto mb-32">
                    {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
                </div>
            </div>
        </div>
    )
}


export default function Shop() {
  return (
    <Suspense fallback={<div>Loading shop...</div>}>
      <ShopContent />
    </Suspense>
  );
}