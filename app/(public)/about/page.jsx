import PageTitle from '@/components/PageTitle'
import Image from 'next/image'

export default function About() {
  return (
    <div className="min-h-screen mx-6 text-slate-800">
      <div className="max-w-7xl mx-auto py-10">
        <PageTitle heading="About P&C Jewellery" text="Who we are and what we do" linkText="Home" />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-1">
            <div className="w-full h-64 bg-slate-100 rounded overflow-hidden">
              <Image
                src="/images/pandcjewellery.jpg"
                alt="About P&C Jewellery"
                className="object-cover w-full h-full"
              />
            </div>
          </div>

          <div className="md:col-span-2 text-slate-600 space-y-4">
            <h2 className="text-2xl font-semibold">Hi — Welcome to P&C Jewellery</h2>
            <p className="text-sm">
              P&C Jewellery is a Retail Jewellery Store offerring a wide range of trendy and elegant
              jewellery pieces. Founded in 2025, we have quickly become a go-to destination for fashion-forward
              individuals looking to accessorize their outfits with unique and stylish jewellery.
            </p>

            <h3 className="text-lg font-medium">Our Vision</h3>
            <p className="leading-relaxed">
              Our Vision is to provide high-quality, affordable jewellery that allows our customers to express
              their individuality and enhance their personal style. We believe that jewellery is more than just an
              accessory — it's a form of self-expression and a way to celebrate life's special moments.
            </p>

            <h3 className="text-lg font-medium">Contact</h3>
            <p className="leading-relaxed">For feedback or questions: pandcjewellery@gmail.com</p>

            <div className="pt-4 text-sm text-slate-500">© {new Date().getFullYear()} P&C Jewellery</div>
          </div>
        </div>
      </div>
    </div>
  )
}
