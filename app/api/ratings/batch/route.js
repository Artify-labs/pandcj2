import { getMongoClient } from '@/lib/mongodb'

const DB_NAME = process.env.MONGODB_DB || 'pandc'

/**
 * Batch fetch ratings for multiple products
 * GET /api/ratings/batch?productIds=id1&productIds=id2&productIds=id3
 * 
 * Solves N+1 problem by fetching all ratings at once
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const productIds = searchParams.getAll('productIds')

        if (!productIds || productIds.length === 0) {
            return Response.json({
                success: false,
                message: 'No product IDs provided'
            }, { status: 400 })
        }

        const client = await getMongoClient()
        const db = client.db(DB_NAME)
        const ratingsCollection = db.collection('ratings')

        // Fetch ratings for all products at once
        const ratingsData = await Promise.all(
            productIds.map(async (productId) => {
                try {
                    const reviews = await ratingsCollection
                        .find({ productId })
                        .limit(100)
                        .toArray()

                    if (!reviews || reviews.length === 0) {
                        return { productId, rating: 0, count: 0 }
                    }

                    const avgRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
                    return {
                        productId,
                        rating: Math.round(avgRating),
                        count: reviews.length
                    }
                } catch (err) {
                    console.error(`Error fetching reviews for product ${productId}:`, err)
                    return { productId, rating: 0, count: 0 }
                }
            })
        )

        // Convert to object keyed by productId for easier access
        const ratingsMap = {}
        ratingsData.forEach(({ productId, rating, count }) => {
            ratingsMap[productId] = { rating, count }
        })

        return Response.json({
            success: true,
            data: ratingsMap
        })
    } catch (error) {
        console.error('[Ratings Batch API] Error:', error)
        return Response.json({
            success: false,
            message: 'Failed to fetch ratings',
            error: error.message
        }, { status: 500 })
    }
}
