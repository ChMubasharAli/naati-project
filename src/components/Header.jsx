import { Brain, Menu } from "lucide-react";

export default function Header({ setIsOpen }) {
  return (
    <>
      <header className="backdrop-blur-xl bg-slate-900/95 lg:hidden sticky top-0 left-0  px-4 md:px-8 flex items-center justify-between h-16 md:h-20 shadow-2xl border border-white/10 z-40">
        <div className="flex items-center justify-between w-full space-x-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="text-white text-xl font-bold">PREP SMART CCL</div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="text-slate-400 cursor-pointer   hover:text-emerald-400 transition-all duration-200 p-2 rounded-xl hover:bg-white/5 border border-white/10"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>
    </>
  );
}
