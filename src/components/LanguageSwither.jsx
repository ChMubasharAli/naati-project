// src/components/LanguageSwitcher.jsx

import { Select } from "@mantine/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/react-query";
import { fetchLanguages } from "../api/languages";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { Globe } from "lucide-react";
import { toast } from "react-toastify";
// Adjust path as needed

const LanguageSwitcher = () => {
  const queryClient = useQueryClient();
  const { updateUserLanguage, userLanguage } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  const { data: languagesResponse, isLoading } = useQuery({
    queryKey: queryKeys.languages.list(),
    queryFn: fetchLanguages,
    staleTime: 5 * 60 * 1000,
  });

  // Use useMemo to memoize languageOptions
  const languageOptions = useMemo(() => {
    return (
      languagesResponse?.data?.map((language) => ({
        value: language.id.toString(), // Convert id to string for Select component
        label: language.name,
        description: `${language.name} (${language.langCode})`,
        data: language, // Store full object for later use
      })) || []
    );
  }, [languagesResponse?.data]); // Only recompute when languagesResponse.data changes

  // Find default language based on userLanguage object
  useEffect(() => {
    if (userLanguage && userLanguage.id && languageOptions.length > 0) {
      // Find the language that matches userLanguage.id
      const foundLanguage = languageOptions.find(
        (option) => parseInt(option.value) === userLanguage.id,
      );

      if (foundLanguage) {
        setSelectedLanguage(foundLanguage.value);
      }
    }
  }, [userLanguage, languageOptions]); // Now languageOptions is memoized

  // Handle language change
  const handleLanguageChange = (selectedId) => {
    if (!selectedId) return;

    // Find the full language object from languageOptions
    const selectedLangObj = languageOptions.find(
      (option) => option.value === selectedId,
    );

    if (selectedLangObj && selectedLangObj.data) {
      // Update local state
      setSelectedLanguage(selectedId);

      // Call updateUserLanguage with the full language object
      const updateSuccess = updateUserLanguage(selectedLangObj.data);

      if (updateSuccess) {
        console.log("Language updated successfully:", selectedLangObj.data);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        toast.success("Language updated successfully! Reloading...");
      } else {
        console.error("Failed to update language");
        // Optional: Show error notification
      }
    }
  };

  return (
    <>
      <p className="text-emerald-400 text-sm mb-1">Switch Language</p>
      <Select
        placeholder="Select Language"
        searchable
        nothingFoundMessage="No language found"
        data={languageOptions}
        value={selectedLanguage}
        onChange={handleLanguageChange}
        leftSection={<Globe size={16} className="text-emerald-500" />}
        size="sm"
        radius="md"
        w={200}
        maxDropdownHeight={280}
        allowDeselect={false}
        disabled={isLoading}
      />
    </>
  );
};

export default LanguageSwitcher;
