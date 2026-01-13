import { getMongoClient } from '@/lib/mongodb';

const DB_NAME = process.env.MONGODB_DB || 'pandc';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get('productId');

    if (!productId) {
      return new Response(
        JSON.stringify({ error: 'productId query parameter is required' }),
        { status: 400 }
      );
    }

    const client = await getMongoClient();
    const db = client.db(DB_NAME);
    const ratingsCollection = db.collection('ratings');

    // Fetch reviews for this product, sorted by newest first
    const reviews = await ratingsCollection
      .find({ productId })
      .sort({ createdAt: -1 })
      .toArray();

    return new Response(
      JSON.stringify({
        success: true,
        data: reviews,
        count: reviews.length,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Error fetching reviews:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch reviews', details: err.message }),
      { status: 500 }
    );
  }
}
