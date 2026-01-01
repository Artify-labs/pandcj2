import Image from 'next/image'
import PageTitle from '@/components/PageTitle'
import { assets } from '@/assets/assets'

export default function TermsPage() {
  return (
    <div className="text-slate-700 mb-28">
      <div className="flex items-center gap-4 mb-6">
        <Image src={assets.pandcjewellery} alt="P&C Jewellery" width={64} height={64} className="rounded" />
        <div>
          <h1 className="text-3xl font-semibold">Terms of Service</h1>
          <p className="text-sm text-slate-500">Rules and regulations for using P&amp;C Jewellery</p>
        </div>
      </div>

      <PageTitle heading="Terms of Service" text="Effective: January 1, 2026" linkText="" />

      <section className="prose prose-slate max-w-none">
        <h3>Acceptance</h3>
        <p>By using our website and services you agree to these Terms. Please read them carefully. If you do not agree to these terms, please do not use our services.</p>

        <h3>Orders & Payments</h3>
        <p>All orders are subject to product availability and confirmation of payment. We reserve the right to refuse or cancel orders for any reason, including but not limited to product unavailability, errors in pricing or product information, or suspected fraudulent activity.</p>
        <p>Prices are listed in Indian Rupees (INR) and are subject to change without notice. The final price charged will be the price displayed at the time of order placement.</p>

        <h3>Payment Methods & Processing</h3>
        <p>We accept payments through <strong>Razorpay</strong>, which supports multiple payment options including:</p>
        <ul>
          <li>Credit and Debit Cards (Visa, Mastercard, RuPay, American Express)</li>
          <li>UPI (Unified Payments Interface)</li>
          <li>Net Banking from major Indian banks</li>
          <li>Digital Wallets (Paytm, PhonePe, Google Pay, etc.)</li>
          <li>EMI options (where available)</li>
        </ul>
        <p>Payment is processed securely through Razorpay's PCI DSS compliant platform. Your payment information is encrypted and transmitted directly to Razorpay. We do not store complete card details on our servers.</p>

        <h3>Order Confirmation</h3>
        <p>Once payment is successfully processed, you will receive an order confirmation email. This email serves as acknowledgment of your order but does not constitute acceptance. We reserve the right to cancel orders after confirmation if issues arise.</p>

        <h3>Pricing & Taxes</h3>
        <p>All prices include applicable GST (Goods and Services Tax) unless otherwise stated. Additional charges such as shipping fees will be clearly displayed before checkout.</p>

        <h3>Failed Transactions</h3>
        <p>If a payment fails or is declined, your order will not be processed. If your account was debited but the order was not confirmed, the amount will be refunded to your original payment method within 5-7 business days. Contact us immediately if you experience payment issues.</p>

        <h3>Returns & Refunds</h3>
        <p>Returns are accepted within 7 days of delivery for eligible products. Refunds will be processed to your original payment method within 7-10 business days after we receive and inspect the returned item. Refund processing time depends on your bank or payment provider.</p>
        <p>Customized or personalized jewelry items are non-returnable unless defective. Contact support@pandcjewellery.example for return authorization before shipping items back.</p>

        <h3>Cancellations</h3>
        <p>Orders can be cancelled before shipment. Once shipped, cancellation is not possible but you may return the product as per our return policy. Refunds for cancelled orders will be processed within 5-7 business days.</p>

        <h3>Intellectual Property</h3>
        <p>All content on this site including product images, descriptions, logos, and designs is protected by copyright and trademark laws. Unauthorized use is prohibited.</p>

        <h3>Dispute Resolution</h3>
        <p>Any disputes arising from transactions or use of our services will be governed by Indian law and subject to the exclusive jurisdiction of courts in Noida, India.</p>

        <h3>Limitations of Liability</h3>
        <p>We are not liable for indirect, incidental, or consequential damages. Our total liability is limited to the amount paid for the specific product or service in question. This limitation applies to the maximum extent permitted by law.</p>

        <h3>Changes to Terms</h3>
        <p>We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Continued use of our services constitutes acceptance of modified terms.</p>

        <h3>Contact</h3>
        <p>Questions about these Terms: pandcjewellery@gmail.com or +91 9804915374</p>
      </section>
    </div>
  )
}
