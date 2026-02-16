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
    <div ref={dropdownRef} className="w-full relative">
      {/* Label - Settings.jsx ke style se match */}
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Switch Language
      </p>

      {/* Trigger Button - Settings.jsx card styling se match */}
      <button
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`
          w-full flex items-center justify-between px-4 py-3 
          rounded-xl transition-all duration-200 group
          border border-gray-200
          ${
            isOpen
              ? "bg-gray-50 border-emerald-500/30 shadow-md"
              : "bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
          }
          ${isLoading ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
        `}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Globe Icon - Settings.jsx ke icon style se match */}
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
            {isLoading ? (
              <Loader2 size={18} className="text-white animate-spin" />
            ) : (
              <Globe size={18} className="text-white" />
            )}
          </div>

          {/* Selected Text */}
          <span
            className={`
            font-medium truncate text-base
            ${isOpen ? "text-gray-900 font-semibold" : "text-gray-900"}
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
          size={20}
          className={`
            shrink-0 ml-2 transition-transform duration-200 text-gray-500
            ${isOpen ? "rotate-180 text-emerald-600" : "group-hover:text-emerald-600"}
          `}
        />
      </button>

      {/* Dropdown Menu - Settings.jsx ke card styling se match */}
      {isOpen && (
        <div
          className="
          absolute top-full left-0 right-0 mt-2 z-50
          bg-white border border-gray-200 rounded-2xl
          shadow-lg
          overflow-hidden
        "
        >
          {/* Search Input - Dropdown ke andar */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <Globe
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search language..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  w-full pl-10 pr-4 py-2.5 rounded-xl
                  bg-white border border-gray-200
                  text-gray-900 text-sm placeholder-gray-400
                  focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
                  transition-all duration-200
                "
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-[240px] overflow-y-auto py-2">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-4 text-gray-500 text-sm text-center">
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
                      w-full flex items-center justify-between px-4 py-3
                      transition-all duration-200
                      ${
                        isSelected
                          ? "bg-emerald-50 text-emerald-900 border-l-4 border-emerald-500"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }
                    `}
                  >
                    <div className="flex flex-col items-start gap-0.5">
                      <span
                        className={`
                        text-sm font-medium
                        ${isSelected ? "font-semibold text-emerald-900" : ""}
                      `}
                      >
                        {option.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {option.code}
                      </span>
                    </div>

                    {/* Checkmark for selected */}
                    {isSelected && (
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Check size={14} className="text-emerald-600" />
                      </div>
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
