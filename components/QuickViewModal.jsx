'use client'
import React, { useState } from 'react'
import { StarIcon, Heart, MessageCircle, ShoppingCartIcon, X } from 'lucide-react'
import Image from 'next/image'
import { useDispatch, useSelector } from 'react-redux'
import { addToWishlist, removeFromWishlist } from '@/lib/features/wishlist/wishlistSlice'
import { addToCart } from '@/lib/features/cart/cartSlice'
import { useAuth } from '@/app/providers/AuthProvider'
import ReviewForm from './ReviewForm'
import toast from 'react-hot-toast'

const QuickViewModal = ({ product, onClose, rating = 0 }) => {
    const dispatch = useDispatch()
    const { user } = useAuth()
    const wishlistItems = useSelector(state => state.wishlist?.items || [])
    const inWishlist = wishlistItems.find(i => i.id === product.id)
    const [showReviewForm, setShowReviewForm] = useState(false)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)

    const toggleWishlist = () => {
        if (inWishlist) dispatch(removeFromWishlist(product.id))
        else dispatch(addToWishlist(product))
    }

    const handleAddToCart = () => {
        dispatch(addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images?.[0],
            product: product,
            quantity: 1
        }))
        toast.success('Added to cart!')
    }

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
    const originalPrice = product.originalPrice || product.mrp
    const discountPercent = originalPrice ? Math.round(((originalPrice - product.price) / originalPrice) * 100) : 0
    const isOutOfStock = product.inStock === false || product.stock === 'out_of_stock'
    const isLowStock = product.stock < 5 && product.stock > 0

    return (
        <>
            <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4' onClick={onClose}>
                <div 
                    className='bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className='flex justify-between items-center p-4 border-b sticky top-0 bg-white'>
                        <h2 className='text-lg font-semibold text-slate-900'>Quick View</h2>
                        <button 
                            onClick={onClose}
                            className='p-2 hover:bg-slate-100 rounded-lg transition'
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className='p-6'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            {/* Images */}
                            <div className='flex flex-col gap-4'>
                                <div className='bg-slate-100 rounded-lg overflow-hidden'>
                                    {product?.images && product.images.length > 0 ? (
                                        <Image
                                            src={product.images[selectedImageIndex]}
                                            alt={product.name}
                                            width={400}
                                            height={400}
                                            className='w-full h-auto object-cover'
                                        />
                                    ) : (
                                        <div className='w-full h-80 flex items-center justify-center text-slate-400'>
                                            No Image
                                        </div>
                                    )}
                                </div>
                                {product?.images && product.images.length > 1 && (
                                    <div className='flex gap-2'>
                                        {product.images.map((img, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedImageIndex(idx)}
                                                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                                                    selectedImageIndex === idx
                                                        ? 'border-yellow-500'
                                                        : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                            >
                                                <Image
                                                    src={img}
                                                    alt={`${product.name} ${idx}`}
                                                    width={64}
                                                    height={64}
                                                    className='w-full h-full object-cover'
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div className='flex flex-col gap-4'>
                                <div>
                                    <h1 className='text-xl sm:text-2xl font-bold text-slate-900 mb-2'>
                                        {product.name}
                                    </h1>
                                    
                                    {/* Rating */}
                                    <div className='flex items-center gap-2 mb-3'>
                                        <div className='flex gap-0.5'>
                                            {Array(5).fill('').map((_, index) => (
                                                <StarIcon
                                                    key={index}
                                                    size={16}
                                                    fill={rating >= index + 1 ? "#00C950" : "#D1D5DB"}
                                                    stroke={rating >= index + 1 ? "#00C950" : "#D1D5DB"}
                                                />
                                            ))}
                                        </div>
                                        <span className='text-sm text-slate-600'>({rating}/5)</span>
                                    </div>

                                    {/* Stock Status */}
                                    <div className='mb-3'>
                                        {isOutOfStock ? (
                                            <span className='text-sm font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full inline-block'>
                                                Out of Stock
                                            </span>
                                        ) : isLowStock ? (
                                            <span className='text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full inline-block'>
                                                Low Stock ({product.stock} left)
                                            </span>
                                        ) : (
                                            <span className='text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full inline-block'>
                                                In Stock
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className='border-b pb-4'>
                                    <div className='flex items-center gap-3 mb-2'>
                                        <p className='text-3xl font-bold text-slate-900'>
                                            {currency}{product.price}
                                        </p>
                                        {originalPrice && originalPrice > product.price && (
                                            <p className='text-lg text-slate-400 line-through'>
                                                {currency}{originalPrice}
                                            </p>
                                        )}
                                    </div>
                                    {discountPercent > 0 && (
                                        <p className='text-lg font-semibold text-green-600'>
                                            Save {discountPercent}% ({currency}{(originalPrice - product.price).toFixed(2)})
                                        </p>
                                    )}
                                </div>

                                {/* Description */}
                                {product.description && (
                                    <div className='text-slate-600 text-sm mb-4'>
                                        <h3 className='font-semibold text-slate-900 mb-2'>Description</h3>
                                        <p className='line-clamp-3'>{product.description}</p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className='flex gap-3 flex-wrap'>
                                    <button
                                        onClick={handleAddToCart}
                                        disabled={isOutOfStock}
                                        className='flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-white rounded-lg font-semibold transition-all hover:bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed'
                                    >
                                        <ShoppingCartIcon size={20} />
                                        Add to Cart
                                    </button>
                                    <button
                                        onClick={toggleWishlist}
                                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
                                            inWishlist
                                                ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        <Heart size={20} fill={inWishlist ? 'currentColor' : 'none'} />
                                        {inWishlist ? 'Saved' : 'Save'}
                                    </button>
                                </div>

                                {/* Review Button */}
                                <button
                                    onClick={() => setShowReviewForm(true)}
                                    className='w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-slate-200 rounded-lg text-slate-700 font-semibold hover:border-slate-300 transition-all'
                                >
                                    <MessageCircle size={20} />
                                    Write a Review
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Review Form Modal */}
            {showReviewForm && (
                <ReviewForm
                    productId={product.id}
                    productName={product.name}
                    onClose={() => setShowReviewForm(false)}
                    onSuccess={() => {}}
                />
            )}
        </>
    )
}

export default QuickViewModal
