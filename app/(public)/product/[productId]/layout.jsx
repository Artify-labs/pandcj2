export async function generateMetadata({ params }) {
    try {
        const productId = params.productId;
        const uuidMatch = productId.match(/([a-f0-9-]{36})$/);
        const actualId = uuidMatch ? uuidMatch[1] : productId;
        
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'https://pandcjewellery.com'}/api/products/${actualId}`,
            { next: { revalidate: 3600 } }
        );
        
        if (!response.ok) {
            return {
                title: 'Product | P&C Jewellery',
                robots: { index: true, follow: true }
            };
        }
        
        const product = await response.json();
        
        return {
            title: `${product.name} | Premium Jewelry | P&C Jewellery`,
            description: product.description?.substring(0, 160) || `Shop ${product.name} at P&C Jewellery. Premium jewelry with free worldwide shipping.`,
            keywords: `${product.name}, ${product.category}, jewelry, earrings, necklaces`,
            robots: {
                index: true,
                follow: true,
                googleBot: {
                    index: true,
                    follow: true,
                    'max-image-preview': 'large',
                }
            },
            alternates: {
                canonical: `https://pandcjewellery.com/product/${productId}`
            },
            openGraph: {
                url: `https://pandcjewellery.com/product/${productId}`,
                title: `${product.name} | P&C Jewellery`,
                description: product.description?.substring(0, 160) || 'Shop premium jewelry',
                images: product.images ? [{ url: product.images[0], width: 1200, height: 1200, alt: product.name }] : []
            }
        };
    } catch (error) {
        return {
            title: 'Product | P&C Jewellery',
            robots: { index: true, follow: true }
        };
    }
}

export default function ProductLayout({ children }) {
    return children;
}
