export const metadata = {
    title: "Shop All Jewelry | P&C Jewellery - Earrings, Necklaces & More",
    description: "Browse our complete collection of premium jewelry. Find exquisite earrings, necklaces, and accessories. Free worldwide shipping on all orders.",
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
        }
    },
    alternates: {
        canonical: 'https://pandcjewellery.com/shop'
    }
};

export default function ShopLayout({ children }) {
    return children;
}
