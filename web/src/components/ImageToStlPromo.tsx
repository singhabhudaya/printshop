import { Link } from "react-router-dom";

const BRONZE = "#A47C5B";
const BRONZE_DEEP = "#8B684B";
const CHAMPAGNE = "#F3E7DA";

export default function ImageToStlPromo() {
  return (
    <section
      className="mt-12 rounded-2xl p-6 sm:p-8 shadow"
      style={{
        backgroundImage: `linear-gradient(135deg, ${CHAMPAGNE} 0%, #e9d7bf 40%, ${BRONZE} 100%)`,
      }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">
            Turn any image into a printable STL—right in your browser.
          </h3>
          <p className="mt-2 text-gray-700">
            Upload a photo, tweak quality, we auto-convert to STL, and you can download instantly.
            No uploads to us—everything runs client-side.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <Link
            to="/image-to-stl"
            className="inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold text-white shadow-sm transition-all ring-1 ring-[#E8DCCD]"
            style={{ backgroundImage: `linear-gradient(135deg, ${BRONZE} 0%, ${BRONZE_DEEP} 100%)` }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundImage = `linear-gradient(135deg, ${BRONZE_DEEP} 0%, ${BRONZE_DEEP} 100%)`)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundImage = `linear-gradient(135deg, ${BRONZE} 0%, ${BRONZE_DEEP} 100%)`)
            }
            data-cta="image-to-stl"
          >
            Try Image → STL
          </Link>

          <Link
            to="/custom-upload"
            className="inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold text-gray-800 bg-white/70 backdrop-blur ring-1 ring-white/60 hover:bg-white"
            data-cta="upload-stl"
          >
            Already have STL? Get a Quote
          </Link>
        </div>
      </div>
    </section>
  );
}
