import { useState, useEffect } from "react";

/**
 * Shows an image from siteImages config, or a creamy placeholder when the file
 * is missing. Public/read-only — site images are managed as files in
 * public/site/, so there is no in-page upload control.
 */
const ImageSlot = ({ src, alt = "", className = "", label = "Add your image", hint = "" }) => {
  const [resolved, setResolved] = useState(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setResolved(src);
    setFailed(false);
  }, [src]);

  const display = failed ? null : resolved;

  const onError = () => setFailed(true);

  if (display) {
    return (
      <figure className={`relative overflow-hidden ${className}`}>
        <img src={display} alt={alt} onError={onError} className="w-full h-full object-cover" />
      </figure>
    );
  }

  return (
    <div
      className={`group flex flex-col items-center justify-center border-2 border-dashed border-clinic-border bg-clinic-sand/80 ${className}`}
    >
      <span className="w-12 h-12 rounded-2xl bg-clinic-cream flex items-center justify-center text-clinic-accent mb-3 shadow-sm">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </span>
      <span className="text-sm font-medium text-clinic-ink/80">{label}</span>
      {hint && <span className="text-xs text-clinic-muted mt-1 px-4 text-center">{hint}</span>}
    </div>
  );
};

export default ImageSlot;
