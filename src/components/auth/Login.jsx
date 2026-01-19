import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/axios";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    emailOrPhone: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiClient.post("/api/v1/auth/login", formData);

      if (response.data.success) {
        const { user, token } = response.data.data;

        // Login function call karo (wo subscription bhi fetch karega)
        await login(user, token);

        // Redirect based on user role and verification
        if (user.isVerified && user.role === "user") {
          navigate("/user");
        } else if (user.isVerified && user.role === "admin") {
          navigate("/admin");
        } else {
          localStorage.setItem("verifyEmail", user.email);
          navigate("/verify-otp");
        }
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (error) {
      console.error(error);

      if (error.response) {
        setError(error.response.data?.message || "Invalid email or password");
      } else if (error.request) {
        setError("Network error. Please check your connection.");
      } else {
        setError(error.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen relative bg-slate-950 text-white  antialiased flex items-center justify-center px-6 py-32 overflow-hidden">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-glow { animation: glow 3s ease-in-out infinite; }
      `}</style>

      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      ></div>

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] animate-float"></div>
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-[120px] animate-float"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8 md:p-10 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 backdrop-blur-sm rounded-full border border-emerald-500/20 mb-6">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-glow"></div>
              <span className="text-sm font-medium text-emerald-400">
                Welcome Back
              </span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">Sign In</h1>
            <p className="text-slate-400">Access your NAATI CCL preparation</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  id="email"
                  name="emailOrPhone"
                  value={formData.emailOrPhone}
                  autoComplete="off"
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  autoComplete="off"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link
                to={"/forgot-password"}
                className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing In..." : "Sign In"}
              {!loading && (
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </form>

          <p className="text-center mt-8 text-slate-400">
            Don't have an account?{" "}
            <a
              href="/signup"
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
