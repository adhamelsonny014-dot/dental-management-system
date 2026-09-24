export const SERVICES = [
  {
    id: "checkup",
    title: "Dental Checkups",
    summary: "Routine exams with digital imaging to catch issues early.",
    description:
      "Comprehensive oral examinations, X-rays when needed, and personalized prevention plans so your smile stays healthy year after year.",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  },
  {
    id: "cleaning",
    title: "Teeth Cleaning",
    summary: "Professional scaling and polishing for a fresh, smooth finish.",
    description:
      "Gentle removal of plaque and tartar, followed by polish and fluoride guidance tailored to your gums and lifestyle.",
    icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  },
  {
    id: "filling",
    title: "Fillings & Restorations",
    summary: "Tooth-colored materials that blend naturally with your smile.",
    description:
      "We restore damaged teeth with durable, aesthetic composites and crowns designed for comfort and long-term function.",
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
  },
  {
    id: "cosmetic",
    title: "Cosmetic Dentistry",
    summary: "Veneers, bonding, and full smile design.",
    description:
      "From subtle enhancements to complete smile makeovers — digital previews and porcelain veneers tailored to your features.",
    icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  },
  {
    id: "whitening",
    title: "Whitening",
    summary: "Clinical-grade whitening for visible results.",
    description:
      "Safe in-office and take-home options supervised by our team to brighten your smile without compromising enamel health.",
    icon: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707",
  },
  {
    id: "orthodontics",
    title: "Orthodontics & Retainers",
    summary: "Alignment solutions for teens and adults.",
    description:
      "Clear aligners, traditional braces, and custom retainers to straighten teeth and maintain results after treatment.",
    icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  },
  {
    id: "consultation",
    title: "Implants & Consultations",
    summary: "Expert planning for implants, crowns, and complex care.",
    description:
      "One-on-one consultations to explore implants, bridges, and full-mouth rehabilitation with transparent treatment options.",
    icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  },
];

export const SERVICE_OPTIONS = SERVICES.map((s) => ({
  value: s.id,
  label: s.title,
}));
