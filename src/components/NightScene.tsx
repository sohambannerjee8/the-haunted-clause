// The moonlit scene behind the input screen (PLAN_DECISIONS.md C14.1). Pure decoration: a moon, a
// hill and the house silhouette rising behind the paste box. It holds no information, is hidden from
// assistive technology, does not move, and takes no clicks. The paste box keeps a solid background.
export function NightScene() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] sm:h-96"
      aria-hidden="true"
    >
      <svg viewBox="0 0 1200 380" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false" className="h-full w-full">
        <defs>
          <radialGradient id="hc-moon-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#efe6d8" stopOpacity="0.22" />
            <stop offset="1" stopColor="#efe6d8" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g data-moon>
          <circle cx="905" cy="95" r="120" fill="url(#hc-moon-glow)" />
          <circle cx="905" cy="95" r="40" fill="#efe6d8" opacity="0.85" />
          <circle cx="890" cy="84" r="6" fill="#b9a9c2" opacity="0.5" />
          <circle cx="918" cy="108" r="9" fill="#b9a9c2" opacity="0.4" />
        </g>
        <path d="M0 330 C200 300 380 315 600 305 S1000 290 1200 320 V380 H0Z" fill="#1e1024" />
        <g data-house-silhouette fill="#1e1024" stroke="#6b4a7d" strokeWidth="3" strokeLinejoin="round">
          {/* Main house with a steep roof, a tower, a side wing and a crooked chimney. */}
          <path d="M440 330 V200 L540 105 L640 200 V330 Z" />
          <path d="M622 330 V160 L672 80 L722 160 V330 Z" />
          <path d="M478 162 V122 H500 V142" />
          <path d="M392 330 V245 L442 205 L492 245 V330 Z" />
        </g>
        <g fill="#f2b544" opacity="0.6">
          {/* Dimly lit windows. */}
          <rect x="515" y="222" width="16" height="24" rx="2" />
          <rect x="551" y="222" width="16" height="24" rx="2" />
          <rect x="665" y="175" width="14" height="22" rx="7" />
        </g>
        <path d="M0 360 C300 335 500 360 700 348 S1050 335 1200 355 V380 H0Z" fill="#0d0a10" />
      </svg>
    </div>
  );
}
