import { useRef, useState, useCallback, useEffect } from "react";
import ImageSlot from "./ImageSlot";

const useImageOk = (src) => {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!src) {
      setOk(false);
      return;
    }
    const img = new Image();
    img.onload = () => setOk(true);
    img.onerror = () => setOk(false);
    img.src = src;
  }, [src]);
  return ok;
};

const BeforeAfterSlider = ({
  beforeSrc,
  afterSrc,
  beforeAlt = "Before",
  afterAlt = "After",
  className = "",
  heightClass = "h-[min(70vh,520px)]",
}) => {
  const containerRef = useRef(null);
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);

  const before = beforeSrc;
  const after = afterSrc;
  const beforeOk = useImageOk(beforeSrc);
  const afterOk = useImageOk(afterSrc);
  const hasBoth = beforeOk && afterOk;

  const updateFromClientX = useCallback((clientX) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    setPosition((x / rect.width) * 100);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => updateFromClientX(e.clientX);
    const onTouch = (e) => updateFromClientX(e.touches[0].clientX);
    const stop = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("touchend", stop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", stop);
    };
  }, [dragging, updateFromClientX]);

  if (!hasBoth) {
    return (
      <section className={`grid sm:grid-cols-2 gap-4 ${className}`}>
        <section>
          <p className="text-[10px] uppercase tracking-widest text-clinic-muted mb-2">Before</p>
          <ImageSlot
            src={beforeSrc}
            alt={beforeAlt}
            className={`${heightClass} rounded-3xl`}
            label="Before photo"
          />
        </section>
        <section>
          <p className="text-[10px] uppercase tracking-widest text-clinic-muted mb-2">After</p>
          <ImageSlot
            src={afterSrc}
            alt={afterAlt}
            className={`${heightClass} rounded-3xl`}
            label="After photo"
          />
        </section>
        <p className="sm:col-span-2 text-center text-xs text-clinic-muted">
          Drag the slider to compare the smile transformation.
        </p>
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      className={`relative select-none overflow-hidden rounded-3xl shadow-[0_24px_80px_-20px_rgba(44,38,32,0.18)] ${heightClass} ${className}`}
      onMouseDown={(e) => {
        setDragging(true);
        updateFromClientX(e.clientX);
      }}
      onTouchStart={(e) => {
        setDragging(true);
        updateFromClientX(e.touches[0].clientX);
      }}
    >
      <img
        src={after}
        alt={afterAlt}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      <section
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={before}
          alt={beforeAlt}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      </section>

      <span
        className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-lg z-10 pointer-events-none"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
      />
      <span
        className="absolute top-1/2 z-20 flex items-center justify-center w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-clinic-cream/95 border-2 border-white shadow-xl cursor-ew-resize backdrop-blur-sm"
        style={{ left: `${position}%` }}
        role="slider"
        aria-valuenow={Math.round(position)}
        aria-label="Compare before and after"
      >
        <svg
          className="w-5 h-5 text-clinic-ink rotate-90"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      </span>

      <span className="absolute top-4 left-4 text-[10px] uppercase tracking-widest bg-clinic-ink/70 text-clinic-cream px-3 py-1 rounded-full backdrop-blur-md">
        Before
      </span>
      <span className="absolute top-4 right-4 text-[10px] uppercase tracking-widest bg-clinic-accent text-white px-3 py-1 rounded-full backdrop-blur-md">
        After
      </span>
    </section>
  );
};

export default BeforeAfterSlider;
