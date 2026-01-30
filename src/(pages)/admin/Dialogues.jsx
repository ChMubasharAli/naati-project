// /components/DialoguesManagement.jsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit,
  Trash2,
  MessageSquare,
  Search,
  X,
  Clock,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";

// Import API functions
import {
  fetchDialogues,
  createDialogue,
  updateDialogue,
  deleteDialogue,
} from "../../api/dialogues";
import { showSuccessToast, queryKeys } from "../../lib/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const DialoguesManagement = () => {
  const { user: loggedInUser } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  // Get data from location state
  const { languageName, languageId, domainName, domainId } =
    location.state || {};

  // Check if required data exists
  useEffect(() => {
    if (!languageName || !languageId || !domainName || !domainId) {
      navigate(-1);
    }
  }, [languageName, languageId, domainName, domainId, navigate]);

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedDialogue, setSelectedDialogue] = useState(null);
  const [formData, setFormData] = useState({
    domainId: domainId || "",
    languageId: languageId || "",
    title: "",
    description: "",
    duration: "",
    difficulty: "easy",
  });

  // Fetch dialogues only (removed languages and domains fetch)
  const { data: dialoguesData, isLoading: dialoguesLoading } = useQuery({
    queryKey: queryKeys.dialogues.list(loggedInUser?.id, languageId),
    queryFn: () => fetchDialogues(loggedInUser?.id, languageId),
    enabled: !!languageId && !!loggedInUser?.id,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createDialogue,
    onSuccess: (data) => {
      showSuccessToast(data.message || "Dialogue created successfully!");
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: queryKeys.dialogues.list() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateDialogue(id, data),
    onSuccess: (data) => {
      showSuccessToast(data.message || "Dialogue updated successfully!");
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: queryKeys.dialogues.list() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDialogue,
    onSuccess: (data) => {
      showSuccessToast(data.message || "Dialogue deleted successfully!");
      queryClient.invalidateQueries({ queryKey: queryKeys.dialogues.list() });
    },
  });

  // Helper functions
  const resetForm = () => {
    setFormData({
      domainId: domainId || "",
      languageId: languageId || "",
      title: "",
      description: "",
      duration: "",
      difficulty: "easy",
    });
    setSelectedDialogue(null);
  };

  const handleCreate = () => {
    setModalMode("create");
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (dialogue) => {
    setModalMode("edit");
    setFormData({
      domainId: dialogue.domainId.toString(),
      languageId: dialogue.languageId.toString(),
      title: dialogue.title,
      description: dialogue.description || "",
      duration: dialogue.duration ? dialogue.duration.toString() : "",
      difficulty: dialogue.difficulty,
    });
    setSelectedDialogue(dialogue);
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const dialogueData = {
      ...formData,
      domainId: parseInt(formData.domainId),
      languageId: parseInt(formData.languageId),
      duration: formData.duration ? parseInt(formData.duration) : undefined,
    };

    if (modalMode === "create") {
      createMutation.mutate(dialogueData);
    } else {
      updateMutation.mutate({ id: selectedDialogue.id, data: dialogueData });
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this dialogue?")) {
      return;
    }
    deleteMutation.mutate(id);
  };

  // Handle dialogue click to navigate to segments
  const handleDialogueClick = (dialogue) => {
    navigate("/admin/segments", {
      state: {
        dialogueTitle: dialogue.title,
        dialogueId: dialogue.id,
        languageName,
        domainName,
      },
    });
  };

  // Extract data
  const dialogues = dialoguesData?.data?.dialogues || [];
  const isLoading = dialoguesLoading;

  // Filter dialogues based on search, languageId and domainId
  const filteredDialogues = dialogues.filter(
    (dialogue) =>
      (dialogue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dialogue.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())) &&
      dialogue.languageId === parseInt(languageId) &&
      dialogue.domainId === parseInt(domainId),
  );

  // Get difficulty badge class
  const getDifficultyClass = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "hard":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Don't render anything if navigating back
  if (!languageName || !languageId || !domainName || !domainId) {
    return null;
  }

  return (
    <div className="p-6 bg-white  shadow-lg border border-gray-200 max-h-[calc(100vh-64px)] lg:max-h-screen h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex cursor-pointer items-center gap-1 px-3 py-1 text-sm  text-emerald-600 bg-gray-100 rounded-lg transition-all"
            >
              <ArrowLeft size={16} />
              Back to Domains
            </button>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-emerald-600" />
            Dialogues Management - {domainName}
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage practice dialogues for {domainName} ({languageName})
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={isLoading}
          className="flex cursor-pointer items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
        >
          <Plus size={18} />
          Add Dialogue
        </button>
      </div>

      {/* Search Only */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search dialogues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="flex justify-center">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
          <p className="text-gray-500 mt-4">Loading dialogues...</p>
        </div>
      )}

      {/* Dialogues List */}
      {!isLoading && (
        <div className="space-y-4 flex-1 overflow-y-auto">
          {filteredDialogues.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm
                ? "No dialogues found"
                : "No dialogues available for this domain"}
            </div>
          ) : (
            filteredDialogues.map((dialogue) => (
              <div
                key={dialogue.id}
                className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-emerald-400 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => handleDialogueClick(dialogue)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
                        style={{
                          backgroundColor: "#e5e7eb",
                        }}
                      >
                        <MessageSquare
                          className="w-5 h-5"
                          style={{
                            color: "#6b7280",
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {dialogue.title}
                        </h3>
                        {dialogue.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {dialogue.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                            {domainName}
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                            {languageName}
                          </span>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyClass(
                              dialogue.difficulty,
                            )}`}
                          >
                            {dialogue.difficulty}
                          </span>
                          {dialogue.duration && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                              <Clock size={12} />
                              {formatDuration(dialogue.duration)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleEdit(dialogue)}
                      className="p-2 cursor-pointer text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      disabled={deleteMutation.isPending}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(dialogue.id)}
                      className="p-2 cursor-pointer text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending &&
                      deleteMutation.variables === dialogue.id ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Count */}
      {!isLoading && filteredDialogues.length > 0 && (
        <div className="mt-6 text-sm text-gray-600">
          Showing {filteredDialogues.length} dialogues for {domainName}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">
                {modalMode === "create" ? "Add New Dialogue" : "Edit Dialogue"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="text-gray-400 cursor-pointer hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., Visa Appointment Dialogue"
                  required
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Brief description"
                  rows="3"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Language
                  </label>
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                    <span className="text-gray-700 font-medium">
                      {languageName}
                    </span>
                    <input type="hidden" value={formData.languageId} readOnly />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Language cannot be changed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Domain
                  </label>
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                    <span className="text-gray-700 font-medium">
                      {domainName}
                    </span>
                    <input type="hidden" value={formData.domainId} readOnly />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Domain cannot be changed
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Difficulty *
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) =>
                      setFormData({ ...formData, difficulty: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    required
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="120"
                    min="0"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="flex-1 cursor-pointer px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {modalMode === "create" ? "Creating..." : "Updating..."}
                    </span>
                  ) : modalMode === "create" ? (
                    "Create"
                  ) : (
                    "Update"
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

export default DialoguesManagement;
