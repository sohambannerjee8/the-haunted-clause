import { Footer } from "@/components/Footer";
import { HauntedApp } from "@/components/HauntedApp";
import { isLlmAvailable } from "@/lib/llm/availability";

// The page shell: skip link, the one h1, the main region and the footer (haunted-house-ui R1.1–R1.3).
// They live here rather than in layout.tsx, so the layout stays a plain <html>/<body> wrapper.
// The page is prerendered, so llmAvailable is read at build time; only the boolean reaches the
// browser (R14.1, docs/DEPLOY.md "A key change needs a redeploy").
export default function Home() {
  const llmAvailable = isLlmAvailable();
  return (
    <>
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <header className="px-4 pt-8 pb-4 text-center">
        <h1 className="font-display text-5xl tracking-wide text-bone sm:text-6xl">The Haunted Clause</h1>
        <p className="mt-2 text-mist">Every ghost is a clause. The worse the clause, the scarier the ghost.</p>
      </header>
      <HauntedApp llmAvailable={llmAvailable} />
      <Footer />
    </>
  );
}
