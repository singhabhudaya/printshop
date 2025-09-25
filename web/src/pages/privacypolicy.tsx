// app/privacypolicy.tsx
import React from "react";

type Props = {
  brand?: string;
  legalEntity?: string;
  address?: string;
  email?: string;
  retention?: string;
  lastUpdated?: string;
};

const today = () =>
  new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const PrivacyPolicy: React.FC<Props> = ({
  brand = "Printing Muse",
  legalEntity = "Printing Muse",
  address = "The House of Printing Muse, Hyde Park, Noida, Uttar Pradesh, 201301",
  email = "theprintingmuse@gmail.com",
  retention = "8 years",
  lastUpdated = today(),
}) => (
  <main style={{ maxWidth: 880, margin: "40px auto", padding: "0 20px" }}>
    <h1>Privacy Policy</h1>
    <p style={{ color: "#666" }}>
      <strong>Last updated:</strong> {lastUpdated}
    </p>

    <h2>Who we are</h2>
    <p>
      {brand} operated by {legalEntity}, {address}. Email: <a href={`mailto:${email}`}>{email}</a>.
    </p>

    <h2>What we collect</h2>
    <ul>
      <li>Contact data: name, email, phone, billing/shipping address.</li>
      <li>Order data: products, payment status, invoices, GST details if provided.</li>
      <li>Technical data: IP address, device/browser info, cookies.</li>
    </ul>

    <h2>Why we collect it</h2>
    <ul>
      <li>To process and deliver orders, payments, refunds, and support.</li>
      <li>To comply with legal and tax obligations.</li>
      <li>To improve our website, prevent fraud, and personalize experience.</li>
    </ul>

    <h2>Payments</h2>
    <p>
      We use payment processors such as Razorpay. When you pay, certain data is transmitted to the processor (name, email, phone, billing info, order amount). We do not store your full card/bank details.
    </p>

    <h2>Cookies</h2>
    <p>We use necessary and analytics cookies. You can control cookies via your browser settings.</p>

    <h2>Sharing</h2>
    <p>We share data with service providers (payments, courier/delivery, analytics, email/SMS) strictly for providing our services. We do not sell your personal data.</p>

    <h2>Data retention</h2>
    <p>We retain order and invoice data for {retention} or as required by law; other data is retained only as long as necessary.</p>

    <h2>Your choices</h2>
    <ul>
      <li>Access, update, or delete certain info by contacting us.</li>
      <li>Opt out of marketing communications at any time.</li>
    </ul>

    <h2>Security</h2>
    <p>We use reasonable technical and organizational measures; no method is 100% secure.</p>

    <h2>Children</h2>
    <p>Our services are not intended for individuals under 18 years of age.</p>

    <h2>Contact</h2>
    <p>
      For privacy queries, write to <a href={`mailto:${email}`}>{email}</a>. Postal: {address}.
    </p>
  </main>
);

export default PrivacyPolicy;
