import { useRef, useState, useCallback, useEffect } from "react";
import ImageSlot from "./ImageSlot";

const useImageOk = (src, preview) => {
  const [ok, setOk] = useState(false);
  const url = preview || src;
  useEffect(() => {
    if (!url) { setOk(false); return; }
    const img = new Image();
    img.onload = () => setOk(true);
    img.onerror = () => setOk(false);
    img.src = url;
  }, [url]);
  return ok;
};

const BeforeAfterSlider = ({
  beforeSrc,
  afterSrc,
  beforeAlt = "Before",
  afterAlt = "After",
  className = "",
  heightClass = "h-[min(70vh,520px)]",
  allowUpload = true,
}) => {
  const containerRef = useRef(null);
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [beforePreview, setBeforePreview] = useState(null);
  const [afterPreview, setAfterPreview] = useState(null);

  const before = beforePreview || beforeSrc;
  const after = afterPreview || afterSrc;
  const beforeOk = useImageOk(beforeSrc, beforePreview);
  const afterOk = useImageOk(afterSrc, afterPreview);
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

  const pickBefore = (e) => {
    const f = e.target.files?.[0];
    if (f) setBeforePreview(URL.createObjectURL(f));
  };

  const pickAfter = (e) => {
    const f = e.target.files?.[0];
    if (f) setAfterPreview(URL.createObjectURL(f));
  };

  if (!hasBoth) {
    return (
      <section className={`grid sm:grid-cols-2 gap-4 ${className}`}>
        <section>
          <p className="text-[10px] uppercase tracking-widest text-clinic-muted mb-2">Before</p>
          <ImageSlot
            src={beforeSrc}
            alt={beforeAlt}
            className={`${heightClass} rounded-3xl`}
            label="Upload before photo"
            hint="public/site/smile-before.jpg"
            allowUpload={allowUpload}
          />
          {allowUpload && (
            <label className="mt-2 block text-center text-xs text-clinic-accent cursor-pointer">
              Quick upload
              <input type="file" accept="image/*" className="hidden" onChange={pickBefore} />
            </label>
          )}
        </section>
        <section>
          <p className="text-[10px] uppercase tracking-widest text-clinic-muted mb-2">After</p>
          <ImageSlot
            src={afterSrc}
            alt={afterAlt}
            className={`${heightClass} rounded-3xl`}
            label="Upload after photo"
            hint="public/site/smile-after.jpg"
            allowUpload={allowUpload}
          />
          {allowUpload && (
            <label className="mt-2 block text-center text-xs text-clinic-accent cursor-pointer">
              Quick upload
              <input type="file" accept="image/*" className="hidden" onChange={pickAfter} />
            </label>
          )}
        </section>
        <p className="sm:col-span-2 text-center text-xs text-clinic-muted">
          When both images are loaded, drag the slider to compare your smile transformation.
        </p>
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      className={`relative select-none overflow-hidden rounded-3xl shadow-[0_24px_80px_-20px_rgba(44,38,32,0.18)] ${heightClass} ${className}`}
      onMouseDown={(e) => { setDragging(true); updateFromClientX(e.clientX); }}
      onTouchStart={(e) => { setDragging(true); updateFromClientX(e.touches[0].clientX); }}
    >
      <img src={after} alt={afterAlt} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      <section
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img src={before} alt={beforeAlt} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
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
        <svg className="w-5 h-5 text-clinic-ink rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      </span>

      <span className="absolute top-4 left-4 text-[10px] uppercase tracking-widest bg-clinic-ink/70 text-clinic-cream px-3 py-1 rounded-full backdrop-blur-md">
        Before
      </span>
      <span className="absolute top-4 right-4 text-[10px] uppercase tracking-widest bg-clinic-accent text-white px-3 py-1 rounded-full backdrop-blur-md">
        After
      </span>

      {allowUpload && (
        <section className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-2 z-20">
          <label className="cursor-pointer text-[10px] uppercase tracking-wider bg-clinic-cream/95 text-clinic-ink px-3 py-1.5 rounded-full backdrop-blur-md border border-white/50 hover:bg-white transition-colors">
            Replace before
            <input type="file" accept="image/*" className="hidden" onChange={pickBefore} />
          </label>
          <label className="cursor-pointer text-[10px] uppercase tracking-wider bg-clinic-cream/95 text-clinic-ink px-3 py-1.5 rounded-full backdrop-blur-md border border-white/50 hover:bg-white transition-colors">
            Replace after
            <input type="file" accept="image/*" className="hidden" onChange={pickAfter} />
          </label>
        </section>
      )}
    </section>
  );
};

export default BeforeAfterSlider;
