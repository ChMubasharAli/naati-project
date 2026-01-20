// src/components/ForgotPassword.jsx
import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Mail, ArrowRight, ArrowLeft, ShieldCheck } from "lucide-react";
import { forgotPassword } from "../../api/auth";
import { showSuccessToast } from "../../lib/react-query";

// Import API function

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  /**
   * TanStack Query mutation for forgot password
   * Handles loading, error, and success states automatically
   */
  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: (data) => {
      // Show success notification
      showSuccessToast(data.message || "Reset code sent successfully!");

      // Store email for reset password
      localStorage.setItem("resetEmail", email);

      // Show success state
      setIsSubmitted(true);
    },
    // Error is automatically handled by global error handler
  });

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic email validation
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Execute mutation
    forgotPasswordMutation.mutate(email);
  };

  /**
   * Navigate to reset password page
   */
  const handleContinue = () => {
    navigate("/reset-password");
  };

  /**
   * Navigate back to login page
   */
  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white  antialiased flex items-center justify-center px-6 py-32 overflow-hidden">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-glow { animation: glow 3s ease-in-out infinite; }
        .animate-pulse-scale { animation: pulse 2s ease-in-out infinite; }
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

      {/* Main container */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8 md:p-10 shadow-2xl">
          {!isSubmitted ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                {/* <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 backdrop-blur-sm rounded-full border border-emerald-500/20 mb-6">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-glow"></div>
                  <span className="text-sm font-medium text-emerald-400">
                    Password Recovery
                  </span>
                </div> */}
                <h1 className="text-4xl font-bold text-white mb-3">
                  Forgot Password?
                </h1>
                <p className="text-slate-400">
                  Enter your email to receive a reset code
                </p>
              </div>

              {/* Form */}
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
                      name="email"
                      autoComplete="off"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="you@example.com"
                      required
                      disabled={forgotPasswordMutation.isPending}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={forgotPasswordMutation.isPending}
                  className="group w-full py-4 cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {forgotPasswordMutation.isPending
                    ? "Sending..."
                    : "Send Reset Code"}
                  {!forgotPasswordMutation.isPending && (
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  )}
                </button>
              </form>

              {/* Back to Login Link */}
              <div className="mt-8 text-center">
                <button
                  onClick={handleBackToLogin}
                  className="inline-flex cursor-pointer items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="text-sm font-medium">Back to Sign In</span>
                </button>
              </div>

              {/* Security Info */}
              <div className="mt-8 p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                <div className="flex gap-4">
                  <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-300 mb-1">
                      Secure Reset Process
                    </p>
                    <p className="text-sm text-slate-400">
                      We'll send a verification code to your email for secure
                      password reset.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-scale">
                  <Mail className="w-10 h-10 text-white" />
                </div>

                <h1 className="text-4xl font-bold text-white mb-3">
                  Check Your Email
                </h1>
                <p className="text-slate-400 mb-8">
                  We've sent a reset code to
                  <br />
                  <span className="text-emerald-400 font-medium">{email}</span>
                </p>

                {/* Continue Button */}
                <button
                  onClick={handleContinue}
                  className="w-full py-4 cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/50 flex items-center justify-center gap-2"
                >
                  Continue to Reset Password
                  <ArrowRight className="w-5 h-5" />
                </button>

                {/* Help Text */}
                <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-sm text-slate-400 mb-4">
                    Didn't receive the code?
                  </p>
                  <div className="space-y-2 text-sm text-slate-500">
                    <p>• Check your spam folder</p>
                    <p>• Verify the email address is correct</p>
                    <p>• Wait a few minutes and check again</p>
                    <p>• Click "Send Reset Code" again if needed</p>
                  </div>
                </div>

                {/* Resend Button */}
                <button
                  onClick={() => forgotPasswordMutation.mutate(email)}
                  disabled={forgotPasswordMutation.isPending}
                  className="mt-6 cursor-pointer text-emerald-400 hover:text-emerald-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {forgotPasswordMutation.isPending
                    ? "Resending..."
                    : "Resend Code"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
