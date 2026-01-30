// /components/SegmentsManagement.jsx
import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit,
  Trash2,
  MessageCircle,
  Search,
  X,
  Play,
  Pause,
  Loader2,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

// Import APIs
import {
  fetchSegments,
  createSegment,
  updateSegment,
  deleteSegment,
} from "../../api/segments";
import { showSuccessToast, queryKeys } from "../../lib/react-query";

const SegmentsManagement = () => {
  const queryClient = useQueryClient();
  const audioRefs = useRef({});
  const location = useLocation();
  const navigate = useNavigate();

  // Get data from location state
  const { dialogueTitle, dialogueId, languageName, domainName } =
    location.state || {};

  // Check if required data exists
  useEffect(() => {
    if (!dialogueTitle || !dialogueId) {
      navigate(-1);
    }
  }, [dialogueTitle, dialogueId, navigate]);

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [playingAudioId, setPlayingAudioId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    dialogueId: dialogueId || "",
    textContent: "",
    segmentOrder: "",
  });

  // File state
  const [audioFile, setAudioFile] = useState(null);
  const [suggestedAudioFile, setSuggestedAudioFile] = useState(null);

  // Fetch segments for the specific dialogue
  const { data: segmentsData, isLoading } = useQuery({
    queryKey: queryKeys.segments.list(dialogueId),
    queryFn: () => fetchSegments(dialogueId),
    enabled: !!dialogueId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createSegment,
    onSuccess: () => {
      showSuccessToast("Segment created successfully!");
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({
        queryKey: queryKeys.segments.list(dialogueId),
      });
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateSegment(id, data),
    onSuccess: () => {
      showSuccessToast("Segment updated successfully!");
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({
        queryKey: queryKeys.segments.list(dialogueId),
      });
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteSegment,
    onSuccess: () => {
      showSuccessToast("Segment deleted successfully!");
      queryClient.invalidateQueries({
        queryKey: queryKeys.segments.list(dialogueId),
      });
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  // Effect to refetch when dialogueId changes
  useEffect(() => {
    if (dialogueId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.segments.list(dialogueId),
      });
    }
  }, [dialogueId, queryClient]);

  // Reset form
  const resetForm = () => {
    setFormData({
      dialogueId: dialogueId || "",
      textContent: "",
      segmentOrder: "",
    });
    setAudioFile(null);
    setSuggestedAudioFile(null);
    setSelectedSegment(null);
  };

  // Handle create
  const handleCreate = () => {
    setModalMode("create");
    const segments = segmentsData?.data?.segments || [];
    const maxOrder =
      segments.length > 0
        ? Math.max(...segments.map((s) => s.segmentOrder))
        : 0;

    setFormData({
      dialogueId: dialogueId || "",
      textContent: "",
      segmentOrder: (maxOrder + 1).toString(),
    });
    setAudioFile(null);
    setSuggestedAudioFile(null);
    setIsModalOpen(true);
  };

  // Handle edit
  const handleEdit = (segment) => {
    setModalMode("edit");
    setSelectedSegment(segment);

    setFormData({
      dialogueId: segment.dialogueId.toString(),
      textContent: segment.textContent,
      segmentOrder: segment.segmentOrder.toString(),
    });

    setAudioFile(null);
    setSuggestedAudioFile(null);
    setIsModalOpen(true);
  };

  // Prepare FormData for submission
  const prepareFormData = () => {
    const formDataObj = new FormData();

    // Add text fields
    formDataObj.append("textContent", formData.textContent.trim());
    formDataObj.append("segmentOrder", formData.segmentOrder);
    formDataObj.append("dialogueId", formData.dialogueId);

    // Add audio files
    if (audioFile) {
      formDataObj.append("audioUrl", audioFile);
    } else if (modalMode === "edit") {
      formDataObj.append("audioUrl", "");
    }

    if (suggestedAudioFile) {
      formDataObj.append("suggestedAudioUrl", suggestedAudioFile);
    } else if (modalMode === "edit") {
      formDataObj.append("suggestedAudioUrl", "");
    }

    return formDataObj;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.textContent.trim() || !formData.segmentOrder) {
      alert("Please fill in all required fields");
      return;
    }

    const formDataObj = prepareFormData();

    if (modalMode === "create") {
      createMutation.mutate(formDataObj);
    } else {
      updateMutation.mutate({
        id: selectedSegment.id,
        data: formDataObj,
      });
    }
  };

  // Handle delete
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this segment?")) {
      deleteMutation.mutate(id);
    }
  };

  // Handle file selection
  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === "audio") {
        setAudioFile(file);
      } else {
        setSuggestedAudioFile(file);
      }
    }
  };

  // Handle audio play/pause
  const handleAudioPlay = (audioUrl, segmentId, audioType) => {
    const audioKey = `${segmentId}_${audioType}`;

    // Stop any currently playing audio
    if (playingAudioId && playingAudioId !== audioKey) {
      const prevAudio = audioRefs.current[playingAudioId];
      if (prevAudio) {
        prevAudio.pause();
        prevAudio.currentTime = 0;
      }
    }

    // If same audio is playing, pause it
    if (playingAudioId === audioKey) {
      const audio = audioRefs.current[audioKey];
      if (audio) {
        audio.pause();
        setPlayingAudioId(null);
      }
      return;
    }

    // Play new audio
    const audio = new Audio(audioUrl);
    audioRefs.current[audioKey] = audio;

    audio
      .play()
      .then(() => {
        setPlayingAudioId(audioKey);
      })
      .catch((error) => {
        console.error("Error playing audio:", error);
        alert(
          "Unable to play audio. The file might be corrupted or unsupported.",
        );
      });

    audio.onended = () => {
      setPlayingAudioId(null);
      delete audioRefs.current[audioKey];
    };

    audio.onerror = () => {
      setPlayingAudioId(null);
      delete audioRefs.current[audioKey];
      alert("Error playing audio file");
    };
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.src = "";
        }
      });
    };
  }, []);

  // Extract data
  const segments = segmentsData?.data?.segments || [];

  // Filter segments based on search
  const filteredSegments = segments
    .filter((segment) =>
      segment.textContent.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => a.segmentOrder - b.segmentOrder);

  // Don't render anything if navigating back
  if (!dialogueTitle || !dialogueId) {
    return null;
  }

  return (
    <div className="p-6 bg-white  shadow-lg border border-gray-200 max-h-[calc(100vh-64px)] lg:max-h-screen h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-4 flex-wrap ">
            <button
              onClick={() => navigate("/admin/languages")}
              className="flex cursor-pointer items-center gap-1 px-3 py-1 text-sm  text-emerald-600 bg-gray-100 rounded-lg transition-all"
            >
              <ArrowLeft size={16} />
              Go to Languages
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex cursor-pointer items-center gap-1 px-3 py-1 text-sm  text-emerald-600 bg-gray-100 rounded-lg transition-all"
            >
              <ArrowLeft size={16} />
              Back to Dialogues
            </button>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-7 h-7 text-emerald-600" />
            Segments Management - {dialogueTitle}
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage segments for dialogue: {dialogueTitle}
            {domainName && languageName && (
              <span className="ml-2 text-gray-500">
                ({domainName} • {languageName})
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={isLoading}
          className="flex cursor-pointer items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          Add Segment
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search segments by text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 flex-1  overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 left-0">
            <tr>
              <th className="px-6 py-4 text-left text-xs  font-semibold text-gray-700 uppercase tracking-wider">
                Order
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Text Content
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Audio
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Suggested Audio
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex justify-center">
                      <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                    </div>
                    <p>Loading segments...</p>
                  </div>
                </td>
              </tr>
            ) : filteredSegments.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {searchTerm
                    ? "No segments found matching your search"
                    : "No segments found for this dialogue"}
                </td>
              </tr>
            ) : (
              filteredSegments.map((segment) => {
                const audioPlaying = playingAudioId === `${segment.id}_audio`;
                const suggestedPlaying =
                  playingAudioId === `${segment.id}_suggested`;

                return (
                  <tr
                    key={segment.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Order */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg font-bold text-emerald-600">
                            {segment.segmentOrder}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Text Content */}
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <p className="text-sm text-gray-900 line-clamp-2">
                          {segment.textContent}
                        </p>
                      </div>
                    </td>

                    {/* Audio */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {segment.audioUrl ? (
                        <button
                          onClick={() =>
                            handleAudioPlay(
                              segment.audioUrl,
                              segment.id,
                              "audio",
                            )
                          }
                          className={`flex cursor-pointer items-center gap-1 px-3 py-1.5 rounded-lg ${
                            audioPlaying
                              ? "bg-emerald-600 text-white"
                              : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          }`}
                        >
                          {audioPlaying ? (
                            <>
                              <Pause size={14} />
                              <span className="text-sm">Pause</span>
                            </>
                          ) : (
                            <>
                              <Play size={14} />
                              <span className="text-sm">Play</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400 italic">
                          No audio
                        </span>
                      )}
                    </td>

                    {/* Suggested Audio */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {segment.suggestedAudioUrl ? (
                        <button
                          onClick={() =>
                            handleAudioPlay(
                              segment.suggestedAudioUrl,
                              segment.id,
                              "suggested",
                            )
                          }
                          className={`flex cursor-pointer items-center gap-1 px-3 py-1.5 rounded-lg ${
                            suggestedPlaying
                              ? "bg-teal-600 text-white"
                              : "bg-teal-100 text-teal-700 hover:bg-teal-200"
                          }`}
                        >
                          {suggestedPlaying ? (
                            <>
                              <Pause size={14} />
                              <span className="text-sm">Pause</span>
                            </>
                          ) : (
                            <>
                              <Play size={14} />
                              <span className="text-sm">Play</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400 italic">
                          No audio
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(segment)}
                          disabled={deleteMutation.isPending}
                          className="p-2 cursor-pointer text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(segment.id)}
                          disabled={deleteMutation.isPending}
                          className="p-2 cursor-pointer text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Results Count */}
      {!isLoading && segments.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredSegments.length} of {segments.length} segments for "
          {dialogueTitle}"
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {modalMode === "create" ? "Add New Segment" : "Edit Segment"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="text-gray-400 cursor-pointer hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Dialogue Display (Static) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dialogue
                </label>
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                  <span className="text-gray-700 font-medium">
                    {dialogueTitle}
                  </span>
                  <input type="hidden" value={formData.dialogueId} readOnly />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Dialogue cannot be changed
                </p>
              </div>

              {/* Text Content */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Text Content *
                </label>
                <textarea
                  value={formData.textContent}
                  onChange={(e) =>
                    setFormData({ ...formData, textContent: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Enter the segment text content..."
                  rows="4"
                  required
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                />
              </div>

              {/* Segment Order */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Segment Order *
                </label>
                <input
                  type="number"
                  value={formData.segmentOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, segmentOrder: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="1"
                  min="1"
                  required
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                />
              </div>

              {/* Audio File */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Audio File (MP3)
                </label>
                <input
                  type="file"
                  accept=".mp3,audio/mpeg"
                  onChange={(e) => handleFileChange(e, "audio")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                />
                {audioFile && (
                  <p className="text-sm text-green-600 mt-2">
                    Selected: {audioFile.name}
                  </p>
                )}
              </div>

              {/* Suggested Audio File */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Suggested Audio File (MP3)
                </label>
                <input
                  type="file"
                  accept=".mp3,audio/mpeg"
                  onChange={(e) => handleFileChange(e, "suggested")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                />
                {suggestedAudioFile && (
                  <p className="text-sm text-green-600 mt-2">
                    Selected: {suggestedAudioFile.name}
                  </p>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="flex-1 px-4 cursor-pointer py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="flex-1 px-4 cursor-pointer py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {modalMode === "create" ? "Creating..." : "Updating..."}
                    </>
                  ) : modalMode === "create" ? (
                    "Create Segment"
                  ) : (
                    "Update Segment"
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

export default SegmentsManagement;
