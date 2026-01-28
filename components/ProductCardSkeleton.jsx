'use client'
import React from 'react'

const ProductCardSkeleton = () => {
    return (
        <div className='group max-xl:mx-auto relative animate-pulse'>
            <div className='rounded-md'>
                <div className='bg-slate-200 h-40 sm:h-56 md:h-68 rounded-lg'></div>
                <div className='pt-2 px-1 sm:px-0'>
                    <div className='h-4 bg-slate-200 rounded w-3/4 mb-2'></div>
                    <div className='h-4 bg-slate-200 rounded w-1/2 mb-3'></div>
                    <div className='flex gap-1 mb-2'>
                        {Array(5).fill('').map((_, i) => (
                            <div key={i} className='h-4 w-4 bg-slate-200 rounded'></div>
                        ))}
                    </div>
                    <div className='h-5 bg-slate-200 rounded w-1/3'></div>
                </div>
            </div>
        </div>
    )
}

export default ProductCardSkeleton
