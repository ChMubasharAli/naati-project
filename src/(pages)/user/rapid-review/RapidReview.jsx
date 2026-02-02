import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  User,
  Loader2,
  Clock,
  CheckCircle,
  ArrowRight,
  CircleQuestionMark,
  Loader,
  ArrowLeft,
  Flag,
  Mic,
  Upload,
} from "lucide-react";
import { FaTriangleExclamation } from "react-icons/fa6";
import { Modal } from "@mantine/core";
import { startExamAttempt, submitSegment } from "../../../api/exams";
import { useAuth } from "../../../context/AuthContext";

import { useQuery, useMutation } from "@tanstack/react-query";
import AiResponseModal from "./RapidReviewExamResultModal";
import RapidReviewPlayAndRecordSection from "../../../components/RapidReviewPlayAndRecordSection";

const TOTAL_EXAM_TIME = 20 * 60; // 20 minutes in seconds
const AUTO_RESTART_SECONDS = 30; // 30 seconds pehle restart

const PracticeDialogue = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: loggedInUser } = useAuth();
  const [volume, setVolume] = useState(50);

  const dialogueId = searchParams.get("dialogueId");
  const languageName = searchParams.get("language") || "English";
  const tryAgain = searchParams.get("new");

  const userId = loggedInUser?.id;

  const [examData, setExamData] = useState(null);
  const [segments, setSegments] = useState([]);
  const [filteredSegments, setFilteredSegments] = useState([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [examAttemptId, setExamAttemptId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLastSegment, setIsLastSegment] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudios, setRecordedAudios] = useState({});
  const [attemptsCount, setAttemptsCount] = useState({});
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [waveHeights, setWaveHeights] = useState([]);

  const [showRepeatConfirm, setShowRepeatConfirm] = useState(false);
  const [segmentsStatus, setSegmentsStatus] = useState({});
  const [blinkText, setBlinkText] = useState("");
  const [recordingStatus, setRecordingStatus] = useState("idle");
  const [isEvaluating, setIsEvaluating] = useState(false);

  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const [remainingTime, setRemainingTime] = useState(TOTAL_EXAM_TIME);
  const [completedSeconds, setCompletedSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const [timeExpired, setTimeExpired] = useState(false);
  const [displayTime, setDisplayTime] = useState("20:00");

  const [aiResponse, setAiResponse] = useState(null);
  const [showAiPopup, setShowAiPopup] = useState(false);
  const [submittedSegments, setSubmittedSegments] = useState([]);
  const [showFinishButton, setShowFinishButton] = useState(false);
  const [showRecordingCompleted, setShowRecordingCompleted] = useState(false);
  const [tempAudioBlob, setTempAudioBlob] = useState(null);
  const [showRecordingChoiceModal, setShowRecordingChoiceModal] =
    useState(false);

  // 🔥 NEW: Auto restart states
  const [isAutoRestarting, setIsAutoRestarting] = useState(false);
  const [restartCountdown, setRestartCountdown] = useState(30);

  const isInitializedRef = useRef(false);
  const initializationInProgressRef = useRef(false);
  const timerStartedRef = useRef(false);
  const incrementApiIntervalRef = useRef(null);
  const animationFrameRefTimer = useRef(null);
  const startTimeRef = useRef(Date.now());
  const accumulatedTimeRef = useRef(0);
  const lastApiCallTimeRef = useRef(Date.now());
  const originalAudioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);
  const hiddenAudioRef = useRef(null);
  const restartTimeoutRef = useRef(null);

  const currentSegment = filteredSegments[currentSegmentIndex];
  const currentRecording = currentSegment
    ? recordedAudios[currentSegment.id]
    : null;
  const currentAttempts = currentSegment ? attemptsCount[currentSegment.id] : 1;

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // 🔥 REACT QUERY: API 1 (GET completed seconds)
  const { data: initialTimeData = 0, isSuccess: isTimeDataSuccess } = useQuery({
    queryKey: ["dialogueTime", userId, dialogueId, examData?.attempt?.id],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/dialogueTime/users/${userId}/dialogues/${dialogueId}?examAttemptId=${examData?.attempt?.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch completed seconds");
      }

      const data = await response.json();
      if (data.success && data.data) {
        return data.data.completedSeconds || 0;
      }
      return 0;
    },
    enabled: !!userId && !!dialogueId && !!examData?.attempt?.id,
    staleTime: Infinity,
    retry: false,
  });

  // 🔥 REACT QUERY: API 2 (PATCH increment)
  const incrementMutation = useMutation({
    mutationFn: async (seconds) => {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/dialogueTime/users/${userId}/dialogues/${dialogueId}/increment?examAttemptId=${examData?.attempt?.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ seconds }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to increment completed seconds");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        setCompletedSeconds((prev) => prev + variables);
      }
    },
  });

  const handleTimeExpired = useCallback(() => {
    setTimerActive(false);
    setTimeExpired(true);

    if (animationFrameRefTimer.current) {
      cancelAnimationFrame(animationFrameRefTimer.current);
      animationFrameRefTimer.current = null;
    }

    if (incrementApiIntervalRef.current) {
      clearInterval(incrementApiIntervalRef.current);
      incrementApiIntervalRef.current = null;
    }

    setDisplayTime("00:00");
    setRemainingTime(0);
  }, []);

  // 🔥 NEW: Auto restart function
  const performAutoRestart = useCallback(async () => {
    console.log("🔄 Auto-restarting exam due to time limit...");
    setIsAutoRestarting(true);

    try {
      // Stop current timer
      if (animationFrameRefTimer.current) {
        cancelAnimationFrame(animationFrameRefTimer.current);
      }

      // Reset all states
      setTimerStartedRef(false);
      setTimerActive(false);
      setTimeExpired(false);
      setCurrentSegmentIndex(0);
      setSubmittedSegments([]);
      setRecordedAudios({});
      setAttemptsCount({});
      setRestartCountdown(30);

      // Call API with new=true
      const examDataPayload = {
        examType: "complete_dialogue",
        dialogueId: parseInt(dialogueId),
        userId,
        new: true, // Force restart
      };

      const response = await startExamAttempt(examDataPayload);
      console.log("✅ Auto-restart API success:", response);

      const notDoneSegments = filterSegments(response.segments || []);

      setExamData(response);
      setSegments(response.segments || []);
      setFilteredSegments(notDoneSegments);
      setExamAttemptId(response.attempt.id);
      setIsLastSegment(notDoneSegments.length === 1);
      setIsAutoRestarting(false);

      // Reset timer
      setCompletedSeconds(0);
      setRemainingTime(TOTAL_EXAM_TIME);
      setDisplayTime(formatTime(TOTAL_EXAM_TIME));

      // Restart timer
      setTimerActive(true);
      startTimeRef.current = Date.now();
      accumulatedTimeRef.current = 0;
      lastApiCallTimeRef.current = Date.now();

      // Start smooth timer
      startSmoothTimer(0);
    } catch (error) {
      console.error("❌ Auto-restart failed:", error);
      alert("Failed to restart exam. Please refresh the page.");
      setIsAutoRestarting(false);
    }
  }, [dialogueId, userId, formatTime]);

  const startSmoothTimer = useCallback(
    (initialCompleted) => {
      if (animationFrameRefTimer.current) {
        cancelAnimationFrame(animationFrameRefTimer.current);
      }

      setCompletedSeconds(initialCompleted);

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

      let lastTimestamp = 0;

      const updateTimer = (timestamp) => {
        if (!lastTimestamp) lastTimestamp = timestamp;

        const elapsed = Date.now() - startTimeRef.current;
        const totalElapsedSeconds = accumulatedTimeRef.current + elapsed / 1000;
        const remaining = Math.max(0, TOTAL_EXAM_TIME - totalElapsedSeconds);

        setDisplayTime(formatTime(remaining));

        if (timestamp - lastTimestamp >= 100) {
          setRemainingTime(Math.floor(remaining));
          lastTimestamp = timestamp;
        }

        const now = Date.now();
        const secondsSinceLastApiCall =
          (now - lastApiCallTimeRef.current) / 1000;

        if (secondsSinceLastApiCall >= 10) {
          const secondsToAdd = Math.floor(secondsSinceLastApiCall);
          if (secondsToAdd > 0) {
            incrementMutation.mutate(secondsToAdd);
            lastApiCallTimeRef.current = now;
          }
        }

        // 🔥 NEW: Check for auto-restart condition (30 seconds left and not all done)
        if (
          remaining <= AUTO_RESTART_SECONDS &&
          remaining > 0 &&
          !isAutoRestarting
        ) {
          const allSegmentsDone =
            filteredSegments.length > 0 &&
            submittedSegments.length === filteredSegments.length;

          if (!allSegmentsDone && !restartTimeoutRef.current) {
            console.log(
              "⏰ 30 seconds left! Starting auto-restart countdown...",
            );
            setIsAutoRestarting(true);

            // Countdown display
            let countdown = 30;
            const countdownInterval = setInterval(() => {
              countdown -= 1;
              setRestartCountdown(countdown);
              if (countdown <= 0) {
                clearInterval(countdownInterval);
              }
            }, 1000);

            // Perform restart after 30 seconds
            restartTimeoutRef.current = setTimeout(() => {
              performAutoRestart();
              clearInterval(countdownInterval);
            }, 30000);
          }
        }

        if (remaining <= 0) {
          setTimeExpired(true);
          handleTimeExpired();
          return;
        }

        if (timerActive && !timeExpired && !isAutoRestarting) {
          animationFrameRefTimer.current = requestAnimationFrame(updateTimer);
        }
      };

      animationFrameRefTimer.current = requestAnimationFrame(updateTimer);
    },
    [
      incrementMutation,
      timerActive,
      timeExpired,
      handleTimeExpired,
      formatTime,
      filteredSegments,
      submittedSegments,
      isAutoRestarting,
      performAutoRestart,
    ],
  );

  const filterSegments = useCallback((segmentsArray) => {
    return segmentsArray.filter((segment) => !segment.isDone);
  }, []);

  const submitSegmentAndShowResponse = useCallback(
    async (segmentId, audioBlob) => {
      if (!segmentId || !audioBlob || !examAttemptId) {
        console.error("Missing required data for API call");
        return null;
      }

      try {
        setIsEvaluating(true);
        const segment = filteredSegments.find((s) => s.id === segmentId);

        if (!segment) {
          console.error("Segment not found:", segmentId);
          return null;
        }

        const formData = new FormData();
        formData.append("dialogueId", dialogueId);
        formData.append(
          "language",
          examData?.dialogue?.Language?.name || "English",
        );
        formData.append("segmentId", segmentId);
        formData.append("audioTranscript", segment?.textContent || "");
        formData.append("examAttemptId", examAttemptId);
        formData.append("audioUrl", segment?.audioUrl || "");
        formData.append("suggestedAudioUrl", segment?.suggestedAudioUrl || "");
        formData.append("userId", userId);
        formData.append("attemptCount", attemptsCount[segmentId] || 0);
        formData.append("userAudio", audioBlob, "recording.webm");

        const response = await submitSegment(formData);
        setAiResponse(response);
        setShowAiPopup(true);
        return response;
      } catch (error) {
        console.error("Failed to submit segment:", error);
        alert("Submission failed. Please try again.");
        throw error;
      } finally {
        setIsEvaluating(false);
      }
    },
    [
      dialogueId,
      examData,
      examAttemptId,
      userId,
      filteredSegments,
      attemptsCount,
    ],
  );

  const playOriginalAudioAndAutoRecord = useCallback(() => {
    if (!currentSegment?.audioUrl || timeExpired || isAutoRestarting) return;

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

    const updateProgress = () => {
      if (hiddenAudioRef.current && !hiddenAudioRef.current.ended) {
        const progress =
          (hiddenAudioRef.current.currentTime /
            hiddenAudioRef.current.duration) *
          100;
        setPlaybackProgress(progress);
      }
    };

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
          alert("Failed to play audio.");
        };
      })
      .catch((error) => {
        console.error("Audio play error:", error);
        setRecordingStatus("idle");
        setBlinkText("");
        setShowFinishButton(false);
      });
  }, [currentSegment, timeExpired, isAutoRestarting]);

  const handleRecordNewAttempt = useCallback(() => {
    if (!currentSegment) return;
    setTempAudioBlob(null);
    setShowRecordingCompleted(false);
    setShowRecordingChoiceModal(false);
    setAttemptsCount((prev) => ({
      ...prev,
      [currentSegment.id]: (prev[currentSegment.id] || 0) + 1,
    }));
    playOriginalAudioAndAutoRecord();
  }, [currentSegment, playOriginalAudioAndAutoRecord]);

  const handleSubmitExistingRecording = useCallback(async () => {
    if (!currentSegment) {
      alert("No segment selected");
      return;
    }

    const audioToSubmit = tempAudioBlob || recordedAudios[currentSegment.id];
    if (!audioToSubmit) {
      alert("No recording available");
      return;
    }

    setShowRecordingChoiceModal(false);
    setShowRecordingCompleted(false);

    if (tempAudioBlob) {
      setAttemptsCount((prev) => ({
        ...prev,
        [currentSegment.id]: (prev[currentSegment.id] || 0) + 1,
      }));
    }

    await submitSegmentAndShowResponse(currentSegment.id, audioToSubmit);
    setTempAudioBlob(null);
  }, [
    currentSegment,
    tempAudioBlob,
    recordedAudios,
    submitSegmentAndShowResponse,
  ]);

  const startAudioAndRecord = useCallback(() => {
    if (!currentSegment || timeExpired || isAutoRestarting) return;
    const hasRecording =
      tempAudioBlob !== null || recordedAudios[currentSegment.id] !== null;
    if (hasRecording && !showRecordingCompleted) {
      setShowRecordingChoiceModal(true);
      return;
    }
    playOriginalAudioAndAutoRecord();
  }, [
    currentSegment,
    timeExpired,
    isAutoRestarting,
    tempAudioBlob,
    recordedAudios,
    showRecordingCompleted,
    playOriginalAudioAndAutoRecord,
  ]);

  const initializeAudioAnalyzer = useCallback((stream) => {
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
  }, []);

  const updateWaveHeights = useCallback(() => {
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
  }, [isRecording]);

  const startRecording = useCallback(async () => {
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
          setTempAudioBlob(audioBlob);
          setRecordedAudios((prev) => ({
            ...prev,
            [currentSegment.id]: audioBlob,
          }));
          setSegmentsStatus((prev) => ({
            ...prev,
            [currentSegment.id]: "answered",
          }));
          setShowRecordingCompleted(true);
          setShowFinishButton(false);
        }

        audioStream.getTracks().forEach((track) => track.stop());
        if (animationFrameRef.current)
          cancelAnimationFrame(animationFrameRef.current);
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
      alert("Microphone access denied.");
    }
  }, [currentSegment, initializeAudioAnalyzer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
    }
  }, [mediaRecorder, isRecording]);

  const handleFinishAttempt = useCallback(() => {
    if (!currentSegment || timeExpired || isAutoRestarting) return;
    if (isRecording) stopRecording();
    setShowFinishButton(false);
    setRecordingStatus("idle");
    setBlinkText("");
  }, [
    currentSegment,
    timeExpired,
    isAutoRestarting,
    isRecording,
    stopRecording,
  ]);

  const shouldDisableNavigation =
    recordingStatus === "playing" ||
    recordingStatus === "recording" ||
    isEvaluating ||
    timeExpired ||
    isAutoRestarting ||
    !submittedSegments.includes(currentSegment?.id);

  const isNextEnabled =
    currentSegment &&
    submittedSegments.includes(currentSegment.id) &&
    !shouldDisableNavigation;

  const handleNextClick = useCallback(() => {
    if (timeExpired || !isNextEnabled || isAutoRestarting) return;
    if (currentSegmentIndex < filteredSegments.length - 1) {
      setCurrentSegmentIndex((prev) => prev + 1);
      setRecordingStatus("idle");
      setBlinkText("");
      setShowFinishButton(false);
      setShowRecordingCompleted(false);
      setTempAudioBlob(null);
      setPlaybackProgress(0);
      if (hiddenAudioRef.current) {
        hiddenAudioRef.current.pause();
        hiddenAudioRef.current = null;
      }
    }
  }, [
    timeExpired,
    isNextEnabled,
    isAutoRestarting,
    currentSegmentIndex,
    filteredSegments.length,
  ]);

  const handlePreviousClick = useCallback(() => {
    if (timeExpired || isAutoRestarting) return;
    const previousSegment = filteredSegments[currentSegmentIndex - 1];
    if (previousSegment && submittedSegments.includes(previousSegment.id)) {
      setCurrentSegmentIndex((prev) => prev - 1);
      setRecordingStatus("idle");
      setBlinkText("");
      setShowFinishButton(false);
      setShowRecordingCompleted(false);
      setTempAudioBlob(null);
      setPlaybackProgress(0);
      if (hiddenAudioRef.current) {
        hiddenAudioRef.current.pause();
        hiddenAudioRef.current = null;
      }
    }
  }, [
    timeExpired,
    isAutoRestarting,
    currentSegmentIndex,
    filteredSegments,
    submittedSegments,
  ]);

  const handleFinishClick = useCallback(() => {
    if (timeExpired || isAutoRestarting) return;
    if (currentSegment && !submittedSegments.includes(currentSegment.id)) {
      alert("Please complete the current segment before finishing.");
      return;
    }
    alert("✅ Exam Completed Successfully!");
    setTimeout(() => navigate("/user"), 1500);
  }, [
    currentSegment,
    timeExpired,
    isAutoRestarting,
    submittedSegments,
    navigate,
  ]);

  const handleAiPopupContinue = useCallback(() => {
    if (currentSegment) {
      setSubmittedSegments((prev) => [...prev, currentSegment.id]);
    }
    setShowAiPopup(false);
    setAiResponse(null);
    if (currentSegmentIndex === filteredSegments.length - 1) {
      setTimeout(() => {
        alert("✅ Exam Completed Successfully!");
        navigate("/user");
      }, 500);
    }
  }, [currentSegment, currentSegmentIndex, filteredSegments.length, navigate]);

  const handleRepeatConfirm = useCallback(() => {
    setShowRepeatConfirm(false);
    playOriginalAudioAndAutoRecord();
  }, [playOriginalAudioAndAutoRecord]);

  useEffect(() => {
    if (
      isTimeDataSuccess &&
      !timerStartedRef.current &&
      examData?.attempt?.id
    ) {
      timerStartedRef.current = true;
      startSmoothTimer(initialTimeData);
    }
  }, [
    isTimeDataSuccess,
    initialTimeData,
    examData?.attempt?.id,
    startSmoothTimer,
  ]);

  useEffect(() => {
    timerStartedRef.current = false;
  }, [examData?.attempt?.id]);

  useEffect(() => {
    const heights = Array.from({ length: 20 }, () => Math.random() * 100);
    setWaveHeights(heights);
  }, [currentSegmentIndex]);

  // Cleanup restart timeout on unmount
  useEffect(() => {
    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, []);

  const initializeExam = useCallback(async () => {
    try {
      setIsLoading(true);

      let examDataPayload = {
        examType: "complete_dialogue",
        dialogueId: parseInt(dialogueId),
        userId,
        new: tryAgain === "true" || false,
      };

      let response = await startExamAttempt(examDataPayload);

      // Check if all segments completed
      const allSegmentsDone =
        response.segments?.length > 0 &&
        response.segments.every((segment) => segment.isDone === true);

      if (allSegmentsDone) {
        examDataPayload = { ...examDataPayload, new: true };
        response = await startExamAttempt(examDataPayload);
      }

      const notDoneSegments = filterSegments(response.segments || []);

      setExamData(response);
      setSegments(response.segments || []);
      setFilteredSegments(notDoneSegments);
      setExamAttemptId(response.attempt.id);

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
      setIsLastSegment(notDoneSegments.length === 1);

      localStorage.setItem(
        "examData",
        JSON.stringify({ ...response, filteredSegments: notDoneSegments }),
      );

      isInitializedRef.current = true;
    } catch (error) {
      console.error("Failed to initialize exam:", error);
      alert("Failed to start exam. Please try again.");
      navigate("/user/mock-test");
    } finally {
      setIsLoading(false);
      initializationInProgressRef.current = false;
    }
  }, [dialogueId, userId, tryAgain, navigate, filterSegments]);

  useEffect(() => {
    if (!dialogueId || !userId) {
      navigate("/user/mock-test");
      return;
    }
    if (isInitializedRef.current || initializationInProgressRef.current) return;

    initializationInProgressRef.current = true;
    initializeExam();

    return () => {
      if (animationFrameRefTimer.current) {
        cancelAnimationFrame(animationFrameRefTimer.current);
      }
      if (audioContextRef.current) audioContextRef.current.close();
      if (hiddenAudioRef.current) {
        hiddenAudioRef.current.pause();
        hiddenAudioRef.current = null;
      }
    };
  }, [dialogueId, userId, navigate, initializeExam]);

  useEffect(() => {
    if (filteredSegments.length > 0) {
      setIsLastSegment(currentSegmentIndex === filteredSegments.length - 1);
    }
  }, [currentSegmentIndex, filteredSegments]);

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
      isInitializedRef.current = true;
    }
  }, []);

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-4" />
        <p className="text-gray-600">Loading exam...</p>
      </div>
    );
  }

  if (!examData || filteredSegments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <p className="text-gray-600 text-center">No segments available</p>
        <button
          onClick={() => navigate("/user/mock-test")}
          className="mt-4 px-6 py-2 bg-emerald-500 text-white rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{waveAnimationCSS}</style>

      {/* 🔥 NEW: Auto Restart Loading Modal */}
      {isAutoRestarting && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md text-center">
            <Loader2 className="w-16 h-16 text-red-600 animate-spin mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Time Almost Up!
            </h3>
            <p className="text-gray-600 mb-4">
              Restarting exam in{" "}
              <span className="font-bold text-red-600 text-2xl">
                {restartCountdown}
              </span>{" "}
              seconds...
            </p>
            <p className="text-sm text-gray-500">
              Please wait while we prepare a new attempt for you.
            </p>
          </div>
        </div>
      )}

      {/* AI Response Modal - External Component */}
      <AiResponseModal
        open={showAiPopup}
        data={aiResponse}
        onContinue={handleAiPopupContinue}
      />

      {/* Evaluation Loading Modal */}
      {isEvaluating && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md text-center">
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              AI Evaluation in Progress
            </h3>
            <p className="text-gray-600">Analyzing your pronunciation...</p>
          </div>
        </div>
      )}

      <Modal
        opened={showRepeatConfirm}
        onClose={() => setShowRepeatConfirm(false)}
        centered
        size="sm"
      >
        <div className="space-y-12 text-center p-6">
          <div className="bg-gray-100 h-32 w-32 rounded-full mx-auto flex items-center justify-center">
            <FaTriangleExclamation size={56} className="text-orange-300" />
          </div>
          <p className="text-gray-500 text-2xl">Repeat the segment?</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setShowRepeatConfirm(false)}
              className="px-8 py-2 rounded-full hover:bg-gray-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              className="bg-[#006b5e] text-white px-8 py-2 rounded-full"
              onClick={handleRepeatConfirm}
            >
              OK
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        opened={showRecordingChoiceModal}
        onClose={() => setShowRecordingChoiceModal(false)}
        centered
        size="sm"
        withCloseButton={false}
      >
        <div className="text-center p-6">
          <div className="bg-blue-100 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Mic className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">
            You already have a recording
          </h3>
          <div className="space-y-3 mt-6">
            <button
              onClick={handleRecordNewAttempt}
              className="w-full py-3 bg-blue-600 text-white rounded-lg cursor-pointer"
            >
              Record New Attempt
            </button>
            <button
              onClick={handleSubmitExistingRecording}
              className="w-full py-3 bg-green-600 text-white rounded-lg cursor-pointer"
            >
              Submit Existing
            </button>
            <button
              onClick={() => setShowRecordingChoiceModal(false)}
              className="w-full py-3 bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <div className="flex flex-col w-full h-full overflow-hidden">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-2 border-b-3 border-[#006b5e]">
          <div className="text-lg sm:text-xl font-bold text-[#006b5e]">
            Rapid Review
          </div>
          <div className="flex items-center text-xs text-gray-600">
            <div className="bg-[#006b5e] p-1 rounded-full text-white mr-2">
              <User size={12} />
            </div>
            <span className="truncate max-w-[150px]">
              {loggedInUser?.email || "User"}
            </span>
          </div>
        </header>

        <div className="flex flex-col text-sm sm:flex-row items-start sm:items-center justify-between px-4 py-3 border-b border-gray-300">
          <div className="font-semibold">CCL Practice - {languageName}</div>
          <div className="flex items-center gap-4">
            <div
              className={`text-sm font-semibold ${remainingTime < 60 ? "text-red-600" : "text-gray-700"}`}
            >
              ⏱️ Time: {displayTime}
            </div>
            <div className="flex items-center gap-2">
              <span>
                {currentSegmentIndex + 1}/{filteredSegments.length}
              </span>
              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#006b5e] opacity-30"
                  style={{
                    width: `${((currentSegmentIndex + 1) / filteredSegments.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 border-b border-gray-300">
          <span className="font-semibold">
            Segment - {currentSegmentIndex + 1}
          </span>
        </div>

        <main className="grow px-4 sm:px-10 py-8 flex-1 overflow-y-scroll">
          <div className="flex justify-center">
            <div className="w-full max-w-3xl">
              {remainingTime < 60 && !isLastSegment && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-600 font-semibold flex items-center gap-2">
                    <Clock size={16} />
                    Warning: Only {displayTime} remaining!
                  </p>
                </div>
              )}

              <div className="space-y-8">
                {isLastSegment && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                    <h2 className="text-xl font-bold text-emerald-600">
                      🎉 Last Segment!
                    </h2>
                  </div>
                )}

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  {currentSegment?.audioUrl && (
                    <audio
                      ref={originalAudioRef}
                      src={currentSegment.audioUrl}
                      style={{ display: "none" }}
                    />
                  )}
                  <RapidReviewPlayAndRecordSection
                    currentSegment={currentSegment}
                    isRecording={isRecording}
                    playbackProgress={playbackProgress}
                    audioDuration={audioDuration}
                    isPlaying={recordingStatus === "playing"}
                  />

                  <div className="space-y-6 mt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-gray-700">
                          <span className="font-medium">Attempts:</span>{" "}
                          {currentAttempts}
                        </div>

                        {!showFinishButton &&
                          !isRecording &&
                          !showRecordingCompleted && (
                            <button
                              onClick={startAudioAndRecord}
                              disabled={
                                recordingStatus === "playing" ||
                                isEvaluating ||
                                timeExpired ||
                                isAutoRestarting ||
                                submittedSegments.includes(currentSegment?.id)
                              }
                              className={`px-6 py-3 rounded-full flex items-center gap-2 cursor-pointer ${recordingStatus === "playing" || isEvaluating || timeExpired || isAutoRestarting || submittedSegments.includes(currentSegment?.id) ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-[#006b5e] text-white hover:bg-[#005a4f]"}`}
                            >
                              <span className="font-medium text-lg">Start</span>
                            </button>
                          )}

                        {showFinishButton && isRecording && (
                          <button
                            onClick={handleFinishAttempt}
                            disabled={
                              recordingStatus === "playing" ||
                              timeExpired ||
                              isAutoRestarting
                            }
                            className={`px-6 py-3 border-2 border-[#006b5e] cursor-pointer text-[#006b5e] rounded-full ${recordingStatus === "playing" || timeExpired || isAutoRestarting ? "opacity-50 cursor-not-allowed" : "hover:bg-[#006b5e] hover:text-white"}`}
                          >
                            Finish Attempt
                          </button>
                        )}

                        {showRecordingCompleted && tempAudioBlob && (
                          <div className="flex gap-3">
                            <button
                              onClick={handleRecordNewAttempt}
                              className="px-6 py-3 cursor-pointer bg-[#006b5e] text-white hover:bg-[#005a4f] text-white rounded-full flex items-center gap-2"
                            >
                              <Mic size={20} /> Start
                            </button>
                            <button
                              onClick={handleSubmitExistingRecording}
                              className="px-6 py-3 cursor-pointer bg-green-600 text-white rounded-full flex items-center gap-2"
                            >
                              <Upload size={20} /> Submit
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 animate-pulse">
                        {blinkText && recordingStatus === "playing" && (
                          <div className="text-center border border-slate-900 py-2 px-4 rounded-lg">
                            <p className="text-sm text-slate-900 flex items-center gap-2">
                              <Loader size={16} className="animate-spin" />
                              {blinkText}
                            </p>
                          </div>
                        )}
                        {blinkText && recordingStatus === "recording" && (
                          <div className="text-center border border-red-500 py-2 px-4 rounded-lg">
                            <p className="text-sm font-medium text-red-600 flex items-center gap-2">
                              <span className="h-3 w-3 rounded-full bg-red-500 inline-block"></span>
                              {blinkText}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {submittedSegments.includes(currentSegment?.id) && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                          <div>
                            <p className="font-semibold text-green-800">
                              Segment Submitted!
                            </p>
                            <p className="text-green-600 text-sm">
                              Click "Next" to continue
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="w-full mt-auto">
          <div className="flex w-full h-1.5 gap-0.5">
            {filteredSegments.map((segment, i) => (
              <div
                key={i}
                className={`grow border-r border-white last:border-0 ${submittedSegments.includes(segment.id) ? "bg-emerald-500" : i === currentSegmentIndex ? "bg-[#3db39e]" : "bg-gray-200"}`}
              ></div>
            ))}
          </div>

          <div className="flex justify-between items-center p-4 border-t border-gray-100">
            <button
              onClick={handlePreviousClick}
              disabled={
                currentSegmentIndex === 0 ||
                shouldDisableNavigation ||
                isEvaluating ||
                !submittedSegments.includes(
                  filteredSegments[currentSegmentIndex - 1]?.id,
                )
              }
              className={`flex items-center gap-2 px-6 py-2 rounded-md cursor-pointer ${currentSegmentIndex === 0 || shouldDisableNavigation ? "text-gray-400 cursor-not-allowed" : "text-[#006b5e] hover:bg-gray-100"}`}
            >
              <ArrowLeft size={18} /> Previous
            </button>

            <div>
              {isLastSegment ? (
                <button
                  onClick={handleFinishClick}
                  disabled={
                    shouldDisableNavigation ||
                    isEvaluating ||
                    timeExpired ||
                    !submittedSegments.includes(currentSegment?.id)
                  }
                  className={`flex items-center gap-2 text-white px-6 py-3 cursor-pointer rounded-full ${shouldDisableNavigation || !submittedSegments.includes(currentSegment?.id) ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"}`}
                >
                  <Flag size={18} /> Finish
                </button>
              ) : (
                <button
                  onClick={handleNextClick}
                  disabled={!isNextEnabled}
                  className={`flex items-center cursor-pointer gap-2 text-white px-6 py-3 rounded-full ${!isNextEnabled ? "bg-gray-400" : "bg-[#006b5e] hover:bg-[#005a4f]"}`}
                >
                  Next <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default PracticeDialogue;
