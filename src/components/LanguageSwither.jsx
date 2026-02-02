// src/components/LanguageSwitcher.jsx

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/react-query";
import { fetchLanguages } from "../api/languages";
import { useEffect, useState, useMemo, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { Globe, Check, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

const LanguageSwitcher = () => {
  const queryClient = useQueryClient();
  const { updateUserLanguage, userLanguage } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);

  const { data: languagesResponse, isLoading } = useQuery({
    queryKey: queryKeys.languages.list(),
    queryFn: fetchLanguages,
    staleTime: 5 * 60 * 1000,
  });

  // Memoize language options
  const languageOptions = useMemo(() => {
    return (
      languagesResponse?.data?.map((language) => ({
        value: language.id.toString(),
        label: language.name,
        code: language.langCode,
        data: language,
      })) || []
    );
  }, [languagesResponse?.data]);

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return languageOptions;
    return languageOptions.filter(
      (option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.code.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [languageOptions, searchQuery]);

  // Find default language
  useEffect(() => {
    if (userLanguage && userLanguage.id && languageOptions.length > 0) {
      const foundLanguage = languageOptions.find(
        (option) => parseInt(option.value) === userLanguage.id,
      );
      if (foundLanguage) {
        setSelectedLanguage(foundLanguage.value);
      }
    }
  }, [userLanguage, languageOptions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (selectedId) => {
    if (!selectedId) return;

    const selectedLangObj = languageOptions.find(
      (option) => option.value === selectedId,
    );

    if (selectedLangObj && selectedLangObj.data) {
      setSelectedLanguage(selectedId);
      setIsOpen(false);
      setSearchQuery("");

      const updateSuccess = updateUserLanguage(selectedLangObj.data);

      if (updateSuccess) {
        console.log("Language updated successfully:", selectedLangObj.data);
        toast.success("Language updated successfully! Reloading...");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        console.error("Failed to update language");
        toast.error("Failed to update language");
      }
    }
  };

  const selectedOption = languageOptions.find(
    (option) => option.value === selectedLanguage,
  );

  return (
    <div ref={dropdownRef} className="!w-full !relative">
      {/* Label - Sidebar ke emerald theme se match */}
      <p className="!text-emerald-400 !w-full !text-left !text-xs !font-medium !mb-2 !uppercase !tracking-wider">
        Switch Language
      </p>

      {/* Trigger Button - Exact sidebar nav item styling */}
      <button
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`
          !w-full !flex !items-center !justify-between !px-4 !py-3 
          !rounded-xl !transition-all !duration-200 !group
          !border !border-white/10
          ${
            isOpen
              ? "!bg-linear-to-r !from-emerald-500/20 !to-teal-500/20 !text-white !border-emerald-500/30 !shadow-lg !shadow-emerald-500/10"
              : "!bg-white/5 !text-slate-400 hover:!bg-white/10 hover:!text-white"
          }
          ${isLoading ? "!cursor-not-allowed !opacity-60" : "!cursor-pointer"}
        `}
      >
        <div className="!flex !items-center !gap-3 !overflow-hidden">
          {/* Globe Icon - Sidebar icons se match */}
          <div className="!shrink-0">
            {isLoading ? (
              <Loader2 size={18} className="!text-emerald-400 !animate-spin" />
            ) : (
              <Globe
                size={18}
                className={`
                  !transition-colors !duration-200
                  ${isOpen ? "!text-emerald-400" : "!text-slate-500 group-hover:!text-emerald-400"}
                `}
              />
            )}
          </div>

          {/* Selected Text */}
          <span
            className={`
            !font-medium !truncate !text-sm
            ${isOpen ? "!text-white !font-semibold" : "!text-slate-300 group-hover:!text-white"}
          `}
          >
            {isLoading
              ? "Loading..."
              : selectedOption
                ? `${selectedOption.label} (${selectedOption.code})`
                : "Select Language"}
          </span>
        </div>

        {/* Dropdown Arrow */}
        <ChevronDown
          size={16}
          className={`
            !shrink-0 !ml-2 !transition-transform !duration-200
            ${isOpen ? "!text-emerald-400 !rotate-180" : "!text-slate-500 group-hover:!text-emerald-400"}
          `}
        />
      </button>

      {/* Dropdown Menu - Sidebar ke modal/dropdown styling se match */}
      {isOpen && (
        <div
          className="
          !absolute !top-full !left-0 !right-0 !mt-2 !z-50
          !bg-slate-900 !border !border-white/10 !rounded-xl
          !shadow-2xl !shadow-black/50
          !overflow-hidden
        "
        >
          {/* Search Input - Dropdown ke andar */}
          <div className="!p-3 !border-b !border-white/10">
            <div className="!relative">
              <Globe
                size={14}
                className="!absolute !left-3 !top-1/2 !-translate-y-1/2 !text-slate-500"
              />
              <input
                type="text"
                placeholder="Search language..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  !w-full !pl-9 !pr-3 !py-2 !rounded-lg
                  !bg-slate-800 !border !border-white/10
                  !text-white !text-sm !placeholder-slate-500
                  focus:!outline-none focus:!border-emerald-500/50 focus:!ring-1 focus:!ring-emerald-500/20
                  !transition-all !duration-200
                "
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="!max-h-[240px] !overflow-y-auto !py-1">
            {filteredOptions.length === 0 ? (
              <div className="!px-4 !py-3 !text-slate-500 !text-sm !text-center">
                No language found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === selectedLanguage;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleLanguageChange(option.value)}
                    className={`
                      !w-full !flex !items-center cursor-pointer! !justify-between !px-4 !py-3
                      !transition-all !duration-200
                      ${
                        isSelected
                          ? "!bg-linear-to-r !from-emerald-500/20 !to-teal-500/20 !text-white"
                          : "!text-slate-400 hover:!bg-white/5 hover:!text-white"
                      }
                    `}
                  >
                    <div className="!flex !flex-col !items-start !gap-0.5">
                      <span
                        className={`
                        !text-sm !font-medium
                        ${isSelected ? "!text-white !font-semibold" : ""}
                      `}
                      >
                        {option.label}
                      </span>
                    </div>

                    {/* Checkmark for selected */}
                    {isSelected && (
                      <Check
                        size={16}
                        className="!text-emerald-400 !shrink-0"
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
