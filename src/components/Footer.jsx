import React from "react";
import {
  Brain,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative bg-slate-900 border-t border-white/5 py-16 px-4 sm:px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-12">
          {/* Logo Section */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/50">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  PREP SMART CCL
                </h3>
                <p className="text-sm text-slate-400">
                  AI-Powered NAATI Preparation
                </p>
              </div>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-md">
              Transform your NAATI CCL preparation with cutting-edge AI
              technology and expert guidance.
            </p>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Services</h3>
            <ul className="space-y-3">
              <li className="text-slate-400 hover:text-emerald-400 cursor-pointer transition-colors text-sm md:text-base">
                AI Scoring
              </li>
              <li className="text-slate-400 hover:text-emerald-400 cursor-pointer transition-colors text-sm md:text-base">
                Real-time Feedback
              </li>
              <li className="text-slate-400 hover:text-emerald-400 cursor-pointer transition-colors text-sm md:text-base">
                Progress Tracking
              </li>
              <li className="text-slate-400 hover:text-emerald-400 cursor-pointer transition-colors text-sm md:text-base">
                Mock Exams
              </li>
              <li className="text-slate-400 hover:text-emerald-400 cursor-pointer transition-colors text-sm md:text-base">
                Expert Coaching
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-400 hover:text-emerald-400 cursor-pointer transition-colors">
                <Mail className="w-5 h-5" />
                <span className="text-sm md:text-base">info@prepsmart.au</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400 hover:text-emerald-400 cursor-pointer transition-colors">
                <Phone className="w-5 h-5" />
                <span className="text-sm md:text-base">+61 xxx xxx xxx</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <MapPin className="w-5 h-5" />
                <span className="text-sm md:text-base">Australia</span>
              </div>
            </div>
          </div>
        </div>

        {/* Social & Bottom */}
        <div className="pt-8 border-t border-white/5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm text-slate-500 text-center md:text-left">
              © 2025 PREP SMART CCL. All rights reserved.
            </p>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-white/5 hover:bg-emerald-500 rounded-full flex items-center justify-center cursor-pointer transition-all">
                <Facebook className="w-5 h-5 text-slate-400" />
              </div>
              <div className="w-10 h-10 bg-white/5 hover:bg-emerald-500 rounded-full flex items-center justify-center cursor-pointer transition-all">
                <Twitter className="w-5 h-5 text-slate-400" />
              </div>
              <div className="w-10 h-10 bg-white/5 hover:bg-emerald-500 rounded-full flex items-center justify-center cursor-pointer transition-all">
                <Instagram className="w-5 h-5 text-slate-400" />
              </div>
              <div className="w-10 h-10 bg-white/5 hover:bg-emerald-500 rounded-full flex items-center justify-center cursor-pointer transition-all">
                <Linkedin className="w-5 h-5 text-slate-400" />
              </div>
            </div>

            <div className="flex gap-4 md:gap-6 text-sm flex-wrap justify-center">
              <a
                href="#"
                className="text-slate-400 hover:text-emerald-400 transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-emerald-400 transition-colors"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-emerald-400 transition-colors"
              >
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
