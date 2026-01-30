import { useEffect, useRef } from "react";
import VerticalVolumeSlider from "./VerticalVolumeSlider";

export default function AudioWaveRecording({
  currentSegment,
  isRecording,
  playbackProgress, // 🔥 NEW: Receive from parent
  audioDuration, // 🔥 NEW: Receive from parent
}) {
  // Refs
  const audioRef = useRef(null);
  const canvasRef = useRef(null); // Recording wave ke liye canvas
  const animationReqRef = useRef(null);

  // 1. Playback Progress Fix - Now using props from parent
  useEffect(() => {
    if (!currentSegment?.audioUrl) return;

    // Pehle se chal rahi audio ko reset karein
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = currentSegment.audioUrl;
    } else {
      audioRef.current = new Audio(currentSegment.audioUrl);
    }

    const audio = audioRef.current;

    // Just for safety, we still listen but parent is controlling
    const handleLoadedMetadata = () => {
      // Parent will update duration
    };

    const handleTimeUpdate = () => {
      // Parent will update progress
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [currentSegment?.audioUrl]);

  // 2. Real-time Waveform (Red Line like Picture)
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

      // wave design ke liye fftSize 2048 behtar hai
      analyser.fftSize = 2048;
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
      source.connect(analyser);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const draw = () => {
        animationReqRef.current = requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);

        // Canvas clearing
        ctx.fillStyle = "#f9fafb"; // Light gray bg
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Wave Line Drawing
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

  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <>
      {currentSegment?.audioUrl && (
        <section className="flex">
          <VerticalVolumeSlider />

          <div className="relative flex-1 space-y-1">
            {/* show this section when recotign will be end  */}

            {/* Top Wave: Playback */}
            <div className="relative w-full h-16  border border-gray-200  overflow-hidden">
              <img
                src="/waves.png"
                alt="waveform"
                className="w-full h-full object-cover"
              />

              {/* Vertical Playback Line - NOW MOVING WITH PARENT PROGRESS */}
              <div
                className="absolute top-0 w-px h-full bg-gray-400 z-10"
                style={{
                  left: `${playbackProgress || 0}%`,
                  transition: isRecording ? "none" : "left 0.08s linear", // 🚀 Smoother transition
                }}
              ></div>
              <div className="absolute h-full top-0 -right-0.5  z-10">
                <div className="flex flex-col  h-full items-center">
                  <svg width="12" height="18" viewBox="0 0 40 80">
                    {" "}
                    <path
                      d="M20 0 L40 30 V80 H0 V30 Z"
                      fill="#FF99A0"
                      transform="rotate(180 20 40)"
                    />{" "}
                  </svg>
                  <div className="w-px bg-[#FF99A0] h-full"></div>
                </div>
              </div>
            </div>

            {/* Bottom Wave: Live Recording (The Red Sine Wave) */}
            <div className="relative w-full h-16 border border-gray-200 bg-gray-200  overflow-hidden">
              <canvas
                ref={canvasRef}
                width={800} // High resolution width
                height={64}
                className="w-full h-full"
              />
              {/* Static Center Line */}
              <div className="absolute top-1/2 w-full h-[1px] bg-red-300 opacity-50"></div>
            </div>

            <div className="text-xs font-bold text-gray-500 flex justify-between px-1">
              <span>0:00</span>
              <span>{audioDuration ? formatTime(audioDuration) : "0:00"}</span>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
