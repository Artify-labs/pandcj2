'use client'
import { assets } from '@/assets/assets'
import { ArrowRightIcon, ChevronRightIcon } from 'lucide-react'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import CategoriesMarquee from './CategoriesMarquee'

const Hero = ({ initial = null }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
    const [settings, setSettings] = useState(initial)

    useEffect(() => {
        let mounted = true
        let es

        try {
            es = new EventSource('/api/settings/stream?key=banner')
            es.addEventListener('update', (ev) => {
                try {
                    const msg = JSON.parse(ev.data)
                    if (mounted && msg && msg.data) {
                        setSettings(msg.data)
                    }
                } catch (e) { }
            })
        } catch (e) { }

        return () => {
            mounted = false
            if (es) es.close()
        }
    }, [])

    const s = settings || {}

    const left = s.left || {}
    const topRight = s.topRight || {}
    const bottomRight = s.bottomRight || {}

    return (
        <div className='mx-3 sm:mx-6'>
            <div className='flex max-xl:flex-col gap-4 sm:gap-8 max-w-7xl mx-auto my-8 sm:my-10'>
                <div
                    className='relative flex-1 flex flex-col rounded-2xl sm:rounded-3xl xl:min-h-100 group'
                    style={
                        left.bgColor
                            ? { backgroundColor: left.bgColor }
                            : left.bgImage
                                ? { backgroundImage: `url(${left.bgImage})`, backgroundSize: 'cover' }
                                : { backgroundColor: '#fcf2dcff' }
                    }
                >
                    <div className='p-3 sm:p-8 md:p-12 lg:p-16'>
                        <div className='inline-flex items-center gap-2 sm:gap-3 pr-2 sm:pr-4 p-1 rounded-full text-xs sm:text-sm' style={{ background: left.newsBg || '#ef9b86ff' }}>
                            <span className='bg-yellow-600 px-2 sm:px-3 py-1 max-sm:ml-1 rounded-full text-white text-xs'>{left.newsLabel || 'NEWS'}</span>
                            <span className='text-black text-xs sm:text-sm'>{left.newsDescription || 'Free Shipping on Orders Above ₹2999!'}</span> 
                        </div>
                        <h2 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-[1.2] my-2 sm:my-3 font-medium text-black max-w-xs  sm:max-w-md'>
                            {left.title || "Gadgets you'll love. Prices you'll trust."}
                        </h2>
                        <div className='text-black text-xs sm:text-sm font-medium mt-3 sm:mt-4 md:mt-8'>
                            <p className='text-black'>{left.priceLabel || 'Starts from'}</p>
                            <p className='text-2xl sm:text-3xl text-black'>{currency}{left.price || '4.90'}</p>
                        </div>
                        <a href={left.learnMoreLink || '/'} className='inline-block'>
                            <button className='bg-slate-800 text-white text-xs sm:text-sm py-2 sm:py-2.5 px-5 sm:px-7 md:py-3 md:px-10 lg:py-5 lg:px-12 mt-3 sm:mt-4 md:mt-8 lg:mt-10 rounded-md hover:bg-slate-900 hover:scale-103 active:scale-95 transition'>BUY NOW</button>
                        </a>
                    </div>
                    <Image className='sm:absolute bottom-0 right-0 md:right-10 w-full sm:max-w-sm' src={left.modelImage || assets.hero_model_img} alt="" />
                </div>
                    <div className='flex flex-col md:flex-row xl:flex-col gap-3 sm:gap-5 w-full xl:max-w-sm text-xs sm:text-sm text-black'>
                    <div
                        className='flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between w-full rounded-2xl sm:rounded-3xl p-4 sm:p-6 px-4 sm:px-8 group'
                        style={
                            topRight.bgColor
                                ? { backgroundColor: topRight.bgColor }
                                : topRight.bgImage
                                    ? { backgroundImage: `url(${topRight.bgImage})`, backgroundSize: 'cover' }
                                    : { backgroundColor: '#FED7AA' }
                        }
                    >
                        <div>
                            <p className='text-xl sm:text-2xl md:text-3xl font-medium text-black max-w-40'>{topRight.title || 'Best products'}</p>
                            <p className='flex items-center gap-1 mt-2 sm:mt-4'><a href={topRight.link || '#'} className='flex items-center gap-1 text-black text-xs sm:text-sm'>View more <ArrowRightIcon className='group-hover:ml-2 transition-all' size={16} /></a> </p>
                        </div>
                        <Image className='w-24 sm:w-35 mt-2 sm:mt-0' src={topRight.image || assets.hero_product_img1} alt="" />
                    </div>
                    <div
                        className='flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between w-full rounded-2xl sm:rounded-3xl p-4 sm:p-6 px-4 sm:px-8 group'
                        style={
                            bottomRight.bgColor
                                ? { backgroundColor: bottomRight.bgColor }
                                : bottomRight.bgImage
                                    ? { backgroundImage: `url(${bottomRight.bgImage})`, backgroundSize: 'cover' }
                                    : { backgroundColor: '#DBEAFE' }
                        }
                    >
                        <div>
                            <p className='text-xl sm:text-2xl md:text-3xl font-medium text-black max-w-40'>{bottomRight.title || '20% discounts'}</p>
                            <p className='flex items-center gap-1 mt-2 sm:mt-4'><a href={bottomRight.link || '#'} className='flex items-center gap-1 text-black text-xs sm:text-sm'>View more <ArrowRightIcon className='group-hover:ml-2 transition-all' size={16} /></a> </p>
                        </div>
                        <Image className='w-24 sm:w-35 mt-2 sm:mt-0' src={bottomRight.image || assets.hero_product_img2} alt="" />
                    </div>
                </div>
            </div>
            <CategoriesMarquee />
        </div>

    )
}

export default Hero