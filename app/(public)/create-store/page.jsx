'use client'
import { assets } from "@/assets/assets"
import { useEffect, useState } from "react"
import Image from "next/image"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"

export default function CreateStore() {

    const [alreadySubmitted, setAlreadySubmitted] = useState(false)
    const [status, setStatus] = useState("")
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState("")

    const [storeInfo, setStoreInfo] = useState({
        name: "",
        username: "",
        description: "",
        email: "",
        contact: "",
        address: "",
        image: ""
    })

    const onChangeHandler = (e) => {
        setStoreInfo({ ...storeInfo, [e.target.name]: e.target.value })
    }

    const fetchSellerStatus = async () => {
        // Logic to check if the store is already submitted


        setLoading(false)
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        // Logic to submit the store details


    }

    useEffect(() => {
        fetchSellerStatus()
    }, [])

    // Store applications are disabled in sole-business model. Show informational message.
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-500 mx-6 my-16">
            <h1 className="text-3xl mb-4">Store applications are closed</h1>
            <p className="max-w-lg text-center">This marketplace runs a single-store model. Store creation by users is disabled. If you need a storefront, contact the site administrator.</p>
        </div>
    )
}