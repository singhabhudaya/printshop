export default function ReviewsSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-semibold mb-6">What customers say</h2>
      <div className="grid md:grid-cols-3 gap-4 text-sm">
        <div className="border rounded-xl p-4">“Quality prints, fast delivery.” — A.R.</div>
        <div className="border rounded-xl p-4">“Sold my STL files with ease!” — K.S.</div>
        <div className="border rounded-xl p-4">“Perfect for cosplay props.” — M.P.</div>
      </div>
    </section>
  );
}
