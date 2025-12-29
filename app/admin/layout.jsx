import AdminLayout from "@/components/admin/AdminLayout";
import AdminLoginPage from "./login/page";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export const metadata = {
    title: "GoCart. - Admin",
    description: "GoCart. - Admin",
};

export default async function RootAdminLayout({ children }) {
    const cookieStore = await cookies();
    const token = cookieStore.get("gocart_token")?.value;
    let isAdmin = false;
    if (token) {
        try {
            const secret = process.env.JWT_SECRET || "dev-secret-change-me";
            const payload = jwt.verify(token, secret);
            if (payload && payload.role === "ADMIN") isAdmin = true;
        } catch (err) {
            isAdmin = false;
        }
    }

    return (
        <>
            <AdminLayout>{isAdmin ? children : <AdminLoginPage />}</AdminLayout>
        </>
    );
}
