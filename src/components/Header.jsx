import { Menu } from "lucide-react";

export default function Header({ setIsOpen, activeItem }) {
  return (
    <>
      <header className="backdrop-blur-xl bg-slate-900/95 sticky top-0 left-0 rounded-2xl px-4 md:px-8 flex items-center justify-between h-16 md:h-20 shadow-2xl border border-white/10 z-40">
        <div className="flex items-center justify-between w-full space-x-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight truncate">
              {activeItem || "Dashboard"}
            </h1>
            <p className="text-slate-400 text-sm font-medium mt-1 truncate hidden sm:block">
              Welcome back, Manage your {activeItem || "Dashboard"} effectively.
            </p>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="text-slate-400 lg:hidden block hover:text-emerald-400 transition-all duration-200 p-2 rounded-xl hover:bg-white/5 border border-white/10"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>
    </>
  );
}
