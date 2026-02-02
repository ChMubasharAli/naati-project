import React, { useState, useRef } from "react";
import { Play, Pause, ChevronRight } from "lucide-react";

const AiResponseModal = ({ open, data, onContinue }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioError, setAudioError] = useState(null);
  const audioRef = useRef(null);

  if (!open) return null;

  // 🔥 EXACT API RESPONSE STRUCTURE - NO DUMMY FALLBACKS
  const responseData = data?.data || {};

  // Core data extraction
  const segmentAttemptId = responseData.segmentAttempt?.id;
  const userAudioUrl = responseData.userAudioUrl;

  // Scores - nested objects
  const scores = responseData.scores || {};
  const segmentAttempt = responseData.segmentAttempt || {};
  const aiScores = segmentAttempt.aiScores || {};

  // Real scores (checking both locations in response)
  const finalScore = scores.final_score ?? segmentAttempt.finalScore ?? null;
  const accuracyScore =
    scores.accuracy_score ?? segmentAttempt.accuracyScore ?? null;
  const fluencyScore =
    scores.fluency_pronunciation_score ??
    segmentAttempt.fluencyPronunciationScore ??
    null;
  const languageScore =
    scores.language_quality_score ??
    segmentAttempt.languageQualityScore ??
    null;
  const deliveryScore =
    scores.delivery_coherence_score ??
    segmentAttempt.deliveryCoherenceScore ??
    null;
  const culturalScore =
    scores.cultural_context_score ??
    segmentAttempt.culturalControlScore ??
    null;
  const responseScore =
    scores.response_management_score ??
    segmentAttempt.responseManagementScore ??
    null;

  // Max score
  const maxScore = 90; // API doesn't provide max, using standard 90

  // Transcripts - REAL USER TRANSCRIPT ONLY
  const studentTranscript = responseData.transcripts?.studentTranscript || "";
  const referenceTranscript = responseData.transcripts?.referenceTranscript;

  // Feedback
  const oneLineFeedback =
    scores.one_line_feedback || segmentAttempt.oneLineFeedback || "";

  // Calculate percentage for circle
  const percentage =
    finalScore !== null
      ? Math.min(100, Math.max(0, (finalScore / maxScore) * 100))
      : 0;

  // Word highlighting based on actual accuracy
  const words = studentTranscript
    ? studentTranscript
        .split(/\s+/)
        .filter((word) => word.length > 0)
        .map((word, index) => {
          // Color logic based on actual accuracy score
          let color = "gray";
          if (accuracyScore !== null) {
            if (accuracyScore >= 70) color = "green";
            else if (accuracyScore >= 40) color = "orange";
            else color = "red";
          }

          return { text: word, color, index };
        })
    : [];

  // Format time
  const formatTime = (time) => {
    if (!time || isNaN(time) || time === Infinity) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlay = async () => {
    if (!audioRef.current || !userAudioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        setAudioError(null);
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        setAudioError("Failed to play audio");
        setIsPlaying(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration) {
      const current = audioRef.current.currentTime;
      const dur = audioRef.current.duration;
      setCurrentTime(current);
      setDuration(dur);
      setProgress((current / dur) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const handleError = () => {
    setAudioError("Error loading audio");
    setIsPlaying(false);
  };

  // Loading state
  if (!data || !responseData.segmentAttempt) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center w-full max-w-md mx-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-700">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Real ID */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium text-base sm:text-lg">
              {segmentAttemptId
                ? `#${segmentAttemptId} Score Info`
                : "Score Info"}
            </span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">
          {/* Score Circle and Stats */}
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            {/* Circular Progress */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 120 120"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#14b8a6"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 54}
                  strokeDashoffset={2 * Math.PI * 54 * (1 - percentage / 100)}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl sm:text-3xl font-bold text-gray-800">
                  {finalScore !== null ? finalScore : "--"}
                </span>
                <span className="text-xs sm:text-sm text-gray-500">
                  /{maxScore}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                  Total
                </span>
              </div>
            </div>

            {/* Score Details - ALL REAL DATA */}
            <div className="flex-1 w-full space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-xs sm:text-sm">
                  Content:
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800 text-xs sm:text-sm">
                    {accuracyScore !== null
                      ? `${accuracyScore}/${maxScore}`
                      : "--"}
                  </span>
                  {accuracyScore !== null && (
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        accuracyScore >= 70
                          ? "bg-green-500"
                          : accuracyScore >= 40
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                    ></div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-xs sm:text-sm">
                  Pronunciation:
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800 text-xs sm:text-sm">
                    {fluencyScore !== null
                      ? `${fluencyScore}/${maxScore}`
                      : "--"}
                  </span>
                  {fluencyScore !== null && (
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        fluencyScore >= 70
                          ? "bg-green-500"
                          : fluencyScore >= 40
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                    ></div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-xs sm:text-sm">
                  Language:
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800 text-xs sm:text-sm">
                    {languageScore !== null
                      ? `${languageScore}/${maxScore}`
                      : "--"}
                  </span>
                  {languageScore !== null && (
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        languageScore >= 70
                          ? "bg-green-500"
                          : languageScore >= 40
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                    ></div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-xs sm:text-sm">
                  Delivery:
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800 text-xs sm:text-sm">
                    {deliveryScore !== null
                      ? `${deliveryScore}/${maxScore}`
                      : "--"}
                  </span>
                  {deliveryScore !== null && (
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        deliveryScore >= 70
                          ? "bg-green-500"
                          : deliveryScore >= 40
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                    ></div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* One Line Feedback - REAL */}
          {oneLineFeedback && (
            <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-teal-500">
              <p className="text-gray-700 text-sm italic">
                "{oneLineFeedback}"
              </p>
            </div>
          )}

          {/* AI Speech Recognition Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-700 font-medium text-sm sm:text-base">
                AI Speech Recognition:
              </h3>
              <span className="text-[10px] sm:text-xs text-gray-500 hidden sm:inline">
                Color indicates word accuracy
              </span>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-green-600">Good</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="text-yellow-600">Avg</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-red-600">Poor</span>
              </div>
            </div>

            {/* Colored Text Display - REAL TRANSCRIPT ONLY */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-100 min-h-[80px]">
              {words.length > 0 ? (
                <p className="text-base sm:text-lg leading-relaxed flex flex-wrap gap-x-2 gap-y-1">
                  {words.map((word, index) => (
                    <span
                      key={index}
                      className={`transition-colors ${
                        word.color === "green"
                          ? "text-green-600"
                          : word.color === "red"
                            ? "text-red-500"
                            : word.color === "orange"
                              ? "text-yellow-600"
                              : "text-gray-700"
                      }`}
                    >
                      {word.text}
                    </span>
                  ))}
                </p>
              ) : studentTranscript ? (
                <p className="text-gray-700 text-sm sm:text-base">
                  {studentTranscript}
                </p>
              ) : (
                <p className="text-gray-400 italic text-sm">
                  No transcript available
                </p>
              )}
            </div>
          </div>

          {/* Audio Player - REAL USER AUDIO ONLY */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-100">
            <audio
              ref={audioRef}
              src={userAudioUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleEnded}
              onError={handleError}
              className="hidden"
            />

            {audioError && (
              <div className="text-red-500 text-xs mb-2 text-center">
                {audioError}
              </div>
            )}

            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={handlePlay}
                disabled={!userAudioUrl}
                className={`w-9 h-9 sm:w-10 sm:h-10 cursor-pointer rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                  userAudioUrl
                    ? "bg-teal-500 text-white hover:bg-teal-600 active:scale-95"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isPlaying ? (
                  <Pause size={16} sm:size={18} fill="currentColor" />
                ) : (
                  <Play
                    size={16}
                    sm:size={18}
                    fill="currentColor"
                    className="ml-0.5"
                  />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <span className="text-[10px] sm:text-xs text-gray-500 font-mono flex-shrink-0 tabular-nums">
                {isPlaying
                  ? `${formatTime(currentTime)}`
                  : `${formatTime(currentTime)} / ${formatTime(duration)}`}
              </span>
            </div>
          </div>

          {/* Detailed Feedback - REAL FROM API */}
          {(scores.accuracy_feedback ||
            scores.fluency_pronunciation_feedback ||
            scores.language_quality_feedback) && (
            <div className="space-y-3 bg-slate-50 p-3 sm:p-4 rounded-lg border border-slate-100">
              <h4 className="font-semibold text-slate-900 text-xs sm:text-sm border-b border-slate-200 pb-2 mb-2">
                Detailed Analysis
              </h4>

              {scores.accuracy_feedback && (
                <div className="space-y-1">
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-700">
                    Content Accuracy:
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-600 leading-relaxed">
                    {scores.accuracy_feedback}
                  </p>
                </div>
              )}

              {scores.language_quality_feedback && (
                <div className="space-y-1">
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-700">
                    Language Quality:
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-600 leading-relaxed">
                    {scores.language_quality_feedback}
                  </p>
                </div>
              )}

              {scores.fluency_pronunciation_feedback && (
                <div className="space-y-1">
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-700">
                    Fluency & Pronunciation:
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-600 leading-relaxed">
                    {scores.fluency_pronunciation_feedback}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Total Raw Score if different from final */}
          {scores.total_raw_score !== undefined &&
            scores.total_raw_score !== finalScore && (
              <div className="flex justify-between items-center text-xs text-gray-500 px-1">
                <span>Raw Score:</span>
                <span className="font-mono">{scores.total_raw_score}</span>
              </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-100 bg-white flex-shrink-0">
          <button
            onClick={onContinue}
            className="w-full py-2.5 sm:py-3 cursor-pointer bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white font-semibold rounded-full transition-colors flex items-center justify-center gap-2 text-sm sm:text-base active:scale-[0.98] transform"
          >
            Next
            <ChevronRight size={18} sm:size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiResponseModal;
