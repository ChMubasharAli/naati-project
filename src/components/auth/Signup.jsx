// src/components/Signup.jsx
import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Phone,
  Calendar,
  Globe,
} from "lucide-react";

// Import API function

import { toast } from "react-toastify";
import { registerUser } from "../../api/auth";
import { queryKeys, showSuccessToast } from "../../lib/react-query";
import { fetchLanguages } from "../../api/languages";

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    preferredLanguage: "en",
    naatiCclExamDate: "",
  });

  const { data: languagesResponse } = useQuery({
    queryKey: queryKeys.languages.list(),
    queryFn: fetchLanguages,
    staleTime: 5 * 60 * 1000,
  });

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      // Show success toast notification
      showSuccessToast(data.message || "Account created successfully!");

      // Store email for OTP verification
      localStorage.setItem("verifyEmail", formData.email);

      // Redirect to OTP verification page
      navigate("/verify-otp");
    },
    // Note: Error is automatically handled by our global error handler
    // which uses the error message from axios
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic client-side validation
    if (!formData.name.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    if (!formData.phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }

    if (!formData.password.trim()) {
      toast.error("Please enter a password");
      return;
    }

    // Execute mutation (axios call)
    registerMutation.mutate(formData);
  };

  /**
   * Handle input changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen relative bg-slate-950 text-white font-sans antialiased flex items-center justify-center px-6 py-20 overflow-hidden">
      {/* {JSON.stringify(languagesResponse, null, 2)} */}
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

      {/* Background elements */}
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

      {/* Main form container */}
      <div className="relative z-10 w-full max-w-3xl">
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8 md:p-10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 backdrop-blur-sm rounded-full border border-emerald-500/20 mb-6">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-glow"></div>
              <span className="text-sm font-medium text-emerald-400">
                Get Started
              </span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              Create Account
            </h1>
            <p className="text-slate-400">Start your NAATI CCL journey today</p>
          </div>

          {/* Registration form */}
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Full Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  autoComplete="off"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="John Doe"
                  required
                  disabled={registerMutation.isPending}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="you@example.com"
                  required
                  autoComplete="off"
                  disabled={registerMutation.isPending}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  autoComplete="off"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="03001234567"
                  required
                  disabled={registerMutation.isPending}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="off"
                  className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="Create a strong password"
                  required
                  disabled={registerMutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400 transition-colors"
                  disabled={registerMutation.isPending}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Preferred Language */}
            <div>
              <label
                htmlFor="preferredLanguage"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Preferred Language *
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  id="preferredLanguage"
                  name="preferredLanguage"
                  value={formData.preferredLanguage}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none"
                  required
                  disabled={registerMutation.isPending}
                >
                  {languagesResponse &&
                    languagesResponse.data?.map((lang) => (
                      <option
                        className="bg-slate-900"
                        key={lang.langCode}
                        value={lang.langCode}
                      >
                        {lang.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* NAATI CCL Exam Date */}
            <div>
              <label
                htmlFor="naatiCclExamDate"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                NAATI CCL Exam Date (Optional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="date"
                  id="naatiCclExamDate"
                  name="naatiCclExamDate"
                  value={formData.naatiCclExamDate}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  disabled={registerMutation.isPending}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="group cursor-pointer md:col-span-2 w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registerMutation.isPending
                ? "Creating Account..."
                : "Create Account"}
              {!registerMutation.isPending && (
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center mt-8 text-slate-400">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
