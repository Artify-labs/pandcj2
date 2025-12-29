import PageTitle from '@/components/PageTitle'
import Image from 'next/image'

export default function About() {
  return (
    <div className="min-h-screen mx-6 text-slate-800">
      <div className="max-w-7xl mx-auto py-10">
        <PageTitle heading="About GoCart" text="Who we are and what we do" linkText="Home" />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-1">
            <div className="w-full h-64 bg-slate-100 rounded overflow-hidden">
              <Image
                src="/assets/slide_1.jpg"
                alt="About"
                width={800}
                height={600}
                className="object-cover w-full h-full"
              />
            </div>
          </div>

          <div className="md:col-span-2 text-slate-600 space-y-4">
            <h2 className="text-2xl font-semibold">Hi — Welcome to GoCart</h2>
            <p className="text-sm">
              GoCart is a lightweight demo storefront built to showcase a minimal
              e-commerce experience. It focuses on clean UI, simple cart flows, and an
              extensible component-driven codebase you can use as a starting point.
            </p>

            <h3 className="text-lg font-medium">Our Mission</h3>
            <p className="leading-relaxed">
              Make it simple for developers to ship commerce experiences quickly — with
              pragmatic primitives and scalable patterns.
            </p>

            <h3 className="text-lg font-medium">Contact</h3>
            <p className="leading-relaxed">For feedback or questions: support@gocart.example</p>

            <div className="pt-4 text-sm text-slate-500">© {new Date().getFullYear()} GoCart</div>
          </div>
        </div>
      </div>
    </div>
  )
}
