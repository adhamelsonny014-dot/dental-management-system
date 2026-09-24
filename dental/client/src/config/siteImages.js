/**
 * Public site images — place files in dental/client/public/site/
 */

const base = "/site";

export const SITE_IMAGES = {
  /** Single hero banner (no multi-image carousel) */
  hero: {
    src: `${base}/hero-01.jpg`,
    alt: "Premium dental clinic interior",
  },

  about: {
    src: `${base}/about-clinic.jpg`,
    alt: "Our clinic",
  },

  signatureCases: [
    {
      id: "whitening",
      title: "Professional Whitening",
      summary: "Visible brightness in one visit.",
      detail:
        "Clinical-grade whitening lifts stains safely while protecting enamel. Results are tailored to your natural tooth shade.",
      before: `${base}/sig-1-before.jpg`,
      after: `${base}/sig-1-after.jpg`,
    },
    {
      id: "cosmetic",
      title: "Cosmetic Dentistry",
      summary: "Veneers and smile design that look naturally yours.",
      detail:
        "Digital smile previews and porcelain veneers crafted for harmony, proportion, and long-term comfort.",
      before: `${base}/sig-2-before.jpg`,
      after: `${base}/sig-2-after.jpg`,
    },
    {
      id: "alignment",
      title: "Smile Alignment",
      summary: "Straighter teeth, renewed confidence.",
      detail:
        "Clear aligners and cosmetic bonding options designed around your lifestyle — discreet, comfortable, effective.",
      before: `${base}/sig-3-before.jpg`,
      after: `${base}/sig-3-after.jpg`,
    },
  ],

  smileShowcase: {
    before: `${base}/smile-before.jpg`,
    after: `${base}/smile-after.jpg`,
  },

  /** Featured doctors — synced with DB seed (Tala & Omar) */
  featuredDoctors: [
    {
      slug: "tala-el-serysy",
      name: "Dr. Tala El Serysy",
      role: "Cosmetic & Aesthetic Dentistry",
      experience: "10+ years crafting signature smiles",
      photo: `${base}/doctor-tala.jpg`,
      color: "#2563eb",
      portfolio: [
        `${base}/tala-portfolio-1.jpg`,
        `${base}/tala-portfolio-2.jpg`,
        `${base}/tala-portfolio-3.jpg`,
      ],
    },
    {
      slug: "omar-el-antary",
      name: "Dr. Omar El Antary",
      role: "Orthodontics & Smile Design",
      experience: "12+ years in alignment & full smile design",
      photo: `${base}/doctor-omar.jpg`,
      color: "#0d9488",
      portfolio: [
        `${base}/omar-portfolio-1.jpg`,
        `${base}/omar-portfolio-2.jpg`,
        `${base}/omar-portfolio-3.jpg`,
      ],
    },
  ],
};

export const HERO_SERVICES = [
  { id: "checkup", label: "Dental checkups" },
  { id: "whitening", label: "Whitening" },
  { id: "cosmetic", label: "Cosmetic dentistry" },
  { id: "cleaning", label: "Teeth cleaning" },
];

export const HOME_STATS = [
  { value: "98%", label: "Satisfaction rate", tone: "blue" },
  { value: "50K+", label: "Smiles transformed", tone: "teal" },
  { value: "4.9", label: "Customer rating", tone: "violet" },
];
