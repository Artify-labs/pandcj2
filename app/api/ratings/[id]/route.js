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

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { userId } = body;

    if (!id || !userId) {
      return new Response(
        JSON.stringify({ error: 'Rating ID and User ID are required' }),
        { status: 400 }
      );
    }

    const client = await getClient();
    const db = client.db(DB_NAME);
    const ratingsCollection = db.collection('ratings');

    // First, verify the review belongs to the user
    const rating = await ratingsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!rating) {
      return new Response(
        JSON.stringify({ error: 'Review not found' }),
        { status: 404 }
      );
    }

    if (rating.userId !== userId) {
      return new Response(
        JSON.stringify({ error: 'You can only delete your own reviews' }),
        { status: 403 }
      );
    }

    // Delete the review
    const result = await ratingsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return new Response(
        JSON.stringify({ error: 'Failed to delete review' }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Review deleted successfully',
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Error deleting rating:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to delete review', details: err.message }),
      { status: 500 }
    );
  }
}
