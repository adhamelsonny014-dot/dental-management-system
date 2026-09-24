import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

const BookingForm = () => {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", service: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      alert("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/public/inquiries", { ...form, source: "landing_page" });
      setDone(true);
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong, please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "0.8rem 1rem",
    border: "1.5px solid #E8E2D9", borderRadius: "10px",
    fontFamily: "inherit", fontSize: "0.88rem", color: "#2C2C2C",
    background: "#F4F0EA", outline: "none",
  };

  if (done) return (
    <div style={{ background: "#F4F0EA", borderRadius: "16px", padding: "2rem", maxWidth: "540px", color: "#8B7355", fontWeight: 500, fontSize: "0.95rem" }}>
      Your request has been received. We will contact you within 24 hours to confirm.
    </div>
  );

  return (
    <div style={{ maxWidth: "540px", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", color: "#A09080", marginBottom: "6px" }}>First Name *</div>
          <input style={inputStyle} name="firstName" value={form.firstName} onChange={set} placeholder="Ahmed" />
        </div>
        <div>
          <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", color: "#A09080", marginBottom: "6px" }}>Last Name *</div>
          <input style={inputStyle} name="lastName" value={form.lastName} onChange={set} placeholder="Hassan" />
        </div>
      </div>
      <div>
        <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", color: "#A09080", marginBottom: "6px" }}>Email *</div>
        <input style={inputStyle} name="email" type="email" value={form.email} onChange={set} placeholder="you@email.com" />
      </div>
      <div>
        <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", color: "#A09080", marginBottom: "6px" }}>Phone *</div>
        <input style={inputStyle} name="phone" value={form.phone} onChange={set} placeholder="+20 100 000 0000" />
      </div>
      <div>
        <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", color: "#A09080", marginBottom: "6px" }}>Service</div>
        <select style={inputStyle} name="service" value={form.service} onChange={set}>
          <option value="">Select a service</option>
          <option>Dental Checkup</option>
          <option>Teeth Cleaning</option>
          <option>Gum Treatment</option>
          <option>Teeth Whitening</option>
          <option>Dental Implants</option>
          <option>Orthodontics</option>
        </select>
      </div>
      <div>
        <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", color: "#A09080", marginBottom: "6px" }}>Notes</div>
        <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }} name="notes" value={form.notes} onChange={set} placeholder="Any additional information..." />
      </div>
      <button onClick={handleSubmit} disabled={loading} style={{
        background: loading ? "#A09080" : "#2C2C2C", color: "#FAF7F2",
        border: "none", padding: "0.9rem", borderRadius: "10px",
        fontSize: "0.9rem", fontWeight: 500, cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "inherit", marginTop: "0.5rem",
      }}>
        {loading ? "Sending..." : "Request Appointment"}
      </button>
      <p style={{ fontSize: "0.75rem", color: "#A09080", fontWeight: 300 }}>
        Your request will be on hold until confirmed by our team.
      </p>
    </div>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const [activeService, setActiveService] = useState(0);
  const [question, setQuestion] = useState("");
  const [sent, setSent] = useState(false);
  const heroInputRef = useRef();

  const services = [
    { label: "Dental Checkups", description: "Routine examinations using digital imaging to detect issues early and maintain long-term oral health." },
    { label: "Teeth Cleaning", description: "Professional scaling and polishing to remove buildup and leave your teeth feeling fresh and smooth." },
    { label: "Gum Treatment", description: "Targeted therapy to address gum disease and restore the health of the tissue around your teeth." },
    { label: "Retainers", description: "Custom-fitted retainers to maintain teeth alignment after orthodontic treatment." },
    { label: "Whitening", description: "Clinical-grade whitening treatments that deliver visible results in a single session." },
  ];

  const [serviceImages, setServiceImages] = useState(services.map(() => ({ before: null, after: null })));
  const [heroImage, setHeroImage] = useState(null);
  const [doctorImages, setDoctorImages] = useState([null, null, null]);

  const handleHeroUpload = (e) => {
    const file = e.target.files[0];
    if (file) setHeroImage(URL.createObjectURL(file));
  };

  const handleServiceImage = (e, index, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setServiceImages((prev) => { const updated = [...prev]; updated[index] = { ...updated[index], [type]: url }; return updated; });
  };

  const handleDoctorImage = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setDoctorImages((prev) => { const updated = [...prev]; updated[index] = url; return updated; });
  };

  const doctors = [
    { name: "Dr. Ahmed Hassan", role: "Lead Dentist", exp: "12 years experience" },
    { name: "Dr. Sara Al-Mansour", role: "Orthodontist", exp: "8 years experience" },
    { name: "Dr. Khaled Al-Shareef", role: "Implant Specialist", exp: "10 years experience" },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', 'Inter', sans-serif", background: "#FAF7F2", color: "#2C2C2C", overflowX: "hidden" }}>

      {/* NAVBAR */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(250,247,242,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid #E8E2D9", padding: "0 6%", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: "1.3rem", fontWeight: 700, color: "#1a1a1a" }}>
          Smile<span style={{ color: "#8B7355" }}>Care</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          {["Home", "About Us", "Our Doctors"].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(" ", "")}`} style={{ textDecoration: "none", color: "#555", fontSize: "0.88rem" }}>{item}</a>
          ))}
          <button onClick={() => navigate("/register")} style={{ background: "#2C2C2C", color: "#FAF7F2", border: "none", padding: "0.5rem 1.3rem", borderRadius: "50px", fontSize: "0.85rem", fontWeight: 500, cursor: "pointer" }}>
            Book Now
          </button>
          <button onClick={() => navigate("/login")} title="Staff / Patient Login" style={{ background: "none", border: "1.5px solid #D4C9B8", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#8B7355" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ paddingTop: "64px", minHeight: "90vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div onClick={() => heroInputRef.current.click()} style={{ width: "100%", height: "82vh", cursor: "pointer", background: heroImage ? "none" : "linear-gradient(160deg, #EDE8E0 0%, #D4C9B8 100%)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          {heroImage
            ? <img src={heroImage} alt="Clinic" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ textAlign: "center", color: "#8B7355" }}>
                <div style={{ fontSize: "2.5rem", fontFamily: "Georgia, serif", fontWeight: 300, marginBottom: "0.5rem" }}>Modern Dentistry with Gentle Care</div>
                <p style={{ fontSize: "0.85rem", color: "#A09080", fontWeight: 300 }}>Click to upload main photo</p>
              </div>
          }
          <input ref={heroInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleHeroUpload} />
          {heroImage && (
            <div style={{ position: "absolute", bottom: "10%", left: "6%", background: "rgba(250,247,242,0.92)", borderRadius: "16px", padding: "1.5rem 2rem", maxWidth: "420px", backdropFilter: "blur(8px)" }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: "1.8rem", fontWeight: 600, color: "#1a1a1a", lineHeight: 1.2, marginBottom: "0.5rem" }}>
                Modern Dentistry<br />with <span style={{ color: "#8B7355", fontStyle: "italic" }}>Gentle Care</span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "#777", fontWeight: 300, lineHeight: 1.7 }}>Expert care in a calm, welcoming environment.</p>
            </div>
          )}
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" style={{ padding: "5rem 6%", background: "#FAF7F2" }}>
        <p style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "2px", color: "#A09080", marginBottom: "0.5rem" }}>What we offer</p>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: "2.1rem", fontWeight: 600, color: "#1a1a1a", marginBottom: "2rem", lineHeight: 1.2 }}>Discover our Signature Services</h2>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "2.5rem" }}>
          {services.map((s, i) => (
            <button key={i} onClick={() => setActiveService(i)} style={{ padding: "0.5rem 1.2rem", borderRadius: "50px", border: "none", cursor: "pointer", fontSize: "0.83rem", fontWeight: 500, background: activeService === i ? "#2C2C2C" : "#EDE8E0", color: activeService === i ? "#FAF7F2" : "#555" }}>
              {s.label}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", background: "#F4F0EA", borderRadius: "20px", padding: "2rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {["before", "after"].map((type) => (
              <label key={type} style={{ cursor: "pointer" }}>
                <div style={{ height: "200px", borderRadius: "14px", overflow: "hidden", background: "#E8E2D9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  {serviceImages[activeService][type]
                    ? <img src={serviceImages[activeService][type]} alt={type} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <><div style={{ fontSize: "0.75rem", color: "#A09080" }}>Upload {type} photo</div><div style={{ fontSize: "0.65rem", color: "#C0B8A8", marginTop: "4px" }}>Click to add</div></>
                  }
                  <div style={{ position: "absolute", top: "8px", left: "8px", background: type === "before" ? "#2C2C2C" : "#8B7355", color: "white", fontSize: "0.65rem", padding: "2px 8px", borderRadius: "50px", textTransform: "uppercase", letterSpacing: "1px" }}>{type}</div>
                </div>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleServiceImage(e, activeService, type)} />
              </label>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1.4rem", fontWeight: 600, color: "#1a1a1a", marginBottom: "1rem" }}>{services[activeService].label}</h3>
            <p style={{ fontSize: "0.9rem", color: "#666", lineHeight: 1.8, fontWeight: 300, marginBottom: "1.5rem" }}>{services[activeService].description}</p>
            <button onClick={() => navigate("/register")} style={{ alignSelf: "flex-start", background: "#2C2C2C", color: "#FAF7F2", border: "none", padding: "0.65rem 1.5rem", borderRadius: "50px", fontSize: "0.83rem", fontWeight: 500, cursor: "pointer" }}>
              Book this service
            </button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: "#2C2C2C", padding: "3rem 6%", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        {[{ num: "98%", label: "Satisfaction Rate" }, { num: "50K+", label: "Smiles Transformed" }, { num: "4.9", label: "Customer Rating" }].map((s) => (
          <div key={s.num} style={{ textAlign: "center", color: "#FAF7F2" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: "2.4rem", fontWeight: 700, marginBottom: "0.3rem" }}>{s.num}</div>
            <div style={{ fontSize: "0.8rem", opacity: 0.55, fontWeight: 300, textTransform: "uppercase", letterSpacing: "1px" }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* DOCTORS */}
      <section id="ourdoctors" style={{ padding: "5rem 6%", background: "#FAF7F2" }}>
        <p style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "2px", color: "#A09080", marginBottom: "0.5rem" }}>The team</p>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: "2.1rem", fontWeight: 600, color: "#1a1a1a", marginBottom: "3rem", lineHeight: 1.2 }}>Our Doctors</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
          {doctors.map((doc, i) => (
            <div key={i} style={{ background: "#F4F0EA", borderRadius: "20px", overflow: "hidden" }}>
              <label style={{ cursor: "pointer", display: "block" }}>
                <div style={{ height: "260px", background: "#E8E2D9", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  {doctorImages[i]
                    ? <img src={doctorImages[i]} alt={doc.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ textAlign: "center", color: "#A09080" }}><div style={{ fontSize: "0.78rem", fontWeight: 300 }}>Add photo</div></div>
                  }
                </div>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleDoctorImage(e, i)} />
              </label>
              <div style={{ padding: "1.3rem" }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: "1rem", fontWeight: 600, color: "#1a1a1a", marginBottom: "0.2rem" }}>{doc.name}</div>
                <div style={{ fontSize: "0.78rem", color: "#8B7355", fontWeight: 500, marginBottom: "0.3rem" }}>{doc.role}</div>
                <div style={{ fontSize: "0.75rem", color: "#A09080", fontWeight: 300 }}>{doc.exp}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SMILE BEFORE & AFTER */}
      <section style={{ padding: "5rem 6%", background: "#F4F0EA" }}>
        <p style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "2px", color: "#A09080", marginBottom: "0.5rem" }}>Transformations</p>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: "2.1rem", fontWeight: 600, color: "#1a1a1a", marginBottom: "0.8rem", lineHeight: 1.2 }}>Make your smile shine<br />all the way</h2>
        <p style={{ fontSize: "0.88rem", color: "#888", fontWeight: 300, lineHeight: 1.7, maxWidth: "440px", marginBottom: "2.5rem" }}>Real results from real patients. Every smile tells a story of confidence restored.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", maxWidth: "700px" }}>
          {["Before", "After"].map((label) => (
            <label key={label} style={{ cursor: "pointer" }}>
              <div style={{ height: "280px", borderRadius: "20px", background: "#EDE8E0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                <div style={{ fontSize: "0.78rem", color: "#A09080" }}>Upload {label} smile photo</div>
                <div style={{ position: "absolute", bottom: "12px", left: "12px", background: label === "Before" ? "#555" : "#8B7355", color: "white", fontSize: "0.65rem", padding: "3px 10px", borderRadius: "50px", textTransform: "uppercase", letterSpacing: "1px" }}>{label}</div>
              </div>
              <input type="file" accept="image/*" style={{ display: "none" }} />
            </label>
          ))}
        </div>
      </section>

      {/* BOOKING FORM */}
      <section id="booking" style={{ padding: "5rem 6%", background: "#FAF7F2" }}>
        <p style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "2px", color: "#A09080", marginBottom: "0.5rem" }}>Get in touch</p>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: "2.1rem", fontWeight: 600, color: "#1a1a1a", marginBottom: "2.5rem" }}>Book an Appointment</h2>
        <BookingForm />
      </section>

      {/* QUESTION BOX */}
      <section style={{ padding: "5rem 6%", background: "#F4F0EA" }}>
        <p style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "2px", color: "#A09080", marginBottom: "0.5rem" }}>Got a question?</p>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: "2rem", fontWeight: 600, color: "#1a1a1a", marginBottom: "2rem" }}>Ask us anything</h2>
        {sent
          ? <div style={{ background: "#F4F0EA", borderRadius: "16px", padding: "2rem", maxWidth: "540px", color: "#8B7355", fontWeight: 500 }}>Your question has been sent. We will get back to you shortly.</div>
          : <div style={{ background: "#EDE8E0", borderRadius: "16px", padding: "1.5rem", maxWidth: "540px", display: "flex", gap: "0.8rem", alignItems: "center" }}>
              <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Type your question here..." style={{ flex: 1, border: "none", background: "white", borderRadius: "10px", padding: "0.75rem 1rem", fontSize: "0.88rem", outline: "none", color: "#2C2C2C", fontFamily: "inherit" }} />
              <button onClick={() => { if (question.trim()) setSent(true); }} style={{ background: "#2C2C2C", color: "#FAF7F2", border: "none", padding: "0.75rem 1.4rem", borderRadius: "10px", fontSize: "0.83rem", fontWeight: 500, cursor: "pointer" }}>Send</button>
            </div>
        }
      </section>

      {/* LOCATION */}
      <section style={{ padding: "5rem 6%", background: "#FAF7F2", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "2px", color: "#A09080", marginBottom: "0.5rem" }}>Find us</p>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "2rem", fontWeight: 600, color: "#1a1a1a", marginBottom: "1.5rem" }}>Location & Info</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[{ label: "Address", value: "123 Dental Street, Cairo, Egypt" }, { label: "Phone", value: "+20 100 000 0000" }, { label: "Email", value: "info@smilecare.com" }, { label: "Hours", value: "Sun – Thu: 9am – 6pm" }].map((item) => (
              <div key={item.label}>
                <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", color: "#A09080", marginBottom: "2px" }}>{item.label}</div>
                <div style={{ fontSize: "0.9rem", color: "#2C2C2C", fontWeight: 400 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: "280px", borderRadius: "20px", background: "#E8E2D9", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", color: "#A09080" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 300 }}>Map placeholder</div>
            <div style={{ fontSize: "0.7rem", color: "#C0B8A8", marginTop: "4px" }}>Embed Google Maps here</div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#2C2C2C", color: "#FAF7F2", padding: "3rem 6% 2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2.5rem", flexWrap: "wrap", gap: "2rem" }}>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.6rem" }}>Smile<span style={{ color: "#C4A882" }}>Care</span></div>
            <p style={{ fontSize: "0.8rem", opacity: 0.45, fontWeight: 300, maxWidth: "220px", lineHeight: 1.7 }}>Modern dentistry with gentle care. Trusted by thousands of patients.</p>
          </div>
          {[{ title: "Services", links: ["Dental Checkups", "Teeth Cleaning", "Whitening", "Implants"] }, { title: "Clinic", links: ["Our Doctors", "Book Appointment", "About Us"] }].map((col) => (
            <div key={col.title}>
              <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.4, marginBottom: "1rem" }}>{col.title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {col.links.map((l) => (<a key={l} href="#" style={{ fontSize: "0.83rem", color: "#FAF7F2", opacity: 0.6, textDecoration: "none", fontWeight: 300 }}>{l}</a>))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <p style={{ fontSize: "0.75rem", opacity: 0.35, fontWeight: 300 }}>2026 SmileCare. All rights reserved.</p>
          <button onClick={() => navigate("/login")} style={{ background: "rgba(255,255,255,0.08)", color: "#FAF7F2", border: "1px solid rgba(255,255,255,0.15)", padding: "0.45rem 1.1rem", borderRadius: "50px", fontSize: "0.78rem", cursor: "pointer", fontFamily: "inherit" }}>Staff Login</button>
        </div>
      </footer>

    </div>
  );
};

export default Landing;