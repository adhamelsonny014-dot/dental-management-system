import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const ROLES = ["receptionist", "assistant"];

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]       = useState({ name: "", email: "", password: "", role: "receptionist" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dental-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="font-display text-lg font-semibold text-slate-900">DentalCare</span>
        </div>

        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold text-slate-900">Create account</h2>
          <p className="text-dental-muted text-sm mt-1">Reception and assistant staff only — doctor logins are created in Staff by an admin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" type="text" name="name" value={form.name}
              onChange={handleChange} placeholder="Dr. Ahmed Hassan" required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="doctor@clinic.com" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="Min. 6 characters" required />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" name="role" value={form.role} onChange={handleChange}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-primary w-full py-2.5 mt-2" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </span>
            ) : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-dental-muted mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary-600 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
