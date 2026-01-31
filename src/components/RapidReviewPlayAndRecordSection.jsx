import { useEffect, useRef, useState } from "react";

export default function RapidReviewPlayAndRecordSection({
  currentSegment,
  isRecording,
  playbackProgress = 0, // Parent se aata hai (0-100)
  audioDuration = 0, // Parent se aata hai (seconds)
  isPlaying = false, // NEW: Parent se aata hai (play/pause state dikhane ke liye)
}) {
  // Refs for recording animation only
  const canvasRef = useRef(null);
  const animationReqRef = useRef(null);

  // Calculate current time from progress percentage
  const currentTime = (playbackProgress / 100) * audioDuration;

  const formatTime = (time) => {
    if (!time || isNaN(time) || time === Infinity) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // Real-time Waveform for Recording (BOTTOM SECTION - EXACT SAME)
  useEffect(() => {
    if (!isRecording) {
      cancelAnimationFrame(animationReqRef.current);
      return;
    }

    let audioContext, analyser, source, dataArray;

    const startRecordingAnimation = async () => {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();

      analyser.fftSize = 2048;
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
      source.connect(analyser);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const draw = () => {
        animationReqRef.current = requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);

        ctx.fillStyle = "#f9fafb";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ef4444"; // Red color
        ctx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);

          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      };

      draw();
    };

    startRecordingAnimation();

    return () => {
      cancelAnimationFrame(animationReqRef.current);
      if (audioContext) audioContext.close();
    };
  }, [isRecording]);

  return (
    <>
      {currentSegment?.audioUrl && (
        <section className="flex flex-col gap-3">
          {/* 🔥 TOP SECTION: Non-interactive Audio Player (Image jaisa) */}
          <div className="flex items-center gap-3 sm:gap-4 bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
            {/* Non-interactive Play Button (Visual only - no click) */}
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-teal-500 flex items-center justify-center text-white flex-shrink-0 select-none"
              style={{ pointerEvents: "none" }} // 🔒 Click disabled
            >
              {isPlaying ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="sm:w-[18px] sm:h-[18px]"
                >
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="ml-0.5 sm:w-[18px] sm:h-[18px]"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </div>

            {/* Non-interactive Progress Bar (No seeking) */}
            <div className="flex-1 h-1 sm:h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-100 ease-linear"
                style={{
                  width: `${playbackProgress}%`,
                  pointerEvents: "none", // 🔒 Click disabled
                }}
              />
            </div>

            {/* Time Display - Exact format: 00:00 / 00:03 */}
            <span className="text-[10px] sm:text-xs text-gray-500 font-mono flex-shrink-0 tabular-nums select-none">
              {formatTime(currentTime)} / {formatTime(audioDuration)}
            </span>
          </div>

          {/* 🔥 BOTTOM SECTION: Live Recording Waveform - EXACT SAME AS BEFORE */}
          <div className="relative w-full h-16 border border-gray-200 bg-gray-50 overflow-hidden rounded">
            <canvas
              ref={canvasRef}
              width={800}
              height={64}
              className="w-full h-full block"
            />
            {/* Static Center Line */}
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-red-300 opacity-50 pointer-events-none"></div>
          </div>
        </section>
      )}
    </>
  );
}
