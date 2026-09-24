import TagInput from "./TagInput";

const BLOOD_TYPES = ["unknown","A+","A-","B+","B-","AB+","AB-","O+","O-"];
const GENDERS     = ["", "male", "female", "other"];

const Section = ({ title, children }) => (
  <div className="card p-6 mb-5">
    <h3 className="text-xs font-semibold text-dental-muted uppercase tracking-wide mb-4">{title}</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
  </div>
);

const Field = ({ label, children, full }) => (
  <div className={full ? "sm:col-span-2" : ""}>
    <label className="label">{label}</label>
    {children}
  </div>
);

const PatientForm = ({ data, onChange, onArrayChange }) => {
  const set = (e) => onChange({ ...data, [e.target.name]: e.target.value });
  const setNested = (parent, field, val) =>
    onChange({ ...data, [parent]: { ...data[parent], [field]: val } });

  return (
    <div>
      {/* Basic info */}
      <Section title="Basic information">
        <Field label="First name *">
          <input className="input" name="firstName" value={data.firstName} onChange={set} required placeholder="Ahmed" />
        </Field>
        <Field label="Last name *">
          <input className="input" name="lastName" value={data.lastName} onChange={set} required placeholder="Hassan" />
        </Field>
        <Field label="Date of birth">
          <input className="input" type="date" name="dateOfBirth" value={data.dateOfBirth} onChange={set} />
        </Field>
        <Field label="Gender">
          <select className="input" name="gender" value={data.gender} onChange={set}>
            {GENDERS.map((g) => (
              <option key={g} value={g}>{g ? g.charAt(0).toUpperCase() + g.slice(1) : "Prefer not to say"}</option>
            ))}
          </select>
        </Field>
        <Field label="National ID">
          <input className="input" name="nationalId" value={data.nationalId} onChange={set} placeholder="Optional" />
        </Field>
        <Field label="Referred by">
          <input className="input" name="referredBy" value={data.referredBy} onChange={set} placeholder="Doctor, friend, etc." />
        </Field>
      </Section>

      {/* Contact */}
      <Section title="Contact information">
        <Field label="Phone number">
          <input className="input" name="phone" value={data.phone} onChange={set} placeholder="+20 100 000 0000" />
        </Field>
        <Field label="Email">
          <input className="input" type="email" name="email" value={data.email} onChange={set} placeholder="patient@email.com" />
        </Field>
        <Field label="Address" full>
          <input className="input" name="address" value={data.address} onChange={set} placeholder="Street address" />
        </Field>
        <Field label="City">
          <input className="input" name="city" value={data.city} onChange={set} placeholder="Cairo" />
        </Field>
      </Section>

      {/* Emergency contact */}
      <Section title="Emergency contact">
        <Field label="Contact name">
          <input className="input" name="name" value={data.emergencyContact?.name || ""}
            onChange={(e) => setNested("emergencyContact", "name", e.target.value)}
            placeholder="Full name" />
        </Field>
        <Field label="Relationship">
          <input className="input" name="relationship" value={data.emergencyContact?.relationship || ""}
            onChange={(e) => setNested("emergencyContact", "relationship", e.target.value)}
            placeholder="Spouse, parent, etc." />
        </Field>
        <Field label="Phone">
          <input className="input" name="ecPhone" value={data.emergencyContact?.phone || ""}
            onChange={(e) => setNested("emergencyContact", "phone", e.target.value)}
            placeholder="+20 100 000 0000" />
        </Field>
      </Section>

      {/* Medical */}
      <Section title="Medical information">
        <Field label="Blood type">
          <select className="input" name="bloodType" value={data.bloodType} onChange={set}>
            {BLOOD_TYPES.map((b) => <option key={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select className="input" name="status" value={data.status} onChange={set}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
        <Field label="Allergies" full>
          <TagInput
            label=""
            values={data.allergies}
            onChange={(v) => onArrayChange("allergies", v)}
            placeholder="Type allergy and press Enter or Add"
            color="red"
          />
        </Field>
        <Field label="Current medications" full>
          <TagInput
            label=""
            values={data.medications}
            onChange={(v) => onArrayChange("medications", v)}
            placeholder="Type medication and press Enter or Add"
            color="blue"
          />
        </Field>
        <Field label="Medical conditions" full>
          <TagInput
            label=""
            values={data.conditions}
            onChange={(v) => onArrayChange("conditions", v)}
            placeholder="e.g. Hypertension, Diabetes"
            color="amber"
          />
        </Field>
        <Field label="Medical notes" full>
          <textarea className="input resize-none" name="medicalNotes" value={data.medicalNotes} onChange={set}
            rows={3} placeholder="Any additional medical notes..." />
        </Field>
        <Field label="General notes" full>
          <textarea className="input resize-none" name="notes" value={data.notes} onChange={set}
            rows={2} placeholder="Internal notes about this patient..." />
        </Field>
      </Section>
    </div>
  );
};

export default PatientForm;
