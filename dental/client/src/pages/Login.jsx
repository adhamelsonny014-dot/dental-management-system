import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const Login = () => {
  const { login } = useAuth();
  const navigate   = useNavigate();

  const [form, setForm]       = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dental-bg flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-dental-sidebar flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="text-white font-display text-lg font-semibold">DentalCare</span>
        </div>

        <div>
          <h1 className="text-white font-display text-4xl font-bold leading-tight mb-4">
            Manage your clinic<br />smarter, faster.
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            Patients, appointments, clinical records, and billing — all in one place.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Patients", value: "1,240+" },
            { label: "Appointments today", value: "28" },
            { label: "Success rate", value: "99.2%" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white font-display text-2xl font-bold">{stat.value}</p>
              <p className="text-slate-400 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-slate-900">Sign in</h2>
            <p className="text-dental-muted text-sm mt-1">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="doctor@clinic.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                className="input"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-2.5 mt-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-dental-muted mt-6">
            No account?{" "}
            <Link to="/register" className="text-primary-600 hover:underline font-medium">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
