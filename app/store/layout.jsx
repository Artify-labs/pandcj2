import StoreLayout from "@/components/store/StoreLayout";

export const metadata = {
    title: "P&C Jewellery. - Store Dashboard",
    description: "`P&C Jewellery. - Store Dashboard",
};

export default function RootAdminLayout({ children }) {

    return (
        <>
            <StoreLayout>
                {children}
            </StoreLayout>
        </>
    );
}
