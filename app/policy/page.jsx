import Image from 'next/image'
import PageTitle from '@/components/PageTitle'
import { assets } from '@/assets/assets'

export default function PrivacyPolicy() {
  return (
    <div className="text-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center gap-4 mb-6">
          <Image src={assets.pandcjewellery} alt="P&C Jewellery" width={72} height={72} className="rounded" />
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-800">Privacy Policy</h1>
            <p className="text-sm text-slate-500 mt-1">How we collect, use and protect your data</p>
          </div>
        </div>

        <PageTitle heading="Privacy Policy" text="Last updated: January 1, 2026" linkText="" />

        <section className="prose prose-slate prose-lg mx-auto max-w-3xl text-slate-700 leading-7">
        <h3>Overview</h3>
        <p>P&amp;C Jewellery (“we”, “us”) respects your privacy. This policy explains what information we collect, why we collect it, and how you can manage it.</p>

        <h3>Information We Collect</h3>
        <ul>
          <li>Account info (name, email) when you register or use Clerk authentication.</li>
          <li>Order and payment details necessary to process purchases.</li>
          <li>Device and usage data for analytics and site improvements.</li>
          <li>Shipping address and contact information for order fulfillment.</li>
        </ul>

        <h3>How We Use Your Data</h3>
        <p>We use collected data to process orders, communicate with you, provide support, and improve our services. We do not sell personal data to third parties.</p>

        <h3>Third-Party Services</h3>
        <p>We rely on third-party providers for authentication (Clerk), payment processing, image hosting (Cloudinary), and analytics. Those providers have their own privacy practices.</p>

        <h3>Payment Processing</h3>
        <p>We use <strong>Razorpay</strong> as our payment gateway to process transactions securely. When you make a purchase, your payment information is transmitted directly to Razorpay over encrypted connections. We do not store complete credit card numbers or CVV codes on our servers. Razorpay is PCI DSS compliant and handles all sensitive payment data according to industry standards.</p>
        <p>Payment data processed includes: card details, UPI information, net banking credentials, and wallet information depending on your chosen payment method. For more details, please refer to <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Razorpay's Privacy Policy</a>.</p>

        <h3>Financial Information Security</h3>
        <p>All financial transactions are encrypted using SSL/TLS protocols. We maintain industry-standard security measures to protect your financial information during transmission and storage. However, no internet transmission is 100% secure, and we cannot guarantee absolute security.</p>

        <h3>Data Retention</h3>
        <p>We retain order and transaction records for accounting and legal compliance purposes. Personal data is retained only as long as necessary to fulfill the purposes outlined in this policy or as required by law.</p>

        <h3>Security</h3>
        <p>We implement reasonable technical and organizational measures to protect personal information, including encrypted data transmission, secure servers, and regular security audits.</p>

        <h3>Your Rights</h3>
        <p>You can request access, correction, or deletion of your personal data by contacting us at pandcjewellery@gmail.com. You may also request a copy of your transaction history and personal information we hold.</p>

        <h3>Contact</h3>
        <p>For privacy questions contact: pandcjewellery@gmail.com or call +91 9804915374</p>
        </section>
      </div>
    </div>
  )
}
