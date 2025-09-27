// src/components/CustomPrintCTA.tsx
import { Link } from "react-router-dom";

export default function CustomPrintCTA() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <div
        className="
          rounded-2xl border border-[#b88a58]
          p-8
          bg-gradient-to-r
          from-[#f6e7c8] via-[#e9d19a] to-[#caa368]
          text-slate-800
        "
      >
        <h3 className="text-xl font-semibold">Need a custom print?</h3>
        <p className="text-gray-700 mt-2">
          Upload your STL or describe your idea. Our Tier-2 makers will bid and deliver.
        </p>
        <Link
          to="/custom-upload"
          className="mt-4 inline-block px-5 py-2.5 rounded-xl
                     bg-[#8b5e34] hover:bg-[#7a4f29] text-white shadow-sm"
        >
          Upload STL &amp; Get Quote
        </Link>
      </div>
    </section>
  );
}
