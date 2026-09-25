import { Link } from "react-router-dom";

const PublicFooter = () => (
  <footer className="bg-clinic-ink text-clinic-cream">
    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
        <section className="sm:col-span-2 lg:col-span-1">
          <p className="font-display text-lg font-bold mb-3">
            Smile<span className="text-clinic-accentLight">Care</span>
          </p>
          <p className="text-sm text-clinic-cream/50 leading-relaxed max-w-xs">
            Modern dentistry with gentle care. Your smile is in trusted hands.
          </p>
        </section>
        <section>
          <p className="text-xs uppercase tracking-wider text-clinic-cream/40 mb-4">Explore</p>
          <ul className="space-y-2 text-sm text-clinic-cream/65">
            <li>
              <Link to="/services" className="hover:text-white">
                Services
              </Link>
            </li>
            <li>
              <Link to="/doctors" className="hover:text-white">
                Our doctors
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-white">
                About us
              </Link>
            </li>
            <li>
              <Link to="/book" className="hover:text-white">
                Book appointment
              </Link>
            </li>
            <li>
              <Link to="/register-patient" className="hover:text-white">
                Patient registration
              </Link>
            </li>
          </ul>
        </section>
        <section>
          <p className="text-xs uppercase tracking-wider text-clinic-cream/40 mb-4">Clinic</p>
          <ul className="space-y-2 text-sm text-clinic-cream/65">
            <li>
              <Link to="/contact" className="hover:text-white">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-white">
                Staff portal
              </Link>
            </li>
          </ul>
        </section>
        <section>
          <p className="text-xs uppercase tracking-wider text-clinic-cream/40 mb-4">Hours</p>
          <p className="text-sm text-clinic-cream/65 leading-relaxed">
            Mon – Fri: 9:00 – 18:00
            <br />
            Sat: 10:00 – 14:00
            <br />
            Sun: Closed
          </p>
        </section>
      </section>
      <section className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between gap-3 text-xs text-clinic-cream/35">
        <p>© {new Date().getFullYear()} SmileCare. All rights reserved.</p>
        <p>Powered by DentalCare clinic management</p>
      </section>
    </section>
  </footer>
);

export default PublicFooter;
