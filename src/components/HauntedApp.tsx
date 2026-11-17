"use client";
// The app's client root (haunted-house-ui design, "State"). Receives only a boolean from the server.

export function HauntedApp({ llmAvailable }: { llmAvailable: boolean }) {
  return (
    <main id="content" tabIndex={-1} data-llm-available={llmAvailable ? "true" : "false"} className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12">
      <p className="text-center text-mist">The house is still being built.</p>
    </main>
  );
}
