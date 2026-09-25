const Staff = require("../Models/Staff");
const User = require("../Models/User");
const { generateTempPassword } = require("../utils/password");

const FEATURED = [
  {
    slug: "tala-el-serysy",
    firstName: "Tala",
    lastName: "El Serysy",
    specialization: "Cosmetic & Aesthetic Dentistry",
    headline: "Crafting luminous, natural smiles with precision artistry.",
    color: "#2563eb",
    photo: "/site/doctor-tala.jpg",
    portfolioImages: [
      "/site/tala-portfolio-1.jpg",
      "/site/tala-portfolio-2.jpg",
      "/site/tala-portfolio-3.jpg",
    ],
    email: "tala.elserysy@smilecare.com",
  },
  {
    slug: "omar-el-antary",
    firstName: "Omar",
    lastName: "El Antary",
    specialization: "Orthodontics & Smile Design",
    headline: "Transforming alignment and confidence with modern techniques.",
    color: "#0d9488",
    photo: "/site/doctor-omar.jpg",
    portfolioImages: [
      "/site/omar-portfolio-1.jpg",
      "/site/omar-portfolio-2.jpg",
      "/site/omar-portfolio-3.jpg",
    ],
    email: "omar.elantary@smilecare.com",
  },
];

const createDoctorLogin = async (staffDoc, doc) => {
  // No hard-coded default: use SEED_DOCTOR_PASSWORD, or a random password printed once
  const password = process.env.SEED_DOCTOR_PASSWORD || generateTempPassword();
  let user = await User.findOne({ email: doc.email });
  if (!user) {
    user = await User.create({
      name: `Dr. ${doc.firstName} ${doc.lastName}`,
      email: doc.email,
      password,
      role: "dentist",
    });
    console.log(`[seed] Dentist login: ${doc.email} / ${password}`);
  }
  staffDoc.userId = user._id;
  await staffDoc.save();
};

// Creates the featured demo doctors once. Existing records are never overwritten,
// so edits made by an admin survive server restarts.
const seedFeaturedDoctors = async () => {
  for (const doc of FEATURED) {
    const exists = await Staff.exists({ slug: doc.slug });
    if (exists) continue;

    const staff = await Staff.create({
      ...doc,
      role: "dentist",
      featured: true,
      phone: "",
    });
    await createDoctorLogin(staff, doc);
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@smilecare.com";
  const adminExists = await User.findOne({ email: adminEmail });
  if (!adminExists && process.env.SEED_ADMIN_PASSWORD) {
    await User.create({
      name: "Clinic Admin",
      email: adminEmail,
      password: process.env.SEED_ADMIN_PASSWORD,
      role: "admin",
    });
    console.log(`[seed] Admin created: ${adminEmail}`);
  }
};

module.exports = { seedFeaturedDoctors, FEATURED };
