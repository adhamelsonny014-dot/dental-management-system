/** Soft color blobs behind the landing page — not “plain cream”. */
export default function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-[20%] top-[-10%] h-[55vh] w-[55vw] max-w-[900px] rounded-full bg-[radial-gradient(circle,var(--fade))] [--fade:rgba(219,234,254,0.95)] opacity-95 blur-3xl" />
      <div className="absolute right-[-15%] top-[28%] h-[42vh] w-[42vw] max-w-[700px] rounded-full bg-[radial-gradient(circle,var(--fade))] [--fade:rgba(191,219,254,0.85)] blur-3xl" />
      <div className="absolute bottom-[5%] left-[15%] h-[38vh] w-[45vw] max-w-[760px] rounded-full bg-[radial-gradient(circle,var(--fade))] [--fade:rgba(233,226,251,0.75)] blur-3xl" />
      <div className="absolute bottom-[20%] right-[8%] h-[35vh] w-[40vw] rounded-full bg-[radial-gradient(circle,var(--fade))] [--fade:rgba(255,237,213,0.9)] blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `linear-gradient(105deg,
            transparent 40%,
            rgba(255,138,122,0.06) 50%,
            transparent 60%
          ), linear-gradient(
            rgb(251,248,243) 0%,
            rgba(251,248,243,0.92) 100%
          )`,
        }}
      />
    </div>
  );
}
