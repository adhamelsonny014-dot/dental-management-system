import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import PatientForm from "../components/PatientForm";

const EMPTY = {
  firstName: "", lastName: "", dateOfBirth: "", gender: "", nationalId: "",
  phone: "", email: "", address: "", city: "",
  emergencyContact: { name: "", relationship: "", phone: "" },
  bloodType: "unknown", allergies: [], medications: [], conditions: [],
  medicalNotes: "", notes: "", referredBy: "", status: "active",
};

const AddEditPatient = () => {
  const { id }   = useParams();      // present = edit mode
  const navigate = useNavigate();
  const isEdit   = Boolean(id);

  const [data,    setData]    = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving,  setSaving]  = useState(false);

  // Load existing patient for edit
  useEffect(() => {
    if (!isEdit) return;
    api.get(`/patients/${id}`)
      .then((r) => {
        const p = r.data;
        // Format date for <input type="date">
        if (p.dateOfBirth) {
          p.dateOfBirth = new Date(p.dateOfBirth).toISOString().split("T")[0];
        }
        setData({ ...EMPTY, ...p });
      })
      .catch(() => toast.error("Failed to load patient"))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleArrayChange = (field, value) => setData((d) => ({ ...d, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!data.firstName.trim() || !data.lastName.trim()) {
      toast.error("First and last name are required");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/patients/${id}`, data);
        toast.success("Patient updated");
        navigate(`/patients/${id}`);
      } else {
        const res = await api.post("/patients", data);
        toast.success("Patient created");
        navigate(`/patients/${res.data._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-8 flex justify-center">
      <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-8 max-w-3xl">
      <PageHeader
        title={isEdit ? "Edit patient" : "Add new patient"}
        subtitle={isEdit ? "Update patient details" : "Register a new patient to the system"}
        action={
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-ghost text-sm"
              onClick={() => navigate(isEdit ? `/patients/${id}` : "/patients")}
            >
              Cancel
            </button>
          </div>
        }
      />

      <form onSubmit={handleSubmit}>
        <PatientForm data={data} onChange={setData} onArrayChange={handleArrayChange} />

        <div className="flex justify-end gap-3 mt-2">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => navigate(isEdit ? `/patients/${id}` : "/patients")}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary px-6" disabled={saving}>
            {saving
              ? (isEdit ? "Saving..." : "Creating...")
              : (isEdit ? "Save changes" : "Create patient")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEditPatient;
