import { getMongoClient } from '@/lib/mongodb';

const DB_NAME = process.env.MONGODB_DB || 'pandc';

export async function DELETE(req) {
    try {
        const client = await getMongoClient();
        const db = client.db(DB_NAME);

        // Delete all orders from the database
        const ordersCollection = db.collection('orders');
        const result = await ordersCollection.deleteMany({});

        return new Response(
            JSON.stringify({
                success: true,
                message: 'All order history has been deleted',
                deletedCount: result.deletedCount,
            }),
            { status: 200 }
        );
    } catch (err) {
        console.error('Error deleting all orders:', err);
        return new Response(
            JSON.stringify({ error: 'Failed to delete orders', details: err.message }),
            { status: 500 }
        );
    }
}
