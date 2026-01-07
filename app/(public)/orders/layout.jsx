export const metadata = {
    title: "My Orders | P&C Jewellery",
    description: "View your order history and status",
    robots: {
        index: false,
        follow: false,
        googleBot: {
            index: false,
            follow: false,
        }
    }
};

export default function OrdersLayout({ children }) {
    return children;
}
