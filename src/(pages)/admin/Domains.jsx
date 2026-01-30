// /components/DomainsManagement.jsx
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Search,
  X,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

// Import API functions
import {
  fetchDomains,
  createDomain,
  updateDomain,
  deleteDomain,
} from "../../api/domains";
import { showSuccessToast, queryKeys } from "../../lib/react-query";

const DomainsManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { languageName, languageId } = location.state || {};

  const queryClient = useQueryClient();

  // Check if languageId and languageName exist
  useEffect(() => {
    if (!languageName || !languageId) {
      navigate(-1);
    }
  }, [languageName, languageId, navigate]);

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "easy",
    colorCode: "#3b82f6",
    languageId: languageId || "",
  });

  // Fetch domains only (removed languages fetch)
  const { data: domainsData, isLoading: domainsLoading } = useQuery({
    queryKey: queryKeys.domains.list(),
    queryFn: fetchDomains,
  });

  // Create domain mutation
  const createMutation = useMutation({
    mutationFn: createDomain,
    onSuccess: (data) => {
      showSuccessToast(data.message || "Domain created successfully!");
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.list() });
    },
  });

  // Update domain mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateDomain(id, data),
    onSuccess: (data) => {
      showSuccessToast(data.message || "Domain updated successfully!");
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.list() });
    },
  });

  // Delete domain mutation
  const deleteMutation = useMutation({
    mutationFn: deleteDomain,
    onSuccess: (data) => {
      showSuccessToast(data.message || "Domain deleted successfully!");
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.list() });
    },
  });

  // Helper functions
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      difficulty: "easy",
      colorCode: "#3b82f6",
      languageId: languageId || "",
    });
    setSelectedDomain(null);
  };

  const handleCreate = () => {
    setModalMode("create");
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (domain) => {
    setModalMode("edit");
    setFormData({
      title: domain.title,
      description: domain.description || "",
      difficulty: domain.difficulty,
      colorCode: domain.colorCode,
      languageId: domain.languageId.toString(),
    });
    setSelectedDomain(domain);
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const domainData = {
      ...formData,
      languageId: parseInt(formData.languageId),
    };

    if (modalMode === "create") {
      createMutation.mutate(domainData);
    } else {
      updateMutation.mutate({ id: selectedDomain.id, data: domainData });
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this domain?")) {
      return;
    }
    deleteMutation.mutate(id);
  };

  // Extract data
  const domains = domainsData?.data?.domains || [];
  const isLoading = domainsLoading;

  // Filter domains based on search and languageId
  const filteredDomains = domains.filter(
    (domain) =>
      (domain.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        domain.description?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      domain.languageId === parseInt(languageId), // Only show domains for the selected language
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

  // Don't render anything if navigating back
  if (!languageName || !languageId) {
    return null;
  }

  return (
    <div className="p-6 bg-white  shadow-lg border border-gray-200  max-h-[calc(100vh-64px)] lg:max-h-screen h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex cursor-pointer items-center gap-1 px-3 py-1 text-sm  text-emerald-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
            >
              <ArrowLeft size={16} />
              Back to Languages
            </button>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-emerald-600" />
            Domains Management - {languageName}
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage practice domains for {languageName}
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={isLoading}
          className="flex cursor-pointer items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
        >
          <Plus size={18} />
          Add Domain
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative ">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search domains..."
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
          <p className="text-gray-500 mt-4">Loading domains...</p>
        </div>
      )}

      {/* Domains Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto ">
          {filteredDomains.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              {searchTerm
                ? "No domains found"
                : "No domains available for this language"}
            </div>
          ) : (
            filteredDomains.map((domain) => (
              <div
                key={domain.id}
                onClick={() => {
                  navigate("/admin/dialogues", {
                    state: {
                      languageName,
                      languageId,
                      domainName: domain.title,
                      domainId: domain.id,
                    },
                  });
                }}
                className="bg-white border-2 cursor-pointer  border-gray-200 rounded-xl p-5 hover:border-emerald-400 hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: domain.colorCode + "20" }}
                  >
                    <BookOpen
                      className="w-6 h-6"
                      style={{ color: domain.colorCode }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(domain);
                      }}
                      className="p-2 cursor-pointer cursor-pointer text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      disabled={deleteMutation.isPending}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(domain.id);
                      }}
                      className="p-2 cursor-pointer text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending &&
                      deleteMutation.variables === domain.id ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {domain.title}
                </h3>

                {domain.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {domain.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyClass(
                      domain.difficulty,
                    )}`}
                  >
                    {domain.difficulty}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                    {languageName}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Domain Count */}
      {!isLoading && filteredDomains.length > 0 && (
        <div className="mt-6 text-sm text-gray-600">
          Showing {filteredDomains.length} domains for {languageName}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">
                {modalMode === "create" ? "Add New Domain" : "Edit Domain"}
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
                  placeholder="e.g., Visa Appointment"
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
                  Color Code
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={formData.colorCode}
                    onChange={(e) =>
                      setFormData({ ...formData, colorCode: e.target.value })
                    }
                    className="w-16 h-12 border border-gray-300 rounded-lg cursor-pointer"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                  />
                  <input
                    type="text"
                    value={formData.colorCode}
                    onChange={(e) =>
                      setFormData({ ...formData, colorCode: e.target.value })
                    }
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="#ffcc00"
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
                  className="flex-1 px-4 py-3 cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600"
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

export default DomainsManagement;
