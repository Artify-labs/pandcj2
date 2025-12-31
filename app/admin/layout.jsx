import AdminLayout from "@/components/admin/AdminLayout";
import AdminLoginPage from "./login/page";
import { cookies } from "next/headers";
import { MongoClient } from 'mongodb'

export const metadata = {
    title: "GoCart. - Admin",
    description: "GoCart. - Admin",
};

export default async function RootAdminLayout({ children }) {
    const cookieStore = await cookies();
    const token = cookieStore.get("pandc_admin_token")?.value;
    let isAdmin = false;
    if (token) {
        // validate token against admin_sessions in MongoDB
        try {
            const uri = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI
            const dbName = process.env.MONGODB_DB || process.env.NEXT_PUBLIC_MONGODB_DB || (uri && uri.split('/').pop())
            if (uri && dbName) {
                const client = new MongoClient(uri)
                await client.connect()
                try {
                    const db = client.db(dbName)
                    const sessions = db.collection('admin_sessions')
                    const row = await sessions.findOne({ token })
                    if (row && (!row.expiresAt || new Date(row.expiresAt) > new Date())) {
                        isAdmin = true
                    }
                } finally {
                    try { await client.close() } catch (e) {}
                }
            }
        } catch (e) {
            isAdmin = false
        }
    }

    return (
        <>
            <AdminLayout>{isAdmin ? children : <AdminLoginPage />}</AdminLayout>
        </>
    );
}
