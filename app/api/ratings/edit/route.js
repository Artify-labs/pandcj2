import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'pandcjewellery';

async function getClient() {
  if (!MONGO_URI) throw new Error('MONGODB_URI not set');
  if (global._mongoClient) return global._mongoClient;
  const c = new MongoClient(MONGO_URI, { useUnifiedTopology: true });
  await c.connect();
  global._mongoClient = c;
  return c;
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { ratingId, userId, rating, review } = body;

    // Validation
    if (!ratingId || !userId || !rating || !review) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: ratingId, userId, rating, review' }),
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return new Response(
        JSON.stringify({ error: 'Rating must be between 1 and 5' }),
        { status: 400 }
      );
    }

    if (review.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: 'Review must be at least 5 characters' }),
        { status: 400 }
      );
    }

    const client = await getClient();
    const db = client.db(DB_NAME);
    const ratingsCollection = db.collection('ratings');

    // First check if the rating exists and belongs to the user
    const existingRating = await ratingsCollection.findOne({
      _id: new ObjectId(ratingId),
      userId
    });

    if (!existingRating) {
      return new Response(
        JSON.stringify({ error: 'Review not found or you do not have permission to edit it' }),
        { status: 404 }
      );
    }

    // Update the rating document
    const result = await ratingsCollection.updateOne(
      { _id: new ObjectId(ratingId) },
      {
        $set: {
          rating: Number(rating),
          review: review.trim(),
          updatedAt: new Date(),
        }
      }
    );

    if (result.modifiedCount === 0) {
      return new Response(
        JSON.stringify({ error: 'Failed to update review' }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Review updated successfully',
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Error updating rating:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to update review', details: err.message }),
      { status: 500 }
    );
  }
}
