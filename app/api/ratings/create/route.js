import mongodb from '@/lib/mongodb';

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, userName, userImage, productId, orderId, rating, review } = body;

    // Validation
    if (!userId || !productId || !rating || !review) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, productId, rating, review' }),
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

    // Use the pooled connection from lib/mongodb.js
    const { MongoClient } = await import('mongodb');
    const MONGO_URI = process.env.MONGODB_URI || '';
    const DB_NAME = process.env.MONGODB_DB || 'pandc';
    
    if (!MONGO_URI) throw new Error('MONGODB_URI not set');
    
    const globalForMongo = globalThis;
    let client = globalForMongo._mongoClient;
    
    if (!client || !client.topology) {
      client = new MongoClient(MONGO_URI, {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      await client.connect();
      globalForMongo._mongoClient = client;
    }
    
    const db = client.db(DB_NAME);
    const ratingsCollection = db.collection('ratings');

    // Create rating document
    const ratingDoc = {
      userId,
      userName: userName || 'Anonymous',
      userImage: userImage || null,
      productId,
      orderId: orderId || null,
      rating: Number(rating),
      review: review.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert into database
    const result = await ratingsCollection.insertOne(ratingDoc);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Review submitted successfully',
        ratingId: result.insertedId,
      }),
      { status: 201 }
    );
  } catch (err) {
    console.error('Error creating rating:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to submit review', details: err.message }),
      { status: 500 }
    );
  }
}
