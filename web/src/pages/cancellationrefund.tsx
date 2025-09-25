// app/cancellationrefund.tsx
import React from "react";

type Props = {
  email?: string;
  phone?: string;
  lastUpdated?: string;
  cancelWindowHours?: number | string;
  returnWindowDays?: number | string;
};

const today = () =>
  new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const CancellationRefund: React.FC<Props> = ({
  email = "theprintingmuse@gmail.com",
  phone = "+91 8527229613",
  lastUpdated = today(),
  cancelWindowHours = 2,
  returnWindowDays = 7,
}) => (
  <main style={{ maxWidth: 880, margin: "40px auto", padding: "0 20px" }}>
    <h1>Cancellation &amp; Refund Policy</h1>
    <p style={{ color: "#666" }}>
      <strong>Last updated:</strong> {lastUpdated}
    </p>

    <h2>Order Cancellation</h2>
    <p>
      Orders can be cancelled within {cancelWindowHours} hours of placing the order or until it is marked “Processing/Dispatched”, whichever is earlier. To cancel, email <a href={`mailto:${email}`}>{email}</a> with your Order ID.
    </p>

    <h2>Returns/Replacement</h2>
    <p>
      Eligible returns are accepted within {returnWindowDays} days of delivery for unopened/unused items in original packaging. Non-returnable items: made-to-order/personalized items, gift cards, and items marked “final sale”.
    </p>

    <h2>Refund Method &amp; Timeline</h2>
    <ul>
      <li>Prepaid orders: refunded to the original payment method.</li>
      <li>COD orders: refunded to bank/UPI details shared by you.</li>
      <li>Timeline: we initiate refunds within 1–3 business days after approval; bank/issuer may take an additional 3–7 business days to credit.</li>
    </ul>

    <h2>Damaged/Incorrect Products</h2>
    <p>Please report within 48 hours of delivery with photos/video as proof. We will replace or refund.</p>

    <h2>Shipping Fees</h2>
    <p>Original shipping fees are non-refundable unless the return is due to our error.</p>

    <h2>Contact</h2>
    <p>
      For cancellations/returns/refunds, contact <a href={`mailto:${email}`}>{email}</a> or call {phone}.
    </p>
  </main>
);

export default CancellationRefund;
