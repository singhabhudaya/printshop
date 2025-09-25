// app/termsandconditions.tsx
import React from "react";

type Props = {
  brand?: string;
  legalEntity?: string;
  address?: string;
  gstin?: string;
  cin?: string;
  jurisdiction?: string;
  lastUpdated?: string;
};

const today = () =>
  new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const TermsAndConditions: React.FC<Props> = ({
  brand = "Printing Muse",
  legalEntity = "Printing Muse", // e.g., "Printing Muse Pvt. Ltd."
  address = "The House of Printing Muse, Hyde Park, Noida, 201301, Uttar Pradesh, India",
  gstin = "", // e.g., "07AAECS1234F1Z5"
  cin = "",
  jurisdiction = "Noida, Uttar Pradesh",
  lastUpdated = today(),
}) => (
  <main style={{ maxWidth: 880, margin: "40px auto", padding: "0 20px" }}>
    <h1>Terms &amp; Conditions</h1>
    <p style={{ color: "#666" }}>
      <strong>Last updated:</strong> {lastUpdated}
    </p>

    <h2>1. About Us</h2>
    <p>
      {brand} (“we”, “us”, “our”) is operated by {legalEntity}, having registered office at {address}. GSTIN: {gstin}{" "}
      {cin && <>| CIN: {cin}</>}.
    </p>

    <h2>2. Eligibility &amp; Account</h2>
    <p>
      By using this website, you confirm you are at least 18 years old and have capacity to contract. You are responsible for
      maintaining the confidentiality of your account and for all activities under it.
    </p>

    <h2>3. Products &amp; Pricing</h2>
    <p>Prices are in INR and inclusive/exclusive of taxes as indicated. We may change prices, descriptions, and availability without prior notice.</p>

    <h2>4. Orders &amp; Acceptance</h2>
    <p>
      Your order is an offer to purchase. We accept only upon an order confirmation email/SMS. We may cancel/refuse an order due to stock, payment, or compliance issues; any charged amount will be refunded as per our Refund Policy.
    </p>

    <h2>5. Payments</h2>
    <p>Payments are processed securely via third-party gateways (e.g., Razorpay). By providing payment information, you authorize the transaction and necessary verification.</p>

    <h2>6. Shipping &amp; Delivery</h2>
    <p>See our <a href="/shippingdelivery">Shipping &amp; Delivery Policy</a> for timelines, fees, and restrictions.</p>

    <h2>7. Cancellations, Returns &amp; Refunds</h2>
    <p>See our <a href="/cancellationrefund">Cancellation &amp; Refund Policy</a> for conditions, method, and timelines.</p>

    <h2>8. Intellectual Property</h2>
    <p>All content (logos, text, graphics) is owned by {brand} or its licensors. You may not use it without written permission.</p>

    <h2>9. Limitation of Liability</h2>
    <p>To the maximum extent permitted by law, we are not liable for indirect or consequential losses. Our aggregate liability for any claim shall not exceed the amount paid by you for the order in question.</p>

    <h2>10. Governing Law &amp; Dispute Resolution</h2>
    <p>These terms are governed by the laws of India with exclusive jurisdiction of the courts at {jurisdiction}.</p>

    <h2>11. Contact</h2>
    <p>Questions? <a href="/contactus">Contact us</a>.</p>
  </main>
);

export default TermsAndConditions;
