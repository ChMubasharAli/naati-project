// src/components/VerifyOTP.jsx
import React, { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// Import API functions

import { toast } from "react-toastify";
import { resendOTP, verifyOTP } from "../../api/auth";
import { showSuccessToast } from "../../lib/react-query";

const VerifyOTP = () => {
  // get login function form the auth provider
  const { login } = useAuth();

  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [email, setEmail] = useState("");

  // Refs for OTP inputs
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  /**
   * Check if email exists in localStorage on component mount
   */
  useEffect(() => {
    const storedEmail = localStorage.getItem("verifyEmail");
    if (!storedEmail) {
      // Redirect to signup if no email found
      navigate("/signup");
    } else {
      setEmail(storedEmail);
    }
  }, [navigate]);

  /**
   * TanStack Query mutation for OTP verification
   */
  const verifyOTPMutation = useMutation({
    mutationFn: verifyOTP,
    onSuccess: (data) => {
      // Show success message
      showSuccessToast(data.message || "OTP verified successfully!");
      login(data.data.user, data.data.token);
      localStorage.removeItem("verifyEmail");
      // Redirect to login page
      navigate("/user");
    },
  });

  /**
   * TanStack Query mutation for resending OTP
   */
  const resendOTPMutation = useMutation({
    mutationFn: resendOTP,
    onSuccess: (data) => {
      // Show success message
      showSuccessToast(data.message || "OTP resent successfully!");

      // Clear OTP fields and focus on first input
      setOtp(["", "", "", ""]);
      if (inputRefs[0].current) {
        inputRefs[0].current.focus();
      }
    },
  });

  /**
   * Handle OTP input change
   */
  const handleChange = (index, value) => {
    // Only allow single digit
    if (value.length > 1) return;

    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    // Update OTP state
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input if value entered
    if (value && index < 3 && inputRefs[index + 1].current) {
      inputRefs[index + 1].current.focus();
    }
  };

  /**
   * Handle backspace key
   */
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      if (inputRefs[index - 1].current) {
        inputRefs[index - 1].current.focus();
      }
    }
  };

  /**
   * Handle paste event for OTP
   */
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 4);

    // Only allow numbers
    if (!/^\d+$/.test(pastedData)) return;

    // Set OTP from pasted data
    const newOtp = pastedData.split("");
    setOtp([...newOtp, ...Array(4 - newOtp.length).fill("")]);

    // Focus on appropriate input
    const nextIndex = Math.min(pastedData.length, 3);
    if (inputRefs[nextIndex].current) {
      inputRefs[nextIndex].current.focus();
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");

    // Validate OTP length
    if (otpCode.length !== 4) {
      toast.error("Please enter all 4 digits", {
        position: "top-right",
      });
      return;
    }

    // Execute verification mutation
    verifyOTPMutation.mutate({ email, otp: otpCode });
  };

  /**
   * Handle resend OTP
   */
  const handleResend = () => {
    // Execute resend mutation
    resendOTPMutation.mutate({ email });
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

      {/* Main container */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8 md:p-10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">Verify OTP</h1>
            <p className="text-slate-400">
              We've sent a 4-digit code to
              <br />
              <span className="text-emerald-400 font-medium">{email}</span>
            </p>
          </div>

          {/* OTP Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* OTP Inputs */}
            <div className="flex gap-4 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-16 h-16 text-center text-2xl font-bold bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  required
                  disabled={
                    verifyOTPMutation.isPending || resendOTPMutation.isPending
                  }
                />
              ))}
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={
                verifyOTPMutation.isPending || resendOTPMutation.isPending
              }
              className="group w-full py-4 cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifyOTPMutation.isPending ? "Verifying..." : "Verify OTP"}
              {!verifyOTPMutation.isPending && (
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </form>

          {/* Resend OTP Section */}
          <div className="mt-8 text-center">
            <p className="text-slate-400 text-sm mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResend}
              disabled={
                verifyOTPMutation.isPending || resendOTPMutation.isPending
              }
              className="text-emerald-400 cursor-pointer hover:text-emerald-300 font-semibold transition-colors disabled:opacity-50"
            >
              Resend OTP
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
            <p className="text-sm text-slate-400 text-center">
              Check your email inbox and spam folder for the verification code.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
