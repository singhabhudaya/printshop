// app/shippingdelivery.tsx
import React from "react";

type Props = {
  email?: string;
  phone?: string;
  lastUpdated?: string;
  processingTime?: string;
  metroETA?: string;
  restETA?: string;
};

const today = () =>
  new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const ShippingDelivery: React.FC<Props> = ({
  email = "theprintingmuse@gmail.com",
  phone = "+91 8527229613",
  lastUpdated = today(),
  processingTime = "1–2 business days (Mon–Sat, excluding public holidays)",
  metroETA = "2–4 business days",
  restETA = "3–7 business days",
}) => (
  <main style={{ maxWidth: 880, margin: "40px auto", padding: "0 20px" }}>
    <h1>Shipping &amp; Delivery Policy</h1>
    <p style={{ color: "#666" }}>
      <strong>Last updated:</strong> {lastUpdated}
    </p>

    <h2>Processing Time</h2>
    <p>Orders are processed within {processingTime}. Personalized/made-to-order items may require extra time.</p>

    <h2>Shipping Partners &amp; Coverage</h2>
    <p>We ship via trusted courier partners to serviceable pincodes across India.</p>

    <h2>Shipping Fees</h2>
    <p>Standard shipping is calculated at checkout. Free shipping may apply above certain cart values during promotions.</p>

    <h2>Delivery Timelines</h2>
    <p>Metro cities: {metroETA}; Rest of India: {restETA}; remote locations may take longer. Tracking details will be shared by email/SMS once dispatched.</p>

    <h2>Delays &amp; Undeliverable Packages</h2>
    <p>If undeliverable/RTS, we will contact you to reship (extra charges may apply) or process a refund per our policy.</p>

    <h2>International Shipping</h2>
    <p>Currently, we ship within India only. (Update this section if you add international shipping.)</p>

    <h2>Contact</h2>
    <p>
      Shipping queries: <a href={`mailto:${email}`}>{email}</a> | {phone}
    </p>
  </main>
);

export default ShippingDelivery;
