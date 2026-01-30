import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  User,
  Loader2,
  BarChart3,
  MessageSquare,
  Volume2,
  Clock,
  CheckCircle,
  ArrowRight,
  CircleQuestionMark,
  Loader,
  ArrowLeft,
  Flag,
  Bookmark,
} from "lucide-react";
import { FaTriangleExclamation } from "react-icons/fa6";
import { FaCircle, FaRegDotCircle } from "react-icons/fa";
import { Modal, Button, Slider } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  startExamAttempt,
  submitSegment,
  getExamResult,
} from "../../api/exams";
import { useAuth } from "../../context/AuthContext";
import VerticalVolumeSlider from "../../components/VerticalVolumeSlider";
import AudioWaveRecording from "../../components/PlayAndRecordSection";

const TOTAL_EXAM_TIME = 20 * 60; // 20 minutes in seconds

const PracticeDialogue = () => {
  const [volume, setVolume] = useState(50);
  // State variables
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: loggedInUser } = useAuth();

  // Get URL parameters
  const dialogueId = searchParams.get("dialogueId");
  const examType = searchParams.get("examType") || "complete_dialogue";
  const languageCode = searchParams.get("languageCode");
  const languageName = searchParams.get("languageName");

  // User ID from auth
  const userId = loggedInUser?.id;

  // Exam data state
  const [examData, setExamData] = useState(null);
  const [segments, setSegments] = useState([]);
  const [filteredSegments, setFilteredSegments] = useState([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [examAttemptId, setExamAttemptId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLastSegment, setIsLastSegment] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudios, setRecordedAudios] = useState({});
  const [attemptsCount, setAttemptsCount] = useState({});
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const [waveHeights, setWaveHeights] = useState([]);

  // New states for updated requirements
  const [showRepeatConfirm, setShowRepeatConfirm] = useState(false);
  const [showFinishSummary, setShowFinishSummary] = useState(false);
  const [segmentsStatus, setSegmentsStatus] = useState({});
  const [showFinishButton, setShowFinishButton] = useState(false);
  const [blinkText, setBlinkText] = useState("");
  const [recordingStatus, setRecordingStatus] = useState("idle"); // idle, playing, recording
  const [showFinalSubmitModal, setShowFinalSubmitModal] = useState(false);
  const [canSubmitFinal, setCanSubmitFinal] = useState(false);
  const [isSubmittingSegment, setIsSubmittingSegment] = useState(false);
  const [isAudioProcessing, setIsAudioProcessing] = useState(false);

  // 🔥 NEW STATE for playback progress
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // 🔥 NEW STATES for timer functionality
  const [remainingTime, setRemainingTime] = useState(TOTAL_EXAM_TIME);
  const [completedSeconds, setCompletedSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const [timeExpired, setTimeExpired] = useState(false);
  const [displayTime, setDisplayTime] = useState("20:00"); // Smooth display time

  // Result modal
  const [opened, { open, close }] = useDisclosure(false);
  const [examResult, setExamResult] = useState(null);

  // 🔥 CRITICAL FIX: Add initialization tracking refs
  const isInitializedRef = useRef(false);
  const initializationInProgressRef = useRef(false);

  // 🔥 NEW REFS for timer functionality
  const incrementApiIntervalRef = useRef(null);
  const animationFrameRefTimer = useRef(null);
  const startTimeRef = useRef(Date.now());
  const accumulatedTimeRef = useRef(0);
  const lastApiCallTimeRef = useRef(Date.now());

  // Refs
  const originalAudioRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);
  const hiddenAudioRef = useRef(null);

  // Initialize gray wave heights
  useEffect(() => {
    const heights = Array.from({ length: 20 }, () => Math.random() * 100);
    setWaveHeights(heights);
  }, [currentSegmentIndex]);

  // 🔥 NEW: Function to fetch completed seconds from API
  const fetchCompletedSeconds = useCallback(async () => {
    if (!userId || !dialogueId) return 0;

    try {
      const response = await fetch(
        `/api/v1/dialogueTime/users/${userId}/dialogues/${dialogueId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          return data.data.completedSeconds || 0;
        }
      }
      return 0;
    } catch (error) {
      console.error("Error fetching completed seconds:", error);
      return 0;
    }
  }, [userId, dialogueId]);

  // 🔥 NEW: Function to increment completed seconds
  const incrementCompletedSeconds = useCallback(
    async (seconds) => {
      if (!userId || !dialogueId || !timerActive) return;

      try {
        const response = await fetch(
          `/api/v1/dialogueTime/users/${userId}/dialogues/${dialogueId}/increment`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ seconds }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCompletedSeconds((prev) => prev + seconds);
          }
        }
      } catch (error) {
        console.error("Error incrementing completed seconds:", error);
        // Silent fail - don't show error to user
      }
    },
    [userId, dialogueId, timerActive],
  );

  // 🔥 NEW: Format time for display (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 🔥 NEW: Smooth timer using requestAnimationFrame
  const startSmoothTimer = useCallback(async () => {
    // Clear any existing animation frames
    if (animationFrameRefTimer.current) {
      cancelAnimationFrame(animationFrameRefTimer.current);
      animationFrameRefTimer.current = null;
    }

    if (incrementApiIntervalRef.current) {
      clearInterval(incrementApiIntervalRef.current);
      incrementApiIntervalRef.current = null;
    }

    // Fetch initial completed seconds
    const initialCompleted = await fetchCompletedSeconds();
    setCompletedSeconds(initialCompleted);

    // Calculate initial remaining time
    const initialRemaining = TOTAL_EXAM_TIME - initialCompleted;
    const initialRemainingValid = initialRemaining > 0 ? initialRemaining : 0;

    setRemainingTime(initialRemainingValid);
    setDisplayTime(formatTime(initialRemainingValid));

    if (initialRemainingValid <= 0) {
      setTimeExpired(true);
      handleTimeExpired();
      return;
    }

    setTimerActive(true);
    setTimeExpired(false);
    startTimeRef.current = Date.now();
    accumulatedTimeRef.current = initialCompleted;
    lastApiCallTimeRef.current = Date.now();

    // 🔥 SMOOTH TIMER: Use requestAnimationFrame for 60fps updates
    let lastTimestamp = 0;
    let secondsSinceLastApiCall = 0;

    const updateTimer = (timestamp) => {
      if (!lastTimestamp) lastTimestamp = timestamp;

      const elapsed = Date.now() - startTimeRef.current;
      const totalElapsedSeconds = accumulatedTimeRef.current + elapsed / 1000;

      // Calculate remaining time
      const remaining = Math.max(0, TOTAL_EXAM_TIME - totalElapsedSeconds);

      // Update display time (smoothly every frame)
      setDisplayTime(formatTime(remaining));

      // Update remaining time state less frequently (every 100ms for reactivity)
      if (timestamp - lastTimestamp >= 100) {
        setRemainingTime(Math.floor(remaining));
        lastTimestamp = timestamp;
      }

      // Check for API call every 10 seconds
      const now = Date.now();
      secondsSinceLastApiCall = (now - lastApiCallTimeRef.current) / 1000;

      if (secondsSinceLastApiCall >= 10) {
        const secondsToAdd = Math.floor(secondsSinceLastApiCall);
        if (secondsToAdd > 0) {
          incrementCompletedSeconds(secondsToAdd);
          lastApiCallTimeRef.current = now;
        }
      }

      // Check if time expired
      if (remaining <= 0) {
        setTimeExpired(true);
        handleTimeExpired();
        return;
      }

      // Continue animation if timer is active
      if (timerActive && !timeExpired) {
        animationFrameRefTimer.current = requestAnimationFrame(updateTimer);
      }
    };

    // Start the smooth animation
    animationFrameRefTimer.current = requestAnimationFrame(updateTimer);
  }, [
    fetchCompletedSeconds,
    incrementCompletedSeconds,
    timerActive,
    timeExpired,
  ]);

  // 🔥 NEW: Handle time expiration
  const handleTimeExpired = useCallback(async () => {
    setTimerActive(false);

    // Clear animation frame
    if (animationFrameRefTimer.current) {
      cancelAnimationFrame(animationFrameRefTimer.current);
      animationFrameRefTimer.current = null;
    }

    // Clear API interval
    if (incrementApiIntervalRef.current) {
      clearInterval(incrementApiIntervalRef.current);
      incrementApiIntervalRef.current = null;
    }

    // Set final display time
    setDisplayTime("00:00");
    setRemainingTime(0);

    // Auto-submit the exam
    await handleAutoSubmit();
  }, []);

  // 🔥 NEW: Auto-submit function when time expires
  const handleAutoSubmit = useCallback(async () => {
    setIsSubmittingFinal(true);

    try {
      // Submit last segment if not already submitted
      const currentSegment = filteredSegments[currentSegmentIndex];
      if (currentSegment && recordedAudios[currentSegment.id]) {
        await submitCurrentSegment(
          currentSegment.id,
          recordedAudios[currentSegment.id],
        );
      }

      // Get final result
      const result = await getExamResult(examAttemptId);
      setExamResult(result);

      // Clear localStorage
      localStorage.removeItem("examData");

      // Open result modal
      open();
    } catch (error) {
      console.error("Failed to auto-submit exam:", error);
      alert("Time expired! Please check your results.");
    } finally {
      setIsSubmittingFinal(false);
    }
  }, [
    filteredSegments,
    currentSegmentIndex,
    recordedAudios,
    examAttemptId,
    open,
  ]);

  // 🔥 NEW: Filter segments to show only those with isDone: false
  const filterSegments = useCallback((segmentsArray) => {
    return segmentsArray.filter((segment) => !segment.isDone);
  }, []);

  // Initialize exam
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

        // Filter segments to show only those with isDone: false
        const notDoneSegments = filterSegments(response.segments || []);

        // Save exam data
        setExamData(response);
        setSegments(response.segments || []);
        setFilteredSegments(notDoneSegments);
        setExamAttemptId(response.attempt.id);

        // Initialize recordings and attempts objects ONLY for filtered segments
        const initialRecordings = {};
        const initialAttempts = {};
        const initialStatus = {};
        notDoneSegments.forEach((segment) => {
          initialRecordings[segment.id] = null;
          initialAttempts[segment.id] = 0;
          initialStatus[segment.id] = "not_answered";
        });

        setRecordedAudios(initialRecordings);
        setAttemptsCount(initialAttempts);
        setSegmentsStatus(initialStatus);

        // Check if it's the last segment
        setIsLastSegment(notDoneSegments.length === 1);

        // Save to localStorage for persistence
        localStorage.setItem(
          "examData",
          JSON.stringify({
            ...response,
            filteredSegments: notDoneSegments,
          }),
        );

        // Start the smooth timer
        await startSmoothTimer();

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
      // Stop all animation frames and intervals
      if (animationFrameRefTimer.current) {
        cancelAnimationFrame(animationFrameRefTimer.current);
        animationFrameRefTimer.current = null;
      }

      if (incrementApiIntervalRef.current) {
        clearInterval(incrementApiIntervalRef.current);
        incrementApiIntervalRef.current = null;
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (hiddenAudioRef.current) {
        hiddenAudioRef.current.pause();
        hiddenAudioRef.current = null;
      }
    };
  }, [
    dialogueId,
    userId,
    navigate,
    examType,
    filterSegments,
    startSmoothTimer,
  ]);

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

  // Get current segment (from filtered segments)
  const currentSegment = filteredSegments[currentSegmentIndex];

  // Get current segment's recording and attempts
  const currentRecording = currentSegment
    ? recordedAudios[currentSegment.id]
    : null;
  const currentAttempts = currentSegment ? attemptsCount[currentSegment.id] : 0;

  // Update last segment status
  useEffect(() => {
    if (filteredSegments.length > 0) {
      setIsLastSegment(currentSegmentIndex === filteredSegments.length - 1);
    }
  }, [currentSegmentIndex, filteredSegments]);

  // Calculate if all segments are attempted
  useEffect(() => {
    if (filteredSegments.length > 0) {
      const allAttempted = filteredSegments.every((segment) => {
        const attempts = attemptsCount[segment.id] || 0;
        return attempts > 0;
      });
      setCanSubmitFinal(allAttempted);
    }
  }, [filteredSegments, attemptsCount]);

  // Check if navigation should be disabled
  const shouldDisableNavigation =
    recordingStatus === "playing" ||
    recordingStatus === "recording" ||
    isAudioProcessing ||
    isSubmittingSegment ||
    timeExpired;

  // Start audio and auto-record function
  const startAudioAndRecord = () => {
    if (!currentSegment || timeExpired) return;

    // Check if this segment has been attempted before (attempts > 0)
    if (attemptsCount[currentSegment.id] > 0) {
      setShowRepeatConfirm(true);
      return;
    }

    // Start the process
    playOriginalAudioAndAutoRecord();
  };

  // Play original audio and auto-start recording when finished
  const playOriginalAudioAndAutoRecord = () => {
    if (currentSegment?.audioUrl && !timeExpired) {
      // Set status to playing
      setRecordingStatus("playing");
      setBlinkText("Playing Source File");
      setShowFinishButton(true);

      // Reset progress
      setPlaybackProgress(0);

      // Clean up any existing audio
      if (hiddenAudioRef.current) {
        hiddenAudioRef.current.pause();
        hiddenAudioRef.current = null;
      }

      // Create a hidden audio element for auto-play
      hiddenAudioRef.current = new Audio(currentSegment.audioUrl);

      hiddenAudioRef.current.addEventListener("loadedmetadata", () => {
        setAudioDuration(hiddenAudioRef.current.duration);
      });

      // 🔥 EK HI EVENT LISTENER SE SMOOTH PROGRESS
      const updateProgress = () => {
        if (hiddenAudioRef.current && !hiddenAudioRef.current.ended) {
          const progress =
            (hiddenAudioRef.current.currentTime /
              hiddenAudioRef.current.duration) *
            100;
          setPlaybackProgress(progress);
        }
      };

      // Use requestAnimationFrame for smoother updates
      let animationFrameId;
      const smoothUpdate = () => {
        updateProgress();
        if (
          hiddenAudioRef.current &&
          !hiddenAudioRef.current.ended &&
          !hiddenAudioRef.current.paused
        ) {
          animationFrameId = requestAnimationFrame(smoothUpdate);
        }
      };

      hiddenAudioRef.current
        .play()
        .then(() => {
          // Start smooth progress tracking
          animationFrameId = requestAnimationFrame(smoothUpdate);

          // Auto start recording when audio ends
          hiddenAudioRef.current.onended = () => {
            cancelAnimationFrame(animationFrameId);
            setRecordingStatus("recording");
            setBlinkText("REC");
            setPlaybackProgress(100); // Complete the progress
            startRecording(); // Auto start recording
          };

          hiddenAudioRef.current.onerror = () => {
            cancelAnimationFrame(animationFrameId);
            setRecordingStatus("idle");
            setBlinkText("");
            setShowFinishButton(false);
            setPlaybackProgress(0); // Reset progress on error
            alert("Failed to play audio. Please try again.");
          };
        })
        .catch((error) => {
          console.error("Audio play error:", error);
          setRecordingStatus("idle");
          setBlinkText("");
          setShowFinishButton(false);
          setPlaybackProgress(0); // Reset progress on error
          alert("Failed to play audio. Please make sure audio is available.");
        });
    }
  };

  // Initialize audio analyzer for live waveforms
  const initializeAudioAnalyzer = (stream) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (
        window.AudioContext || window.webkitAudioContext
      )();
    }

    const audioContext = audioContextRef.current;
    const source = audioContext.createMediaStreamSource(stream);
    analyserRef.current = audioContext.createAnalyser();

    analyserRef.current.fftSize = 256;
    const bufferLength = analyserRef.current.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);

    source.connect(analyserRef.current);

    // Start updating wave heights
    updateWaveHeights();
  };

  const updateWaveHeights = () => {
    if (!analyserRef.current || !isRecording) return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    // Get average of frequencies for wave heights
    const average =
      dataArrayRef.current.reduce((a, b) => a + b) /
      dataArrayRef.current.length;

    // Update wave heights based on audio input
    const newHeights = Array.from({ length: 20 }, (_, i) => {
      const index = Math.floor(i * (dataArrayRef.current.length / 20));
      const height = (dataArrayRef.current[index] || average) / 2.55;
      return Math.min(100, Math.max(10, height));
    });

    setWaveHeights(newHeights);

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(updateWaveHeights);
  };

  // Submit current segment (AI-Exam API call) - UPDATED
  const submitCurrentSegment = useCallback(
    async (segmentId, audioBlob) => {
      if (!segmentId || !audioBlob || !examAttemptId) {
        console.error("Missing required data for API call");
        return null;
      }

      try {
        console.log("🔵 AI-Exam API CALLED for segment:", segmentId);

        // Get current segment data
        const segment =
          filteredSegments.find((s) => s.id === segmentId) || currentSegment;

        // Create FormData
        const formData = new FormData();
        formData.append("dialogueId", dialogueId);
        formData.append(
          "language",
          examData?.dialogue?.Language?.name || languageCode || "English",
        );
        formData.append("segmentId", segmentId);
        formData.append("audioTranscript", segment?.textContent || "");
        formData.append("examAttemptId", examAttemptId);
        formData.append("audioUrl", segment?.audioUrl || "");
        formData.append("suggestedAudioUrl", segment?.suggestedAudioUrl || "");
        formData.append("userId", userId);
        formData.append("attemptCount", attemptsCount[segmentId] || 0);

        // Append audio file
        formData.append("userAudio", audioBlob, "recording.webm");

        // Submit segment - AI-Exam API call
        const response = await submitSegment(formData);
        console.log("✅ AI-Exam API SUCCESS:", response);

        return response;
      } catch (error) {
        console.error("❌ Failed to submit segment:", error);
        throw error;
      }
    },
    [
      dialogueId,
      examData,
      languageCode,
      examAttemptId,
      userId,
      filteredSegments,
      currentSegment,
      attemptsCount,
    ],
  );

  // Start recording - UPDATED with API call in recorder.onstop
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
        setRecordingStatus("idle");
        setBlinkText("");

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

          // Update segment status
          setSegmentsStatus((prev) => ({
            ...prev,
            [currentSegment.id]: "answered",
          }));

          // 🔴 CRITICAL FIX: Call AI-Exam API in BACKGROUND (no UI changes)
          // Use setTimeout to make it truly async and non-blocking
          setTimeout(async () => {
            try {
              console.log("🎯 AI-Exam API calling in background...");

              // Get current segment data
              const segment = currentSegment;

              // Create FormData
              const formData = new FormData();
              formData.append("dialogueId", dialogueId);
              formData.append(
                "language",
                examData?.dialogue?.Language?.name || languageCode || "English",
              );
              formData.append("segmentId", segment.id);
              formData.append("audioTranscript", segment?.textContent || "");
              formData.append("examAttemptId", examAttemptId);
              formData.append("audioUrl", segment?.audioUrl || "");
              formData.append(
                "suggestedAudioUrl",
                segment?.suggestedAudioUrl || "",
              );
              formData.append("userId", userId);
              formData.append("attemptCount", attemptsCount[segment.id] || 0);

              // Append audio file
              formData.append("userAudio", audioBlob, "recording.webm");

              // Submit segment - AI-Exam API call (background, no await)
              submitSegment(formData)
                .then((response) => {
                  console.log("✅ AI-Exam API SUCCESS (background):", response);
                })
                .catch((error) => {
                  console.error("❌ AI-Exam API failed (background):", error);
                  // Silent fail - user doesn't need to know
                });
            } catch (error) {
              console.error("❌ Error in background API call:", error);
              // Silent fail
            }
          }, 100); // Small delay to ensure UI is not blocked
        }

        // Reset UI
        setShowFinishButton(false);

        // Stop all audio tracks
        audioStream.getTracks().forEach((track) => track.stop());

        // Clean up audio analyzer
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      // Initialize audio analyzer for live waveforms
      initializeAudioAnalyzer(audioStream);
    } catch (error) {
      console.error("Recording error:", error);
      setRecordingStatus("idle");
      setBlinkText("");
      setShowFinishButton(false);
      alert("Microphone access denied. Please allow microphone access.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
    }
  };

  // Updated Finish Attempt Button Handler - SIMPLIFIED
  const handleFinishAttempt = () => {
    if (!currentSegment || timeExpired) return;

    console.log("🎯 Finish Attempt clicked");

    // Simply stop recording (API will be called automatically in recorder.onstop)
    if (isRecording) {
      console.log("🛑 Stopping recording...");
      stopRecording();
    }

    // Reset UI
    setShowFinishButton(false);
    setRecordingStatus("idle");
    setBlinkText("");
  };

  // Handle NEXT button click (for all segments except last)
  const handleNextClick = async () => {
    if (timeExpired) return;

    // Move to next segment immediately (NO API call here)
    if (currentSegmentIndex < filteredSegments.length - 1) {
      setCurrentSegmentIndex((prev) => prev + 1);
      // Reset audio states
      setRecordingStatus("idle");
      setBlinkText("");
      setShowFinishButton(false);
      setPlaybackProgress(0); // Reset progress
      // Clean up hidden audio
      if (hiddenAudioRef.current) {
        hiddenAudioRef.current.pause();
        hiddenAudioRef.current = null;
      }
    }
  };

  // Updated handleFinishClick (for last segment only)
  const handleFinishClick = async () => {
    if (timeExpired) return;

    // Check if all segments are answered
    const allAnswered = filteredSegments.every(
      (segment) => segmentsStatus[segment.id] === "answered",
    );

    if (!allAnswered) {
      setShowFinishSummary(true);
      return;
    }

    // Show final submission modal
    setShowFinalSubmitModal(true);
  };

  // Handle final submission
  const handleFinalSubmission = async () => {
    setIsSubmittingFinal(true);

    try {
      // Submit last segment if not already submitted
      if (
        currentSegment &&
        currentRecording &&
        !recordedAudios[currentSegment.id]
      ) {
        await submitCurrentSegment(currentSegment.id, currentRecording);
      }

      // Stop timer animation frame
      if (animationFrameRefTimer.current) {
        cancelAnimationFrame(animationFrameRefTimer.current);
        animationFrameRefTimer.current = null;
      }

      // Stop API interval
      if (incrementApiIntervalRef.current) {
        clearInterval(incrementApiIntervalRef.current);
        incrementApiIntervalRef.current = null;
      }

      // Get final result
      const result = await getExamResult(examAttemptId);
      setExamResult(result);

      // Clear localStorage
      localStorage.removeItem("examData");

      // Close final submit modal
      setShowFinalSubmitModal(false);

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
    if (timeExpired) return;

    if (currentSegmentIndex > 0) {
      setCurrentSegmentIndex((prev) => prev - 1);
      // Reset audio states
      setRecordingStatus("idle");
      setBlinkText("");
      setShowFinishButton(false);
      setPlaybackProgress(0); // Reset progress
      // Clean up hidden audio
      if (hiddenAudioRef.current) {
        hiddenAudioRef.current.pause();
        hiddenAudioRef.current = null;
      }
    }
  };

  // Load from localStorage on refresh
  useEffect(() => {
    const savedExamData = localStorage.getItem("examData");
    if (savedExamData) {
      const parsedData = JSON.parse(savedExamData);
      setExamData(parsedData);
      setSegments(parsedData.segments || []);
      setFilteredSegments(
        parsedData.filteredSegments ||
          parsedData.segments?.filter((s) => !s.isDone) ||
          [],
      );
      setExamAttemptId(parsedData.attempt.id);

      const initialRecordings = {};
      const initialAttempts = {};
      const initialStatus = {};
      const filteredSegmentsData =
        parsedData.filteredSegments ||
        parsedData.segments?.filter((s) => !s.isDone) ||
        [];

      filteredSegmentsData.forEach((segment) => {
        initialRecordings[segment.id] = null;
        initialAttempts[segment.id] = 0;
        initialStatus[segment.id] = "not_answered";
      });

      setRecordedAudios(initialRecordings);
      setAttemptsCount(initialAttempts);
      setSegmentsStatus(initialStatus);

      // Start smooth timer when loading from localStorage
      startSmoothTimer();

      // ✅ Mark as initialized when loading from localStorage
      isInitializedRef.current = true;
    }
  }, [startSmoothTimer]);

  // Handle repeat confirmation
  const handleRepeatConfirm = () => {
    setShowRepeatConfirm(false);
    playOriginalAudioAndAutoRecord();
  };

  // Handle segment click in summary modal
  const handleSegmentClick = (index) => {
    setCurrentSegmentIndex(index);
    setShowFinishSummary(false);
  };

  // Wave animation styles
  const waveStyle = {
    animation:
      recordingStatus === "playing"
        ? "waveAnimation 1s ease-in-out infinite alternate"
        : "none",
  };

  // Add CSS for wave animation
  const waveAnimationCSS = `
    @keyframes waveAnimation {
      0% { height: 30%; }
      100% { height: 100%; }
    }
    
    @keyframes blink {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
  `;

  // Live recording wave component
  const LiveRecordingWave = ({ index }) => {
    const height = waveHeights[index] || 50;
    return (
      <div
        className="w-0.5 sm:w-1 rounded-full"
        style={{
          height: `${height}%`,
          backgroundColor: "#ef4444",
          animation: isRecording
            ? "waveAnimation 0.5s ease-in-out infinite alternate"
            : "none",
        }}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="flex justify-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
        <p className="text-gray-600 text-center">Loading exam...</p>
      </div>
    );
  }

  if (!examData || filteredSegments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <p className="text-gray-600 text-center">
          No segments available for practice
        </p>
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
                {timeExpired
                  ? "Time Expired - Submitting..."
                  : "Processing Final Submission"}
              </h3>
              <p className="text-gray-600 text-center text-sm sm:text-base">
                {timeExpired
                  ? "Your time has expired. Submitting your responses..."
                  : "Submitting your responses and calculating results..."}
                <br />
                <span className="text-xs sm:text-sm">
                  This may take a moment
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Segment Submission Indicator */}
      {(isSubmittingSegment || isAudioProcessing) && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          {isSubmittingSegment
            ? "Submitting recording..."
            : "Processing audio..."}
        </div>
      )}

      {/* Time Expired Warning */}
      {timeExpired && (
        <div className="fixed top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          ⏰ Time Expired! Submitting your exam...
        </div>
      )}

      {/* Repeat Confirmation Modal */}
      <Modal
        opened={showRepeatConfirm}
        onClose={() => setShowRepeatConfirm(false)}
        centered
        size="sm"
      >
        <div className="space-y-12">
          <div className="bg-gray-100 h-32 w-32 rounded-full mx-auto shadow-md flex items-center justify-center">
            <FaTriangleExclamation size={56} className="text-orange-300" />
          </div>

          <p className="text-gray-500 text-2xl text-center ">
            Are you sure you want to repeat the segment?
          </p>

          <div className="flex justify-center  gap-2">
            <button
              onClick={() => setShowRepeatConfirm(false)}
              className="hover:bg-gray-200 cursor-pointer text-black !text-sm py-2 px-8 rounded-full"
            >
              Cancel
            </button>
            <button
              className="bg-[#006b5e] text-white cursor-pointer py-2 px-8 rounded-full"
              onClick={handleRepeatConfirm}
            >
              ok
            </button>
          </div>
        </div>
      </Modal>

      {/* Finish Exam Summary Modal */}
      <Modal
        opened={showFinishSummary}
        centered
        withCloseButton={false}
        size={"sm"}
      >
        <div className=" flex flex-col overflow-hidden">
          <div className="flex items-center justify-evenly  pb-6 border-b border-gray-300 ">
            <FaTriangleExclamation size={28} className="text-orange-300" />
            <div className="">
              <p className="font-normal ">End of dialogues</p>
              <p className="text-xs">
                You have{" "}
                {
                  filteredSegments.filter(
                    (segment) => segmentsStatus[segment.id] !== "answered",
                  ).length
                }{" "}
                {""} unanswered segment(s).
              </p>
            </div>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1">
            {filteredSegments.map((segment, idx) => (
              <div
                key={segment.id}
                onClick={() => handleSegmentClick(idx)}
                className={` py-2 border-b border-gray-300 cursor-pointer transition-colors `}
              >
                <div className="flex justify-between items-center  text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      {segmentsStatus[segment.id] === "answered" ? (
                        <FaCircle />
                      ) : (
                        <FaRegDotCircle />
                      )}
                      <span>Segment {idx + 1}</span>
                    </div>
                  </div>
                  <div className={` rounded text-xs text-gray-500  `}>
                    {segmentsStatus[segment.id] === "answered"
                      ? "Answered"
                      : "Opened, but not answered"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6 gap-2">
            <button
              onClick={() => setShowFinishSummary(false)}
              className="hover:bg-gray-200 cursor-pointer text-black !text-sm py-0.5 px-6 rounded-full"
            >
              Cancel
            </button>
            <button
              className="bg-[#006b5e] text-white cursor-pointer py-0.5 px-6 rounded-full"
              onClick={() => setShowFinishSummary(false)}
            >
              ok
            </button>
          </div>
        </div>
      </Modal>

      {/* Final Submission Modal */}
      <Modal
        opened={showFinalSubmitModal}
        onClose={() => !isSubmittingFinal && setShowFinalSubmitModal(false)}
        centered
        withCloseButton={false}
        size={"sm"}
      >
        <div className="flex flex-col overflow-hidden">
          <div className="flex items-center justify-evenly  pb-6 border-b border-gray-300 ">
            <FaTriangleExclamation size={28} className="text-orange-300" />
            <div className="">
              <p className="font-normal ">End of dialogues</p>
              <p className="text-xs">
                You have{" "}
                {
                  filteredSegments.filter(
                    (segment) => segmentsStatus[segment.id] !== "answered",
                  ).length
                }{" "}
                {""} unanswered segment(s).
              </p>
            </div>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1">
            {filteredSegments.map((segment, idx) => (
              <div
                key={segment.id}
                onClick={() => handleSegmentClick(idx)}
                className={` py-2 border-b border-gray-300 cursor-pointer transition-colors `}
              >
                <div className="flex justify-between items-center  text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      {segmentsStatus[segment.id] === "answered" ? (
                        <FaCircle />
                      ) : (
                        <FaRegDotCircle />
                      )}
                      <span>Segment {idx + 1}</span>
                    </div>
                  </div>
                  <div className={` rounded text-xs text-gray-500  `}>
                    {segmentsStatus[segment.id] === "answered"
                      ? "Answered"
                      : "Opened, but not answered"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex justify-end mt-6 gap-2">
            <button
              className="hover:bg-gray-200 cursor-pointer text-black !text-sm py-0.5 px-6 rounded-full"
              onClick={() => setShowFinalSubmitModal(false)}
              disabled={isSubmittingFinal}
            >
              Cancel
            </button>
            <button
              className="bg-[#006b5e] text-white cursor-pointer py-0.5 px-6 rounded-full"
              onClick={() => {
                setShowFinalSubmitModal(false);
                handleFinalSubmission();
              }}
              disabled={!canSubmitFinal || isSubmittingFinal}
            >
              Submit
            </button>
          </div>
        </div>
      </Modal>

      <div className="flex flex-col w-full max-h-[calc(100dvh-64px)] lg:max-h-screen h-full overflow-hidden">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-4 py-2 border-b-3 border-[#006b5e]">
          <div className="flex items-center mb-2 sm:mb-0">
            <div className="ml-2 leading-tight">
              <div className="text-lg sm:text-xl font-bold text-[#006b5e]  tracking-normal">
                assessmentQ
              </div>
            </div>
          </div>
          <div className="flex items-center text-xs sm:text-[13px] text-gray-600">
            <div className="bg-[#006b5e] p-1 rounded-full text-white mr-1">
              <User size={12} className="sm:size-[14px]" />
            </div>
            <span className="truncate max-w-[150px] sm:max-w-none">
              {loggedInUser?.email || "User"}
            </span>
          </div>
        </header>

        {/* Breadcrumb & Progress Bar */}
        <div className="flex flex-col text-sm   sm:flex-row items-start sm:items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-300  ">
          <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-0 flex-wrap">
            <span className="font-semibold">
              CCL Practice dialogue - {languageName}
            </span>

            <span>/</span>
            <span className="">Dialogue</span>
          </div>

          {/* 🔥 SMOOTH TIMER Display */}
          <div className="flex items-center gap-4">
            <div
              className={`text-sm font-semibold ${remainingTime < 60 ? "text-red-600 animate-pulse" : "text-gray-700"}`}
            >
              ⏱️ Time: {displayTime}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-nowrap">
                {currentSegmentIndex + 1}/{filteredSegments.length}
              </span>
              <div className="w-24 sm:w-32 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200 flex-grow sm:flex-grow-0">
                <div
                  className="h-full bg-[#006b5e] opacity-30 transition-all duration-300"
                  style={{
                    width: `${
                      ((currentSegmentIndex + 1) / filteredSegments.length) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Segment & Help */}
        <div className="flex flex-col text-sm  sm:flex-row items-start sm:items-center justify-between px-3 sm:px-4 py-2 sm:py-3  border-b border-gray-300  ">
          <div className="flex items-center gap-1  sm:gap-2 mb-2 sm:mb-0 flex-wrap">
            <span className="font-semibold">
              Segment - {currentSegmentIndex + 1}
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <CircleQuestionMark size={16} /> Help
          </div>
        </div>

        {/* Main Content */}
        <main
          className="grow px-4 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8 flex-1   overflow-y-scroll
        "
        >
          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-12">
            {/* Left Instructions */}
            <div className="flex-1 space-y-3 sm:space-y-4 text-xs sm:text-[13.5px] text-[#444] leading-relaxed">
              {isLastSegment ? (
                <h2 className=" text-base text-[#3db39e] font-semibold mb-4 sm:mb-6 lg:mb-8 tracking-normal text-center sm:text-left">
                  END OF PRACTICE DIALOGUE
                </h2>
              ) : (
                <h2 className=" text-base text-[#3db39e] font-semibold mb-4 sm:mb-6 lg:mb-8 tracking-normal text-center sm:text-left">
                  {languageName} - CCL test
                </h2>
              )}

              {/* 🔥 NEW: Time Warning for last 60 seconds */}
              {remainingTime < 60 && !isLastSegment && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-600 font-semibold flex items-center gap-2">
                    <Clock size={16} />
                    Warning: Only {displayTime} remaining!
                  </p>
                  <p className="text-red-500 text-xs mt-1">
                    Complete your current segment quickly or it will be
                    auto-submitted.
                  </p>
                </div>
              )}

              {isLastSegment ? (
                <div className="space-y-4">
                  <p className="flex items-center gap-1">
                    Please click on{" "}
                    <span className="border  flex items-center gap-1 border-red-500 py-1 px-4 rounded-full text-red-500">
                      <Flag size={14} />
                      Finish
                    </span>{" "}
                    at the bottom of the screen to end the practice test.
                  </p>

                  <p className="">
                    You will be shown a list of the dialogue segments.
                  </p>

                  <p className="">
                    Please make sure every segment is marked "Answered"
                  </p>
                  <p className="">
                    If "Not answered", you must click on the segment to properly
                    complete it.
                  </p>
                  <p className="mt-12">
                    Once finished, please click "Confirm".
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="font-semibold">To hear the segment</p>

                  <ul className="list-disc pl-4 sm:pl-5 flex flex-col space-y-6">
                    <li>
                      Click{" "}
                      <span className="bg-[#006b5e] py-2 px-4 rounded-full text-white">
                        Start
                      </span>{" "}
                      and speak after the chime
                    </li>
                    <li>
                      Click{" "}
                      <span className="bg-[#006b5e] py-2 px-4 rounded-full text-white">
                        Finish Attempt
                      </span>{" "}
                      to upload
                    </li>
                  </ul>

                  <p className="font-semibold mb-2">To repeat a segment</p>

                  <p>(One per dialogue without penalty)</p>

                  <ul className="list-disc pl-4 sm:pl-5 flex flex-col space-y-6">
                    <li>
                      Click{" "}
                      <span className="bg-[#006b5e] py-2 px-4 rounded-full text-white">
                        Start
                      </span>{" "}
                      again
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Right Interface (Video & Audio) */}
            <div className="flex-1">
              {/* Camera Feed */}
              <div className="w-full h-52  mb-4 sm:mb-6 overflow-hidden  flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-64 h-full object-cover rounded-md"
                  style={{ transform: "scaleX(-1)" }}
                />
              </div>

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

                {/* Original Audio - Gray wave visualization */}
                <AudioWaveRecording
                  currentSegment={currentSegment}
                  isRecording={isRecording}
                  playbackProgress={playbackProgress} // 🔥 NEW: Pass progress
                  audioDuration={audioDuration} // 🔥 NEW: Pass duration
                />

                {/* Status and Controls */}
                <div className="space-y-4">
                  {/* Attempts Count, Start Button, Finish Button in same row */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {/* Attempts Count */}
                      <div className="">
                        <span className="text-sm  text-gray-700">
                          Attempts: {currentAttempts}
                        </span>
                      </div>

                      {/* Start Button */}
                      {!showFinishButton && !isRecording && (
                        <button
                          onClick={startAudioAndRecord}
                          disabled={
                            recordingStatus === "playing" ||
                            isRecording ||
                            isSubmittingSegment ||
                            isAudioProcessing ||
                            timeExpired
                          }
                          className={`px-4 sm:px-6 py-2 rounded-full flex items-center gap-2 justify-center w-full sm:w-auto cursor-pointer ${
                            recordingStatus === "playing" ||
                            isRecording ||
                            isSubmittingSegment ||
                            isAudioProcessing ||
                            timeExpired
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-[#006b5e] text-white hover:bg-[#005a4f]"
                          }`}
                        >
                          <span className="font-medium">Start</span>
                        </button>
                      )}

                      {/* Finish Attempt Button */}
                      {showFinishButton && (
                        <button
                          onClick={handleFinishAttempt}
                          disabled={
                            recordingStatus === "playing" || timeExpired
                          }
                          className={`px-4 sm:px-6 py-2 border rounded-full flex items-center gap-2 justify-center w-full sm:w-auto ${
                            recordingStatus === "playing" || timeExpired
                              ? "cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                        >
                          Finish Attempt
                        </button>
                      )}
                    </div>

                    {/* Status Text in same row */}
                    <div className="flex items-center gap-2 animate-pulse">
                      {blinkText && recordingStatus === "playing" && (
                        <div
                          className="text-center border border-slate-900 py-1 px-2 rounded-sm "
                          style={{ animation: "blink 1s infinite" }}
                        >
                          <p className="text-sm  text-slate-900 flex items-center gap-1">
                            <Loader size={14} className="animate-spin" />
                            {blinkText}
                          </p>
                        </div>
                      )}
                      {blinkText && recordingStatus === "recording" && (
                        <div
                          className="text-center border border-red-500 py-1 px-2 rounded-sm "
                          style={{ animation: "blink 1s infinite" }}
                        >
                          <p className="text-sm font-medium text-red-600 flex items-center gap-1">
                            <span className="h-3 w-3 rounded-full bg-red-500 inline-block"></span>{" "}
                            {blinkText}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer / Bottom Progress */}
        <footer className="w-full mt-auto">
          {/* Segment Progress Dots */}
          <div className="flex w-full h-1.5 gap-0.5 sm:gap-1">
            {filteredSegments.map((_, i) => (
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
              disabled={
                currentSegmentIndex === 0 ||
                shouldDisableNavigation ||
                isSubmittingFinal
              }
              className={`flex items-center  gap-1 sm:gap-2  text-xs sm:text-[14px] font-medium px-4 sm:px-6 py-2 rounded-md transition-colors ${
                currentSegmentIndex === 0 ||
                shouldDisableNavigation ||
                isSubmittingFinal
                  ? "cursor-not-allowed"
                  : "cursor-pointer"
              }`}
            >
              <ArrowLeft size={16} className="sm:size-[18px]" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-4">
              {isLastSegment ? (
                // FINISH Button for last segment
                <button
                  onClick={handleFinishClick}
                  disabled={
                    shouldDisableNavigation || isSubmittingFinal || timeExpired
                  }
                  className={`flex items-center cursor-pointer gap-1 sm:gap-2 text-white text-xs sm:text-[14px] font-medium px-4 sm:px-6 py-2 rounded-full transition-colors ${
                    shouldDisableNavigation || isSubmittingFinal || timeExpired
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  <Flag size={16} className="sm:size-[18px]" />
                  <span>Finish</span>
                </button>
              ) : (
                // NEXT Button for all other segments
                <button
                  onClick={handleNextClick}
                  disabled={
                    shouldDisableNavigation ||
                    isSubmittingSegment ||
                    isAudioProcessing ||
                    timeExpired
                  }
                  className={`flex items-center cursor-pointer gap-1 sm:gap-2 text-white text-xs sm:text-[14px] font-medium px-4 sm:px-6 py-2 rounded-full transition-colors ${
                    shouldDisableNavigation ||
                    isSubmittingSegment ||
                    isAudioProcessing ||
                    timeExpired
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

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
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
                                  <p className="font-semibold text-red-700 text-sm sm:text-base">
                                    {segment.aiScores.cultural_context_score ||
                                      segment.culturalControlScore}
                                  </p>
                                </div>

                                <div className="bg-yellow-50 p-2 sm:p-3 rounded border border-yellow-200">
                                  <p className="text-[10px] sm:text-xs text-yellow-600 font-medium">
                                    Response Management
                                  </p>
                                  <p className="font-semibold text-yellow-700 text-sm sm:text-base">
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
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
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
