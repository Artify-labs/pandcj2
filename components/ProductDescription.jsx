'use client'
import { ArrowRight, StarIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

const ProductDescription = ({ product = {} }) => {

    const [selectedTab, setSelectedTab] = useState('Description')

    const description = product?.description || '';
    const ratings = Array.isArray(product?.rating) ? product.rating : [];
    const store = product?.store || {};

    return (
        <div className="my-18 text-sm text-slate-600">

            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6 max-w-2xl">
                {['Description', 'Reviews'].map((tab, index) => (
                    <button className={`${tab === selectedTab ? 'border-b-[1.5px] font-semibold' : 'text-slate-400'} px-3 py-2 font-medium`} key={index} onClick={() => setSelectedTab(tab)}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* Description */}
            {selectedTab === "Description" && (
                <p className="max-w-xl">{description}</p>
            )}

            {/* Reviews */}
            {selectedTab === "Reviews" && (
                <div className="flex flex-col gap-3 mt-14">
                    {ratings.length ? ratings.map((item, index) => (
                        <div key={index} className="flex gap-5 mb-10">
                            <Image src={item?.user?.image || '/assets/slide_1.jpg'} alt="" className="size-10 rounded-full" width={100} height={100} />
                            <div>
                                <div className="flex items-center" >
                                    {Array(5).fill('').map((_, i) => (
                                        <StarIcon key={i} size={18} className='text-transparent mt-0.5' fill={(item?.rating || 0) >= i + 1 ? "#00C950" : "#D1D5DB"} />
                                    ))}
                                </div>
                                <p className="text-sm max-w-lg my-4">{item?.review || ''}</p>
                                <p className="font-medium text-slate-800">{item?.user?.name || 'Anonymous'}</p>
                                <p className="mt-3 font-light">{item?.createdAt ? new Date(item.createdAt).toDateString() : ''}</p>
                            </div>
                        </div>
                    )) : (
                        <p className="text-slate-500">No reviews yet.</p>
                    )}
                </div>
            )}

            {/* Store Page removed per request */}
        </div>
    )
}

export default ProductDescription