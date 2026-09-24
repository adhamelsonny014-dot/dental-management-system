import { useState, useEffect } from "react";

/**
 * Shows an image from siteImages config, or a creamy placeholder.
 * Optional local upload (preview only) — for production, use files in public/site/.
 */
const ImageSlot = ({
  src,
  alt = "",
  className = "",
  label = "Add your image",
  hint = "",
  allowUpload = true,
}) => {
  const [resolved, setResolved] = useState(src);
  const [failed, setFailed] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    setResolved(src);
    setFailed(false);
    setPreview(null);
  }, [src]);

  const display = preview || (failed ? null : resolved);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setFailed(false);
  };

  const onError = () => setFailed(true);

  if (display) {
    return (
      <figure className={`relative overflow-hidden ${className}`}>
        <img
          src={display}
          alt={alt}
          onError={onError}
          className="w-full h-full object-cover"
        />
        {allowUpload && (
          <label className="absolute bottom-3 right-3 cursor-pointer rounded-full bg-clinic-ink/75 text-clinic-cream text-[10px] uppercase tracking-wider px-3 py-1.5 backdrop-blur-sm hover:bg-clinic-accent transition-colors">
            Change photo
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
        )}
      </figure>
    );
  }

  return (
    <label
      className={`group flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-clinic-border bg-clinic-sand/80 hover:border-clinic-accent/50 hover:bg-clinic-stone/50 transition-all ${className}`}
    >
      <span className="w-12 h-12 rounded-2xl bg-clinic-cream flex items-center justify-center text-clinic-accent mb-3 shadow-sm">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </span>
      <span className="text-sm font-medium text-clinic-ink/80">{label}</span>
      {hint && <span className="text-xs text-clinic-muted mt-1 px-4 text-center">{hint}</span>}
      {allowUpload && (
        <>
          <span className="mt-3 text-[10px] uppercase tracking-widest text-clinic-accent">
            Click to preview upload
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </>
      )}
    </label>
  );
};

export default ImageSlot;
