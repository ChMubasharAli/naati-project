import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Brain, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="text-white text-xl font-bold">PREP SMART CCL</div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            <Link
              to="/"
              className="text-slate-300 hover:text-emerald-400 transition-colors font-medium text-sm lg:text-base px-2 py-1"
            >
              Home
            </Link>
            {/* <Link
              to="/practice"
              className="text-slate-300 hover:text-emerald-400 transition-colors font-medium text-sm lg:text-base px-2 py-1"
            >
              Practice
            </Link>
            <Link
              to="/mock-test"
              className="text-slate-300 hover:text-emerald-400 transition-colors font-medium text-sm lg:text-base px-2 py-1"
            >
              Mock Test
            </Link> */}
            <Link
              to="/subscriptions"
              className="text-slate-300 hover:text-emerald-400 transition-colors font-medium text-sm lg:text-base px-2 py-1"
            >
              Subscriptions
            </Link>
            <Link
              to="/contact-us"
              className="text-slate-300 hover:text-emerald-400 transition-colors font-medium text-sm lg:text-base px-2 py-1"
            >
              Contact Us
            </Link>
          </nav>

          {/* Desktop Login Button - Hidden on mobile */}
          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-2.5 cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-emerald-500/50 text-base"
            >
              Login
            </button>
          </div>

          {/* Mobile Menu Button - Visible only on mobile */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden cursor-pointer text-slate-300 hover:text-emerald-400 transition-colors p-2"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-20 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-b border-white/10">
            <nav className="flex flex-col p-4">
              {/* Navigation Links */}
              <div className="space-y-1 mb-6">
                <Link
                  to="/"
                  className="block text-slate-300 hover:text-emerald-400 transition-colors font-medium py-3 px-4 hover:bg-white/5 rounded-lg text-base"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/subscriptions"
                  className="block text-slate-300 hover:text-emerald-400 transition-colors font-medium py-3 px-4 hover:bg-white/5 rounded-lg text-base"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Subscriptions
                </Link>
                <Link
                  to="/contact-us"
                  className="block text-slate-300 hover:text-emerald-400 transition-colors font-medium py-3 px-4 hover:bg-white/5 rounded-lg text-base"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Contact Us
                </Link>
              </div>

              {/* Mobile Login Button */}
              <button
                onClick={() => {
                  navigate("/login");
                  setIsMobileMenuOpen(false);
                }}
                className="w-full px-6 cursor-pointer py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-emerald-500/50 text-base"
              >
                Login
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
