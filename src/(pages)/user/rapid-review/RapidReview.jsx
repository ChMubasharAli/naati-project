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
import { startExamAttempt, submitSegment } from "../../../api/exams";
import { useAuth } from "../../../context/AuthContext";

const PracticeDialogue = () => {
  // State variables
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: loggedInUser } = useAuth();

  // Get URL parameters
  const dialogueId = searchParams.get("dialogueId");
  const examType = searchParams.get("examType") || "rapid_review";
  const languageCode = searchParams.get("languageCode");

  // User ID from auth
  const userId = loggedInUser?.id;

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
  const [waveHeights, setWaveHeights] = useState([]);

  // 🔥 NEW STATES FOR NEW FLOW
  const [isSubmittingSegment, setIsSubmittingSegment] = useState(false);
  const [segmentResult, setSegmentResult] = useState(null);

  // Result modal
  const [opened, { open, close }] = useDisclosure(false);

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
      navigate("/user/dialogues");
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

  // 🔥 UPDATED: Submit current segment and return response
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

        // Submit segment and return response
        const response = await submitSegment(formData);
        return response;
      } catch (error) {
        console.error("Failed to submit segment:", error);
        throw error;
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

  // 🔥 NEW: Handle modal close and move to next segment
  const handleModalClose = () => {
    close();
    setSegmentResult(null);

    // If not last segment, move to next
    if (!isLastSegment) {
      setCurrentSegmentIndex((prev) => prev + 1);
    } else {
      // If last segment, redirect to dialogues
      localStorage.removeItem("examData");
      navigate("/user/dialogues");
    }
  };

  // 🔥 UPDATED: Handle NEXT button click (for all segments except last)
  const handleNextClick = async () => {
    if (!currentSegment || !currentRecording) {
      alert("Please record your response first.");
      return;
    }

    // Show loading for segment submission
    setIsSubmittingSegment(true);

    try {
      // Submit current segment and get response
      const response = await submitCurrentSegment(
        currentSegment.id,
        currentRecording,
      );

      // Save segment result and show modal
      if (response && response.data) {
        setSegmentResult(response.data);
        open();
      } else {
        alert("Failed to get segment result. Please try again.");
      }
    } catch (error) {
      console.error("Failed to submit segment:", error);
      alert("Failed to submit segment. Please try again.");
    } finally {
      setIsSubmittingSegment(false);
    }
  };

  // 🔥 UPDATED: Handle FINISH button click (for last segment only)
  const handleFinishClick = async () => {
    if (!currentSegment || !currentRecording) {
      alert("Please record your response first.");
      return;
    }

    // Show loading for segment submission
    setIsSubmittingSegment(true);

    try {
      // Submit last segment and get response
      const response = await submitCurrentSegment(
        currentSegment.id,
        currentRecording,
      );

      // Save segment result and show modal
      if (response && response.data) {
        setSegmentResult(response.data);
        open();
      } else {
        alert("Failed to get segment result. Please try again.");
      }
    } catch (error) {
      console.error("Failed to submit segment:", error);
      alert("Failed to submit. Please try again.");
    } finally {
      setIsSubmittingSegment(false);
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
          className="mt-4 px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
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
          onClick={() => navigate("/user/dialogues")}
          className="mt-4 px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
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

      {/* 🔥 NEW: Loading Overlay for Segment Submission */}
      {isSubmittingSegment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex flex-col items-center">
              <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-500 animate-spin mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 text-center">
                Submitting Segment {currentSegmentIndex + 1}
              </h3>
              <p className="text-gray-600 text-center text-sm sm:text-base">
                Processing your response...
                <br />
                <span className="text-xs sm:text-sm">Please wait a moment</span>
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
            <span
              className="cursor-pointer"
              onClick={() => navigate("/user/dialogues")}
            >
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
              <h2 className="text-base sm:text-[18px] font-bold text-[#3db39e] uppercase mb-4 sm:mb-6 lg:mb-8 tracking-wide text-center sm:text-left">
                {examData?.dialogue?.title || "Dialogue"}
              </h2>
              <p>
                This segment is intended to{" "}
                <strong>test your audio and visual equipment</strong> prior to
                taking the full CCL test.
              </p>
              <p>
                Click on <strong>Play Audio</strong> below the audio, to hear
                the segment and test your microphone and camera.
              </p>
              <p>
                You should be able to see yourself, and notice soundwaves when
                audio will play.
              </p>
              <p>
                Click on <strong>Next </strong>, to upload your recorded audio
                and move to the next segment.
              </p>
              <p>
                You can also play and listen to the{" "}
                <strong>Suggested Audio</strong> for this segment, to compare
                with your recording.
              </p>

              <div className="mt-6 sm:mt-8 space-y-2 sm:space-y-3">
                <p className="font-bold">Repeat:</p>
                <p>
                  You are able to repeat any segment before you begin speaking (
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
              </div>

              {/* Current Segment Text - For Small Screens */}
              {currentSegment?.textContent && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 ">
                  <h3 className="font-bold text-gray-700 mb-2">
                    Current Segment:
                  </h3>
                  <p className="text-gray-800">{currentSegment.textContent}</p>
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
                />
              </div>

              {/* Current Segment Text - For Large Screens */}

              {/* Audio Section */}
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
                        className={`px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1 sm:gap-2 justify-center w-full sm:w-auto ${
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
                          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm w-full sm:w-auto justify-center"
                        >
                          <Square size={14} className="sm:size-[16px]" />
                          Stop Recording
                        </button>
                      )}

                      {/* Retry Button (after first recording) */}
                      {showRetryButton && (
                        <button
                          onClick={handleRetry}
                          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[#006b5e] hover:bg-[#005a4f] text-white rounded-lg text-sm w-full sm:w-auto justify-center"
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

          {/* Navigation Buttons */}
          <div className="flex justify-end items-center gap-2 sm:gap-4 p-3 sm:p-4 border-t border-gray-100">
            <button
              onClick={handlePreviousClick}
              disabled={currentSegmentIndex === 0 || isSubmittingSegment}
              className={`flex items-center gap-1 sm:gap-2 text-white text-xs sm:text-[14px] font-medium px-4 sm:px-6 py-2 rounded-md transition-colors ${
                currentSegmentIndex === 0 || isSubmittingSegment
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
                  disabled={!currentRecording || isSubmittingSegment}
                  className={`flex items-center gap-1 sm:gap-2 text-white text-xs sm:text-[14px] font-medium px-4 sm:px-6 py-2 rounded-md transition-colors ${
                    !currentRecording || isSubmittingSegment
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
                  disabled={!currentRecording || isSubmittingSegment}
                  className={`flex items-center gap-1 sm:gap-2 text-white text-xs sm:text-[14px] font-medium px-4 sm:px-6 py-2 rounded-md transition-colors ${
                    !currentRecording || isSubmittingSegment
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
        </footer>

        {/* 🔥 UPDATED: Segment Result Modal */}
        <Modal
          opened={opened}
          closeOnClickOutside={false}
          onClose={handleModalClose}
          title={`Segment ${currentSegmentIndex + 1} Results`}
          size="lg"
          fullScreen={window.innerWidth < 768}
          radius={"lg"}
          withCloseButton={false}
          centered
          overlayProps={{ blur: 3, opacity: 0.25 }}
          styles={{
            title: {
              fontSize: window.innerWidth < 640 ? "1.25rem" : "1.5rem",
              fontWeight: "bold",
            },
            body: { padding: window.innerWidth < 640 ? "16px" : "24px" },
          }}
        >
          {segmentResult ? (
            <div className="space-y-4 sm:space-y-6 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto pr-1 sm:pr-2">
              {/* Segment Summary */}
              <div className="bg-linear-to-r from-emerald-50 to-teal-50 p-4 sm:p-6 rounded-lg border border-emerald-200">
                <h3 className="font-bold text-lg sm:text-xl text-emerald-800 mb-3 sm:mb-4">
                  <CheckCircle
                    size={20}
                    className="inline mr-2 sm:size-[24px]"
                  />
                  Segment {currentSegmentIndex + 1} Results
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">
                      Final Score
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-emerald-600">
                      {segmentResult.scores?.final_score ||
                        segmentResult.segmentAttempt?.finalScore ||
                        "N/A"}
                    </p>
                  </div>

                  <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">
                      Accuracy
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">
                      {segmentResult.scores?.accuracy_score ||
                        segmentResult.segmentAttempt?.accuracyScore ||
                        "N/A"}
                    </p>
                  </div>

                  <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">
                      Total Raw Score
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-800">
                      {segmentResult.scores?.total_raw_score ||
                        segmentResult.segmentAttempt?.totalRawScore ||
                        "N/A"}
                    </p>
                  </div>
                </div>

                {/* Detailed Scores */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="bg-green-50 p-2 sm:p-3 rounded border border-green-200">
                    <p className="text-[10px] sm:text-xs text-green-600 font-medium">
                      Language Quality
                    </p>
                    <p className="font-semibold text-green-700 text-sm sm:text-base">
                      {segmentResult.scores?.language_quality_score ||
                        segmentResult.segmentAttempt?.languageQualityScore ||
                        "N/A"}
                    </p>
                  </div>

                  <div className="bg-orange-50 p-2 sm:p-3 rounded border border-orange-200">
                    <p className="text-[10px] sm:text-xs text-orange-600 font-medium">
                      Fluency & Pronunciation
                    </p>
                    <p className="font-semibold text-orange-700 text-sm sm:text-base">
                      {segmentResult.scores?.fluency_pronunciation_score ||
                        segmentResult.segmentAttempt
                          ?.fluencyPronunciationScore ||
                        "N/A"}
                    </p>
                  </div>

                  <div className="bg-yellow-50 p-2 sm:p-3 rounded border border-yellow-200">
                    <p className="text-[10px] sm:text-xs text-yellow-600 font-medium">
                      Delivery & Coherence
                    </p>
                    <p className="font-semibold text-yellow-700 text-sm sm:text-base">
                      {segmentResult.scores?.delivery_coherence_score ||
                        segmentResult.segmentAttempt?.deliveryCoherenceScore ||
                        "N/A"}
                    </p>
                  </div>

                  <div className="bg-red-50 p-2 sm:p-3 rounded border border-red-200">
                    <p className="text-[10px] sm:text-xs text-red-600 font-medium">
                      Cultural Context
                    </p>
                    <p className="font-semibold text-red-700 text-sm sm:text-base">
                      {segmentResult.scores?.cultural_context_score ||
                        segmentResult.segmentAttempt?.culturalControlScore ||
                        "N/A"}
                    </p>
                  </div>

                  <div className="bg-purple-50 p-2 sm:p-3 rounded border border-purple-200">
                    <p className="text-[10px] sm:text-xs text-purple-600 font-medium">
                      Response Management
                    </p>
                    <p className="font-semibold text-purple-700 text-sm sm:text-base">
                      {segmentResult.scores?.response_management_score ||
                        segmentResult.segmentAttempt?.responseManagementScore ||
                        "N/A"}
                    </p>
                  </div>
                </div>

                {/* Feedback */}
                <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">
                    <MessageSquare
                      size={14}
                      className="inline mr-2 sm:size-[16px]"
                    />
                    Feedback
                  </h4>
                  <div className="text-gray-700 whitespace-pre-line bg-gray-50 p-3 sm:p-4 rounded border border-gray-300 text-xs sm:text-sm">
                    {segmentResult.scores?.one_line_feedback ||
                      segmentResult.segmentAttempt?.oneLineFeedback ||
                      segmentResult.segmentAttempt?.feedback ||
                      "No feedback available"}
                  </div>
                </div>

                {/* Transcripts */}
                {segmentResult.transcripts && (
                  <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">
                      Transcripts
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-600 mb-1 font-medium">
                          Your Response:
                        </p>
                        <p className="text-gray-800 bg-gray-50 p-3 rounded border text-sm">
                          {segmentResult.transcripts.studentTranscript ||
                            segmentResult.segmentAttempt?.userTranscription ||
                            "No transcription available"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1 font-medium">
                          Suggested Response:
                        </p>
                        <p className="text-gray-800 bg-gray-50 p-3 rounded border text-sm">
                          {segmentResult.transcripts.suggestedTranscript ||
                            "No suggested transcript available"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audio Player */}
                {(segmentResult.userAudioUrl ||
                  segmentResult.segmentAttempt?.audioUrl) && (
                  <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">
                      Your Recording
                    </h4>
                    <audio
                      src={
                        segmentResult.userAudioUrl ||
                        segmentResult.segmentAttempt?.audioUrl
                      }
                      controls
                      className="w-full"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleModalClose}
                    color="teal"
                    size={window.innerWidth < 640 ? "sm" : "md"}
                    fullWidth={window.innerWidth < 640}
                  >
                    {isLastSegment
                      ? "Complete Exam"
                      : "Continue to Next Segment"}
                  </Button>
                </div>
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
