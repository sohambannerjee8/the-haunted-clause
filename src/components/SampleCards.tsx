// The three fictional sample policies (haunted-house-ui R2.5). Reads only names and blurbs, never
// the policy texts, so the first screen stays small.
import { SAMPLE_META, type SampleId } from "../lib/samples/meta";

export function SampleCards({ onOpen }: { onOpen: (id: SampleId) => void }) {
  return (
    <section aria-labelledby="samples-heading" className="mt-10">
      <h2 id="samples-heading" className="font-display text-3xl tracking-wide text-bone">
        Or open a sample house
      </h2>
      <p className="mt-1 text-mist">Three policies written for this project. The companies are fictional.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {SAMPLE_META.map((m) => (
          <article key={m.id} className="flex flex-col rounded-lg border border-aubergine-500 bg-aubergine-900 p-4">
            <h3 className="text-xl font-bold text-bone">{m.company}</h3>
            <p className="mt-1 flex-1 text-mist">{m.blurb}</p>
            <button
              type="button"
              aria-label={`Open this house: ${m.company}`}
              onClick={() => onOpen(m.id)}
              className="mt-4 min-h-11 rounded-md border-2 border-candle px-4 py-2 font-bold text-candle hover:bg-aubergine-700"
            >
              Open this house
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
