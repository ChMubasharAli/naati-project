import React from "react";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import Navbar from "../Navbar";
import Footer from "../Footer";

const Contact = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans antialiased">
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

      {/* <Navbar /> */}
      {/* Background Grid Pattern */}
      <div
        className="fixed inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      ></div>

      {/* Animated Gradient Orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] animate-float"></div>
      <div
        className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-[120px] animate-float"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="relative z-10 py-20 px-6">
        <div className="container mx-auto ">
          {/* Header */}
          <div className="text-center mb-20 pt-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 backdrop-blur-sm rounded-full border border-emerald-500/20 mb-6">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-glow"></div>
              <span className="text-sm font-medium text-emerald-400">
                Contact Us
              </span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6">
              Get in{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                Touch
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Have questions about NAATI CCL preparation? Our expert team is
              here to help you succeed. Reach out for personalized guidance and
              support.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8 md:p-10">
              <h2 className="text-2xl font-bold text-white mb-8">
                Send us a Message
              </h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your first name"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your last name"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="What can we help you with?"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Message
                  </label>
                  <textarea
                    placeholder="Tell us more about your questions or needs..."
                    rows={5}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="group w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/50 flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              {/* Contact Info Card */}
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8">
                <h3 className="text-xl font-bold text-white mb-6">
                  Contact Information
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white mb-1">
                        Office Address
                      </p>
                      <p className="text-slate-400 leading-relaxed">
                        Level 5, 123 Collins Street
                        <br />
                        Melbourne VIC 3000, Australia
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-teal-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white mb-1">
                        Phone Number
                      </p>
                      <p className="text-slate-400">+61 3 9000 0000</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white mb-1">
                        Email Address
                      </p>
                      <p className="text-slate-400">support@prepsmart.au</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-teal-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white mb-1">
                        Business Hours
                      </p>
                      <p className="text-slate-400 leading-relaxed">
                        Monday - Friday: 9:00 AM - 6:00 PM
                        <br />
                        Saturday: 10:00 AM - 4:00 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ Card */}
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8">
                <h3 className="text-xl font-bold text-white mb-6">
                  Frequently Asked
                </h3>
                <div className="space-y-6">
                  <div className="pb-6 border-b border-white/10 last:border-0 last:pb-0">
                    <p className="font-semibold text-white mb-2">
                      How long does it take to prepare for NAATI CCL?
                    </p>
                    <p className="text-slate-400 leading-relaxed">
                      Most students prepare for 2-3 months with our structured
                      courses.
                    </p>
                  </div>
                  <div className="pb-6 border-b border-white/10 last:border-0 last:pb-0">
                    <p className="font-semibold text-white mb-2">
                      Do you offer refunds?
                    </p>
                    <p className="text-slate-400 leading-relaxed">
                      Yes, we offer a 30-day money-back guarantee on all
                      courses.
                    </p>
                  </div>
                  <div className="pb-6 border-b border-white/10 last:border-0 last:pb-0">
                    <p className="font-semibold text-white mb-2">
                      Can I get one-on-one coaching?
                    </p>
                    <p className="text-slate-400 leading-relaxed">
                      Yes, personalized coaching is available with our premium
                      packages.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <Footer /> */}
    </div>
  );
};

export default Contact;
