import React, { useEffect, useState } from "react";
import { XCircle, RefreshCw } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

const PaymentFailure = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Get error message from URL parameters if available
    const errorMsg =
      searchParams.get("error") ||
      searchParams.get("message") ||
      "We couldn't process your payment at this time.";
    setErrorMessage(errorMsg);

    // Show error toast notification
    toast.error("Payment failed. Please try again.");
  }, [searchParams]);

  const handleTryAgain = () => {
    // Navigate back to subscriptions page
    navigate("/user/subscriptions", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans antialiased flex items-center justify-center px-6 py-20">
      {/* Background Grid Pattern */}
      <div
        className="fixed inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(239, 68, 68, 0.1) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(239, 68, 68, 0.1) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      ></div>

      {/* Animated Gradient Orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-[120px]"></div>
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-[120px]"></div>

      {/* Failure Card */}
      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8 md:p-12 shadow-2xl text-center">
          {/* Error Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-28 h-28 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/50">
                <XCircle className="w-16 h-16 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Payment Failed
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              {errorMessage}
            </p>
          </div>

          {/* Error Info */}
          <div className="mb-8 p-5 bg-red-500/10 rounded-2xl border border-red-500/20">
            <div className="flex items-start gap-3 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-left">
                <p className="text-red-300 font-semibold mb-1">
                  Common reasons:
                </p>
                <ul className="text-slate-400 space-y-1">
                  <li>• Insufficient funds or credit limit exceeded</li>
                  <li>• Incorrect card details or expired card</li>
                  <li>• Bank security restrictions</li>
                  <li>• Technical error during payment processing</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleTryAgain}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again with Different Plan
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-sm text-slate-400">
              <span className="font-semibold text-white">Need help?</span> Our
              support team is available 24/7 to assist you with payment issues.
              Email: support@prepsmartccl.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;
