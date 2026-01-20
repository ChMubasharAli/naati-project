// /components/AudioInput.jsx
import React, { useState, useRef } from "react";
import {
  Upload,
  Mic,
  StopCircle,
  Play,
  Pause,
  FileAudio,
  Loader2,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { uploadAudio } from "../api/segments";
import { showSuccessToast } from "../lib/react-query";

const AudioInput = ({
  label,
  value,
  onChange,
  disabled = false,
  allowRecord = true,
  required = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(value || "");
  const [recordedBlob, setRecordedBlob] = useState(null);

  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const fileInputRef = useRef(null);

  // Upload audio mutation
  const uploadMutation = useMutation({
    mutationFn: uploadAudio,
    onSuccess: (data) => {
      const uploadedUrl = data.data?.url || data.url;
      if (uploadedUrl) {
        setAudioUrl(uploadedUrl);
        onChange(uploadedUrl);
        showSuccessToast("Audio uploaded successfully!");
      }
    },
  });

  // Handle file selection
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("audio/")) {
      setAudioFile(file);

      // Create temporary URL for preview
      const tempUrl = URL.createObjectURL(file);
      setAudioUrl(tempUrl);

      // Upload file to server
      uploadMutation.mutate(file);
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: "audio/webm",
        });

        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Convert blob to file and upload
        const audioFile = new File([blob], `recording-${Date.now()}.webm`, {
          type: "audio/webm",
        });

        uploadMutation.mutate(audioFile);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Recording failed:", error);
      alert(
        "Microphone access denied or not available. Please check your browser permissions."
      );
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (!audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Handle audio ended
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  // Handle remove audio
  const handleRemoveAudio = () => {
    setAudioUrl("");
    setAudioFile(null);
    setRecordedBlob(null);
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Audio Player Preview */}
      {audioUrl && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              disabled={disabled || uploadMutation.isPending}
              className="p-2 cursor-pointer bg-emerald-500 text-white rounded-full hover:bg-emerald-600 disabled:opacity-50 transition-colors"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {audioFile?.name || "Recorded audio"}
              </div>
              {audioFile && (
                <div className="text-xs text-gray-500">
                  {formatFileSize(audioFile.size)}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemoveAudio}
            disabled={disabled || uploadMutation.isPending}
            className="p-1 cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={16} />
          </button>

          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={handleAudioEnded}
            className="hidden"
          />
        </div>
      )}

      {/* Input Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* File Upload */}
        <div className="flex-1">
          <label
            className={`flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors ${
              disabled || uploadMutation.isPending
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {uploadMutation.isPending ? (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            ) : (
              <Upload size={18} className="text-gray-500" />
            )}
            <span className="text-sm font-medium text-gray-700">
              {uploadMutation.isPending ? "Uploading..." : "Choose Audio File"}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.webm"
              onChange={handleFileSelect}
              disabled={disabled || uploadMutation.isPending || isRecording}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Supports: MP3, WAV, OGG, M4A, WEBM
          </p>
        </div>

        {/* Record Button - Only for suggested audio */}
        {allowRecord && (
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled || uploadMutation.isPending}
            className={`flex cursor-pointer items-center justify-center gap-2 px-4 py-3 font-medium rounded-lg transition-colors ${
              isRecording
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-red-50 border border-red-200 text-red-700 hover:bg-red-100"
            } ${
              disabled || uploadMutation.isPending
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {isRecording ? (
              <>
                <StopCircle size={18} />
                <span>Stop Recording</span>
              </>
            ) : (
              <>
                <Mic size={18} />
                <span>Record Audio</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Status Messages */}
      {isRecording && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
          <span>Recording... Click "Stop Recording" when done</span>
        </div>
      )}

      {uploadMutation.isPending && (
        <div className="flex items-center gap-2 text-blue-600 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Uploading audio file...</span>
        </div>
      )}

      {/* Hidden URL Input for form submission */}
      <input type="hidden" value={audioUrl} required={required} />
    </div>
  );
};

// X Icon component
const X = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

// Play Icon component
// const Play = ({ size }) => (
//   <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
//     <path d="M8 5v14l11-7z" />
//   </svg>
// );

// Pause Icon component
// const Pause = ({ size }) => (
//   <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
//     <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
//   </svg>
// );

export default AudioInput;
