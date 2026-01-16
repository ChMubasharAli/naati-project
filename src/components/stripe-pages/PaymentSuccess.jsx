import React, { useEffect, useState } from "react";
import { CheckCircle, ArrowRight, FileText } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../api/axios";

const PaymentSuccess = () => {
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState("verifying");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get session_id from URL
        const sessionId = searchParams.get("session_id");

        if (!sessionId) {
          toast.error("Session ID not found");
          setVerificationStatus("failed");
          setLoading(false);
          return;
        }

        console.log("Verifying session:", sessionId);

        // Make API call to verify payment
        const response = await apiClient.post(
          "/api/v1/stripe/checkout/verify",
          {
            session_id: sessionId,
          }
        );

        console.log("Verification response:", response.data);

        // Check if payment was successful
        if (response.data && response.data.paid === true) {
          setVerificationStatus("success");
          toast.success("Payment verified successfully!");
        } else {
          throw new Error("Payment not verified");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setVerificationStatus("failed");
        toast.error(
          error.response?.data?.message ||
            "Payment verification failed. Please contact support."
        );
      } finally {
        setLoading(false);
      }
    };

    // Only verify once
    verifyPayment();
  }, [searchParams]);

  const handleGoToDashboard = () => {
    navigate("/user");
  };

  const handleViewDetails = () => {
    navigate("/user/subscription");
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans antialiased flex items-center justify-center px-6 py-20">
        <div
          className="fixed inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        ></div>

        <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px]"></div>
        <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-[120px]"></div>

        <div className="relative z-10 w-full max-w-lg">
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8 md:p-12 shadow-2xl text-center">
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="w-28 h-28 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/50">
                  <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Verifying Payment...
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed">
                Please wait while we verify your payment details.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (verificationStatus === "failed") {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans antialiased flex items-center justify-center px-6 py-20">
        <div
          className="fixed inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(239, 68, 68, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(239, 68, 68, 0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        ></div>

        <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-[120px]"></div>
        <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/20 rounded-full blur-[120px]"></div>

        <div className="relative z-10 w-full max-w-lg">
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8 md:p-12 shadow-2xl text-center">
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="w-28 h-28 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/50">
                  <div className="text-4xl font-bold">!</div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Verification Failed
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed">
                We couldn't verify your payment. Please contact support.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => navigate("/")}
                className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold rounded-xl hover:scale-[1.02] transition-all"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show success state
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans antialiased flex items-center justify-center px-6 py-20">
      <div
        className="fixed inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      ></div>

      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px]"></div>
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-[120px]"></div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8 md:p-12 shadow-2xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-28 h-28 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/50">
                <CheckCircle
                  className="w-16 h-16 text-white"
                  strokeWidth={2.5}
                />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Payment Successful!
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              Your subscription is now active. You have full access to all
              premium features.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGoToDashboard}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-8">
            A confirmation email has been sent to your registered email address.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
