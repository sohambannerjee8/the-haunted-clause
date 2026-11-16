import { Footer } from "@/components/Footer";

// The page shell: skip link, the one h1, the main region and the footer (haunted-house-ui R1.1–R1.3).
// They live here rather than in layout.tsx, so the layout stays a plain <html>/<body> wrapper.
export default function Home() {
  return (
    <>
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <header className="px-4 pt-8 pb-4 text-center">
        <h1 className="font-display text-5xl tracking-wide text-bone sm:text-6xl">The Haunted Clause</h1>
        <p className="mt-2 text-mist">Every ghost is a clause. The worse the clause, the scarier the ghost.</p>
      </header>
      <main id="content" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12">
        <p className="text-center text-mist">The house is still being built.</p>
      </main>
      <Footer />
    </>
  );
}
