// app/aboutus.tsx
import React from "react";

type Props = {
  brand?: string;
  legalEntity?: string;
  address?: string;
  email?: string;
  lastUpdated?: string;
};

const today = () =>
  new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const AboutUs: React.FC<Props> = ({
  brand = "Printing Muse",
  legalEntity = "Printing Muse Pvt. Ltd.",
  address = "The House of Printing Muse, Hyde Park, Noida, Uttar Pradesh, 201301",
  email = "theprintingmuse@gmail.com",
  lastUpdated = today(),
}) => (
  <main style={{ maxWidth: 880, margin: "40px auto", padding: "0 20px" }}>
    <h1>About Us</h1>
    <p style={{ color: "#666" }}>
      <strong>Last updated:</strong> {lastUpdated}
    </p>

    <h2>Who we are</h2>
    <p>
      Welcome to <strong>{brand}</strong>, operated by {legalEntity}, headquartered at {address}.
      You can reach us anytime at <a href={`mailto:${email}`}>{email}</a>.
    </p>

    <h2>Our Story</h2>
    <p>
      {brand} was founded with a simple vision — to transform{" "}
      <strong>everyday objects</strong> into extraordinary experiences. We
      believe that design and craftsmanship should not be reserved only for
      luxury artifacts, but should touch the items you use daily.
    </p>

    <h2>What We Do</h2>
    <p>
      We design and manufacture <strong>high-end daily objects</strong> that
      merge aesthetics, durability, and thoughtful functionality. From finely
      crafted stationery and lifestyle accessories to bespoke essentials, each
      piece is created to elevate the rhythm of everyday life.
    </p>

    <h2>Our Philosophy</h2>
    <ul>
      <li>
        <strong>Design with Purpose</strong> – Every detail is intentional, every
        object tells a story.
      </li>
      <li>
        <strong>Crafted to Last</strong> – We use only premium materials and
        meticulous techniques.
      </li>
      <li>
        <strong>Sustainable Excellence</strong> – Our processes aim to respect
        people and the planet.
      </li>
      <li>
        <strong>Customer First</strong> – We treat every order and every product
        as if it were our own.
      </li>
    </ul>

    <h2>Our Muse is You</h2>
    <p>
      Every product we make is inspired by the people who use them. At {brand},
      we are more than manufacturers — we are partners in helping you live,
      work, and create with elegance and ease.
    </p>

    <h2>Contact</h2>
    <p>
      Want to know more about us or collaborate? Write to{" "}
      <a href={`mailto:${email}`}>{email}</a> or visit us at {address}.
    </p>
  </main>
);

export default AboutUs;
