// The footer on every screen (haunted-house-ui R1.2, R1.7, R13.1).
import { REPO_URL } from "../lib/ui/copy";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-aubergine-500/60 bg-aubergine-900 px-4 py-6 text-center text-mist">
      <p>
        <strong className="text-bone">Not legal advice.</strong> The readings are automated and can be wrong.
      </p>
      <p className="mt-2">
        <a href={REPO_URL} className="text-candle underline" rel="noopener noreferrer" target="_blank">
          How it works and source code
        </a>
      </p>
    </footer>
  );
}
