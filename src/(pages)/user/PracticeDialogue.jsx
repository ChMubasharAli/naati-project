import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Play,
  Square,
  HelpCircle,
  ArrowRight,
  User,
  Loader2,
  RefreshCw,
  BarChart3,
  MessageSquare,
  Volume2,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Modal, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  startExamAttempt,
  submitSegment,
  getExamResult,
} from "../../api/exams";
import { useAuth } from "../../context/AuthContext";

const PracticeDialogue = () => {
  // State variables
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: loggedInUser, hasActiveSubscription, subscription } = useAuth();

  // Track free mock test usage
  const [freeTestUsed, setFreeTestUsed] = useState(false);
  const [isFreeTestActive, setIsFreeTestActive] = useState(false);

  // Get URL parameters
  const dialogueId = searchParams.get("dialogueId");
  const examType = searchParams.get("examType") || "complete_dialogue";
  const languageCode = searchParams.get("languageCode");

  // User ID from auth
  const userId = loggedInUser?.id;

  // Check if user has used free test
  useEffect(() => {
    if (loggedInUser && !hasActiveSubscription) {
      const usedFreeTest = localStorage.getItem(
        `freeTestUsed_${loggedInUser.id}`,
      );
      setFreeTestUsed(usedFreeTest === "true");
    }
  }, [loggedInUser, hasActiveSubscription]);

  // Exam data state
  const [examData, setExamData] = useState(null);
  const [segments, setSegments] = useState([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [examAttemptId, setExamAttemptId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLastSegment, setIsLastSegment] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudios, setRecordedAudios] = useState({});
  const [attemptsCount, setAttemptsCount] = useState({});
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [showRetryButton, setShowRetryButton] = useState(false);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const [waveHeights, setWaveHeights] = useState([]);

  // Result modal
  const [opened, { open, close }] = useDisclosure(false);
  const [examResult, setExamResult] = useState(null);

  // 🔥 CRITICAL FIX: Add initialization tracking refs
  const isInitializedRef = useRef(false);
  const initializationInProgressRef = useRef(false);

  // Refs
  const originalAudioRef = useRef(null);
  const suggestedAudioRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const videoRef = useRef(null);

  // Initialize wave heights
  useEffect(() => {
    const heights = Array.from({ length: 20 }, () => Math.random() * 100);
    setWaveHeights(heights);
  }, [currentSegmentIndex]);

  // 🔥 FIXED: Initialize exam - RUNS ONLY ONCE
  useEffect(() => {
    // ✅ Early return conditions
    if (!dialogueId || !userId) {
      console.error("Missing dialogue ID or user ID");
      navigate("/user");
      return;
    }

    // ✅ Already initialized check
    if (isInitializedRef.current) {
      return;
    }

    // ✅ Already in progress check
    if (initializationInProgressRef.current) {
      return;
    }

    // ✅ Mark as in progress
    initializationInProgressRef.current = true;

    const initializeExam = async () => {
      try {
        setIsLoading(true);

        const examData = {
          examType,
          dialogueId: parseInt(dialogueId),
          userId,
        };

        console.log("🔥 API CALL: startExamAttempt - ONLY ONCE");
        const response = await startExamAttempt(examData);

        // Save exam data
        setExamData(response);
        setSegments(response.segments || []);
        setExamAttemptId(response.attempt.id);

        // Initialize recordings and attempts objects
        const initialRecordings = {};
        const initialAttempts = {};
        response.segments?.forEach((segment) => {
          initialRecordings[segment.id] = null;
          initialAttempts[segment.id] = 0;
        });

        setRecordedAudios(initialRecordings);
        setAttemptsCount(initialAttempts);

        // Check if it's the last segment
        setIsLastSegment(response.segments.length === 1);

        // Save to localStorage for persistence
        localStorage.setItem("examData", JSON.stringify(response));

        // ✅ Mark as initialized
        isInitializedRef.current = true;
      } catch (error) {
        console.error("Failed to initialize exam:", error);
        alert("Failed to start exam. Please try again.");
        navigate("/user/dialogues");
      } finally {
        setIsLoading(false);
        initializationInProgressRef.current = false;
      }
    };

    initializeExam();

    // Cleanup on unmount
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []); // ✅ EMPTY dependency array - runs only on mount

  // Initialize camera
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        mediaStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Camera access error:", error);
      }
    };

    if (!isLoading && examData) {
      initializeCamera();
    }
  }, [isLoading, examData]);

  // Get current segment
  const currentSegment = segments[currentSegmentIndex];

  // Get current segment's recording and attempts
  const currentRecording = currentSegment
    ? recordedAudios[currentSegment.id]
    : null;
  const currentAttempts = currentSegment ? attemptsCount[currentSegment.id] : 0;

  // Update last segment status
  useEffect(() => {
    if (segments.length > 0) {
      setIsLastSegment(currentSegmentIndex === segments.length - 1);
    }
  }, [currentSegmentIndex, segments]);

  // Update retry button based on current recording
  useEffect(() => {
    if (currentSegment && recordedAudios[currentSegment.id]) {
      setShowRetryButton(true);
    } else {
      setShowRetryButton(false);
    }
  }, [currentSegment, recordedAudios]);

  // Play original audio and auto-start recording when finished
  const playOriginalAudioAndAutoRecord = () => {
    if (originalAudioRef.current) {
      // Create a hidden audio element for auto-play
      const hiddenAudio = new Audio(currentSegment?.audioUrl);

      hiddenAudio
        .play()
        .then(() => {
          setIsAudioPlaying(true);

          // Auto start recording when audio ends
          hiddenAudio.onended = () => {
            setIsAudioPlaying(false);
            startRecording(); // Auto start recording
          };

          // If audio fails to play, show error
          hiddenAudio.onerror = () => {
            setIsAudioPlaying(false);
            alert("Failed to play audio. Please try again.");
          };
        })
        .catch((error) => {
          console.error("Audio play error:", error);
          setIsAudioPlaying(false);
          alert("Failed to play audio. Please make sure audio is available.");
        });
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(audioStream, {
        mimeType: "audio/webm;codecs=opus",
      });

      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        setIsRecording(false);

        // Create audio blob
        const audioBlob = new Blob(chunks, { type: "audio/webm" });

        // Save recording for current segment
        if (currentSegment) {
          setRecordedAudios((prev) => ({
            ...prev,
            [currentSegment.id]: audioBlob,
          }));

          // Update attempts count for this segment
          setAttemptsCount((prev) => ({
            ...prev,
            [currentSegment.id]: (prev[currentSegment.id] || 0) + 1,
          }));
        }

        // Stop all audio tracks
        audioStream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error("Recording error:", error);
      alert("Microphone access denied. Please allow microphone access.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
    }
  };

  // Retry recording
  const handleRetry = () => {
    if (currentSegment) {
      // Clear recording for current segment
      setRecordedAudios((prev) => ({
        ...prev,
        [currentSegment.id]: null,
      }));

      // Play original audio again
      playOriginalAudioAndAutoRecord();
    }
  };

  // Submit current segment (background API call)
  const submitCurrentSegment = useCallback(
    async (segmentId, audioBlob) => {
      if (!segmentId || !audioBlob || !examAttemptId || !currentSegment) return;

      try {
        // Create FormData
        const formData = new FormData();
        formData.append("dialogueId", dialogueId);
        formData.append(
          "language",
          examData?.dialogue?.Language?.name || languageCode || "English",
        );
        formData.append("segmentId", segmentId);
        formData.append("audioTranscript", currentSegment.textContent);
        formData.append("examAttemptId", examAttemptId);
        formData.append("audioUrl", currentSegment.audioUrl || "");
        formData.append(
          "suggestedAudioUrl",
          currentSegment.suggestedAudioUrl || "",
        );
        formData.append("userId", userId);
        formData.append("attemptCount", attemptsCount[segmentId] || 0);

        // Append audio file
        formData.append("userAudio", audioBlob, "recording.webm");

        // Submit segment
        await submitSegment(formData);
      } catch (error) {
        console.error("Failed to submit segment:", error);
      }
    },
    [
      dialogueId,
      examData,
      languageCode,
      examAttemptId,
      userId,
      currentSegment,
      attemptsCount,
    ],
  );

  // Handle NEXT button click (for all segments except last)
  const handleNextClick = async () => {
    if (!currentSegment || !currentRecording) {
      alert("Please record your response first.");
      return;
    }

    // Submit current segment in background (ai-exam API)
    submitCurrentSegment(currentSegment.id, currentRecording);

    // Move to next segment immediately (no loading)
    setCurrentSegmentIndex((prev) => prev + 1);
  };

  // Handle FINISH button click (for last segment only)
  const handleFinishClick = async () => {
    if (!currentSegment || !currentRecording) {
      alert("Please record your response first.");
      return;
    }

    // Show loading overlay for final submission
    setIsSubmittingFinal(true);

    try {
      // 1. First submit last segment (ai-exam API)
      await submitCurrentSegment(currentSegment.id, currentRecording);

      // 2. Then get final result
      const result = await getExamResult(examAttemptId);
      setExamResult(result);

      // Mark free test as used if user is not subscribed
      if (!hasActiveSubscription && loggedInUser) {
        localStorage.setItem(`freeTestUsed_${loggedInUser.id}`, "true");
        setFreeTestUsed(true);
      }

      // Clear localStorage
      localStorage.removeItem("examData");

      // Open result modal
      open();
    } catch (error) {
      console.error("Failed to get result:", error);
      alert("Failed to get exam results. Please try again.");
    } finally {
      setIsSubmittingFinal(false);
    }
  };

  // Handle previous button click
  const handlePreviousClick = () => {
    if (currentSegmentIndex > 0) {
      setCurrentSegmentIndex((prev) => prev - 1);
    }
  };

  // Load from localStorage on refresh
  useEffect(() => {
    const savedExamData = localStorage.getItem("examData");
    if (savedExamData) {
      const parsedData = JSON.parse(savedExamData);
      setExamData(parsedData);
      setSegments(parsedData.segments || []);
      setExamAttemptId(parsedData.attempt.id);

      const initialRecordings = {};
      const initialAttempts = {};
      parsedData.segments?.forEach((segment) => {
        initialRecordings[segment.id] = null;
        initialAttempts[segment.id] = 0;
      });

      setRecordedAudios(initialRecordings);
      setAttemptsCount(initialAttempts);

      // ✅ Mark as initialized when loading from localStorage
      isInitializedRef.current = true;
    }
  }, []);

  // Wave animation styles
  const waveStyle = {
    animation: isAudioPlaying
      ? "waveAnimation 1s ease-in-out infinite alternate"
      : "none",
  };

  // Add CSS for wave animation
  const waveAnimationCSS = `
    @keyframes waveAnimation {
      0% { height: 30%; }
      100% { height: 100%; }
    }
  `;

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <p className="text-gray-600 text-center">Please login to continue</p>
        <button
          onClick={() => navigate("/login")}
          className="mt-4 cursor-pointer px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="flex justify-center">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
        <p className="text-gray-600 text-center">Loading exam...</p>
      </div>
    );
  }

  if (!examData || segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <p className="text-gray-600 text-center">No exam data found</p>
        <button
          onClick={() => navigate("/user")}
          className="mt-4 cursor-pointer px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Add wave animation CSS */}
      <style>{waveAnimationCSS}</style>

      {/* Loading Overlay for Final Submission */}
      {isSubmittingFinal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex flex-col items-center">
              <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-500 animate-spin mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 text-center">
                Processing Final Submission
              </h3>
              <p className="text-gray-600 text-center text-sm sm:text-base">
                Submitting your responses and calculating results...
                <br />
                <span className="text-xs sm:text-sm">
                  This may take a moment
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col  w-full ">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-4 py-2 border-b border-gray-200">
          <div className="flex items-center mb-2 sm:mb-0">
            <div className="ml-2 leading-tight">
              <div className="text-lg sm:text-xl font-bold text-[#006b5e] uppercase tracking-tighter">
                PREP SMART
              </div>
              <div className="text-xs sm:text-sm text-[#006b5e] font-medium tracking-tighter">
                CCL Platform
              </div>
            </div>
          </div>
          <div className="flex items-center text-xs sm:text-[13px] text-gray-600">
            <div className="bg-[#006b5e] p-1 rounded-full text-white mr-1">
              <User size={12} className="sm:size-[14px]" />
            </div>
            <span className="truncate max-w-[150px] sm:max-w-none">
              {loggedInUser?.email}
            </span>
          </div>
        </header>

        {/* Breadcrumb & Progress Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-b border-gray-100 text-[10px] sm:text-[11px] text-gray-500">
          <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-0 flex-wrap">
            <span className="cursor-pointer" onClick={() => navigate("/user")}>
              🏠
            </span>
            <span className="hidden xs:inline">
              CCL Practice dialogue -{" "}
              {examData?.dialogue?.Language?.name || "Language"}
            </span>
            <span className="xs:hidden">
              Dialogue - {examData?.dialogue?.Language?.name || "Language"}
            </span>
            <span>/</span>
            <span className="text-gray-400">Dialogue</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-nowrap">
              {currentSegmentIndex + 1}/{segments.length}
            </span>
            <div className="w-24 sm:w-32 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200 flex-grow sm:flex-grow-0">
              <div
                className="h-full bg-[#006b5e] opacity-30 transition-all duration-300"
                style={{
                  width: `${
                    ((currentSegmentIndex + 1) / segments.length) * 100
                  }%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="grow px-4 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-12">
            {/* Left Instructions */}
            <div className="flex-1 space-y-3 sm:space-y-4 text-xs sm:text-[13.5px] text-[#444] leading-relaxed">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-[18px] font-bold text-[#3db39e] uppercase mb-4 sm:mb-6 lg:mb-8 tracking-wide text-center sm:text-left">
                  {examData?.dialogue?.title || "Dialogue"}
                </h2>

                {/* Free Test Badge - Only show for non-subscribed users */}
                {!hasActiveSubscription && !freeTestUsed && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                    🎁 Try Now - Free Test
                  </span>
                )}

                {/* Subscription Required Badge */}
                {!hasActiveSubscription && freeTestUsed && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                    🔒 Premium Required
                  </span>
                )}

                {/* Premium User Badge */}
                {hasActiveSubscription && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ✅ Premium Access
                  </span>
                )}
              </div>

              {/* Access Control Message */}
              {!hasActiveSubscription && freeTestUsed && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Premium Access Required
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>
                          You have used your free test. Upgrade to premium for
                          unlimited access to:
                        </p>
                        <ul className="list-disc pl-5 mt-1">
                          <li>All practice dialogues</li>
                          <li>Advanced analytics</li>
                          <li>Full mock tests</li>
                        </ul>
                        <button
                          onClick={() => navigate("/user/subscriptions")}
                          className="mt-3 cursor-pointer px-4 py-2 cursor-pointer bg-gradient-to-r from-red-600 to-orange-600 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                        >
                          Upgrade to Premium
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Instructions - Only show if access allowed */}
              {hasActiveSubscription || !freeTestUsed ? (
                <>
                  <p>
                    This segment is intended to{" "}
                    <strong>test your audio and visual equipment</strong> prior
                    to taking the full CCL test.
                  </p>
                  <p>
                    Click on <strong>Play Audio</strong> below the audio, to
                    hear the segment and test your microphone and camera.
                  </p>
                  <p>
                    You should be able to see yourself, and notice soundwaves
                    when audio will play.
                  </p>
                  <p>
                    Click on <strong>Next </strong>, to upload your recorded
                    audio and move to the next segment.
                  </p>
                  <p>
                    You can also play and listen to the{" "}
                    <strong>Suggested Audio</strong> for this segment, to
                    compare with your recording.
                  </p>

                  <div className="mt-6 sm:mt-8 space-y-2 sm:space-y-3">
                    <p className="font-bold">Repeat:</p>
                    <p>
                      You are able to repeat any segment before you begin
                      speaking (
                      <span className="font-bold underline">
                        one repeat per dialogue without penalty
                      </span>
                      ) to do this:
                    </p>
                    <ul className="list-disc pl-4 sm:pl-5">
                      <li>
                        Click on the <strong>Retry</strong> button for again
                        recording you voice
                      </li>
                    </ul>
                  </div>

                  <div className="mt-8 sm:mt-10 flex items-center gap-2 text-xs sm:text-[13px] flex-wrap">
                    <span>
                      Now you can start your test by clicking on the{" "}
                      <strong>Play Audio </strong> button.
                    </span>

                    {/* Free Test Usage Notice */}
                    {!hasActiveSubscription && !freeTestUsed && (
                      <span className="text-yellow-600 font-medium">
                        (This is your free trial test)
                      </span>
                    )}
                  </div>
                </>
              ) : (
                /* Locked Content for non-subscribed users who used free test */
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-2">
                    Content Locked
                  </h3>
                  <p className="text-gray-600 mb-4">
                    You have already used your free test. Upgrade to premium for
                    unlimited access to all practice dialogues.
                  </p>
                  <button
                    onClick={() => navigate("/user/subscriptions")}
                    className="px-6 cursor-pointer py-3 cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                  >
                    View Pricing Plans
                  </button>
                </div>
              )}

              {/* Current Segment Text - For Small Screens */}
              {(hasActiveSubscription || !freeTestUsed) &&
                currentSegment?.textContent && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 ">
                    <h3 className="font-bold text-gray-700 mb-2">
                      Current Segment:
                    </h3>
                    <p className="text-gray-800">
                      {currentSegment.textContent}
                    </p>
                  </div>
                )}
            </div>

            {/* Right Interface (Video & Audio) */}
            <div className="flex-1">
              {/* Camera Feed */}
              <div className="w-full h-72 rounded-lg   shadow-sm mb-4 sm:mb-6 overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
              </div>

              {/* Audio Section */}
              {hasActiveSubscription || !freeTestUsed ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Hidden audio element for original audio */}
                  {currentSegment?.audioUrl && (
                    <audio
                      ref={originalAudioRef}
                      src={currentSegment.audioUrl}
                      style={{ display: "none" }}
                    />
                  )}

                  {/* Original Audio - Wave visualization */}
                  {currentSegment?.audioUrl && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Original Audio:
                      </p>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        {/* Audio Wave Visualization */}
                        <div className="flex-1 w-full h-12 sm:h-16 bg-gray-100 rounded-lg border border-gray-300 p-3 sm:p-4">
                          <div className="flex items-center justify-center h-full">
                            <div className="flex items-end h-6 sm:h-8 gap-0.5 sm:gap-1">
                              {waveHeights.map((height, index) => (
                                <div
                                  key={index}
                                  className="w-0.5 sm:w-1 bg-emerald-500 rounded-full"
                                  style={{
                                    height: `${height}%`,
                                    ...(isAudioPlaying ? waveStyle : {}),
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={playOriginalAudioAndAutoRecord}
                          disabled={
                            isRecording || currentRecording || isAudioPlaying
                          }
                          className={`px-3 cursor-pointer sm:px-4 py-2 rounded-lg flex items-center gap-1 sm:gap-2 justify-center w-full sm:w-auto ${
                            isRecording || currentRecording || isAudioPlaying
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-emerald-500 text-white hover:bg-emerald-600"
                          }`}
                        >
                          <Play size={14} className="sm:size-[16px]" />
                          <span>Play Audio</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Suggested Audio - With controls */}
                  {currentSegment?.suggestedAudioUrl && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Suggested Audio:
                      </p>
                      <div className="flex items-center gap-4">
                        <audio
                          ref={suggestedAudioRef}
                          src={currentSegment.suggestedAudioUrl}
                          controls
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}

                  {/* Status and Controls */}
                  <div className="space-y-4">
                    {/* Attempts Count */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          Attempts: {currentAttempts}
                        </span>
                        {isRecording && (
                          <div className="flex items-center gap-1 text-red-500">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-xs">Recording...</span>
                          </div>
                        )}
                      </div>

                      {/* Recording Controls */}
                      <div className="flex flex-wrap gap-2 sm:gap-4">
                        {/* Stop Recording Button (only when recording) */}
                        {isRecording && (
                          <button
                            onClick={stopRecording}
                            className="flex cursor-pointer items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm w-full sm:w-auto justify-center"
                          >
                            <Square size={14} className="sm:size-[16px]" />
                            Stop Recording
                          </button>
                        )}

                        {/* Retry Button (after first recording) */}
                        {showRetryButton && (
                          <button
                            onClick={handleRetry}
                            className="flex cursor-pointer items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[#006b5e] hover:bg-[#005a4f] text-white rounded-lg text-sm w-full sm:w-auto justify-center"
                          >
                            <RefreshCw size={14} className="sm:size-[16px]" />
                            Retry
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Next/Finish Button Info */}
                    {currentRecording && !isRecording && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs sm:text-sm font-medium text-green-700">
                          {isLastSegment ? (
                            <>
                              <CheckCircle
                                size={14}
                                className="inline mr-1 sm:size-[16px]"
                              />
                              Ready to finish! Click "Finish" to submit all
                              responses and view results.
                            </>
                          ) : (
                            <>
                              ✓ Recording completed! Click "Next" to continue to
                              the next segment.
                            </>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Locked Audio Section */
                <div className="relative">
                  <div className="absolute inset-0 bg-gray-100 bg-opacity-80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center p-8 z-10">
                    <svg
                      className="w-12 h-12 text-gray-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <h3 className="text-lg font-bold text-gray-700 mb-2">
                      Audio Section Locked
                    </h3>
                    <p className="text-gray-600 text-center mb-4">
                      Upgrade to premium to access audio recording features
                    </p>
                    <button
                      onClick={() => navigate("/user/subscriptions")}
                      className="px-6 cursor-pointer cursor-pointer py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Unlock Premium
                    </button>
                  </div>

                  {/* Blurred Original Audio Section */}
                  <div className="filter blur-sm">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Original Audio:
                    </p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                      <div className="flex-1 w-full h-12 sm:h-16 bg-gray-100 rounded-lg border border-gray-300 p-3 sm:p-4 opacity-50">
                        <div className="flex items-center justify-center h-full">
                          <div className="flex items-end h-6 sm:h-8 gap-0.5 sm:gap-1">
                            {waveHeights.map((height, index) => (
                              <div
                                key={index}
                                className="w-0.5 sm:w-1 bg-gray-400 rounded-full"
                                style={{ height: `${height}%` }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <button
                        disabled
                        className="px-3 sm:px-4 cursor-pointer py-2 rounded-lg flex items-center gap-1 sm:gap-2 justify-center w-full sm:w-auto bg-gray-300 text-gray-500 cursor-not-allowed"
                      >
                        <Play size={14} className="sm:size-[16px]" />
                        <span>Play Audio</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer / Bottom Progress */}
        <footer className="w-full mt-auto">
          {/* Segment Progress Dots */}
          <div className="flex w-full h-1.5 gap-0.5 sm:gap-1">
            {segments.map((_, i) => (
              <div
                key={i}
                className={`grow border-r border-white last:border-0 ${
                  i <= currentSegmentIndex ? "bg-[#3db39e]" : "bg-gray-200"
                }`}
              ></div>
            ))}
          </div>

          {/* Navigation Buttons - Only show if user has access */}
          {(hasActiveSubscription || !freeTestUsed) && (
            <div className="flex justify-end items-center gap-2 sm:gap-4 p-3 sm:p-4 border-t border-gray-100">
              <button
                onClick={handlePreviousClick}
                disabled={currentSegmentIndex === 0 || isSubmittingFinal}
                className={`flex items-center cursor-pointer gap-1 sm:gap-2 text-white text-xs sm:text-[14px] font-medium px-4 sm:px-6 py-2 rounded-md transition-colors ${
                  currentSegmentIndex === 0 || isSubmittingFinal
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                <ChevronLeft size={16} className="sm:size-[18px]" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-2 sm:gap-4">
                {isLastSegment ? (
                  // FINISH Button for last segment
                  <button
                    onClick={handleFinishClick}
                    disabled={!currentRecording || isSubmittingFinal}
                    className={`flex items-center cursor-pointer gap-1 sm:gap-2 text-white text-xs sm:text-[14px] font-medium px-4 sm:px-6 py-2 rounded-md transition-colors ${
                      !currentRecording || isSubmittingFinal
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    <CheckCircle size={16} className="sm:size-[18px]" />
                    <span>Finish</span>
                  </button>
                ) : (
                  // NEXT Button for all other segments
                  <button
                    onClick={handleNextClick}
                    disabled={!currentRecording}
                    className={`flex items-center cursor-pointer gap-1 sm:gap-2 text-white text-xs sm:text-[14px] font-medium px-4 sm:px-6 py-2 rounded-md transition-colors ${
                      !currentRecording
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-[#006b5e] hover:bg-[#005a4f]"
                    }`}
                  >
                    <span>Next</span>
                    <ArrowRight size={16} className="sm:size-[18px]" />
                  </button>
                )}
              </div>
            </div>
          )}
        </footer>

        {/* Result Modal - Made Responsive */}
        <Modal
          opened={opened}
          closeOnClickOutside={false}
          onClose={close}
          title="Exam Results"
          size="lg"
          fullScreen={window.innerWidth < 768}
          radius={"lg"}
          withCloseButton={true}
          centered
          overlayProps={{ blur: 3, opacity: 0.25 }}
        >
          {examResult ? (
            <div className="space-y-4 sm:space-y-6 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto pr-1 sm:pr-2">
              {/* Overall Summary */}
              <div className="bg-linear-to-r from-emerald-50 to-teal-50 p-4 sm:p-6 rounded-lg border border-emerald-200">
                <h3 className="font-bold text-lg sm:text-xl text-emerald-800 mb-3 sm:mb-4">
                  <CheckCircle
                    size={20}
                    className="inline mr-2 sm:size-[24px]"
                  />
                  Overall Performance Summary
                </h3>

                <div className="grid  grid-cols-2  lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">
                      Final Score
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-emerald-600">
                      {examResult.summary?.averages?.finalScore
                        ? parseFloat(
                            examResult.summary.averages.finalScore,
                          ).toFixed(1)
                        : "N/A"}
                    </p>
                  </div>

                  <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">
                      Accuracy
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">
                      {examResult.summary?.averages?.accuracyScore
                        ? parseFloat(
                            examResult.summary.averages.accuracyScore,
                          ).toFixed(1)
                        : "N/A"}
                    </p>
                  </div>

                  <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">
                      Language Quality
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-purple-600">
                      {examResult.summary?.averages?.languageQualityScore
                        ? parseFloat(
                            examResult.summary.averages.languageQualityScore,
                          ).toFixed(1)
                        : "N/A"}
                    </p>
                  </div>

                  <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">
                      Total Segments
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-800">
                      {examResult.summary?.segmentCount ||
                        examResult.segments?.length ||
                        0}
                    </p>
                  </div>
                </div>

                {/* Additional Scores */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="bg-green-50 p-2 sm:p-3 rounded border border-green-200">
                    <p className="text-[10px] sm:text-xs text-green-600 font-medium">
                      Fluency & Pronunciation
                    </p>
                    <p className="font-semibold text-green-700 text-sm sm:text-base">
                      {examResult.summary?.averages?.fluencyPronunciationScore
                        ? parseFloat(
                            examResult.summary.averages
                              .fluencyPronunciationScore,
                          ).toFixed(1)
                        : "N/A"}
                    </p>
                  </div>

                  <div className="bg-orange-50 p-2 sm:p-3 rounded border border-orange-200">
                    <p className="text-[10px] sm:text-xs text-orange-600 font-medium">
                      Delivery & Coherence
                    </p>
                    <p className="font-semibold text-orange-700 text-sm sm:text-base">
                      {examResult.summary?.averages?.deliveryCoherenceScore
                        ? parseFloat(
                            examResult.summary.averages.deliveryCoherenceScore,
                          ).toFixed(1)
                        : "N/A"}
                    </p>
                  </div>

                  <div className="bg-yellow-50 p-2 sm:p-3 rounded border border-yellow-200">
                    <p className="text-[10px] sm:text-xs text-yellow-600 font-medium">
                      Cultural Control
                    </p>
                    <p className="font-semibold text-yellow-700 text-sm sm:text-base">
                      {examResult.summary?.averages?.culturalControlScore
                        ? parseFloat(
                            examResult.summary.averages.culturalControlScore,
                          ).toFixed(1)
                        : "N/A"}
                    </p>
                  </div>

                  <div className="bg-red-50 p-2 sm:p-3 rounded border border-red-200">
                    <p className="text-[10px] sm:text-xs text-red-600 font-medium">
                      Response Management
                    </p>
                    <p className="font-semibold text-red-700 text-sm sm:text-base">
                      {examResult.summary?.averages?.responseManagementScore
                        ? parseFloat(
                            examResult.summary.averages.responseManagementScore,
                          ).toFixed(1)
                        : "N/A"}
                    </p>
                  </div>

                  <div className="bg-indigo-50 p-2 sm:p-3 rounded border border-indigo-200">
                    <p className="text-[10px] sm:text-xs text-indigo-600 font-medium">
                      Total Raw Score
                    </p>
                    <p className="font-semibold text-indigo-700 text-sm sm:text-base">
                      {examResult.summary?.averages?.totalRawScore
                        ? parseFloat(
                            examResult.summary.averages.totalRawScore,
                          ).toFixed(1)
                        : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Overall Feedback */}
                {examResult.summary?.overallFeedback && (
                  <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">
                      <MessageSquare
                        size={14}
                        className="inline mr-2 sm:size-[16px]"
                      />
                      Overall Feedback
                    </h4>
                    <div className="text-gray-700 whitespace-pre-line bg-gray-50 p-3 sm:p-4 rounded border border-gray-300 text-xs sm:text-sm">
                      {examResult.summary.overallFeedback}
                    </div>
                  </div>
                )}
              </div>

              {/* Segments Breakdown */}
              {examResult.segments && examResult.segments.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg sm:text-xl text-gray-800 mb-3 sm:mb-4">
                    <BarChart3
                      size={18}
                      className="inline mr-2 sm:size-[20px]"
                    />
                    Segment-wise Detailed Analysis
                  </h3>

                  <div className="space-y-3 sm:space-y-4">
                    {examResult.segments.map((segment, index) => (
                      <div
                        key={segment.id || index}
                        className="bg-white rounded-lg border border-gray-300 overflow-hidden"
                      >
                        {/* Segment Header */}
                        <div className="bg-gray-100 p-3 sm:p-4 border-b border-gray-300">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <h4 className="font-bold text-base sm:text-lg text-gray-800">
                              Segment {index + 1}
                              <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-normal text-gray-600">
                                (ID: {segment.segmentId})
                              </span>
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm text-gray-600">
                                Final Score:
                              </span>
                              <span className="text-lg sm:text-xl font-bold text-emerald-600">
                                {segment.finalScore
                                  ? parseFloat(segment.finalScore).toFixed(1)
                                  : "N/A"}
                              </span>
                            </div>
                          </div>

                          {/* Segment Details */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-2 sm:mt-3">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Clock
                                size={12}
                                className="text-gray-500 sm:size-[14px]"
                              />
                              <span className="text-xs text-gray-600">
                                Repeat:
                              </span>
                              <span className="font-medium text-xs">
                                {segment.repeatCount || 1}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Volume2
                                size={12}
                                className="text-gray-500 sm:size-[14px]"
                              />
                              <span className="text-xs text-gray-600">
                                Language:
                              </span>
                              <span className="font-medium text-xs">
                                {segment.language || "en"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 sm:p-4">
                          {/* User Transcription */}
                          <div className="mb-3 sm:mb-4">
                            <h5 className="font-semibold text-gray-700 mb-2 flex items-center text-sm sm:text-base">
                              <MessageSquare
                                size={14}
                                className="mr-2 sm:size-[16px]"
                              />
                              Your Response
                            </h5>
                            <div className="bg-gray-50 p-3 sm:p-4 rounded border border-gray-300">
                              <p className="text-gray-800 font-medium text-sm sm:text-base">
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

                          {/* AI Scores from aiScores object */}
                          {segment.aiScores && (
                            <div className="mb-3 sm:mb-4">
                              <h5 className="font-semibold text-gray-700 mb-2 text-sm sm:text-base">
                                AI Detailed Scores
                              </h5>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                                <div className="bg-blue-50 p-2 sm:p-3 rounded border border-blue-200">
                                  <p className="text-[10px] sm:text-xs text-blue-600 font-medium">
                                    Accuracy Score
                                  </p>
                                  <p className="text-base sm:text-lg font-bold text-blue-700">
                                    {segment.aiScores.accuracy_score ||
                                      segment.accuracyScore}
                                  </p>
                                </div>

                                <div className="bg-purple-50 p-2 sm:p-3 rounded border border-purple-200">
                                  <p className="text-[10px] sm:text-xs text-purple-600 font-medium">
                                    Language Quality
                                  </p>
                                  <p className="text-base sm:text-lg font-bold text-purple-700">
                                    {segment.aiScores.language_quality_score ||
                                      segment.languageQualityScore}
                                  </p>
                                </div>

                                <div className="bg-green-50 p-2 sm:p-3 rounded border border-green-200">
                                  <p className="text-[10px] sm:text-xs text-green-600 font-medium">
                                    Fluency & Pronunciation
                                  </p>
                                  <p className="text-base sm:text-lg font-bold text-green-700">
                                    {segment.aiScores
                                      .fluency_pronunciation_score ||
                                      segment.fluencyPronunciationScore}
                                  </p>
                                </div>

                                <div className="bg-orange-50 p-2 sm:p-3 rounded border border-orange-200">
                                  <p className="text-[10px] sm:text-xs text-orange-600 font-medium">
                                    Delivery & Coherence
                                  </p>
                                  <p className="text-base sm:text-lg font-bold text-orange-700">
                                    {segment.aiScores
                                      .delivery_coherence_score ||
                                      segment.deliveryCoherenceScore}
                                  </p>
                                </div>

                                <div className="bg-red-50 p-2 sm:p-3 rounded border border-red-200">
                                  <p className="text-[10px] sm:text-xs text-red-600 font-medium">
                                    Cultural Context
                                  </p>
                                  <p className="text-base sm:text-lg font-bold text-red-700">
                                    {segment.aiScores.cultural_context_score ||
                                      segment.culturalControlScore}
                                  </p>
                                </div>

                                <div className="bg-yellow-50 p-2 sm:p-3 rounded border border-yellow-200">
                                  <p className="text-[10px] sm:text-xs text-yellow-600 font-medium">
                                    Response Management
                                  </p>
                                  <p className="text-base sm:text-lg font-bold text-yellow-700">
                                    {segment.aiScores
                                      .response_management_score ||
                                      segment.responseManagementScore}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* One Line Feedback */}
                          <div className="bg-emerald-50 p-3 sm:p-4 rounded border border-emerald-200">
                            <h5 className="font-semibold text-emerald-800 mb-2 text-sm sm:text-base">
                              Summary Feedback
                            </h5>
                            <p className="text-emerald-700 text-sm sm:text-base">
                              {segment.oneLineFeedback ||
                                segment.feedback ||
                                segment.aiScores?.one_line_feedback}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end cursor-pointer gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
                <Button
                  onClick={() => {
                    close();
                    navigate("/user");
                  }}
                  color="teal"
                  size={window.innerWidth < 640 ? "sm" : "md"}
                  fullWidth={window.innerWidth < 640}
                >
                  Back to Dialogues
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <div className="flex justify-center">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
              </div>
              <p className="mt-2 text-gray-600">Loading results...</p>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
};

export default PracticeDialogue;
