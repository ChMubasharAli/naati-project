import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  User,
  Loader2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Mic,
  Upload,
  Play,
  Clock,
  AlertCircle,
  History,
  ChevronRight,
  PanelRight,
  Check,
  ChevronLeft,
} from "lucide-react";
import { Modal } from "@mantine/core";
import { useAuth } from "../../../context/AuthContext";
import axios from "axios";
import AiResponseModal from "./RapidReviewExamResultModal";

const API_BASE_URL = "https://api.prepsmart.au/api/v1";

const RapidReviewDialogues = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: logedInUser, userLanguage } = useAuth();

  const rapidReviewId = searchParams.get("rapidReviewId");
  const userId = searchParams.get("userId") || logedInUser?.id;

  const [rapidReview, setRapidReview] = useState(null);
  const [segments, setSegments] = useState([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("idle");
  const [recordedAudios, setRecordedAudios] = useState({});
  const [attemptsCount, setAttemptsCount] = useState({});
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [tempAudioBlob, setTempAudioBlob] = useState(null);
  const [showRecordingCompleted, setShowRecordingCompleted] = useState(false);

  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attemptsHistory, setAttemptsHistory] = useState([]);
  const [showAttemptsModal, setShowAttemptsModal] = useState(false);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(false);

  const [showRecordingChoiceModal, setShowRecordingChoiceModal] =
    useState(false);
  const [showRecordAgainConfirm, setShowRecordAgainConfirm] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [showAiPopup, setShowAiPopup] = useState(false);
  const [submittedSegments, setSubmittedSegments] = useState([]);

  // Refs for animation
  const hiddenAudioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const canvasRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const streamRef = useRef(null);

  const currentSegment = segments[currentSegmentIndex];
  const currentAttempts = currentSegment
    ? attemptsCount[currentSegment.id] || 0
    : 0;
  const hasRecording = tempAudioBlob || recordedAudios[currentSegment?.id];

  const fetchRapidReview = useCallback(async () => {
    if (!rapidReviewId) {
      navigate("/user/rapid-review");
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/rapid-review/${rapidReviewId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.data.success) {
        const reviewData = response.data.data.rapidReview;
        setRapidReview(reviewData);
        setSegments(reviewData.segmentObjects || []);

        const initialAttempts = {};
        reviewData.segmentObjects.forEach((seg) => {
          initialAttempts[seg.id] = 0;
        });
        setAttemptsCount(initialAttempts);

        await fetchAttemptsHistory();
      } else {
        setIsError(true);
      }
    } catch (error) {
      console.error("Failed to fetch rapid review:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [rapidReviewId, navigate]);

  const fetchAttemptsHistory = async () => {
    if (!userId) return;
    try {
      setIsLoadingAttempts(true);
      const response = await axios.get(
        `${API_BASE_URL}/rapid-review/attempts/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      if (response.data.success) {
        setAttemptsHistory(response.data.data?.rapidReviews || []);
      }
    } catch (error) {
      console.error("Failed to fetch attempts history:", error);
    } finally {
      setIsLoadingAttempts(false);
    }
  };

  useEffect(() => {
    fetchRapidReview();
  }, [fetchRapidReview]);

  const playOriginalAudioAndAutoRecord = useCallback(() => {
    if (!currentSegment?.audioUrl) return;

    setRecordingStatus("playing");
    setIsPlaying(true);
    setPlaybackProgress(0);
    setCurrentTime(0);

    if (hiddenAudioRef.current) {
      hiddenAudioRef.current.pause();
      hiddenAudioRef.current = null;
    }

    hiddenAudioRef.current = new Audio(currentSegment.audioUrl);

    hiddenAudioRef.current.addEventListener("loadedmetadata", () => {
      const duration = hiddenAudioRef.current.duration;
      setAudioDuration(duration);
    });

    const updateProgress = () => {
      if (hiddenAudioRef.current && !hiddenAudioRef.current.paused) {
        const current = hiddenAudioRef.current.currentTime;
        const duration = hiddenAudioRef.current.duration;

        if (duration > 0) {
          const progress = (current / duration) * 100;
          setPlaybackProgress(progress);
          setCurrentTime(current);
        }
      }
    };

    hiddenAudioRef.current
      .play()
      .then(() => {
        progressIntervalRef.current = setInterval(updateProgress, 100);

        hiddenAudioRef.current.onended = () => {
          clearInterval(progressIntervalRef.current);
          setRecordingStatus("recording");
          setIsPlaying(false);
          setPlaybackProgress(100);
          setCurrentTime(audioDuration);
          startRecording();
        };
      })
      .catch((error) => {
        console.error("Audio play error:", error);
        setRecordingStatus("idle");
        setIsPlaying(false);
      });
  }, [currentSegment, audioDuration]);

  // Initialize audio context and analyser
  const initializeAudio = useCallback(async (stream) => {
    try {
      streamRef.current = stream;

      if (!audioContextRef.current) {
        audioContextRef.current = new (
          window.AudioContext || window.webkitAudioContext
        )();
      }

      const audioContext = audioContextRef.current;
      const source = audioContext.createMediaStreamSource(stream);
      analyserRef.current = audioContext.createAnalyser();

      // Configure analyser for better visualization
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
      analyserRef.current.minDecibels = -90;
      analyserRef.current.maxDecibels = -10;

      source.connect(analyserRef.current);

      return true;
    } catch (error) {
      console.error("Error initializing audio:", error);
      return false;
    }
  }, []);

  // Draw static line when not recording
  const drawStaticLine = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    ctx.fillStyle = "#f9fafb";
    ctx.fillRect(0, 0, width, height);

    ctx.beginPath();
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 2;
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
  }, []);

  // Active wave animation when recording
  const startWaveAnimation = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current) {
      console.error("Canvas or analyser not available");
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let time = 0;
    let animationId;

    const draw = () => {
      // Continue animation only if recording
      if (!isRecording) {
        drawStaticLine();
        return;
      }

      animationId = requestAnimationFrame(draw);
      animationFrameRef.current = animationId;

      // Get frequency data
      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate volume (0 to 1)
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      const volume = Math.min(1, Math.max(0, average / 255));

      // Clear canvas
      ctx.fillStyle = "#f9fafb";
      ctx.fillRect(0, 0, width, height);

      // Always draw center red line
      ctx.beginPath();
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 2;
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // Draw animated waves only when there's sound (volume > threshold)
      if (volume > 0.02) {
        const baseAmplitude = 25;
        const dynamicAmplitude = baseAmplitude + volume * 35;

        // Draw multiple sine waves with different properties
        const waves = [
          {
            color: "#ef4444",
            amplitude: dynamicAmplitude,
            frequency: 0.015,
            speed: 2,
            yOffset: 0,
          },
          {
            color: "#f87171",
            amplitude: dynamicAmplitude * 0.6,
            frequency: 0.025,
            speed: 1.5,
            yOffset: 0,
          },
          {
            color: "#fca5a5",
            amplitude: dynamicAmplitude * 0.3,
            frequency: 0.035,
            speed: 2.5,
            yOffset: 0,
          },
        ];

        waves.forEach((wave, index) => {
          ctx.beginPath();
          ctx.strokeStyle = wave.color;
          ctx.lineWidth = index === 0 ? 3 : 2;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          for (let x = 0; x <= width; x += 2) {
            // Create sine wave with time-based animation
            const angle = x * wave.frequency + time * wave.speed * 0.1;
            const y =
              centerY +
              Math.sin(angle) * wave.amplitude * Math.min(1, volume * 2);

            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }

          ctx.stroke();
        });

        // Mirror waves (inverted) for symmetrical effect
        waves.forEach((wave, index) => {
          ctx.beginPath();
          ctx.strokeStyle = wave.color;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.5;

          for (let x = 0; x <= width; x += 2) {
            const angle =
              x * wave.frequency + time * wave.speed * 0.1 + Math.PI;
            const y =
              centerY +
              Math.sin(angle) * wave.amplitude * Math.min(1, volume * 2);

            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }

          ctx.stroke();
          ctx.globalAlpha = 1;
        });
      }

      time += 1;
    };

    // Start the animation loop
    draw();
  }, [isRecording, drawStaticLine]);

  // Effect to handle recording state changes
  useEffect(() => {
    if (isRecording && analyserRef.current && canvasRef.current) {
      console.log("Starting wave animation");
      startWaveAnimation();
    } else if (!isRecording && canvasRef.current) {
      console.log("Stopping wave animation, drawing static line");
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      drawStaticLine();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, startWaveAnimation, drawStaticLine]);

  const startRecording = useCallback(async () => {
    try {
      console.log("Starting recording...");
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      const recorder = new MediaRecorder(audioStream, {
        mimeType: "audio/webm;codecs=opus",
      });
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        console.log("Recording stopped");
        setIsRecording(false);
        setRecordingStatus("idle");
        const audioBlob = new Blob(chunks, { type: "audio/webm" });

        if (currentSegment) {
          setTempAudioBlob(audioBlob);
          setRecordedAudios((prev) => ({
            ...prev,
            [currentSegment.id]: audioBlob,
          }));
          setShowRecordingCompleted(true);

          setAttemptsCount((prev) => ({
            ...prev,
            [currentSegment.id]: (prev[currentSegment.id] || 0) + 1,
          }));
        }

        // Cleanup
        audioStream.getTracks().forEach((track) => track.stop());
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        analyserRef.current = null;
      };

      // Initialize audio context first
      const initialized = await initializeAudio(audioStream);
      if (!initialized) {
        throw new Error("Failed to initialize audio context");
      }

      recorder.start(100); // Collect data every 100ms
      setMediaRecorder(recorder);
      setIsRecording(true);

      console.log("Recording started successfully");
    } catch (error) {
      console.error("Recording error:", error);
      setRecordingStatus("idle");
      alert("Microphone access denied or error occurred: " + error.message);
    }
  }, [currentSegment, initializeAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
    }
  }, [mediaRecorder, isRecording]);

  const submitSegment = useCallback(async () => {
    if (!currentSegment || !tempAudioBlob) return;

    try {
      setIsEvaluating(true);

      const formData = new FormData();
      formData.append("rapidReviewId", rapidReviewId);
      formData.append("userId", userId);
      formData.append("language", userLanguage?.langCode || "en");
      formData.append("segmentId", currentSegment.id);
      formData.append("userAudio", tempAudioBlob, "recording.webm");

      const response = await axios.post(
        `${API_BASE_URL}/mocktest/rapid-review/ai`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setAiResponse(response.data);
      setShowAiPopup(true);
      setSubmittedSegments((prev) => [...prev, currentSegment.id]);

      await fetchAttemptsHistory();
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to submit. Please try again.");
    } finally {
      setIsEvaluating(false);
    }
  }, [currentSegment, tempAudioBlob, rapidReviewId, userId, userLanguage]);

  const handleStart = useCallback(() => {
    if (hasRecording && !showRecordingCompleted) {
      setShowRecordingChoiceModal(true);
      return;
    }
    playOriginalAudioAndAutoRecord();
  }, [hasRecording, showRecordingCompleted, playOriginalAudioAndAutoRecord]);

  const handleRecordAgainClick = useCallback(() => {
    setShowRecordAgainConfirm(true);
  }, []);

  const confirmRecordAgain = useCallback(() => {
    setShowRecordAgainConfirm(false);
    setTempAudioBlob(null);
    setShowRecordingCompleted(false);
    playOriginalAudioAndAutoRecord();
  }, [playOriginalAudioAndAutoRecord]);

  const cancelRecordAgain = useCallback(() => {
    setShowRecordAgainConfirm(false);
  }, []);

  const handleRecordNewAttempt = useCallback(() => {
    setShowRecordingChoiceModal(false);
    handleRecordAgainClick();
  }, [handleRecordAgainClick]);

  const handleSubmitExisting = useCallback(async () => {
    setShowRecordingChoiceModal(false);
    await submitSegment();
  }, [submitSegment]);

  const handleNext = useCallback(() => {
    if (currentSegmentIndex < segments.length - 1) {
      setCurrentSegmentIndex((prev) => prev + 1);
      resetSegmentState();
    }
  }, [currentSegmentIndex, segments.length]);

  const handlePrevious = useCallback(() => {
    if (currentSegmentIndex > 0) {
      setCurrentSegmentIndex((prev) => prev - 1);
      resetSegmentState();
    }
  }, [currentSegmentIndex]);

  const handleSegmentClick = useCallback((index) => {
    setCurrentSegmentIndex(index);
    resetSegmentState();
    setSidebarOpen(false);
  }, []);

  const resetSegmentState = useCallback(() => {
    setRecordingStatus("idle");
    setIsRecording(false);
    setIsPlaying(false);
    setPlaybackProgress(0);
    setCurrentTime(0);
    setShowRecordingCompleted(false);
    setTempAudioBlob(null);
    setShowRecordingChoiceModal(false);
    setShowRecordAgainConfirm(false);
    if (hiddenAudioRef.current) {
      hiddenAudioRef.current.pause();
      hiddenAudioRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  }, []);

  const handleAiPopupContinue = useCallback(() => {
    setShowAiPopup(false);
    setAiResponse(null);
    if (currentSegmentIndex === segments.length - 1) {
      setTimeout(() => {
        navigate("/user/rapid-review");
      }, 500);
    }
  }, [currentSegmentIndex, segments.length, navigate]);

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // Initialize canvas with static line on mount
  useEffect(() => {
    drawStaticLine();

    return () => {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (hiddenAudioRef.current) hiddenAudioRef.current.pause();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [drawStaticLine]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading rapid review...</p>
      </div>
    );
  }

  if (isError || !rapidReview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-600 mb-4">Failed to load rapid review</p>
        <button
          onClick={() => navigate("/user/rapid-review")}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg cursor-pointer hover:bg-emerald-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Rapid Review Practice
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="bg-emerald-100 p-2 rounded-full">
                <User size={16} className="text-emerald-600" />
              </div>
              <span className="hidden sm:inline">
                {logedInUser?.email || "User"}
              </span>
            </div>
          </div>
        </header>

        {/* Right Side Slider Button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-emerald-500 shadow-lg border border-gray-200 rounded-l-xl px-1 py-4 hover:bg-emerald-600 transition-all duration-300 group cursor-pointer"
        >
          <ChevronLeft size={24} className="text-white  h-16 " />
          <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs  py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Show Segments
          </div>
        </button>

        {/* Main Practice Area */}
        <main className="flex-1 overflow-y-auto flex items-center p-6">
          <div className="max-w-3xl mx-auto">
            {/* Segment Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <p className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium w-fit">
                  Attempts:{" "}
                  <span className="font-semibold">{currentAttempts}</span>
                </p>
                {submittedSegments.includes(currentSegment?.id) && (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <CheckCircle size={14} /> Submitted
                  </span>
                )}
              </div>
            </div>

            {/* Audio Player Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                  {isPlaying ? (
                    <div className="flex gap-1">
                      <div className="w-1 h-4 bg-white animate-pulse"></div>
                      <div className="w-1 h-4 bg-white animate-pulse delay-75"></div>
                    </div>
                  ) : (
                    <Play size={20} fill="currentColor" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-100 ease-linear"
                      style={{ width: `${playbackProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(audioDuration)}</span>
                  </div>
                </div>
              </div>

              {/* Recording Waveform with Sine Waves */}
              <div className="relative h-24 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={96}
                  className="w-full h-full block"
                  style={{ display: "block" }}
                />
                {isRecording && (
                  <div className="absolute top-2 right-2 flex items-center gap-2 bg-red-100 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-red-600">
                      REC
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-4">
              {!showRecordingCompleted && (
                <button
                  onClick={handleStart}
                  disabled={
                    recordingStatus === "playing" ||
                    isRecording ||
                    submittedSegments.includes(currentSegment?.id)
                  }
                  className={`px-6 py-3 rounded-full font-medium flex items-center gap-2 cursor-pointer ${
                    recordingStatus === "playing" ||
                    isRecording ||
                    submittedSegments.includes(currentSegment?.id)
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  {recordingStatus === "playing" ? (
                    <>
                      <Clock size={18} className="animate-spin" /> Playing...
                    </>
                  ) : isRecording ? (
                    <>
                      <Mic size={18} /> Recording...
                    </>
                  ) : (
                    <>
                      <Play size={18} /> Start
                    </>
                  )}
                </button>
              )}

              {isRecording && (
                <button
                  onClick={stopRecording}
                  className="px-6 py-3 rounded-full font-medium bg-red-600 text-white hover:bg-red-700 flex items-center gap-2 cursor-pointer"
                >
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  Stop Recording
                </button>
              )}

              {showRecordingCompleted && (
                <div className="flex gap-3">
                  <button
                    onClick={handleRecordAgainClick}
                    className="px-6 py-3 rounded-full font-medium bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2 cursor-pointer"
                  >
                    <Mic size={18} /> Record Again
                  </button>
                  <button
                    onClick={handleSubmitExisting}
                    className="px-6 py-3 rounded-full font-medium bg-green-600 text-white hover:bg-green-700 flex items-center gap-2 cursor-pointer"
                  >
                    <Upload size={18} /> Submit
                  </button>
                </div>
              )}

              {submittedSegments.includes(currentSegment?.id) && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                  <CheckCircle size={20} />
                  <span className="font-medium">Submitted successfully!</span>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer Navigation - My Attempts Left, Previous/Next Right */}
        <footer className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center max-w-3xl mx-auto">
            {/* Left Side - My Attempts Button */}
            <button
              onClick={() => setShowAttemptsModal(true)}
              className="flex items-center rounded-lg gap-2 px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600  cursor-pointer"
            >
              <History size={18} />
              <span className="hidden sm:inline">Previous Attempts</span>
            </button>

            {/* Right Side - Previous and Next Together */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevious}
                disabled={currentSegmentIndex === 0}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium cursor-pointer ${
                  currentSegmentIndex === 0
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100 border border-gray-300"
                }`}
              >
                <ArrowLeft size={18} /> Previous
              </button>

              <button
                onClick={handleNext}
                disabled={currentSegmentIndex === segments.length - 1}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium cursor-pointer ${
                  currentSegmentIndex === segments.length - 1
                    ? "text-gray-300 cursor-not-allowed"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                Next <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Right Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-40 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="font-bold text-gray-800">Segments</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {segments.map((segment, index) => (
              <button
                key={segment.id}
                onClick={() => handleSegmentClick(index)}
                className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                  currentSegmentIndex === index
                    ? "bg-emerald-50 border-l-4 border-l-emerald-500"
                    : ""
                } ${submittedSegments.includes(segment.id) ? "opacity-75" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      submittedSegments.includes(segment.id)
                        ? "bg-green-100 text-green-700"
                        : currentSegmentIndex === index
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1 flex items-center gap-2  justify-between min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {/* {segment.textContent?.substring(0, 40)}... */}
                      Segment
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {submittedSegments.includes(segment.id)
                        ? "✓ Completed"
                        : "Pending"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 cursor-pointer"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Attempts History Modal */}
      <Modal
        opened={showAttemptsModal}
        onClose={() => setShowAttemptsModal(false)}
        centered
        size="lg"
        title="My Completed Attempts"
      >
        <div className="max-h-96 overflow-y-auto">
          {isLoadingAttempts ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
          ) : attemptsHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No previous attempts found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {attemptsHistory.map((attempt, index) => {
                const doneSegmentIds = attempt.progress?.doneSegmentIds || [];
                const completedSegments =
                  attempt.segments?.filter((seg) =>
                    doneSegmentIds.includes(seg.id),
                  ) || [];

                if (completedSegments.length === 0) return null;

                return (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="p-4 border-b border-gray-200 bg-gray-100">
                      <span className="font-semibold text-gray-800">
                        {attempt.rapidReview?.title || `Attempt ${index + 1}`}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({completedSegments.length} completed)
                      </span>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {completedSegments.map((segment) => (
                        <div
                          key={segment.id}
                          className="p-4 flex items-start gap-3"
                        >
                          <div className="mt-1">
                            <Check size={16} className="text-green-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {segment.textContent}
                            </p>
                            <span className="inline-flex items-center mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                              Completed
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Recording Choice Modal */}
      <Modal
        opened={showRecordingChoiceModal}
        onClose={() => setShowRecordingChoiceModal(false)}
        centered
        size="sm"
        withCloseButton={false}
      >
        <div className="text-center p-6">
          <div className="bg-blue-100 w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Mic className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold mb-2">Recording Exists</h3>
          <p className="text-gray-500 mb-6">
            You already have a recording for this segment.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleRecordNewAttempt}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              Record New Attempt
            </button>
            <button
              onClick={handleSubmitExisting}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer"
            >
              Submit Existing Recording
            </button>
            <button
              onClick={() => setShowRecordingChoiceModal(false)}
              className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Record Again Confirmation Modal */}
      <Modal
        opened={showRecordAgainConfirm}
        onClose={cancelRecordAgain}
        centered
        size="sm"
        withCloseButton={false}
      >
        <div className="text-center p-6">
          <div className="bg-amber-100 w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-lg font-bold mb-2">Record Again?</h3>
          <p className="text-gray-500 mb-6">
            Are you sure you want to record again? Your current recording will
            be replaced.
          </p>
          <div className="flex gap-3">
            <button
              onClick={cancelRecordAgain}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 cursor-pointer"
            >
              No, Cancel
            </button>
            <button
              onClick={confirmRecordAgain}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
            >
              Yes, Record Again
            </button>
          </div>
        </div>
      </Modal>

      {/* AI Evaluation Modal */}
      {isEvaluating && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl text-center">
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">
              AI Evaluation in Progress
            </h3>
            <p className="text-gray-600">Analyzing your pronunciation...</p>
          </div>
        </div>
      )}

      {/* AI Response Modal */}
      {showAiPopup && aiResponse && (
        <AiResponseModal
          open={showAiPopup}
          data={aiResponse}
          onContinue={handleAiPopupContinue}
        />
      )}
    </div>
  );
};

export default RapidReviewDialogues;
