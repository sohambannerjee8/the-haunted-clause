// The three fictional sample policies, drawn as small house fronts with doors (haunted-house-ui R2.5,
// PLAN_DECISIONS.md C14.1). Reads only names and blurbs, never the policy texts, so the first screen
// stays small. The door is the button; the roof and walls are decoration.
import { SAMPLE_META, type SampleId } from "../lib/samples/meta";

/** How many lit windows each front has: more light for a more haunted house. */
const WINDOWS: Record<SampleId, number> = { mild: 1, average: 2, terrible: 3 };

function Front({ lit }: { lit: number }) {
  return (
    <svg data-house-front viewBox="0 0 120 54" aria-hidden="true" focusable="false" className="block h-14 w-full text-aubergine-500">
      <path d="M8 52 L60 6 L112 52" fill="#1e1024" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M84 30 V12 H94 V38" fill="#1e1024" stroke="currentColor" strokeWidth="3" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={40 + i * 15} y="32" width="9" height="12" rx="1" fill={i < lit ? "#f2b544" : "#3a1f45"} opacity={i < lit ? 0.7 : 1} />
      ))}
    </svg>
  );
}

export function SampleCards({ onOpen }: { onOpen: (id: SampleId) => void }) {
  return (
    <section aria-labelledby="samples-heading" className="mt-10">
      <h2 id="samples-heading" className="font-display text-3xl tracking-wide text-bone">
        Or open a sample house
      </h2>
      <p className="mt-1 text-mist">Three policies written for this project. The companies are fictional.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {SAMPLE_META.map((m) => (
          <article key={m.id} className="flex flex-col">
            <Front lit={WINDOWS[m.id]} />
            <div className="flex flex-1 flex-col rounded-b-md border-x-2 border-b-2 border-aubergine-500 bg-aubergine-900 px-4 pt-3 pb-4">
              <h3 className="text-xl font-bold text-bone">{m.company}</h3>
              <p className="mt-1 flex-1 text-mist">{m.blurb}</p>
              <button
                type="button"
                aria-label={`Open this house: ${m.company}`}
                onClick={() => onOpen(m.id)}
                style={{ minWidth: "44px", minHeight: "44px" }}
                className="hc-door mx-auto mt-4 rounded-t-full border-2 border-candle bg-aubergine-700 px-6 pt-4 pb-2 font-bold text-candle hover:bg-ink"
              >
                Open this house
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
