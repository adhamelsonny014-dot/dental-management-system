import { useRef, useState, useEffect } from "react";
import useInView from "./useInView";

const ytEmbedUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  const s = url.trim();
  try {
    if (s.includes("youtube.com/embed/")) return s.split("&")[0];
    const u = new URL(s.includes("http") ? s : `https://${s}`);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` : null;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace("/", "").split("?")[0];
      return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` : null;
    }
  } catch {
    /* ignore */
  }
  return null;
};

const vimeoEmbedUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? `https://player.vimeo.com/video/${m[1]}?background=0&autopause=0` : null;
};

const DoctorVideoSpotlight = ({ doctor }) => {
  const { videoUrl, videoPoster } = doctor;
  const videoRef = useRef(null);
  const youtube = ytEmbedUrl(videoUrl || "");
  const vimeo = vimeoEmbedUrl(videoUrl || "");
  const isStreamer = !!(youtube || vimeo);

  const isDirectVideo =
    typeof videoUrl === "string" &&
    videoUrl.length > 0 &&
    /\.(mp4|webm|ogg)(\?|$)/i.test(videoUrl);

  const [showIframe, setShowIframe] = useState(false);
  const [muted, setMuted] = useState(true);
  const [containerRef, inView] = useInView({ threshold: 0.3 });

  useEffect(() => {
    const v = videoRef.current;
    if (!v || isStreamer || !isDirectVideo) return;
    v.muted = muted;
    if (!inView) {
      v.pause();
      return;
    }
    v.play()?.catch(() => {});
  }, [muted, inView, isStreamer, isDirectVideo]);

  return (
    <section ref={containerRef} className="relative mb-14 md:mb-16">
      <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-clinic-teal/30 blur-[100px]" aria-hidden />
      <div className="absolute -right-24 top-32 h-72 w-72 rounded-full bg-clinic-coral/25 blur-[110px]" aria-hidden />
      <div className="absolute bottom-10 right-1/4 h-56 w-56 rounded-full bg-clinic-violet/35 blur-[90px]" aria-hidden />

      <article className="relative overflow-visible rounded-[2rem] md:rounded-[2.25rem] p-[2px] shadow-[0_32px_100px_-30px_rgba(124,58,237,0.45)] bg-gradient-to-br from-clinic-teal via-clinic-violet to-clinic-coral">
        <div className="relative overflow-hidden rounded-[1.95rem] md:rounded-[2.15rem] bg-clinic-ink/95 backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-black/35" />

          <div className="relative grid gap-0 lg:grid-cols-[minmax(0,1.06fr)_minmax(260px,0.94fr)]">
            <section className="relative aspect-video lg:aspect-auto lg:min-h-[300px]">
              {youtube || vimeo ? (
                <div className="relative h-full min-h-[200px] w-full lg:min-h-[300px]">
                  {!showIframe ? (
                    <button
                      type="button"
                      onClick={() => setShowIframe(true)}
                      className="relative flex h-full w-full min-h-[inherit] flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-violet-950/60 to-teal-950/50 transition hover:from-violet-950"
                    >
                      {videoPoster ? (
                        <img
                          src={videoPoster}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover opacity-35 saturate-125"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-[linear-gradient(to_top,_rgba(0,0,0,0.6),transparent_55%)]" />
                      <span className="relative z-10 mb-3 inline-flex h-[4.75rem] w-[4.75rem] items-center justify-center rounded-full bg-gradient-to-br from-white/25 to-white/5 text-white shadow-2xl ring-2 ring-teal-300/60 backdrop-blur-md transition hover:scale-105 hover:ring-amber-300/80">
                        <svg className="ml-1 h-11 w-11 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                      <span className="relative z-10 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/90">
                        Tap to play video
                      </span>
                    </button>
                  ) : (
                    <iframe
                      title={`${doctor.name} intro`}
                      src={youtube || vimeo}
                      className="h-full min-h-[200px] w-full lg:min-h-[300px]"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                    />
                  )}
                </div>
              ) : isDirectVideo ? (
                <div className="relative h-full min-h-[200px] w-full overflow-hidden bg-black lg:min-h-[300px]">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    poster={videoPoster}
                    muted
                    loop
                    playsInline
                    className="h-full w-full object-cover contrast-[1.02] saturate-[1.05]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-clinic-ink/70 via-transparent to-black/25" />
                  <button
                    type="button"
                    onClick={() => setMuted((m) => !m)}
                    className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-full bg-black/35 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md ring-1 ring-white/25 transition hover:bg-black/55"
                  >
                    {muted ? "Sound on" : "Mute"}
                  </button>
                </div>
              ) : (
                <div className="flex h-full min-h-[220px] flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_rgba(45,212,191,0.15),transparent_55%),linear-gradient(to_bottom,#0f172a,#134e4a30)] px-8 text-center lg:min-h-[300px]">
                  <p className="font-display text-xl text-white md:text-2xl">Drop your spotlight video here</p>
                  <p className="mt-3 max-w-sm text-sm text-white/60">
                    Add <code className="rounded-lg bg-white/10 px-2 py-0.5 text-xs">public/site/doctor-intro.mp4</code>{" "}
                    — or paste a YouTube/Vimeo URL in{" "}
                    <code className="rounded-lg bg-white/10 px-2 py-0.5 text-xs">siteImages.js</code>.
                  </p>
                </div>
              )}
            </section>

            <section className="relative flex flex-col justify-center px-7 py-8 md:p-10">
              <p className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/25 to-violet-500/25 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-100 ring-1 ring-white/25">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Meet your doctor
              </p>
              <h3 className="font-display text-3xl font-semibold leading-tight text-white md:text-[2.15rem]">
                <span className="bg-gradient-to-r from-teal-200 via-white to-amber-100 bg-clip-text text-transparent">
                  {doctor.name}
                </span>
              </h3>
              <p className="mt-2 text-sm font-semibold text-teal-300/95">{doctor.role}</p>
              <p className="mt-1 text-xs text-white/45">{doctor.experience}</p>
              <p className="mt-5 text-sm leading-relaxed text-white/70">
                {doctor.videoTagline ||
                  "A quick intro — then book a visit and we’ll map out your smile goals together."}
              </p>
            </section>
          </div>
        </div>
      </article>
    </section>
  );
};

export default DoctorVideoSpotlight;
