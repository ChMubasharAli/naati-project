import React, { useState, useRef, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
  BookOpen,
  Search,
  Play,
  Pause,
  Upload,
  AlertCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Import your existing APIs
import { fetchLanguages } from "../../api/languages";
import {
  fetchVocabularies,
  createVocabulary,
  updateVocabulary,
  deleteVocabulary,
} from "../../api/vocabulary";

// Import queryKeys from your existing setup
import { queryKeys, showSuccessToast } from "../../lib/react-query";
import { useAuth } from "../../context/AuthContext";

const VocabularyManagement = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedVocabulary, setSelectedVocabulary] = useState(null);

  // Audio states
  const [playingAudio, setPlayingAudio] = useState(null);
  const audioRefs = useRef({});

  const [formData, setFormData] = useState({
    languageId: "",
    originalWord: "",
    convertedWord: "",
    description: "",
    originalAudio: null,
    convertedAudio: null,
  });

  // Define userId (you should get this from your auth system)
  const { user } = useAuth();
  const userId = user?.id;

  // Fetch languages using React Query with your existing API
  const {
    data: languagesData = {},
    isLoading: languagesLoading,
    error: languagesError,
  } = useQuery({
    queryKey: queryKeys.languages.list(),
    queryFn: fetchLanguages,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch vocabularies with filter
  const {
    data: vocabulariesData = {},
    isLoading: vocabulariesLoading,
    error: vocabulariesError,
    refetch: refetchVocabularies,
  } = useQuery({
    queryKey: queryKeys.vocabulary.list({ userId, languageId: filterLanguage }),
    queryFn: () => fetchVocabularies({ userId, languageId: filterLanguage }),
    enabled: !!userId,
  });

  // Extract data from responses
  const languages = languagesData.data || [];
  const vocabularies = vocabulariesData.data || [];

  // Get selected language name for modal labels
  const selectedLanguageName = useMemo(() => {
    if (!formData.languageId) return "";
    const lang = languages.find((l) => l.id === parseInt(formData.languageId));
    return lang ? lang.name : "";
  }, [formData.languageId, languages]);

  // Create/Update mutation
  const vocabularyMutation = useMutation({
    mutationFn: ({ data, id }) =>
      id ? updateVocabulary(id, data) : createVocabulary(data),
    onSuccess: (data, variables) => {
      const message = variables.id
        ? "Vocabulary updated successfully!"
        : "Vocabulary created successfully!";

      showSuccessToast(message);

      queryClient.invalidateQueries({
        queryKey: queryKeys.vocabulary.list({
          userId,
          languageId: filterLanguage,
        }),
      });

      setIsModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Operation failed");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteVocabulary(id),
    onSuccess: () => {
      showSuccessToast("Vocabulary deleted successfully!");
      queryClient.invalidateQueries({
        queryKey: queryKeys.vocabulary.list({
          userId,
          languageId: filterLanguage,
        }),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete vocabulary");
    },
  });

  // Audio control functions
  const toggleAudio = (vocabId, audioType, url) => {
    if (!url) return;

    const audioKey = `${vocabId}-${audioType}`;

    if (!audioRefs.current[audioKey]) {
      audioRefs.current[audioKey] = new Audio(url);
      audioRefs.current[audioKey].onended = () => {
        setPlayingAudio(null);
      };
    }

    const audio = audioRefs.current[audioKey];

    if (playingAudio === audioKey) {
      audio.pause();
      setPlayingAudio(null);
    } else {
      // Stop all other audios
      Object.keys(audioRefs.current).forEach((key) => {
        if (key !== audioKey && !audioRefs.current[key].paused) {
          audioRefs.current[key].pause();
          audioRefs.current[key].currentTime = 0;
        }
      });

      audio.play();
      setPlayingAudio(audioKey);
    }
  };

  // Handle language filter change
  const handleLanguageFilterChange = (languageId) => {
    setFilterLanguage(languageId);
  };

  // Open create modal
  const handleCreate = () => {
    setModalMode("create");
    resetForm();
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleEdit = (vocabulary) => {
    setModalMode("edit");
    setFormData({
      languageId: vocabulary.languageId.toString(),
      originalWord: vocabulary.originalWord,
      convertedWord: vocabulary.convertedWord,
      description: vocabulary.description || "",
      originalAudio: null,
      convertedAudio: null,
    });
    setSelectedVocabulary(vocabulary);
    setIsModalOpen(true);
  };

  // Handle file input change
  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    setFormData({
      ...formData,
      [fieldName]: file || null,
    });
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      languageId: "",
      originalWord: "",
      convertedWord: "",
      description: "",
      originalAudio: null,
      convertedAudio: null,
    });
    setSelectedVocabulary(null);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.languageId) {
      toast.error("Please select a language");
      return;
    }
    if (!formData.originalWord.trim()) {
      toast.error("Please enter original word");
      return;
    }
    if (!formData.convertedWord.trim()) {
      toast.error("Please enter converted word");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("languageId", parseInt(formData.languageId));
    formDataToSend.append("originalWord", formData.originalWord.trim());
    formDataToSend.append("convertedWord", formData.convertedWord.trim());
    formDataToSend.append("description", formData.description || "");

    if (formData.originalAudio) {
      formDataToSend.append("originalAudio", formData.originalAudio);
    }
    if (formData.convertedAudio) {
      formDataToSend.append("convertedAudio", formData.convertedAudio);
    }

    if (modalMode === "create") {
      formDataToSend.append("userId", userId);
    }

    vocabularyMutation.mutate({
      data: formDataToSend,
      id: modalMode === "edit" ? selectedVocabulary.id : null,
    });
  };

  // Delete vocabulary
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vocabulary?")) {
      return;
    }
    deleteMutation.mutate(id);
  };

  // Filter vocabularies by search
  const filteredVocabularies = vocabularies.filter(
    (vocab) =>
      vocab.originalWord?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vocab.convertedWord?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vocab.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Get language name
  const getLanguageName = (languageId) => {
    const lang = languages.find((l) => l.id === languageId);
    return lang ? lang.name : `Language #${languageId}`;
  };

  const isLoading =
    vocabulariesLoading ||
    vocabularyMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-emerald-600" />
            Vocabulary Management
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage vocabulary words with audio pronunciations
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          Add Vocabulary
        </button>
      </div>

      {/* Show errors if any */}
      {vocabulariesError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{vocabulariesError.message}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search vocabulary..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        <div>
          <select
            value={filterLanguage}
            onChange={(e) => handleLanguageFilterChange(e.target.value)}
            disabled={languagesLoading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">All Languages</option>
            {languages.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name} ({lang.langCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vocabulary Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Original Word
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Converted Word
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Language
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Original Audio
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Converted Audio
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading && vocabularies.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-6 py-12 text-center text-gray-500"
                >
                  Loading vocabularies...
                </td>
              </tr>
            ) : filteredVocabularies.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No vocabularies found
                </td>
              </tr>
            ) : (
              filteredVocabularies.map((vocab) => (
                <tr
                  key={vocab.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">
                      {vocab.originalWord}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-emerald-600">
                      {vocab.convertedWord}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                      {getLanguageName(vocab.languageId)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className="text-sm text-gray-600 max-w-xs truncate"
                      title={vocab.description}
                    >
                      {vocab.description || "-"}
                    </div>
                  </td>

                  {/* Original Audio Column */}
                  <td className="px-6 py-4">
                    {vocab.originalAudioUrl ? (
                      <button
                        onClick={() =>
                          toggleAudio(
                            vocab.id,
                            "original",
                            vocab.originalAudioUrl,
                          )
                        }
                        className={`flex items-center justify-center p-2 rounded-full transition-all ${
                          playingAudio === `${vocab.id}-original`
                            ? "bg-emerald-100 text-emerald-600"
                            : "text-gray-600 hover:bg-gray-100 hover:text-emerald-600"
                        }`}
                        title="Play original audio"
                      >
                        {playingAudio === `${vocab.id}-original` ? (
                          <span className=" flex items-center gap-1 cursor-pointer">
                            {" "}
                            <Pause size={18} /> Pause
                          </span>
                        ) : (
                          <span className=" flex items-center gap-1 cursor-pointer">
                            {" "}
                            <Play size={18} /> Play
                          </span>
                        )}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        No audio
                      </span>
                    )}
                  </td>

                  {/* Converted Audio Column */}
                  <td className="px-6 py-4">
                    {vocab.convertedAudioUrl ? (
                      <button
                        onClick={() =>
                          toggleAudio(
                            vocab.id,
                            "converted",
                            vocab.convertedAudioUrl,
                          )
                        }
                        className={`flex items-center justify-center p-2 rounded-full transition-all ${
                          playingAudio === `${vocab.id}-converted`
                            ? "bg-emerald-100 text-emerald-600"
                            : "text-gray-600 hover:bg-gray-100 hover:text-emerald-600"
                        }`}
                        title="Play converted audio"
                      >
                        {playingAudio === `${vocab.id}-converted` ? (
                          <span className=" flex items-center gap-1 cursor-pointer">
                            {" "}
                            <Pause size={18} /> Pause
                          </span>
                        ) : (
                          <span className=" flex items-center gap-1 cursor-pointer">
                            {" "}
                            <Play size={18} /> Play
                          </span>
                        )}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        No audio
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(vocab)}
                        disabled={isLoading}
                        className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(vocab.id)}
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
        Total Vocabularies:{" "}
        <span className="font-semibold text-gray-900">
          {filteredVocabularies.length}
        </span>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">
                {modalMode === "create" ? "Add Vocabulary" : "Edit Vocabulary"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={vocabularyMutation.isPending}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {vocabularyMutation.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{vocabularyMutation.error.message}</span>
                </div>
              )}

              {/* Language Selection */}
              <div>
                <label
                  htmlFor="languageId"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Language *
                </label>
                <select
                  id="languageId"
                  value={formData.languageId}
                  onChange={(e) =>
                    setFormData({ ...formData, languageId: e.target.value })
                  }
                  disabled={languagesLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">-- Select Language --</option>
                  {languages.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Words */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="originalWord"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Original Word (English) *
                  </label>
                  <input
                    type="text"
                    id="originalWord"
                    value={formData.originalWord}
                    onChange={(e) =>
                      setFormData({ ...formData, originalWord: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="e.g., Hello"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="convertedWord"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Converted Word{" "}
                    {selectedLanguageName ? `(${selectedLanguageName})` : ""} *
                  </label>
                  <input
                    type="text"
                    id="convertedWord"
                    value={formData.convertedWord}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        convertedWord: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="e.g., Namaste"
                    required
                  />
                </div>
              </div>

              {/* Audio Files */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="originalAudio"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Original Audio (English)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      id="originalAudio"
                      accept="audio/*"
                      onChange={(e) => handleFileChange(e, "originalAudio")}
                      disabled={vocabularyMutation.isPending}
                      className="hidden disabled:opacity-50"
                    />
                    <label
                      htmlFor="originalAudio"
                      className={`flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                        vocabularyMutation.isPending
                          ? "border-gray-200 bg-gray-100 cursor-not-allowed"
                          : "border-gray-300 hover:border-emerald-500"
                      }`}
                    >
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {formData.originalAudio
                          ? formData.originalAudio.name
                          : "Choose audio file"}
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="convertedAudio"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Converted Audio{" "}
                    {selectedLanguageName ? `(${selectedLanguageName})` : ""}
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      id="convertedAudio"
                      accept="audio/*"
                      onChange={(e) => handleFileChange(e, "convertedAudio")}
                      disabled={vocabularyMutation.isPending}
                      className="hidden disabled:opacity-50"
                    />
                    <label
                      htmlFor="convertedAudio"
                      className={`flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                        vocabularyMutation.isPending
                          ? "border-gray-200 bg-gray-100 cursor-not-allowed"
                          : "border-gray-300 hover:border-emerald-500"
                      }`}
                    >
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {formData.convertedAudio
                          ? formData.convertedAudio.name
                          : "Choose audio file"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  placeholder="Add pronunciation notes or context..."
                  rows="3"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={vocabularyMutation.isPending}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={vocabularyMutation.isPending}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {vocabularyMutation.isPending
                    ? "Saving..."
                    : modalMode === "create"
                      ? "Add Vocabulary"
                      : "Update Vocabulary"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VocabularyManagement;
