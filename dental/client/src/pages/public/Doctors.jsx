import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SectionHeading from "../../components/public/SectionHeading";
import { fetchStaff } from "../../utils/publicApi";

const ROLE_LABEL = {
  dentist: "Dentist",
  hygienist: "Hygienist",
  assistant: "Dental Assistant",
  receptionist: "Care Coordinator",
  manager: "Clinic Manager",
};

const Doctors = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaff()
      .then(setStaff)
      .catch(() => setStaff([]))
      .finally(() => setLoading(false));
  }, []);

  const dentists = staff.filter((m) => m.role === "dentist" || m.role === "hygienist");
  const team = staff.filter((m) => !["dentist", "hygienist"].includes(m.role));

  return (
    <>
      <section className="bg-clinic-sand border-b border-clinic-border py-16 sm:py-20">
        <section className="max-w-6xl mx-auto px-5 sm:px-8">
          <SectionHeading
            eyebrow="Our team"
            title="Meet the people behind your care"
            description="Experienced clinicians and support staff dedicated to making every visit comfortable."
          />
        </section>
      </section>

      <section className="py-16 sm:py-20">
        <section className="max-w-6xl mx-auto px-5 sm:px-8">
          {loading ? (
            <p className="text-clinic-muted text-center py-12">Loading team…</p>
          ) : staff.length === 0 ? (
            <section className="text-center py-12 bg-clinic-sand rounded-2xl border border-clinic-border">
              <p className="text-slate-600">Team profiles will appear here once added in the clinic system.</p>
              <Link to="/book" className="inline-block mt-4 text-sm font-medium text-clinic-accent hover:underline">
                Book an appointment anyway →
              </Link>
            </section>
          ) : (
            <>
              {dentists.length > 0 && (
                <>
                  <h2 className="font-display text-xl font-semibold mb-6">Clinical team</h2>
                  <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
                    {dentists.map((m) => (
                      <TeamCard key={m._id} member={m} />
                    ))}
                  </section>
                </>
              )}
              {team.length > 0 && (
                <>
                  <h2 className="font-display text-xl font-semibold mb-6">Support team</h2>
                  <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {team.map((m) => (
                      <TeamCard key={m._id} member={m} />
                    ))}
                  </section>
                </>
              )}
            </>
          )}
        </section>
      </section>
    </>
  );
};

const TeamCard = ({ member }) => (
  <article className="bg-clinic-sand border border-clinic-border rounded-2xl overflow-hidden">
    <p
      className="h-48 flex items-center justify-center text-4xl font-display font-bold text-white"
      style={{ backgroundColor: member.color || "#8B7355" }}
    >
      {member.firstName?.[0]}
      {member.lastName?.[0]}
    </p>
    <section className="p-5">
      <h3 className="font-display font-semibold text-clinic-ink">
        {member.firstName} {member.lastName}
      </h3>
      <p className="text-sm text-clinic-accent font-medium mt-0.5">
        {ROLE_LABEL[member.role] || member.role}
      </p>
      {member.specialization && (
        <p className="text-sm text-slate-600 mt-2">{member.specialization}</p>
      )}
    </section>
  </article>
);

export default Doctors;
