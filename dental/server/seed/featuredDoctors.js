const Staff = require("../Models/Staff");
const User = require("../Models/User");

const FEATURED = [
  {
    slug: "tala-el-serysy",
    firstName: "Tala",
    lastName: "El Serysy",
    specialization: "Cosmetic & Aesthetic Dentistry",
    headline: "Crafting luminous, natural smiles with precision artistry.",
    color: "#2563eb",
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
    portfolioImages: [
      "/site/omar-portfolio-1.jpg",
      "/site/omar-portfolio-2.jpg",
      "/site/omar-portfolio-3.jpg",
    ],
    email: "omar.elantary@smilecare.com",
  },
];

const ensureDoctorLogin = async (staffDoc, doc) => {
  const defaultPass = process.env.SEED_DOCTOR_PASSWORD || "Doctor123!";
  let user = await User.findOne({ email: doc.email });
  if (!user) {
    user = await User.create({
      name: `Dr. ${doc.firstName} ${doc.lastName}`,
      email: doc.email,
      password: defaultPass,
      role: "dentist",
    });
    console.log(`[seed] Dentist login: ${doc.email} / ${defaultPass}`);
  }
  if (!staffDoc.userId) {
    staffDoc.userId = user._id;
    await staffDoc.save();
  }
};

const seedFeaturedDoctors = async () => {
  for (const doc of FEATURED) {
    let staff = await Staff.findOne({ slug: doc.slug });
    if (staff) {
      staff.featured = true;
      staff.portfolioImages = doc.portfolioImages;
      staff.headline = doc.headline;
      staff.specialization = doc.specialization;
      staff.color = doc.color;
      staff.email = doc.email;
      await staff.save();
    } else {
      staff = await Staff.create({
        ...doc,
        role: "dentist",
        featured: true,
        phone: "",
      });
    }
    await ensureDoctorLogin(staff, doc);
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
