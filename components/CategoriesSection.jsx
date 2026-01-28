'use client'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const CategoriesSection = () => {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/categories')
                if (res.ok) {
                    const data = await res.json()
                    setCategories(data.data || [])
                }
            } catch (error) {
                console.error('Error fetching categories:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchCategories()
    }, [])

    if (loading || categories.length === 0) return null

    return (
        <div className='py-8 sm:py-12 md:py-16 mx-3 sm:mx-6 md:mx-8'>
            <div className='max-w-7xl mx-auto'>
                {/* Section Title */}
                <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-8 text-center'>
                    Shop by Category
                </h2>

                {/* Categories Grid */}
                <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 sm:gap-6'>
                    {categories.map((category) => (
                        <Link
                            key={category._id}
                            href={`/shop?category=${encodeURIComponent(category.name)}`}
                            className='flex flex-col items-center gap-3 group cursor-pointer'
                        >
                            {/* Circular Image */}
                            <div className='relative w-20 sm:w-24 md:w-28 h-20 sm:h-24 md:h-28 rounded-full overflow-hidden shadow-md group-hover:shadow-lg transition-shadow'>
                                <Image
                                    src={category.image}
                                    alt={category.name}
                                    fill
                                    className='object-cover group-hover:scale-110 transition-transform duration-300'
                                />
                            </div>

                            {/* Category Name */}
                            <p className='text-xs sm:text-sm md:text-base font-semibold text-slate-800 text-center line-clamp-2 group-hover:text-yellow-600 transition-colors'>
                                {category.name}
                            </p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default CategoriesSection
