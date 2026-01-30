import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
  GraduationCap,
  Search,
  AlertCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

// Mantine Components
import { Select, Loader } from "@mantine/core";

// Import your existing APIs
import { fetchLanguages } from "../../api/languages";
import { fetchDialogues } from "../../api/dialogues";
import {
  fetchMockTests,
  createMockTest,
  deleteMockTest,
  updateMockTest,
} from "../../api/mockTest";

// Import queryKeys from your existing setup
import { queryKeys, showSuccessToast } from "../../lib/react-query";

const MockTestManagement = () => {
  const { user: loggedInUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedMockTest, setSelectedMockTest] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    language_id: "",
    dialogue_id: "",
    dialogue_id_2: "",
    durationSeconds: "",
    totalMarks: "",
    passMarks: "",
  });

  // Fetch languages using React Query
  const { data: languagesData = {}, isLoading: isLanguagesLoading } = useQuery({
    queryKey: queryKeys.languages.list(),
    queryFn: fetchLanguages,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch ALL dialogues once
  const { data: dialoguesData = {}, isLoading: isDialoguesLoading } = useQuery({
    queryKey: queryKeys.dialogues.list(),
    queryFn: () => fetchDialogues(loggedInUser.id),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch mock tests
  const {
    data: mockTestsData = [],
    isLoading: isMockTestsLoading,
    error: mockTestsError,
  } = useQuery({
    queryKey: queryKeys.mockTests.list(),
    queryFn: () => fetchMockTests(loggedInUser?.id),
    enabled: !!loggedInUser?.id,
  });

  // Extract data from responses
  const languages = languagesData.data || [];
  const allDialogues =
    dialoguesData.data?.dialogues || dialoguesData.data || [];
  const mockTests = mockTestsData.data || mockTestsData || [];

  // Get filtered dialogues based on selected language
  const getFilteredDialogues = () => {
    if (!formData.language_id) return [];
    const selectedLangId = parseInt(formData.language_id);
    return allDialogues.filter(
      (d) =>
        d.Language?.id === selectedLangId || d.language_id === selectedLangId,
    );
  };

  const filteredDialogues = getFilteredDialogues();
  const hasDialoguesForSelectedLanguage = filteredDialogues.length > 0;
  const isDialoguesDisabled =
    !formData.language_id || !hasDialoguesForSelectedLanguage;

  // Create/Update mutation - FIXED: Now uses updateMockTest for edit mode
  const createUpdateMutation = useMutation({
    mutationFn: (mockTestData) => {
      if (modalMode === "edit") {
        return updateMockTest(mockTestData);
      } else {
        return createMockTest(mockTestData);
      }
    },
    onSuccess: (data) => {
      showSuccessToast(
        modalMode === "create"
          ? "Mock test created successfully!"
          : "Mock test updated successfully!",
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.mockTests.list() });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Operation failed");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteMockTest(id),
    onSuccess: () => {
      showSuccessToast("Mock test deleted successfully!");
      queryClient.invalidateQueries({ queryKey: queryKeys.mockTests.list() });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete mock test");
    },
  });

  // Handle language change
  const handleLanguageChange = (languageId) => {
    setFormData({
      ...formData,
      language_id: languageId || "",
      dialogue_id: "",
      dialogue_id_2: "",
    });
  };

  // Open create modal
  const handleCreate = () => {
    setModalMode("create");
    resetForm();
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleEdit = (mockTest) => {
    setModalMode("edit");
    setFormData({
      title: mockTest.title || "",
      language_id: mockTest.language_id?.toString() || "",
      dialogue_id:
        (mockTest.dialogueId || mockTest.dialogue_id)?.toString() || "",
      dialogue_id_2:
        (mockTest.dialogueId2 || mockTest.dialogue_id_2)?.toString() || "",
      durationSeconds: mockTest.durationSeconds?.toString() || "",
      totalMarks: mockTest.totalMarks?.toString() || "",
      passMarks: mockTest.passMarks?.toString() || "",
    });
    setSelectedMockTest(mockTest);
    setIsModalOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      language_id: "",
      dialogue_id: "",
      dialogue_id_2: "",
      durationSeconds: "",
      totalMarks: "",
      passMarks: "",
    });
    setSelectedMockTest(null);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.language_id) {
      toast.error("Please select a language");
      return;
    }

    // Check if selected language has dialogues
    if (filteredDialogues.length === 0) {
      toast.error(
        "Selected language has no dialogues. Please select another language or add dialogues first.",
      );
      return;
    }

    if (!formData.dialogue_id) {
      toast.error("Please select Dialogue 1");
      return;
    }
    if (!formData.dialogue_id_2) {
      toast.error("Please select Dialogue 2");
      return;
    }
    if (formData.dialogue_id === formData.dialogue_id_2) {
      toast.error("Dialogue 1 and Dialogue 2 cannot be the same");
      return;
    }

    // Prepare payload
    const payload = {
      title: formData.title,
      language_id: parseInt(formData.language_id),
      dialogueId: parseInt(formData.dialogue_id),
      dialogueId2: parseInt(formData.dialogue_id_2),
    };

    // Add optional fields for edit
    if (modalMode === "edit") {
      if (formData.durationSeconds) {
        payload.durationSeconds = parseInt(formData.durationSeconds);
      }
      if (formData.totalMarks) {
        payload.totalMarks = parseInt(formData.totalMarks);
      }
      if (formData.passMarks) {
        payload.passMarks = parseInt(formData.passMarks);
      }

      payload.id = selectedMockTest.id;
    }

    createUpdateMutation.mutate(payload);
  };

  // Delete mock test
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this mock test?")) {
      return;
    }
    deleteMutation.mutate(id);
  };

  // Filter mock tests
  const filteredMockTests = mockTests.filter((test) =>
    test.title?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Get language name by ID
  const getLanguageName = (languageId) => {
    const lang = languages.find((l) => l.id === languageId);
    return lang ? lang.name : `Language #${languageId}`;
  };

  // Get dialogue title by ID
  const getDialogueTitle = (dialogueId) => {
    const dialogue = allDialogues.find((d) => d.id === dialogueId);
    return dialogue ? dialogue.title : `Dialogue #${dialogueId}`;
  };

  const isLoading =
    isMockTestsLoading ||
    createUpdateMutation.isPending ||
    deleteMutation.isPending;

  // Prepare data for Mantine Select
  const languageOptions = languages.map((lang) => ({
    value: lang.id.toString(),
    label: `${lang.name} (${lang.langCode})`,
  }));

  const dialogueOptions = filteredDialogues.map((dialogue) => ({
    value: dialogue.id.toString(),
    label: dialogue.title,
  }));

  return (
    <div className="p-6 bg-white max-h-[calc(100vh-64px)] lg:max-h-screen h-full flex flex-col overflow-hidden ">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-emerald-600" />
            Mock Test Management
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Create and manage NAATI CCL mock tests
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={isLoading}
          className="flex items-center cursor-pointer gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          Create Mock Test
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search mock tests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Show errors if any */}
      {mockTestsError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{mockTestsError.message}</span>
          </div>
        </div>
      )}

      {/* Mock Tests Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 flex-1">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 ">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Language
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Dialogue 1
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Dialogue 2
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Marks
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading && mockTests.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex justify-center">
                    <Loader size="sm" />
                    <span className="ml-2">Loading mock tests...</span>
                  </div>
                </td>
              </tr>
            ) : filteredMockTests.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {isDialoguesLoading ? (
                    <div className="flex justify-center">
                      <Loader size="sm" />
                      <span className="ml-2">Loading dialogues...</span>
                    </div>
                  ) : (
                    "No mock tests found"
                  )}
                </td>
              </tr>
            ) : (
              filteredMockTests.map((test) => (
                <tr
                  key={test.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">
                      {test.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                      {getLanguageName(test.language_id)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">
                      {getDialogueTitle(test.dialogueId || test.dialogue_id)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">
                      {getDialogueTitle(test.dialogueId2 || test.dialogue_id_2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      {test.durationSeconds
                        ? `${test.durationSeconds / 60} Minutes`
                        : "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      {test.totalMarks
                        ? `${test.passMarks}/${test.totalMarks}`
                        : "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(test)}
                        disabled={isLoading}
                        className="p-2 cursor-pointer text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(test.id)}
                        disabled={isLoading}
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
        Total Mock Tests:{" "}
        <span className="font-semibold text-gray-900">
          {filteredMockTests.length}
        </span>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">
                {modalMode === "create" ? "Create Mock Test" : "Edit Mock Test"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={createUpdateMutation.isPending}
                className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {createUpdateMutation.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{createUpdateMutation.error.message}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Mock Test Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., Mock Test 1"
                  required
                />
              </div>

              {/* STEP 1: Language Selection with Mantine Select */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Language * (Select first to enable dialogues)
                </label>
                <Select
                  placeholder="Search and select language..."
                  size="lg"
                  data={languageOptions}
                  value={formData.language_id}
                  onChange={handleLanguageChange}
                  searchable
                  clearable
                  nothingFound="No languages found"
                  disabled={isLanguagesLoading}
                  styles={{
                    input: {
                      borderColor: "#d1d5db",
                      borderRadius: "0.5rem",
                      padding: "0.75rem 1rem",
                      fontSize: "0.875rem",
                    },
                    dropdown: {
                      borderRadius: "0.5rem",
                      border: "1px solid #e5e7eb",
                    },
                  }}
                  required
                />
                {isLanguagesLoading && (
                  <div className="mt-1 text-sm text-gray-500">
                    Loading languages...
                  </div>
                )}
              </div>

              {/* Warning if language not selected */}
              {!formData.language_id && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <strong>Important:</strong> You must select a language
                      before choosing dialogues.
                    </div>
                  </div>
                </div>
              )}

              {/* Warning if language has no dialogues */}
              {formData.language_id && !hasDialoguesForSelectedLanguage && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-800">
                      <strong>No Dialogues Available:</strong> Selected language
                      has no dialogues. Please add dialogues first or select
                      another language.
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Dialogue Dropdowns with Mantine Select */}
              {formData.language_id && hasDialoguesForSelectedLanguage && (
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Dialogue 1 *
                    </label>
                    <Select
                      placeholder="Search and select dialogue..."
                      size="lg"
                      data={dialogueOptions}
                      value={formData.dialogue_id}
                      onChange={(value) =>
                        setFormData({ ...formData, dialogue_id: value || "" })
                      }
                      searchable
                      clearable
                      nothingFound="No dialogues found"
                      disabled={isDialoguesDisabled || isDialoguesLoading}
                      styles={{
                        input: {
                          borderColor: "#d1d5db",
                          borderRadius: "0.5rem",
                          padding: "0.75rem 1rem",
                          fontSize: "0.875rem",
                          backgroundColor: isDialoguesDisabled
                            ? "#f3f4f6"
                            : "white",
                          cursor: isDialoguesDisabled ? "not-allowed" : "text",
                        },
                        dropdown: {
                          borderRadius: "0.5rem",
                          border: "1px solid #e5e7eb",
                          maxHeight: "300px",
                        },
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Dialogue 2 *
                    </label>
                    <Select
                      placeholder="Search and select dialogue..."
                      size="lg"
                      data={dialogueOptions}
                      value={formData.dialogue_id_2}
                      onChange={(value) =>
                        setFormData({ ...formData, dialogue_id_2: value || "" })
                      }
                      searchable
                      clearable
                      nothingFound="No dialogues found"
                      disabled={isDialoguesDisabled || isDialoguesLoading}
                      styles={{
                        input: {
                          borderColor: "#d1d5db",
                          borderRadius: "0.5rem",
                          padding: "0.75rem 1rem",
                          fontSize: "0.875rem",
                          backgroundColor: isDialoguesDisabled
                            ? "#f3f4f6"
                            : "white",
                          cursor: isDialoguesDisabled ? "not-allowed" : "text",
                        },
                        dropdown: {
                          borderRadius: "0.5rem",
                          border: "1px solid #e5e7eb",
                          maxHeight: "300px",
                        },
                      }}
                      required
                    />
                  </div>
                  {isDialoguesLoading && (
                    <div className="col-span-2 mt-1 text-sm text-gray-500">
                      Loading dialogues...
                    </div>
                  )}
                </div>
              )}

              {/* Optional fields (only for edit) */}
              {modalMode === "edit" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="durationSeconds"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Duration (seconds)
                    </label>
                    <input
                      type="number"
                      id="durationSeconds"
                      value={formData.durationSeconds}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          durationSeconds: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="1200"
                      min="0"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="totalMarks"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Total Marks
                    </label>
                    <input
                      type="number"
                      id="totalMarks"
                      value={formData.totalMarks}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalMarks: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="90"
                      min="0"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="passMarks"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Pass Marks
                    </label>
                    <input
                      type="number"
                      id="passMarks"
                      value={formData.passMarks}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          passMarks: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="62"
                      min="0"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={createUpdateMutation.isPending}
                  className="flex-1 cursor-pointer px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createUpdateMutation.isPending ||
                    (formData.language_id && !hasDialoguesForSelectedLanguage)
                  }
                  className="flex-1 px-4 cursor-pointer py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createUpdateMutation.isPending
                    ? "Saving..."
                    : modalMode === "create"
                      ? "Create"
                      : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockTestManagement;
