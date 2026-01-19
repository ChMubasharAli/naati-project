// src/components/LanguagesManagement.jsx
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Globe, Search, X, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";

// Import API functions
import {
  fetchLanguages,
  createLanguage,
  updateLanguage,
  deleteLanguage,
} from "../../api/languages";
import { showSuccessToast, queryKeys } from "../../lib/react-query";

const LanguagesManagement = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    langCode: "",
  });

  /**
   * Fetch languages using React Query
   * Now properly handles API response structure
   */
  const {
    data: languagesResponse,
    isLoading: isFetchingLanguages,
    error: fetchError,
    refetch: refetchLanguages,
  } = useQuery({
    queryKey: queryKeys.languages.list(),
    queryFn: fetchLanguages,
    staleTime: 5 * 60 * 1000,
  });

  // Extract languages array from response
  // Response structure: { success: true, data: [...] }
  const languages = languagesResponse?.data || [];
  const languagesArray = Array.isArray(languages) ? languages : [];

  /**
   * Create language mutation
   */
  const createMutation = useMutation({
    mutationFn: createLanguage,
    onSuccess: (data) => {
      showSuccessToast(data.message || "Language created successfully!");
      setIsModalOpen(false);
      setFormData({ name: "", langCode: "" });
      queryClient.invalidateQueries({ queryKey: queryKeys.languages.list() });
    },
    onError: (error) => {
      // Show specific error from API
      toast.error(error.message);
    },
  });

  /**
   * Update language mutation
   */
  const updateMutation = useMutation({
    mutationFn: ({ id, languageData }) => updateLanguage(id, languageData),
    onSuccess: (data) => {
      showSuccessToast(data.message || "Language updated successfully!");
      setIsModalOpen(false);
      setFormData({ name: "", langCode: "" });
      setSelectedLanguage(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.languages.list() });
    },
    onError: (error) => {
      // Show specific error from API
      toast.error(error.message);
    },
  });

  /**
   * Delete language mutation
   */
  const deleteMutation = useMutation({
    mutationFn: deleteLanguage,
    onSuccess: (data) => {
      showSuccessToast(data.message || "Language deleted successfully!");
      queryClient.invalidateQueries({ queryKey: queryKeys.languages.list() });
    },
    onError: (error) => {
      // Show specific error from API
      toast.error(error.message);
    },
  });

  /**
   * Open modal for creating new language
   */
  const handleCreate = () => {
    setModalMode("create");
    setFormData({ name: "", langCode: "" });
    setSelectedLanguage(null);
    setIsModalOpen(true);
  };

  /**
   * Open modal for editing existing language
   */
  const handleEdit = (language) => {
    setModalMode("edit");
    setFormData({
      name: language.name || "",
      langCode: language.langCode || "",
    });
    setSelectedLanguage(language);
    setIsModalOpen(true);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Please enter language name");
      return;
    }

    if (!formData.langCode.trim()) {
      toast.error("Please enter language code");
      return;
    }

    // Clean data
    const cleanData = {
      name: formData.name.trim(),
      langCode: formData.langCode.trim().toLowerCase(),
    };

    if (modalMode === "create") {
      createMutation.mutate(cleanData);
    } else {
      updateMutation.mutate({
        id: selectedLanguage.id,
        languageData: cleanData,
      });
    }
  };

  /**
   * Handle language deletion
   */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this language?")) {
      return;
    }

    deleteMutation.mutate(id);
  };

  /**
   * Filter languages based on search term
   */
  const filteredLanguages = languagesArray.filter((lang) => {
    const name = lang.name?.toLowerCase() || "";
    const code = lang.langCode?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();

    return name.includes(search) || code.includes(search);
  });

  /**
   * Combined loading state for mutations
   */
  const isMutationLoading =
    createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-7 h-7 text-emerald-600" />
            Languages Management
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage available languages for the platform
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={createMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          Add Language
        </button>
      </div>

      {/* Error Display for Fetch */}
      {fetchError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">
            {fetchError.message || "Failed to load languages"}
          </p>
          <button
            onClick={() => refetchLanguages()}
            className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            disabled={isFetchingLanguages}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Language Code
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isFetchingLanguages ? (
              <tr>
                <td
                  colSpan="3"
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex justify-center">
                      <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                    </div>
                    <p>Loading languages...</p>
                  </div>
                </td>
              </tr>
            ) : filteredLanguages.length === 0 ? (
              <tr>
                <td
                  colSpan="3"
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {searchTerm
                    ? "No languages found matching your search"
                    : "No languages found"}
                </td>
              </tr>
            ) : (
              filteredLanguages.map((language) => (
                <tr
                  key={language.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Globe className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {language.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                      {language.langCode}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(language)}
                        disabled={deleteMutation.isPending}
                        className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(language.id)}
                        disabled={deleteMutation.isPending}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Total Count */}
      <div className="mt-4 text-sm text-gray-600">
        Showing:{" "}
        <span className="font-semibold text-gray-900">
          {filteredLanguages.length}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-gray-900">
          {languagesArray.length}
        </span>{" "}
        languages
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {modalMode === "create" ? "Add New Language" : "Edit Language"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isMutationLoading}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Language Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., English"
                  required
                  disabled={isMutationLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="langCode"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Language Code *
                </label>
                <input
                  type="text"
                  id="langCode"
                  value={formData.langCode}
                  onChange={(e) =>
                    setFormData({ ...formData, langCode: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., en"
                  required
                  maxLength="10"
                  disabled={isMutationLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  ISO 639-1 code (2 letters)
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isMutationLoading}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMutationLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isMutationLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {modalMode === "create" ? "Creating..." : "Updating..."}
                    </>
                  ) : modalMode === "create" ? (
                    "Create Language"
                  ) : (
                    "Update Language"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguagesManagement;
