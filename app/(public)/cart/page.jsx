'use client'
import Counter from "@/components/Counter";
import OrderSummary from "@/components/OrderSummary";
import PageTitle from "@/components/PageTitle";
import { deleteItemFromCart } from "@/lib/features/cart/cartSlice";
import { Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from '@/lib/features/cart/cartSlice'
import { removeFromWishlist } from '@/lib/features/wishlist/wishlistSlice'
import { toast } from 'react-hot-toast'

export default function Cart() {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';
    
    const { cartItems } = useSelector(state => state.cart);
    const products = useSelector(state => state.product.list);

    const dispatch = useDispatch();

    const [cartArray, setCartArray] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const wishlistItems = useSelector(state => state.wishlist?.items || [])

    const createCartArray = () => {
        setTotalPrice(0);
        const cartArray = [];
        for (const [key, value] of Object.entries(cartItems)) {
            const product = products.find(product => product.id === key);
            if (product) {
                cartArray.push({
                    ...product,
                    quantity: value,
                });
                setTotalPrice(prev => prev + product.price * value);
            }
        }
        setCartArray(cartArray);
    }

    const handleDeleteItemFromCart = (productId) => {
        dispatch(deleteItemFromCart({ productId }))
    }

    const moveWishlistToCart = (product) => {
        if (!product || !product.id) return
        if (product.inStock === false) {
            toast.error('Cannot add — product is out of stock')
            return
        }
        dispatch(addToCart({ productId: product.id }))
        dispatch(removeFromWishlist(product.id))
    }

    useEffect(() => {
        if (products.length > 0) {
            createCartArray();
        }
    }, [cartItems, products]);

    return cartArray.length > 0 ? (
        <div className="min-h-screen mx-6 text-slate-800">

            <div className="max-w-7xl mx-auto ">
                {/* Title */}
                <PageTitle heading="My Cart" text="items in your cart" linkText="Add more" />

                <div className="flex items-start justify-between gap-5 max-lg:flex-col">

                    <div className="w-full max-w-4xl">
                        <table className="w-full text-slate-600 table-auto">
                        <thead>
                            <tr className="max-sm:text-sm">
                                <th className="text-left">Product</th>
                                <th>Quantity</th>
                                <th>Total Price</th>
                                <th className="max-md:hidden">Remove</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                cartArray.map((item, index) => (
                                    <tr key={index} className="space-x-2">
                                        <td className="flex gap-3 my-4">
                                            <div className="flex gap-3 items-center justify-center bg-slate-100 size-18 rounded-md">
                                                <Image src={item.images[0]} className="h-14 w-auto" alt="" width={45} height={45} />
                                            </div>
                                            <div>
                                                <p className="max-sm:text-sm">{item.name}</p>
                                                <p className="text-xs text-slate-500">{item.category}</p>
                                                <p>{currency}{item.price}</p>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <Counter productId={item.id} />
                                        </td>
                                        <td className="text-center">{currency}{(item.price * item.quantity).toLocaleString()}</td>
                                        <td className="text-center max-md:hidden">
                                            <button onClick={() => handleDeleteItemFromCart(item.id)} className=" text-red-500 hover:bg-red-50 p-2.5 rounded-full active:scale-95 transition-all">
                                                <Trash2Icon size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                    </div>

                    <div className="w-80">
                        <div className="bg-white p-4 rounded shadow">
                            <div className="flex gap-2">
                                <button className="flex-1 py-2 px-3 bg-violet-600 text-white rounded">Cart</button>
                                <a href="#wishlist" className="flex-1 py-2 px-3 text-slate-600 rounded border">Wishlist</a>
                            </div>
                            <div className="mt-4">
                                <OrderSummary totalPrice={totalPrice} items={cartArray} />
                            </div>
                        </div>

                        <div id="wishlist" className="mt-4 bg-white p-4 rounded shadow">
                            <h3 className="font-semibold">Wishlist</h3>
                            {wishlistItems.length === 0 ? (
                                <p className="text-sm text-slate-500 mt-3">No items in wishlist</p>
                            ) : (
                                <div className="flex flex-col gap-3 mt-3">
                                    {wishlistItems.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-slate-100 size-12 rounded flex items-center justify-center">
                                                    <Image src={item.images && item.images[0] ? item.images[0] : '/assets/slide_1.jpg'} alt="" width={48} height={48} />
                                                </div>
                                                <div>
                                                    <p className="text-sm">{item.name}</p>
                                                    <p className="text-xs text-slate-500">{currency}{item.price}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => moveWishlistToCart(item)} className="px-3 py-1 bg-slate-800 text-white rounded text-sm">Add to cart</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    ) : (
        <div className="min-h-[80vh] mx-6 flex items-center justify-center">
            <div className="text-center">
                <div className="mx-auto mb-6 w-48 h-48 md:w-64 md:h-64">
                    <img src="/images/empty_cart.png" alt="empty cart" className=" w-full h-full " />
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold text-slate-800">Your cart is empty and sad :(</h1>
                <p className="text-slate-500 mt-2">Add something to make it happy!</p>
                <div className="mt-6">
                    <a href="/shop" className="inline-block bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-md">Continue Shopping</a>
                </div>
            </div>
        </div>
    )
}