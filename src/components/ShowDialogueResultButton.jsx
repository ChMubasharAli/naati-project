import React, { useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { Modal, Button } from "@mantine/core";
import {
  Loader2,
  CheckCircle,
  MessageSquare,
  BarChart3,
  Clock,
  Volume2,
  X,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const ShowDialogueResultButton = ({
  dialogueId,
  examType = "complete_dialogue",
}) => {
  const { user } = useAuth();
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);
  const [examResult, setExamResult] = useState(null);
  const [error, setError] = useState(null);

  const fetchExamResult = async () => {
    if (!user?.id || !dialogueId) {
      setError("User or dialogue information missing");
      return;
    }

    setLoading(true);
    setError(null);
    setExamResult(null);

    try {
      // Step 1: Create exam attempt
      const attemptResponse = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/exams`,
        {
          examType: examType,
          dialogueId: dialogueId,
          userId: user.id,
        },
      );

      const attemptId = attemptResponse.data.attempt?.id;

      if (!attemptId) {
        throw new Error("No attempt ID received");
      }

      // Step 2: Get computed result
      const resultResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/exams/computeResult/${attemptId}`,
      );

      if (resultResponse.data.success) {
        setExamResult(resultResponse.data);
      } else {
        throw new Error("Failed to compute result");
      }
    } catch (err) {
      console.error("Error fetching exam result:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load results. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    open();
    fetchExamResult();
  };

  const formatScore = (score) => {
    if (score === undefined || score === null) return "N/A";
    return parseFloat(score).toFixed(1);
  };

  return (
    <>
      {/* Show Result Button */}
      <button
        onClick={handleButtonClick}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg hover:scale-105"
      >
        Show Result
      </button>

      {/* Result Modal */}
      <Modal
        opened={opened}
        onClose={close}
        size="xl"
        radius="lg"
        withCloseButton={true}
        centered
        overlayProps={{ blur: 3, opacity: 0.25 }}
        className="relative"
      >
        <div className="max-h-[70vh] sm:max-h-[75vh] overflow-y-auto pr-1 sm:pr-2">
          {loading ? (
            <div className="text-center py-8">
              <div className="flex justify-center">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
              </div>
              <p className="mt-4 text-gray-600 font-medium">
                Loading your results...
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This may take a few moments
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-700 mb-2">
                  Error Loading Results
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button
                  onClick={fetchExamResult}
                  color="red"
                  size="md"
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : examResult ? (
            <div className="space-y-6">
              {/* Overall Summary */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-lg border border-emerald-200">
                <h3 className="font-bold text-xl text-emerald-800 mb-4">
                  <CheckCircle className="inline mr-2" size={22} />
                  Overall Performance Summary
                </h3>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Final Score</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatScore(examResult.summary?.averages?.finalScore)}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Accuracy</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatScore(examResult.summary?.averages?.accuracyScore)}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">
                      Language Quality
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatScore(
                        examResult.summary?.averages?.languageQualityScore,
                      )}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Total Segments</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {examResult.summary?.segmentCount ||
                        examResult.segments?.length ||
                        0}
                    </p>
                  </div>
                </div>

                {/* Additional Scores */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <p className="text-xs text-green-600 font-medium">
                      Fluency & Pronunciation
                    </p>
                    <p className="font-semibold text-green-700 text-base">
                      {formatScore(
                        examResult.summary?.averages?.fluencyPronunciationScore,
                      )}
                    </p>
                  </div>

                  <div className="bg-orange-50 p-3 rounded border border-orange-200">
                    <p className="text-xs text-orange-600 font-medium">
                      Delivery & Coherence
                    </p>
                    <p className="font-semibold text-orange-700 text-base">
                      {formatScore(
                        examResult.summary?.averages?.deliveryCoherenceScore,
                      )}
                    </p>
                  </div>

                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <p className="text-xs text-yellow-600 font-medium">
                      Cultural Control
                    </p>
                    <p className="font-semibold text-yellow-700 text-base">
                      {formatScore(
                        examResult.summary?.averages?.culturalControlScore,
                      )}
                    </p>
                  </div>

                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <p className="text-xs text-red-600 font-medium">
                      Response Management
                    </p>
                    <p className="font-semibold text-red-700 text-base">
                      {formatScore(
                        examResult.summary?.averages?.responseManagementScore,
                      )}
                    </p>
                  </div>

                  <div className="bg-indigo-50 p-3 rounded border border-indigo-200">
                    <p className="text-xs text-indigo-600 font-medium">
                      Total Raw Score
                    </p>
                    <p className="font-semibold text-indigo-700 text-base">
                      {formatScore(examResult.summary?.averages?.totalRawScore)}
                    </p>
                  </div>
                </div>

                {/* Overall Feedback */}
                {examResult.summary?.overallFeedback && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-2 text-base">
                      <MessageSquare className="inline mr-2" size={16} />
                      Overall Feedback
                    </h4>
                    <div className="text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded border border-gray-300 text-sm">
                      {examResult.summary.overallFeedback}
                    </div>
                  </div>
                )}
              </div>

              {/* Segments Breakdown */}
              {examResult.segments && examResult.segments.length > 0 && (
                <div>
                  <h3 className="font-bold text-xl text-gray-800 mb-4">
                    <BarChart3 className="inline mr-2" size={20} />
                    Segment-wise Detailed Analysis
                  </h3>

                  <div className="space-y-4">
                    {examResult.segments.map((segment, index) => (
                      <div
                        key={segment.id || index}
                        className="bg-white rounded-lg border border-gray-300 overflow-hidden"
                      >
                        {/* Segment Header */}
                        <div className="bg-gray-100 p-4 border-b border-gray-300">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <h4 className="font-bold text-lg text-gray-800">
                              Segment {index + 1}
                              <span className="ml-2 text-sm font-normal text-gray-600">
                                (ID: {segment.segmentId})
                              </span>
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">
                                Final Score:
                              </span>
                              <span className="text-xl font-bold text-emerald-600">
                                {formatScore(segment.finalScore)}
                              </span>
                            </div>
                          </div>

                          {/* Segment Details */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-gray-500" />
                              <span className="text-xs text-gray-600">
                                Repeat:
                              </span>
                              <span className="font-medium text-xs">
                                {segment.repeatCount || 1}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Volume2 size={14} className="text-gray-500" />
                              <span className="text-xs text-gray-600">
                                Language:
                              </span>
                              <span className="font-medium text-xs">
                                {segment.language || "en"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4">
                          {/* User Transcription */}
                          <div className="mb-4">
                            <h5 className="font-semibold text-gray-700 mb-2 flex items-center text-base">
                              <MessageSquare className="mr-2" size={16} />
                              Your Response
                            </h5>
                            <div className="bg-gray-50 p-4 rounded border border-gray-300">
                              <p className="text-gray-800 font-medium text-base">
                                {segment.userTranscription}
                              </p>
                              {segment.audioUrl && (
                                <div className="mt-2">
                                  <audio
                                    src={segment.audioUrl}
                                    controls
                                    className="w-full mt-2"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* AI Scores */}
                          {segment.aiScores && (
                            <div className="mb-4">
                              <h5 className="font-semibold text-gray-700 mb-2 text-base">
                                AI Detailed Scores
                              </h5>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                  <p className="text-xs text-blue-600 font-medium">
                                    Accuracy Score
                                  </p>
                                  <p className="text-lg font-bold text-blue-700">
                                    {segment.aiScores.accuracy_score ||
                                      formatScore(segment.accuracyScore)}
                                  </p>
                                </div>

                                <div className="bg-purple-50 p-3 rounded border border-purple-200">
                                  <p className="text-xs text-purple-600 font-medium">
                                    Language Quality
                                  </p>
                                  <p className="text-lg font-bold text-purple-700">
                                    {segment.aiScores.language_quality_score ||
                                      formatScore(segment.languageQualityScore)}
                                  </p>
                                </div>

                                <div className="bg-green-50 p-3 rounded border border-green-200">
                                  <p className="text-xs text-green-600 font-medium">
                                    Fluency & Pronunciation
                                  </p>
                                  <p className="text-lg font-bold text-green-700">
                                    {segment.aiScores
                                      .fluency_pronunciation_score ||
                                      formatScore(
                                        segment.fluencyPronunciationScore,
                                      )}
                                  </p>
                                </div>

                                <div className="bg-orange-50 p-3 rounded border border-orange-200">
                                  <p className="text-xs text-orange-600 font-medium">
                                    Delivery & Coherence
                                  </p>
                                  <p className="text-lg font-bold text-orange-700">
                                    {segment.aiScores
                                      .delivery_coherence_score ||
                                      formatScore(
                                        segment.deliveryCoherenceScore,
                                      )}
                                  </p>
                                </div>

                                <div className="bg-red-50 p-3 rounded border border-red-200">
                                  <p className="text-xs text-red-600 font-medium">
                                    Cultural Context
                                  </p>
                                  <p className="font-semibold text-red-700 text-base">
                                    {segment.aiScores.cultural_context_score ||
                                      formatScore(segment.culturalControlScore)}
                                  </p>
                                </div>

                                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                                  <p className="text-xs text-yellow-600 font-medium">
                                    Response Management
                                  </p>
                                  <p className="font-semibold text-yellow-700 text-base">
                                    {segment.aiScores
                                      .response_management_score ||
                                      formatScore(
                                        segment.responseManagementScore,
                                      )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* One Line Feedback */}
                          <div className="bg-emerald-50 p-4 rounded border border-emerald-200">
                            <h5 className="font-semibold text-emerald-800 mb-2 text-base">
                              Summary Feedback
                            </h5>
                            <p className="text-emerald-700 text-base">
                              {segment.oneLineFeedback ||
                                segment.feedback ||
                                segment.aiScores?.one_line_feedback ||
                                "No feedback available"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <Button onClick={close} color="teal" size="md">
                  Close Results
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>
    </>
  );
};

export default ShowDialogueResultButton;
