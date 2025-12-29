'use client'
// import Banner from "@/components/Banner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageIntro from '@/components/PageIntro'

export default function PublicLayout({ children }) {

    return (
        <>
            <Navbar />
            <PageIntro />
            {children}
            <Footer />
        </>
    );
}
