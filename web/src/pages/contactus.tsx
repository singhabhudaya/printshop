// src/pages/contactus.tsx
import React from "react";

const EMAIL = "theprintingmuse@gmail.com";
const PHONE = "8527229613";

export default function ContactUs() {
  return (
    <main style={{ maxWidth: 880, margin: "40px auto", padding: "0 20px" }}>
      <h1>Contact Us</h1>
      <p>We’re here to help with orders, payments, and returns.</p>

      <p>
        <strong>Email:</strong>{" "}
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        <br />
        <strong>Phone/WhatsApp:</strong> {PHONE} (Mon–Sat 10:00–18:00 IST)
      </p>

      <p>
        <strong>Postal Address:</strong> The House of Printing Muse, Hyde Park, Noida, 201301, Uttar Pradesh, India
      </p>

      {/*
      -- Hidden for now per your request --
      <p>
        <strong>GSTIN:</strong> [ADD GSTIN IF APPLICABLE] | <strong>CIN:</strong> [ADD CIN IF APPLICABLE]
      </p>
      */}

      <p>
        <strong>Grievance/Compliance Officer:</strong> [ADD NAME], <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
      </p>
    </main>
  );
}
