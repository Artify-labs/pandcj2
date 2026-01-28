import { useEffect, useState, useMemo } from 'react'

/**
 * Custom hook to fetch ratings for multiple products
 * Solves N+1 problem by fetching all ratings at once instead of per-product
 */
export const useProductRatings = (productIds = []) => {
    const [ratings, setRatings] = useState({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!productIds || productIds.length === 0) {
            setLoading(false)
            return
        }

        const fetchRatings = async () => {
            try {
                setLoading(true)
                // Batch fetch: send all product IDs at once
                const params = new URLSearchParams()
                productIds.forEach(id => params.append('productIds', id))

                const res = await fetch(`/api/ratings/batch?${params.toString()}`)
                
                if (res.ok) {
                    const data = await res.json()
                    setRatings(data.data || {})
                } else {
                    setError('Failed to fetch ratings')
                }
            } catch (err) {
                console.error('Error fetching ratings:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchRatings()
    }, [productIds])

    // Memoized getter function
    const getRating = useMemo(() => {
        return (productId) => {
            return ratings[productId]?.rating || 0
        }
    }, [ratings])

    return { ratings, getRating, loading, error }
}
