import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import ProductsLoader from '@/components/ProductsLoader'
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import { assets } from '@/assets/assets'

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
    title: "P&C Jewellery",
    description: "P&C Jewellery is your one stop for all kinds of jewellery.",
    icons: {
        icon: '/assets/pandcjewellery.jpg'
    }
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href={assets.pandcjewellery.src} />
            </head>
            <body className={`${outfit.className} antialiased`}>
                <ClerkProvider>
                    <StoreProvider>
                        <Toaster />
                        <ProductsLoader />
                        {children}
                    </StoreProvider>
                </ClerkProvider>
            </body>
        </html>
    );
}
