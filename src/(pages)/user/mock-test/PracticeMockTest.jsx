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
} from "lucide-react";
import { FaTriangleExclamation } from "react-icons/fa6";
import { FaCircle, FaRegDotCircle } from "react-icons/fa";
import { Modal, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

// Mock Test APIs
import {
  startMockTestAttempt,
  submitMockTestSegment,
  getMockTestResult,
  getSessionTime,
  incrementSessionTime,
} from "../../../api/mockTests";

import { useAuth } from "../../../context/AuthContext";
import AudioWaveRecording from "../../../components/PlayAndRecordSection";

const PracticeMockTest = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: loggedInUser } = useAuth();

  // Get URL parameters
  const mockTestId = searchParams.get("mockTestId");

  // User ID from auth
  const userId = loggedInUser?.id;

  // Mock Test data state
  const [mockTestData, setMockTestData] = useState(null);
  const [segments, setSegments] = useState([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [mockTestSessionId, setMockTestSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLastSegment, setIsLastSegment] = useState(false);
  const [isSessionResumed, setIsSessionResumed] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudios, setRecordedAudios] = useState({});
  const [attemptsCount, setAttemptsCount] = useState({});
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const [waveHeights, setWaveHeights] = useState([]);

  // Timer state
  const [remainingTime, setRemainingTime] = useState(1200);
  const [completedSeconds, setCompletedSeconds] = useState(0);
  const [totalDuration, setTotalDuration] = useState(1200);

  // UI states
  const [showRepeatConfirm, setShowRepeatConfirm] = useState(false);
  const [showFinishSummary, setShowFinishSummary] = useState(false);
  const [segmentsStatus, setSegmentsStatus] = useState({});
  const [showFinishButton, setShowFinishButton] = useState(false);
  const [blinkText, setBlinkText] = useState("");
  const [recordingStatus, setRecordingStatus] = useState("idle");
  const [showFinalSubmitModal, setShowFinalSubmitModal] = useState(false);
  const [canSubmitFinal, setCanSubmitFinal] = useState(false);

  // Playback progress state
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // Result modal
  const [opened, { open, close }] = useDisclosure(false);
  const [mockTestResult, setMockTestResult] = useState(null);

  // Pass rules
  const [passRules, setPassRules] = useState({
    total: { outOf: 90, passAtLeast: 62 },
    perDialogue: { outOf: 45, passAtLeast: 31 },
  });

  // Session progress
  const [sessionProgress, setSessionProgress] = useState({
    totalSegments: 0,
    completedSegments: 0,
    pendingSegments: 0,
  });

  // Refs
  const isInitializedRef = useRef(false);
  const timerIntervalRef = useRef(null);
  const timeIncrementIntervalRef = useRef(null);
  const cleanupDoneRef = useRef(false);
  const isSessionCompletedRef = useRef(false);

  const originalAudioRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);
  const hiddenAudioRef = useRef(null);

  // ==================== API CALL FUNCTIONS ====================

  // Start new mock test session
  const startNewSession = useCallback(async () => {
    try {
      console.log("🚀 Starting NEW mock test session");

      const mockTestData = {
        userId,
        mockTestId: parseInt(mockTestId),
      };

      const response = await startMockTestAttempt(mockTestData);

      console.log("✅ Start API Response:", response);

      // Save session data
      setMockTestData(response);
      setSegments(response.segments || []);
      setMockTestSessionId(response.session?.id);
      setTotalDuration(response.durationSeconds || 1200);
      setRemainingTime(response.durationSeconds || 1200);

      if (response.passRule) {
        setPassRules(response.passRule);
      }

      // Set progress
      if (response.progress) {
        setSessionProgress(response.progress);
      } else {
        const total = response.segments?.length || 0;
        setSessionProgress({
          totalSegments: total,
          completedSegments: 0,
          pendingSegments: total,
        });
      }

      // Initialize recordings and attempts
      const initialRecordings = {};
      const initialAttempts = {};
      const initialStatus = {};

      response.segments?.forEach((segment) => {
        initialRecordings[segment.id] = null;
        initialAttempts[segment.id] = 0;
        initialStatus[segment.id] = "not_answered";
      });

      setRecordedAudios(initialRecordings);
      setAttemptsCount(initialAttempts);
      setSegmentsStatus(initialStatus);

      // Check if any segments are already completed from API
      if (response.results) {
        response.results.forEach((result) => {
          if (result.status === "completed") {
            initialStatus[result.segmentId] = "answered";
            initialAttempts[result.segmentId] = 1;
          }
        });
      }

      // Save session info to localStorage
      const sessionData = {
        sessionId: response.session?.id,
        mockTestId: parseInt(mockTestId),
        userId: userId,
        startedAt: Date.now(),
        isNewSession: true,
      };

      localStorage.setItem("mockTestSessionData", JSON.stringify(sessionData));
      localStorage.setItem("mockTestData", JSON.stringify(response));

      // Initialize progress data
      localStorage.setItem(
        "mockTestRecordings",
        JSON.stringify(initialRecordings),
      );
      localStorage.setItem("mockTestAttempts", JSON.stringify(initialAttempts));
      localStorage.setItem("mockTestStatus", JSON.stringify(initialStatus));
      localStorage.setItem("currentSegmentIndex", "0");

      setIsSessionResumed(false);
      return response;
    } catch (error) {
      console.error("❌ Failed to start mock test:", error);
      throw error;
    }
  }, [mockTestId, userId]);

  // Resume existing session
  const resumeSession = useCallback(
    async (sessionId) => {
      try {
        console.log("🔄 Attempting to resume session:", sessionId);

        // We need to simulate the progress API response
        // Since we don't have the exact API, we'll check localStorage first
        const savedData = localStorage.getItem("mockTestData");

        if (savedData) {
          const parsedData = JSON.parse(savedData);

          // Check if it's the same mock test
          if (
            parsedData.mockTest?.id === parseInt(mockTestId) ||
            parsedData.mockTestId === parseInt(mockTestId)
          ) {
            console.log("✅ Found matching session data in localStorage");

            // Load data from localStorage
            setMockTestData(parsedData);
            setSegments(parsedData.segments || []);
            setMockTestSessionId(sessionId);
            setTotalDuration(parsedData.durationSeconds || 1200);

            if (parsedData.passRule) {
              setPassRules(parsedData.passRule);
            }

            // Load recordings and attempts from localStorage
            const savedRecordings = JSON.parse(
              localStorage.getItem("mockTestRecordings") || "{}",
            );
            const savedAttempts = JSON.parse(
              localStorage.getItem("mockTestAttempts") || "{}",
            );
            const savedStatus = JSON.parse(
              localStorage.getItem("mockTestStatus") || "{}",
            );
            const savedIndex =
              localStorage.getItem("currentSegmentIndex") || "0";

            setRecordedAudios(savedRecordings);
            setAttemptsCount(savedAttempts);
            setSegmentsStatus(savedStatus);
            setCurrentSegmentIndex(parseInt(savedIndex));

            // Calculate progress
            const totalSegments = parsedData.segments?.length || 0;
            const completedSegments = Object.values(savedStatus).filter(
              (status) => status === "answered",
            ).length;

            setSessionProgress({
              totalSegments,
              completedSegments,
              pendingSegments: totalSegments - completedSegments,
            });

            setIsSessionResumed(true);

            // Return mock progress response
            return {
              success: true,
              session: parsedData.session || {
                id: sessionId,
                status: "in_progress",
              },
              progress: {
                totalSegments,
                completedSegments,
                pendingSegments: totalSegments - completedSegments,
              },
              segments: parsedData.segments,
              mockTest: parsedData.mockTest,
              passRule: parsedData.passRule,
              durationSeconds: parsedData.durationSeconds,
            };
          }
        }

        // If no saved data, start new session
        console.log("📝 No matching session found, starting new");
        return await startNewSession();
      } catch (error) {
        console.error("❌ Failed to resume session:", error);
        throw error;
      }
    },
    [mockTestId, startNewSession],
  );

  // ==================== TIMER FUNCTIONS ====================

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Start timer
  const startTimer = useCallback(async () => {
    if (!mockTestSessionId || !userId || cleanupDoneRef.current) return;

    try {
      // Get already completed seconds from backend
      const timeResponse = await getSessionTime(mockTestSessionId, userId);
      const alreadyCompleted = timeResponse?.data?.completedSeconds || 0;
      setCompletedSeconds(alreadyCompleted);

      // Calculate remaining time
      const remaining = Math.max(0, totalDuration - alreadyCompleted);
      setRemainingTime(remaining);

      // Start frontend countdown
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      timerIntervalRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Start backend time increment every 30 seconds
      if (timeIncrementIntervalRef.current) {
        clearInterval(timeIncrementIntervalRef.current);
      }

      timeIncrementIntervalRef.current = setInterval(async () => {
        try {
          await incrementSessionTime(mockTestSessionId, {
            userId,
            seconds: 30,
          });
          setCompletedSeconds((prev) => prev + 30);
        } catch (error) {
          console.error("Failed to increment session time:", error);
        }
      }, 30000);
    } catch (error) {
      console.error("Failed to start timer:", error);
      // Continue with frontend timer even if backend fails
      timerIntervalRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [mockTestSessionId, userId, totalDuration]);

  // Clean up all timers and intervals
  const stopAllTimers = useCallback(() => {
    if (cleanupDoneRef.current) return;

    console.log("🧹 Stopping all timers...");

    // Stop frontend timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Stop backend time increment interval
    if (timeIncrementIntervalRef.current) {
      clearInterval(timeIncrementIntervalRef.current);
      timeIncrementIntervalRef.current = null;
    }

    cleanupDoneRef.current = true;
  }, []);

  const handleTimeUp = useCallback(async () => {
    console.log("⏰ Time's up! Auto-submitting...");
    stopAllTimers();

    if (mockTestSessionId && userId) {
      try {
        setIsSubmittingFinal(true);
        const result = await getMockTestResult(mockTestSessionId, userId);
        setMockTestResult(result);

        // Clear localStorage
        localStorage.removeItem("mockTestSessionData");
        localStorage.removeItem("mockTestData");
        localStorage.removeItem("mockTestRecordings");
        localStorage.removeItem("mockTestAttempts");
        localStorage.removeItem("mockTestStatus");
        localStorage.removeItem("currentSegmentIndex");

        open();
      } catch (error) {
        console.error("Failed to auto-submit:", error);
        alert("Time's up! Please submit manually.");
      } finally {
        setIsSubmittingFinal(false);
      }
    } else {
      alert("Time's up! Please submit manually.");
    }
  }, [mockTestSessionId, userId, stopAllTimers, open]);

  // ==================== INITIALIZATION ====================

  // Initialize mock test
  useEffect(() => {
    if (!mockTestId || !userId) {
      navigate("/user/mock-test");
      return;
    }

    if (isInitializedRef.current) return;

    const initializeMockTest = async () => {
      try {
        setIsLoading(true);
        console.log("🔧 Initializing mock test...");

        // Check localStorage for existing session
        const savedSession = JSON.parse(
          localStorage.getItem("mockTestSessionData") || "null",
        );

        let response;
        let shouldResume = false;

        // Check if we should resume existing session
        if (
          savedSession &&
          savedSession.sessionId &&
          savedSession.mockTestId === parseInt(mockTestId) &&
          savedSession.userId === userId
        ) {
          console.log("📁 Found existing session for user");
          response = await resumeSession(savedSession.sessionId);
          shouldResume = true;
        } else {
          // Start new session
          console.log("🆕 Starting new session");
          response = await startNewSession();
          shouldResume = false;
        }

        if (!response) {
          throw new Error("Failed to initialize session");
        }

        // Check if session is already completed
        if (response.session?.status === "completed") {
          console.log("✅ Session already completed, showing results");
          isSessionCompletedRef.current = true;

          // Get final results
          const result = await getMockTestResult(response.session.id, userId);
          setMockTestResult(result);

          // Clear localStorage
          localStorage.removeItem("mockTestSessionData");
          localStorage.removeItem("mockTestData");
          localStorage.removeItem("mockTestRecordings");
          localStorage.removeItem("mockTestAttempts");
          localStorage.removeItem("mockTestStatus");
          localStorage.removeItem("currentSegmentIndex");

          setIsLoading(false);
          open(); // Open results modal
          return;
        }

        // Set initial segment
        const initialIndex = parseInt(
          localStorage.getItem("currentSegmentIndex") || "0",
        );
        setCurrentSegmentIndex(initialIndex);

        if (response.segments?.length > 0) {
          setIsLastSegment(initialIndex === response.segments.length - 1);
        }

        // Start timer
        await startTimer();

        isInitializedRef.current = true;
        setIsLoading(false);

        console.log(
          `✅ Mock test initialized successfully (${shouldResume ? "Resumed" : "New"})`,
        );
      } catch (error) {
        console.error("❌ Failed to initialize mock test:", error);
        alert("Failed to start mock test. Please try again.");
        navigate("/user/mock-test");
      }
    };

    initializeMockTest();

    // Cleanup on unmount
    return () => {
      console.log("🔴 Component unmounting - cleaning up...");
      stopAllTimers();
      cleanupDoneRef.current = false;

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      if (hiddenAudioRef.current) {
        hiddenAudioRef.current.pause();
        hiddenAudioRef.current = null;
      }

      isInitializedRef.current = false;
    };
  }, [
    mockTestId,
    userId,
    navigate,
    startTimer,
    stopAllTimers,
    startNewSession,
    resumeSession,
    open,
  ]);

  // Save progress on changes
  useEffect(() => {
    if (!mockTestSessionId) return;

    // Save recordings
    localStorage.setItem("mockTestRecordings", JSON.stringify(recordedAudios));
    // Save attempts
    localStorage.setItem("mockTestAttempts", JSON.stringify(attemptsCount));
    // Save status
    localStorage.setItem("mockTestStatus", JSON.stringify(segmentsStatus));
    // Save current index
    localStorage.setItem("currentSegmentIndex", currentSegmentIndex.toString());

    // Update progress
    const totalSegments = segments.length;
    const completedSegments = Object.values(segmentsStatus).filter(
      (status) => status === "answered",
    ).length;

    setSessionProgress({
      totalSegments,
      completedSegments,
      pendingSegments: totalSegments - completedSegments,
    });
  }, [
    mockTestSessionId,
    recordedAudios,
    attemptsCount,
    segmentsStatus,
    currentSegmentIndex,
    segments,
  ]);

  // Initialize wave heights
  useEffect(() => {
    const heights = Array.from({ length: 20 }, () => Math.random() * 100);
    setWaveHeights(heights);
  }, [currentSegmentIndex]);

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

    if (!isLoading && mockTestData) {
      initializeCamera();
    }
  }, [isLoading, mockTestData]);

  // ==================== SEGMENT MANAGEMENT ====================

  // Get current segment
  const currentSegment = segments[currentSegmentIndex];
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

  // Calculate if all segments are attempted
  useEffect(() => {
    if (segments.length > 0) {
      const allAttempted = segments.every((segment) => {
        const attempts = attemptsCount[segment.id] || 0;
        return attempts > 0;
      });
      setCanSubmitFinal(allAttempted);
    }
  }, [segments, attemptsCount]);

  // Check if navigation should be disabled
  const shouldDisableNavigation = false;

  // ==================== AUDIO FUNCTIONS ====================

  // Start audio and auto-record function
  const startAudioAndRecord = () => {
    if (!currentSegment) return;

    // Check if this segment has been attempted before
    if (attemptsCount[currentSegment.id] > 0) {
      setShowRepeatConfirm(true);
      return;
    }

    playOriginalAudioAndAutoRecord();
  };

  // Play original audio and auto-start recording
  const playOriginalAudioAndAutoRecord = () => {
    if (currentSegment?.audioUrl) {
      setRecordingStatus("playing");
      setBlinkText("Playing Source File");
      setShowFinishButton(true);
      setPlaybackProgress(0);

      if (hiddenAudioRef.current) {
        hiddenAudioRef.current.pause();
        hiddenAudioRef.current = null;
      }

      hiddenAudioRef.current = new Audio(currentSegment.audioUrl);

      hiddenAudioRef.current.addEventListener("loadedmetadata", () => {
        setAudioDuration(hiddenAudioRef.current.duration);
      });

      let animationFrameId;
      const smoothUpdate = () => {
        if (hiddenAudioRef.current && !hiddenAudioRef.current.ended) {
          const progress =
            (hiddenAudioRef.current.currentTime /
              hiddenAudioRef.current.duration) *
            100;
          setPlaybackProgress(progress);
          if (!hiddenAudioRef.current.ended && !hiddenAudioRef.current.paused) {
            animationFrameId = requestAnimationFrame(smoothUpdate);
          }
        }
      };

      hiddenAudioRef.current
        .play()
        .then(() => {
          animationFrameId = requestAnimationFrame(smoothUpdate);

          hiddenAudioRef.current.onended = () => {
            cancelAnimationFrame(animationFrameId);
            setRecordingStatus("recording");
            setBlinkText("REC");
            setPlaybackProgress(100);
            startRecording();
          };

          hiddenAudioRef.current.onerror = () => {
            cancelAnimationFrame(animationFrameId);
            setRecordingStatus("idle");
            setBlinkText("");
            setShowFinishButton(false);
            setPlaybackProgress(0);
            alert("Failed to play audio. Please try again.");
          };
        })
        .catch((error) => {
          console.error("Audio play error:", error);
          setRecordingStatus("idle");
          setBlinkText("");
          setShowFinishButton(false);
          setPlaybackProgress(0);
          alert("Failed to play audio. Please make sure audio is available.");
        });
    }
  };

  // Initialize audio analyzer
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
    updateWaveHeights();
  };

  const updateWaveHeights = () => {
    if (!analyserRef.current || !isRecording) return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    const average =
      dataArrayRef.current.reduce((a, b) => a + b) /
      dataArrayRef.current.length;

    const newHeights = Array.from({ length: 20 }, (_, i) => {
      const index = Math.floor(i * (dataArrayRef.current.length / 20));
      const height = (dataArrayRef.current[index] || average) / 2.55;
      return Math.min(100, Math.max(10, height));
    });

    setWaveHeights(newHeights);
    animationFrameRef.current = requestAnimationFrame(updateWaveHeights);
  };

  // Submit segment in background
  const submitSegmentInBackground = useCallback(
    async (segmentId, audioBlob) => {
      if (!segmentId || !audioBlob || !mockTestSessionId) return;

      try {
        const formData = new FormData();
        formData.append("userId", userId);
        formData.append("mockTestSessionId", mockTestSessionId);
        formData.append("segmentId", segmentId);

        if (currentSegment?.languageId) {
          formData.append("language", `Language ${currentSegment.languageId}`);
        }
        if (currentSegment?.audioUrl) {
          formData.append("audioUrl", currentSegment.audioUrl);
        }
        if (currentSegment?.suggestedAudioUrl) {
          formData.append(
            "suggestedAudioUrl",
            currentSegment.suggestedAudioUrl,
          );
        }

        formData.append("userAudio", audioBlob, "recording.webm");

        // Submit in background
        submitMockTestSegment(formData).catch((error) => {
          console.error("Background segment submission failed:", error);
        });
      } catch (error) {
        console.error("Error preparing segment submission:", error);
      }
    },
    [mockTestSessionId, userId, currentSegment],
  );

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
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        setRecordingStatus("idle");
        setBlinkText("");

        const audioBlob = new Blob(chunks, { type: "audio/webm" });

        if (currentSegment) {
          setRecordedAudios((prev) => ({
            ...prev,
            [currentSegment.id]: audioBlob,
          }));

          setAttemptsCount((prev) => ({
            ...prev,
            [currentSegment.id]: (prev[currentSegment.id] || 0) + 1,
          }));

          setSegmentsStatus((prev) => ({
            ...prev,
            [currentSegment.id]: "answered",
          }));

          // Submit in background
          submitSegmentInBackground(currentSegment.id, audioBlob);
        }

        // Reset UI immediately
        setShowFinishButton(false);

        // Stop audio tracks
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

  // ==================== UI HANDLERS ====================

  // Finish Attempt Button Handler
  const handleFinishAttempt = () => {
    if (!currentSegment) return;

    if (isRecording) {
      stopRecording();
    }

    setShowFinishButton(false);
    setRecordingStatus("idle");
    setBlinkText("");
  };

  // Handle NEXT button click
  const handleNextClick = () => {
    if (currentSegmentIndex < segments.length - 1) {
      setCurrentSegmentIndex((prev) => prev + 1);
      setRecordingStatus("idle");
      setBlinkText("");
      setShowFinishButton(false);
      setPlaybackProgress(0);
      if (hiddenAudioRef.current) {
        hiddenAudioRef.current.pause();
        hiddenAudioRef.current = null;
      }
    }
  };

  // Handle FINISH click
  const handleFinishClick = () => {
    const allAnswered = segments.every(
      (segment) => segmentsStatus[segment.id] === "answered",
    );

    if (!allAnswered) {
      setShowFinishSummary(true);
      return;
    }

    setShowFinalSubmitModal(true);
  };

  // Handle final submission
  const handleFinalSubmission = async () => {
    if (!mockTestSessionId) {
      alert("Cannot submit: Session ID missing");
      return;
    }

    setIsSubmittingFinal(true);
    stopAllTimers();

    try {
      const result = await getMockTestResult(mockTestSessionId, userId);
      setMockTestResult(result);

      // Clear localStorage
      localStorage.removeItem("mockTestSessionData");
      localStorage.removeItem("mockTestData");
      localStorage.removeItem("mockTestRecordings");
      localStorage.removeItem("mockTestAttempts");
      localStorage.removeItem("mockTestStatus");
      localStorage.removeItem("currentSegmentIndex");

      setShowFinalSubmitModal(false);
      open();
    } catch (error) {
      console.error("Failed to get result:", error);
      alert("Failed to get mock test results. Please try again.");
    } finally {
      setIsSubmittingFinal(false);
    }
  };

  // Handle previous button click
  const handlePreviousClick = () => {
    if (currentSegmentIndex > 0) {
      setCurrentSegmentIndex((prev) => prev - 1);
      setRecordingStatus("idle");
      setBlinkText("");
      setShowFinishButton(false);
      setPlaybackProgress(0);
      if (hiddenAudioRef.current) {
        hiddenAudioRef.current.pause();
        hiddenAudioRef.current = null;
      }
    }
  };

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

  // Check pass/fail status
  const checkPassStatus = (result) => {
    if (!result || !result.data) return false;

    const dialogue1Score =
      result.data.dialogue1Score || result.finalResult?.dialogue1Score || 0;
    const dialogue2Score =
      result.data.dialogue2Score || result.finalResult?.dialogue2Score || 0;
    const totalScore =
      result.data.totalScore || result.finalResult?.totalScore || 0;

    const totalPass = totalScore >= passRules.total.passAtLeast;
    const dialogue1Pass = dialogue1Score >= passRules.perDialogue.passAtLeast;
    const dialogue2Pass = dialogue2Score >= passRules.perDialogue.passAtLeast;

    return totalPass && dialogue1Pass && dialogue2Pass;
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

  // ==================== RENDER LOGIC ====================

  // If session is already completed and we have results
  if (isSessionCompletedRef.current && mockTestResult) {
    return (
      <Modal
        opened={true}
        closeOnClickOutside={false}
        onClose={() => navigate("/user/mock-test")}
        title="Mock Test Results"
        size="lg"
        fullScreen={window.innerWidth < 768}
        radius={"lg"}
        withCloseButton={true}
        centered
        overlayProps={{ blur: 3, opacity: 0.25 }}
      >
        <ResultContent
          result={mockTestResult}
          passRules={passRules}
          completedSeconds={completedSeconds}
          onClose={() => navigate("/user/mock-test")}
        />
      </Modal>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="flex justify-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
        <p className="text-gray-600 text-center">
          {isSessionResumed ? "Resuming mock test..." : "Loading mock test..."}
        </p>
      </div>
    );
  }

  if (!mockTestData || segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <p className="text-gray-600 text-center">No mock test data found</p>
        <button
          onClick={() => navigate("/user/mock-test")}
          className="mt-4 cursor-pointer px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <>
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
              </p>
            </div>
          </div>
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
              <p className="font-normal ">End of mock test</p>
              <p className="text-xs">
                You have{" "}
                {
                  segments.filter(
                    (segment) => segmentsStatus[segment.id] !== "answered",
                  ).length
                }{" "}
                {""} unanswered segment(s).
              </p>
            </div>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1">
            {segments.map((segment, idx) => (
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
              <p className="font-normal ">End of mock test</p>
              <p className="text-xs">
                You have{" "}
                {
                  segments.filter(
                    (segment) => segmentsStatus[segment.id] !== "answered",
                  ).length
                }{" "}
                {""} unanswered segment(s).
              </p>
            </div>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1">
            {segments.map((segment, idx) => (
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
        {/* Top Header with TIMER */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-4 py-2 border-b-3 border-[#006b5e]">
          <div className="flex items-center mb-2 sm:mb-0">
            <div className="ml-2 leading-tight">
              <div className="text-lg sm:text-xl font-bold text-[#006b5e] tracking-normal">
                Mock Test: {mockTestData?.mockTest?.title || "Practice Test"}
              </div>
            </div>
          </div>

          {/* TIMER DISPLAY */}
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full ${remainingTime < 300 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
            >
              <Clock size={16} />
              <span className="font-bold">{formatTime(remainingTime)}</span>
              <span className="text-xs">remaining</span>
            </div>

            <div className="flex items-center text-xs sm:text-[13px] text-gray-600">
              <div className="bg-[#006b5e] p-1 rounded-full text-white mr-1">
                <User size={12} className="sm:size-[14px]" />
              </div>
              <span className="truncate max-w-[150px] sm:max-w-none">
                {loggedInUser?.email || "User"}
              </span>
            </div>
          </div>
        </header>

        {/* Breadcrumb & Progress Bar */}
        <div className="flex flex-col text-sm sm:flex-row items-start sm:items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-300">
          <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-0 flex-wrap">
            <span className="font-semibold">
              Mock Test - {mockTestData?.mockTest?.title || "Practice"}
            </span>
            <span>/</span>
            <span className="">Segment</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-nowrap">
              {currentSegmentIndex + 1}/{segments.length}
            </span>
            <div className="w-24 sm:w-32 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200 flex-grow sm:flex-grow-0">
              <div
                className="h-full bg-[#006b5e] opacity-30 transition-all duration-300"
                style={{
                  width: `${((currentSegmentIndex + 1) / segments.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Segment & Help */}
        <div className="flex flex-col text-sm sm:flex-row items-start sm:items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-300">
          <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-0 flex-wrap">
            <span className="font-semibold">
              Segment - {currentSegmentIndex + 1}
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <CircleQuestionMark size={16} /> Help
          </div>
        </div>

        {/* Main Content */}
        <main className="grow px-4 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8 flex-1 overflow-y-scroll">
          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-12">
            {/* Left Instructions - EXACT SAME ORIGINAL DESIGN */}
            <div className="flex-1 space-y-3 sm:space-y-4 text-xs sm:text-[13.5px] text-[#444] leading-relaxed">
              {isLastSegment ? (
                <h2 className="text-base text-[#3db39e] font-semibold mb-4 sm:mb-6 lg:mb-8 tracking-normal text-center sm:text-left">
                  END OF MOCK TEST
                </h2>
              ) : (
                <h2 className="text-base text-[#3db39e] font-semibold mb-4 sm:mb-6 lg:mb-8 tracking-normal text-center sm:text-left">
                  Mock Test - Complete both dialogues
                </h2>
              )}

              {isLastSegment ? (
                <div className="space-y-4">
                  <p className="flex items-center gap-1">
                    Please click on{" "}
                    <span className="border flex items-center gap-1 border-red-500 py-1 px-4 rounded-full text-red-500">
                      <Flag size={14} />
                      Finish
                    </span>{" "}
                    at the bottom of the screen to end the mock test.
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
              <div className="w-full h-52 mb-4 sm:mb-6 overflow-hidden flex items-center justify-center">
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
                {currentSegment?.audioUrl && (
                  <audio
                    ref={originalAudioRef}
                    src={currentSegment.audioUrl}
                    style={{ display: "none" }}
                  />
                )}

                <AudioWaveRecording
                  currentSegment={currentSegment}
                  isRecording={isRecording}
                  playbackProgress={playbackProgress}
                  audioDuration={audioDuration}
                />

                {/* Status and Controls */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {/* Attempts Count */}
                      <div className="">
                        <span className="text-sm text-gray-700">
                          Attempts: {currentAttempts}
                        </span>
                      </div>

                      {/* Start Button */}
                      {!showFinishButton && !isRecording && (
                        <button
                          onClick={startAudioAndRecord}
                          disabled={recordingStatus === "playing"}
                          className={`px-4 sm:px-6 py-2 rounded-full flex items-center gap-2 justify-center w-full sm:w-auto cursor-pointer ${
                            recordingStatus === "playing"
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
                          disabled={recordingStatus === "playing"}
                          className={`px-4 sm:px-6 py-2 border rounded-full flex items-center gap-2 justify-center w-full sm:w-auto ${
                            recordingStatus === "playing"
                              ? "cursor-not-allowed"
                              : "cursor-pointer bg-white hover:bg-gray-50"
                          }`}
                        >
                          Finish Attempt
                        </button>
                      )}
                    </div>

                    {/* Status Text */}
                    <div className="flex items-center gap-2 animate-pulse">
                      {blinkText && recordingStatus === "playing" && (
                        <div
                          className="text-center border border-slate-900 py-1 px-2 rounded-sm "
                          style={{ animation: "blink 1s infinite" }}
                        >
                          <p className="text-sm text-slate-900 flex items-center gap-1">
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
              disabled={currentSegmentIndex === 0 || isSubmittingFinal}
              className={`flex items-center gap-1 sm:gap-2 text-xs sm:text-[14px] font-medium px-4 sm:px-6 py-2 rounded-md transition-colors ${
                currentSegmentIndex === 0 || isSubmittingFinal
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:text-gray-900 cursor-pointer"
              }`}
            >
              <ArrowLeft size={16} className="sm:size-[18px]" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-4">
              {isLastSegment ? (
                <button
                  onClick={handleFinishClick}
                  disabled={isSubmittingFinal}
                  className={`flex items-center gap-1 sm:gap-2 text-white text-xs sm:text-[14px] font-medium px-4 sm:px-6 py-2 rounded-full transition-colors ${
                    isSubmittingFinal
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700 cursor-pointer"
                  }`}
                >
                  <Flag size={16} className="sm:size-[18px]" />
                  <span>Finish</span>
                </button>
              ) : (
                <button
                  onClick={handleNextClick}
                  className="flex items-center gap-1 sm:gap-2 text-white text-xs sm:text-[14px] font-medium px-4 sm:px-6 py-2 rounded-full bg-[#006b5e] hover:bg-[#005a4f] cursor-pointer"
                >
                  <span>Next</span>
                  <ArrowRight size={16} className="sm:size-[18px]" />
                </button>
              )}
            </div>
          </div>
        </footer>

        {/* Result Modal */}
        <Modal
          opened={opened}
          closeOnClickOutside={false}
          onClose={close}
          title="Mock Test Results"
          size="lg"
          fullScreen={window.innerWidth < 768}
          radius={"lg"}
          withCloseButton={true}
          centered
          overlayProps={{ blur: 3, opacity: 0.25 }}
        >
          {mockTestResult ? (
            <ResultContent
              result={mockTestResult}
              passRules={passRules}
              completedSeconds={completedSeconds}
              onClose={() => {
                close();
                navigate("/user/mock-test");
              }}
            />
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

// Separate Result Content Component
const ResultContent = ({ result, passRules, completedSeconds, onClose }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const checkPassStatus = () => {
    if (!result || !result.data) return false;

    const dialogue1Score =
      result.data.dialogue1Score || result.finalResult?.dialogue1Score || 0;
    const dialogue2Score =
      result.data.dialogue2Score || result.finalResult?.dialogue2Score || 0;
    const totalScore =
      result.data.totalScore || result.finalResult?.totalScore || 0;

    const totalPass = totalScore >= (passRules?.total?.passAtLeast || 62);
    const dialogue1Pass =
      dialogue1Score >= (passRules?.perDialogue?.passAtLeast || 31);
    const dialogue2Pass =
      dialogue2Score >= (passRules?.perDialogue?.passAtLeast || 31);

    return totalPass && dialogue1Pass && dialogue2Pass;
  };

  const passed = checkPassStatus();

  return (
    <div className="space-y-4 sm:space-y-6 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto pr-1 sm:pr-2">
      <div
        className={`p-4 sm:p-6 rounded-lg border ${passed ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h3 className="font-bold text-lg sm:text-xl mb-2">
              <CheckCircle
                size={20}
                className={`inline mr-2 sm:size-[24px] ${passed ? "text-emerald-600" : "text-red-600"}`}
              />
              {passed
                ? "🎉 You have passed this mock test!"
                : "❌ Mock Test Failed"}
            </h3>
            <p
              className={`text-sm ${passed ? "text-emerald-700" : "text-red-700"}`}
            >
              {passed
                ? "Congratulations! You met all passing criteria."
                : "You did not meet all passing criteria. Please review your performance and try again."}
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-full font-bold ${passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
          >
            {passed ? "PASSED" : "FAILED"}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
          <div
            className={`p-3 sm:p-4 rounded-lg border ${(result.finalResult?.dialogue1Score || 0) >= (passRules?.perDialogue?.passAtLeast || 31) ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
          >
            <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">
              Dialogue 1 Score
            </p>
            <div className="flex items-baseline justify-between">
              <p className="text-xl sm:text-2xl font-bold">
                {result.finalResult?.dialogue1Score?.toFixed(1) || "0.0"}
                <span className="text-sm text-gray-500 ml-1">
                  / {passRules?.perDialogue?.outOf || 45}
                </span>
              </p>
              <span
                className={`text-xs px-2 py-1 rounded-full ${(result.finalResult?.dialogue1Score || 0) >= (passRules?.perDialogue?.passAtLeast || 31) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
              >
                {(result.finalResult?.dialogue1Score || 0) >=
                (passRules?.perDialogue?.passAtLeast || 31)
                  ? "✓ Pass"
                  : "✗ Fail"}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Required: ≥{passRules?.perDialogue?.passAtLeast || 31}
            </p>
          </div>

          <div
            className={`p-3 sm:p-4 rounded-lg border ${(result.finalResult?.dialogue2Score || 0) >= (passRules?.perDialogue?.passAtLeast || 31) ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
          >
            <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">
              Dialogue 2 Score
            </p>
            <div className="flex items-baseline justify-between">
              <p className="text-xl sm:text-2xl font-bold">
                {result.finalResult?.dialogue2Score?.toFixed(1) || "0.0"}
                <span className="text-sm text-gray-500 ml-1">
                  / {passRules?.perDialogue?.outOf || 45}
                </span>
              </p>
              <span
                className={`text-xs px-2 py-1 rounded-full ${(result.finalResult?.dialogue2Score || 0) >= (passRules?.perDialogue?.passAtLeast || 31) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
              >
                {(result.finalResult?.dialogue2Score || 0) >=
                (passRules?.perDialogue?.passAtLeast || 31)
                  ? "✓ Pass"
                  : "✗ Fail"}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Required: ≥{passRules?.perDialogue?.passAtLeast || 31}
            </p>
          </div>

          <div
            className={`p-3 sm:p-4 rounded-lg border ${(result.finalResult?.totalScore || 0) >= (passRules?.total?.passAtLeast || 62) ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"}`}
          >
            <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">
              Total Score
            </p>
            <div className="flex items-baseline justify-between">
              <p className="text-xl sm:text-2xl font-bold">
                {result.finalResult?.totalScore?.toFixed(1) || "0.0"}
                <span className="text-sm text-gray-500 ml-1">
                  / {passRules?.total?.outOf || 90}
                </span>
              </p>
              <span
                className={`text-xs px-2 py-1 rounded-full ${(result.finalResult?.totalScore || 0) >= (passRules?.total?.passAtLeast || 62) ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}
              >
                {(result.finalResult?.totalScore || 0) >=
                (passRules?.total?.passAtLeast || 62)
                  ? "✓ Pass"
                  : "✗ Fail"}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Required: ≥{passRules?.total?.passAtLeast || 62}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">Time Taken:</span>
            </div>
            <span className="font-semibold">
              {formatTime(completedSeconds)} / 20:00
            </span>
          </div>
        </div>

        {result.finalResult?.overallFeedback && (
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 mt-4">
            <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base flex items-center">
              <MessageSquare size={14} className="mr-2 sm:size-[16px]" />
              Overall Feedback
            </h4>
            <div className="text-gray-700 whitespace-pre-line bg-gray-50 p-3 sm:p-4 rounded border border-gray-300 text-xs sm:text-sm">
              {result.finalResult.overallFeedback}
            </div>
          </div>
        )}
      </div>

      {/* Detailed Segment Results */}
      {result.results && result.results.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">Detailed Segment Results</h4>
          <div className="space-y-3 ">
            {result.results.map((segmentResult, index) => (
              <div
                key={segmentResult.id}
                className="border rounded-lg p-3 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-medium text-sm">Segment {index + 1}</h5>
                  <span
                    className={`px-2 py-1 rounded text-xs ${segmentResult.obtainedMarks >= 6 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    Score: {segmentResult.obtainedMarks}/9
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-1">
                  {segmentResult.segment?.textContent}
                </p>
                {segmentResult.oneLineFeedback && (
                  <p className="text-xs text-gray-700">
                    {segmentResult.oneLineFeedback}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
        <Button
          onClick={onClose}
          color="teal"
          size={window.innerWidth < 640 ? "sm" : "md"}
          fullWidth={window.innerWidth < 640}
        >
          Back to Mock Tests
        </Button>
      </div>
    </div>
  );
};

export default PracticeMockTest;
