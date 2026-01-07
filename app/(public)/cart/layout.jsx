export const metadata = {
    title: "Shopping Cart | P&C Jewellery",
    description: "Review your items and proceed to checkout",
    robots: {
        index: false,
        follow: false,
        googleBot: {
            index: false,
            follow: false,
        }
    }
};

export default function CartLayout({ children }) {
    return children;
}
