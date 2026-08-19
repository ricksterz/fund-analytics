export function JCurveIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M5 7 C 5 18, 9 25, 15 23 C 23 20, 19 6, 27 4"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="27" cy="4" r="2.2" fill="currentColor" />
    </svg>
  );
}
