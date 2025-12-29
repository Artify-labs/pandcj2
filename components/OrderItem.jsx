 'use client'
import Image from "next/image";
import { DotIcon } from "lucide-react";
import { useSelector } from "react-redux";
import Rating from "./Rating";
import { useState } from "react";
import RatingModal from "./RatingModal";
import { useRouter } from 'next/navigation'

const OrderItem = ({ order, editable = false, onStatusChange = null, onCancel = null }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';
    const [ratingModal, setRatingModal] = useState(null);

    const { ratings } = useSelector(state => state.rating);
    const router = useRouter()

    return (
        <>
            <tr className="text-sm">
                <td className="text-left">
                    <div className="flex flex-col gap-6">
                        {order.orderItems.map((item, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <div className="w-20 aspect-square bg-slate-100 flex items-center justify-center rounded-md">
                                    <Image
                                        className="h-14 w-auto"
                                        src={item.product.images[0]}
                                        alt="product_img"
                                        width={50}
                                        height={50}
                                    />
                                </div>
                                <div className="flex flex-col justify-center text-sm">
                                    <p className="font-medium text-slate-600 text-base">{item.product.name}</p>
                                    <p>{currency}{item.price} Qty : {item.quantity} </p>
                                    <p className="mb-1">{new Date(order.createdAt).toDateString()}</p>
                                    <div>
                                        {ratings.find(rating => order.id === rating.orderId && item.product.id === rating.productId)
                                            ? <Rating value={ratings.find(rating => order.id === rating.orderId && item.product.id === rating.productId).rating} />
                                            : <button onClick={() => setRatingModal({ orderId: order.id, productId: item.product.id })} className={`text-green-500 hover:bg-green-50 transition ${order.status !== "DELIVERED" && 'hidden'}`}>Rate Product</button>
                                        }</div>
                                    {ratingModal && <RatingModal ratingModal={ratingModal} setRatingModal={setRatingModal} />}
                                </div>
                            </div>
                        ))}
                    </div>
                </td>

                <td className="text-center max-md:hidden">{currency}{order.total}</td>

                <td className="text-left max-md:hidden">
                    <p>{order.address.name}, {order.address.street},</p>
                    <p>{order.address.city}, {order.address.state}, {order.address.zip}, {order.address.country},</p>
                    <p>{order.address.phone}</p>
                </td>

                <td className="text-left space-y-2 text-sm max-md:hidden">
                    {editable && typeof onStatusChange === 'function' ? (
                        <div className="flex flex-col gap-2">
                            <select
                                value={order.status}
                                onChange={(e) => onStatusChange(order.id, e.target.value)}
                                className="px-3 py-1 rounded border"
                            >
                                <option value="ORDER_PLACED">Ordered</option>
                                <option value="PROCESSING">Processing</option>
                                <option value="CANCELLED">Cancelled</option>
                                <option value="SHIPPED">Shipped</option>
                                <option value="DELIVERED">Delivered</option>
                            </select>
                            <div className="flex items-center gap-2">
                                {onCancel && (order.status === 'ORDER_PLACED' || order.status === 'PROCESSING') && (
                                    <button onClick={() => onCancel(order.id)} className="text-red-600 bg-red-50 px-3 py-1 rounded">Cancel</button>
                                )}
                                <button onClick={() => router.push(`/store/orders/${order.id}`)} className="text-slate-700 bg-slate-100 px-3 py-1 rounded">View</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div
                                className={`flex items-center justify-center gap-1 rounded-full p-1 ${order.status === 'PROCESSING'
                                    ? 'text-yellow-500 bg-yellow-100'
                                    : order.status === 'DELIVERED'
                                        ? 'text-green-500 bg-green-100'
                                        : 'text-slate-500 bg-slate-100'
                                    }`}
                            >
                                <DotIcon size={10} className="scale-250" />
                                {String(order.status).split('_').join(' ').toLowerCase()}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                {onCancel && (order.status === 'ORDER_PLACED' || order.status === 'PROCESSING') && (
                                    <button onClick={() => onCancel(order.id)} className="text-red-600 bg-red-50 px-3 py-1 rounded">Cancel</button>
                                )}
                                {editable && (
                                    onView ? (
                                        <button onClick={() => onView(order)} className="text-slate-700 bg-slate-100 px-3 py-1 rounded">View</button>
                                    ) : (
                                        <button onClick={() => router.push(`/store/orders/${order.id}`)} className="text-slate-700 bg-slate-100 px-3 py-1 rounded">View</button>
                                    )
                                )}
                            </div>
                        </>
                    )}
                </td>
            </tr>
            {/* Mobile */}
            <tr className="md:hidden">
                <td colSpan={5}>
                    <p>{order.address.name}, {order.address.street}</p>
                    <p>{order.address.city}, {order.address.state}, {order.address.zip}, {order.address.country}</p>
                    <p>{order.address.phone}</p>
                    <br />
                    <div className="flex items-center">
                        {editable && typeof onStatusChange === 'function' ? (
                            <select
                                value={order.status}
                                onChange={(e) => onStatusChange(order.id, e.target.value)}
                                className="px-3 py-1 rounded border mx-auto"
                            >
                                <option value="ORDER_PLACED">Ordered</option>
                                <option value="PROCESSING">Processing</option>
                                    <option value="CANCELLED">Cancelled</option>
                                <option value="SHIPPED">Shipped</option>
                                <option value="DELIVERED">Delivered</option>
                            </select>
                        ) : (
                            <div className="mx-auto flex items-center gap-2">
                                <span className='text-center px-3 py-1.5 rounded bg-green-100 text-green-700' >{String(order.status).replace(/_/g, ' ').toLowerCase()}</span>
                                {onCancel && (order.status === 'ORDER_PLACED' || order.status === 'PROCESSING') && (
                                    <button onClick={() => onCancel(order.id)} className="text-red-600 bg-red-50 px-3 py-1 rounded">Cancel</button>
                                )}
                                {editable && (
                                    <button onClick={() => { if (typeof window !== 'undefined') window.location.href = `/store/orders/${order.id}` }} className="text-slate-700 bg-slate-100 px-3 py-1 rounded">View</button>
                                )}
                            </div>
                        )}
                    </div>
                </td>
            </tr>
            <tr>
                <td colSpan={4}>
                    <div className="border-b border-slate-300 w-6/7 mx-auto" />
                </td>
            </tr>
        </>
    )
}

export default OrderItem