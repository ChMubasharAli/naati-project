import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Zap,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Search,
} from "lucide-react";

const RapidReviewsManagement = () => {
  const [rapidReviews, setRapidReviews] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [dialogues, setDialogues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedReview, setSelectedReview] = useState(null);
  const [error, setError] = useState("");
  const [expandedDialogues, setExpandedDialogues] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    languageId: "",
    segments: [],
  });

  const getToken = () => localStorage.getItem("token");

  // Get selected segment objects with dialogue info
  const getSelectedSegments = () => {
    const selected = [];
    dialogues.forEach((dialogue) => {
      dialogue.segments?.forEach((segment) => {
        if (formData.segments.includes(segment.id)) {
          selected.push({
            ...segment,
            dialogueTitle: dialogue.title,
            dialogueId: dialogue.id,
          });
        }
      });
    });
    return selected;
  };

  // Fetch languages
  const fetchLanguages = async () => {
    try {
      const response = await fetch(
        "https://api.prepsmart.au/api/v1/admin/languages",
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        },
      );
      const data = await response.json();
      if (data.success) {
        setLanguages(data.data.languages || []);
      }
    } catch (err) {
      console.error("Failed to fetch languages:", err);
    }
  };

  // Fetch segments by language
  const fetchSegments = async (languageId) => {
    if (!languageId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.prepsmart.au/api/v1/rapid-review/segments/${languageId}`,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      const data = await response.json();
      if (data.success) {
        setDialogues(data.data.dialogues || []);
      }
    } catch (err) {
      console.error("Failed to fetch segments:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch rapid reviews
  const fetchRapidReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://api.prepsmart.au/api/v1/rapid-review?userId=1",
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        },
      );
      const data = await response.json();
      if (data.success) {
        setRapidReviews(data.data.rapidReviews || []);
      }
    } catch (err) {
      console.error("Failed to fetch rapid reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLanguages();
    fetchRapidReviews();
  }, []);

  // Handle language change - reset segments
  const handleLanguageChange = (languageId) => {
    setFormData({
      ...formData,
      languageId,
      segments: [], // Reset segments when language changes
    });
    setExpandedDialogues([]);
    fetchSegments(languageId);
  };

  // Toggle dialogue accordion
  const toggleDialogue = (dialogueId) => {
    setExpandedDialogues((prev) =>
      prev.includes(dialogueId)
        ? prev.filter((id) => id !== dialogueId)
        : [...prev, dialogueId],
    );
  };

  // Toggle segment selection
  const toggleSegment = (segmentId) => {
    setFormData((prev) => ({
      ...prev,
      segments: prev.segments.includes(segmentId)
        ? prev.segments.filter((id) => id !== segmentId)
        : [...prev.segments, segmentId],
    }));
  };

  // Remove segment from selection
  const removeSegment = (segmentId) => {
    setFormData((prev) => ({
      ...prev,
      segments: prev.segments.filter((id) => id !== segmentId),
    }));
  };

  const handleCreate = () => {
    setModalMode("create");
    setFormData({
      title: "",
      languageId: "",
      segments: [],
    });
    setSelectedReview(null);
    setDialogues([]);
    setExpandedDialogues([]);
    setError("");
    setIsModalOpen(true);
  };

  const handleEdit = (review) => {
    setModalMode("edit");
    setFormData({
      title: review.title,
      languageId: review.languageId,
      segments: review.segments || [],
    });
    setSelectedReview(review);
    setError("");
    fetchSegments(review.languageId);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.segments.length === 0) {
      setError("Please select at least one segment");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const url =
        modalMode === "create"
          ? "https://api.prepsmart.au/api/v1/rapid-review"
          : `https://api.prepsmart.au/api/v1/rapid-review/${selectedReview.id}`;

      const method = modalMode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          title: formData.title,
          languageId: parseInt(formData.languageId),
          segments: formData.segments,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsModalOpen(false);
        fetchRapidReviews();
        setFormData({ title: "", languageId: "", segments: [] });
        setDialogues([]);
      } else {
        setError(data.message || "Operation failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this rapid review?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.prepsmart.au/api/v1/rapid-review/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getToken()}` },
        },
      );

      const data = await response.json();

      if (data.success) {
        fetchRapidReviews();
      } else {
        alert(data.message || "Delete failed");
      }
    } catch (err) {
      alert("Failed to delete rapid review");
    } finally {
      setLoading(false);
    }
  };

  const selectedSegments = getSelectedSegments();

  // Filter rapid reviews based on search
  const filteredRapidReviews = rapidReviews.filter(
    (review) =>
      review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.language?.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200  max-h-[calc(100vh-64px)] lg:max-h-screen h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-7 h-7 text-emerald-600" />
            Rapid Reviews Management
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Create and manage rapid review sets
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center cursor-pointer gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg"
        >
          <Plus size={18} />
          Create Rapid Review
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or language..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Rapid Reviews List */}
      <div className="space-y-4 flex-1 overflow-y-auto p-1">
        {loading && rapidReviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Loading rapid reviews...
          </div>
        ) : filteredRapidReviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchTerm
              ? "No rapid reviews found matching your search"
              : "No rapid reviews found"}
          </div>
        ) : (
          filteredRapidReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-emerald-400 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 ">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {review.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                      {review.language?.name || "Unknown"}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                      {review.segments?.length || 0} Segments
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(review)}
                    className="p-2 text-gray-600 cursor-pointer hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="p-2 text-gray-600 cursor-pointer hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Total Count */}
      <div className="mt-6 text-sm text-gray-600">
        {searchTerm ? (
          <>
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {filteredRapidReviews.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900">
              {rapidReviews.length}
            </span>{" "}
            rapid reviews
          </>
        ) : (
          <>
            Total Rapid Reviews:{" "}
            <span className="font-semibold text-gray-900">
              {rapidReviews.length}
            </span>
          </>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {modalMode === "create"
                  ? "Create Rapid Review"
                  : "Edit Rapid Review"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-6 space-y-5"
            >
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., Rapid Review Set 1"
                  required
                />
              </div>

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
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white"
                  required
                >
                  <option value="">Select Language</option>
                  {languages.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name} ({lang.langCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Segments Display */}
              {selectedSegments.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Selected Segments ({selectedSegments.length})
                  </label>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                    {selectedSegments.map((segment) => (
                      <div
                        key={segment.id}
                        className="bg-white border border-emerald-300 rounded-lg p-3 flex items-start justify-between gap-3 hover:border-emerald-400 transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-teal-100 text-teal-700">
                              {segment.dialogueTitle}
                            </span>
                            <span className="text-xs text-gray-500">
                              Segment #{segment.segmentOrder}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {segment.textContent}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSegment(segment.id)}
                          className="flex-shrink-0 cursor-pointer p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Remove segment"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Segments Selection */}
              {formData.languageId && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Select More Segments
                  </label>
                  <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto">
                    {loading ? (
                      <div className="p-6 text-center text-gray-500">
                        Loading dialogues...
                      </div>
                    ) : dialogues.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        No dialogues found
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {dialogues.map((dialogue) => (
                          <div key={dialogue.id} className="bg-white">
                            {/* Dialogue Header */}
                            <button
                              type="button"
                              onClick={() => toggleDialogue(dialogue.id)}
                              className="w-full px-4 cursor-pointer py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 text-left">
                                  {dialogue.title}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                                  {dialogue.segments?.filter((s) =>
                                    formData.segments.includes(s.id),
                                  ).length || 0}{" "}
                                  selected
                                </span>
                              </div>
                              {expandedDialogues.includes(dialogue.id) ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              )}
                            </button>

                            {/* Segments */}
                            {expandedDialogues.includes(dialogue.id) && (
                              <div className="px-4 pb-3 space-y-2 bg-gray-50">
                                {dialogue.segments?.map((segment) => (
                                  <div
                                    key={segment.id}
                                    onClick={() => toggleSegment(segment.id)}
                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                      formData.segments.includes(segment.id)
                                        ? "border-emerald-500 bg-emerald-50"
                                        : "border-gray-200 bg-white hover:border-emerald-300"
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div
                                        className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                          formData.segments.includes(segment.id)
                                            ? "bg-emerald-500"
                                            : "bg-white border-2 border-gray-300"
                                        }`}
                                      >
                                        {formData.segments.includes(
                                          segment.id,
                                        ) && (
                                          <Check className="w-3 h-3 text-white" />
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-sm text-gray-700">
                                          {segment.textContent}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          Segment #{segment.segmentOrder}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 cursor-pointer border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || formData.segments.length === 0}
                  className="flex-1 px-4 cursor-pointer py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
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

export default RapidReviewsManagement;
