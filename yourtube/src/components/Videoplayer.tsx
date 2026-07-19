import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import { formatWatchLimit } from "@/lib/plans";
import { getVideoUrl } from "@/lib/video";
import { Maximize, Pause, Play, Volume2, VolumeX } from "lucide-react";

interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath: string;
  };
  onNextVideo?: () => void;
}

const SYNC_INTERVAL_MS = 5000;
const GESTURE_WINDOW_MS = 350;
const SINGLE_TAP_DELAY_MS = 280;
const SEEK_SECONDS = 10;

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

const Videoplayer = ({ video, onNextVideo }: VideoPlayerProps) => {
  const { user } = useUser();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSyncedRef = useRef(0);
  const sessionStartRef = useRef(0);
  const gestureStateRef = useRef<{
    count: number;
    lastTapAt: number;
    side: "left" | "center" | "right" | null;
    timer: number | null;
  }>({ count: 0, lastTapAt: 0, side: null, timer: null });
  const feedbackTimerRef = useRef<number | null>(null);

  const [limitReached, setLimitReached] = useState(false);
  const [gestureFeedback, setGestureFeedback] = useState<string | null>(null);
  const [seekFlash, setSeekFlash] = useState<"left" | "right" | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef<number | null>(null);

  const [watchInfo, setWatchInfo] = useState<{
    watchedSeconds: number;
    limitSeconds: number | null;
    remainingSeconds: number | null;
    plan: string;
  } | null>(null);

  const userId = user?._id;
  const plan = user?.plan || "free";

  const fetchWatchTime = useCallback(async () => {
    if (!userId || !video._id) return;
    try {
      const res = await axiosInstance.get(`/watchtime/${userId}/${video._id}`);
      setWatchInfo(res.data);
      if (res.data.limitSeconds !== null && res.data.remainingSeconds <= 0) {
        setLimitReached(true);
        videoRef.current?.pause();
      }
    } catch (error) {
      console.error(error);
    }
  }, [userId, video._id]);

  const syncWatchTime = useCallback(
    async (time: number) => {
      if (!userId || !video._id || watchInfo?.limitSeconds === null) return;
      const totalWatched =
        (watchInfo?.watchedSeconds || 0) +
        Math.max(0, time - sessionStartRef.current);
      try {
        const res = await axiosInstance.post("/watchtime/update", {
          userId,
          videoId: video._id,
          watchedSeconds: totalWatched,
        });
        setWatchInfo(res.data);
        sessionStartRef.current = time;
        if (res.data.limitReached) {
          setLimitReached(true);
          videoRef.current?.pause();
        }
      } catch (error) {
        console.error(error);
      }
    },
    [userId, video._id, watchInfo?.watchedSeconds, watchInfo?.limitSeconds]
  );

  useEffect(() => {
    fetchWatchTime();
  }, [fetchWatchTime]);

  useEffect(() => {
    sessionStartRef.current = 0;
    setLimitReached(false);
    setWatchInfo(null);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }, [video._id]);

  useEffect(() => {
    return () => {
      if (gestureStateRef.current.timer) clearTimeout(gestureStateRef.current.timer);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []);

  const showFeedback = (message: string) => {
    setGestureFeedback(message);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => setGestureFeedback(null), 900);
  };

  const flashSeek = (side: "left" | "right") => {
    setSeekFlash(side);
    window.setTimeout(() => setSeekFlash(null), 500);
  };

  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (isPlaying) {
      controlsTimerRef.current = window.setTimeout(() => setShowControls(false), 3000);
    }
  };

  const handleTimeUpdate = () => {
    const el = videoRef.current;
    if (!el) return;

    setCurrentTime(el.currentTime);

    if (!userId || !watchInfo || limitReached || watchInfo.limitSeconds === null) return;

    const sessionElapsed = el.currentTime - sessionStartRef.current;
    const totalWatched = watchInfo.watchedSeconds + sessionElapsed;

    if (totalWatched >= watchInfo.limitSeconds) {
      el.pause();
      setLimitReached(true);
      syncWatchTime(el.currentTime);
      return;
    }

    const now = Date.now();
    if (now - lastSyncedRef.current >= SYNC_INTERVAL_MS) {
      lastSyncedRef.current = now;
      syncWatchTime(el.currentTime);
    }
  };

  const handlePlay = () => {
    if (limitReached) {
      videoRef.current?.pause();
      return;
    }
    sessionStartRef.current = videoRef.current?.currentTime || 0;
    setIsPlaying(true);
    resetControlsTimer();
  };

  const handlePause = () => {
    setIsPlaying(false);
    setShowControls(true);
  };

  const togglePlayback = () => {
    const el = videoRef.current;
    if (!el || limitReached) return;
    if (el.paused) {
      el.play().catch(() => undefined);
      showFeedback("Playing");
    } else {
      el.pause();
      showFeedback("Paused");
    }
  };

  const seekBy = (seconds: number) => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(el.duration || 0, el.currentTime + seconds));
    showFeedback(seconds > 0 ? "+10 seconds" : "-10 seconds");
    flashSeek(seconds > 0 ? "right" : "left");
    resetControlsTimer();
  };

  const handleCloseWebsite = () => {
    showFeedback("Closing...");
    window.close();
    window.location.assign("/");
  };

  const handleOpenComments = () => {
    showFeedback("Comments");
    document.getElementById("comments-section")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const getGestureSide = (clientX: number): "left" | "center" | "right" => {
    const container = containerRef.current;
    if (!container) return "center";
    const { left, width } = container.getBoundingClientRect();
    const x = clientX - left;
    if (x < width * 0.33) return "left";
    if (x > width * 0.66) return "right";
    return "center";
  };

  const clearGestureTimer = () => {
    if (gestureStateRef.current.timer) {
      clearTimeout(gestureStateRef.current.timer);
      gestureStateRef.current.timer = null;
    }
  };

  const resetGestureState = () => {
    clearGestureTimer();
    gestureStateRef.current = { count: 0, lastTapAt: 0, side: null, timer: null };
  };

  const executeGesture = (tapCount: number, side: "left" | "center" | "right") => {
    if (tapCount === 1 && side === "center") {
      togglePlayback();
      return;
    }
    if (tapCount === 2 && side === "right") {
      seekBy(SEEK_SECONDS);
      return;
    }
    if (tapCount === 2 && side === "left") {
      seekBy(-SEEK_SECONDS);
      return;
    }
    if (tapCount >= 3 && side === "center") {
      showFeedback("Next video");
      onNextVideo?.();
      return;
    }
    if (tapCount >= 3 && side === "right") {
      handleCloseWebsite();
      return;
    }
    if (tapCount >= 3 && side === "left") {
      handleOpenComments();
    }
  };

  const handlePointerTap = (clientX: number) => {
    if (limitReached) return;

    const now = Date.now();
    const side = getGestureSide(clientX);
    const state = gestureStateRef.current;

    if (state.count > 0 && now - state.lastTapAt > GESTURE_WINDOW_MS) {
      resetGestureState();
    }

    if (state.side && state.side !== side) {
      resetGestureState();
    }

    clearGestureTimer();
    state.count += 1;
    state.lastTapAt = now;
    state.side = side;
    resetControlsTimer();

    if (state.count === 1 && side === "center") {
      state.timer = window.setTimeout(() => {
        executeGesture(1, side);
        resetGestureState();
      }, SINGLE_TAP_DELAY_MS);
      return;
    }

    if (state.count === 2 && (side === "left" || side === "right")) {
      state.timer = window.setTimeout(() => {
        executeGesture(2, side);
        resetGestureState();
      }, SINGLE_TAP_DELAY_MS);
      return;
    }

    if (state.count >= 3) {
      executeGesture(3, side);
      resetGestureState();
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = videoRef.current;
    if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    el.currentTime = ratio * duration;
    resetControlsTimer();
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setIsMuted(el.muted);
    resetControlsTimer();
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen().catch(() => undefined);
    }
    resetControlsTimer();
  };

  const progressPercent =
    watchInfo?.limitSeconds && watchInfo.limitSeconds > 0
      ? Math.min(100, ((watchInfo.watchedSeconds || 0) / watchInfo.limitSeconds) * 100)
      : 0;

  const playbackPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black rounded-lg overflow-hidden select-none"
      onMouseMove={resetControlsTimer}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        poster="/placeholder.svg?height=480&width=854"
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onClick={(e) => e.preventDefault()}
      >
        <source src={getVideoUrl(video.filepath)} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Gesture overlay */}
      <div
        className="absolute inset-0 z-10 touch-none"
        onClick={(e) => handlePointerTap(e.clientX)}
        onTouchEnd={(e) => {
          e.preventDefault();
          const touch = e.changedTouches[0];
          if (touch) handlePointerTap(touch.clientX);
        }}
        aria-hidden
      />

      {/* Seek flash zones */}
      {seekFlash === "left" && (
        <div className="absolute inset-y-0 left-0 w-1/3 bg-white/10 pointer-events-none flex items-center justify-center z-20">
          <span className="text-white text-2xl font-bold drop-shadow">-10s</span>
        </div>
      )}
      {seekFlash === "right" && (
        <div className="absolute inset-y-0 right-0 w-1/3 bg-white/10 pointer-events-none flex items-center justify-center z-20">
          <span className="text-white text-2xl font-bold drop-shadow">+10s</span>
        </div>
      )}

      {/* Gesture feedback */}
      {gestureFeedback && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
          <div className="bg-black/75 text-white px-4 py-2 rounded-full text-sm font-medium">
            {gestureFeedback}
          </div>
        </div>
      )}

      {/* Custom controls */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-8 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="h-1 bg-white/30 rounded-full mb-3 cursor-pointer"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-red-600 rounded-full relative"
            style={{ width: `${playbackPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full" />
          </div>
        </div>

        <div className="flex items-center justify-between text-white gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePlayback();
              }}
              className="p-1 hover:bg-white/20 rounded-full"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className="p-1 hover:bg-white/20 rounded-full hidden sm:block"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <span className="text-xs sm:text-sm tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="p-1 hover:bg-white/20 rounded-full"
            aria-label="Fullscreen"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Plan watch limit bar */}
      {userId && watchInfo && watchInfo.limitSeconds !== null && (
        <div className="absolute top-0 left-0 right-0 z-20 px-2 sm:px-3 pt-2">
          <div className="bg-black/70 text-white text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-md">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 mb-1">
              <span className="truncate">
                {plan.charAt(0).toUpperCase() + plan.slice(1)} — {formatWatchLimit(plan)}
              </span>
              <span className="shrink-0 tabular-nums">
                {formatTime(watchInfo.watchedSeconds || 0)} / {formatTime(watchInfo.limitSeconds || 0)}
              </span>
            </div>
            <Progress value={progressPercent} className="h-1" />
          </div>
        </div>
      )}

      {/* Gesture hint (mobile) */}
      <div className="absolute top-12 left-2 right-2 z-10 pointer-events-none sm:hidden">
        <p className="text-[10px] text-white/70 text-center bg-black/40 rounded px-2 py-1">
          Tap center: play · 2× sides: seek · 3× center: next · 3× left: comments
        </p>
      </div>

      {limitReached && (
        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-white p-4 sm:p-6 text-center z-40">
          <h3 className="text-lg sm:text-xl font-semibold mb-2">Watch limit reached</h3>
          <p className="text-sm sm:text-base text-gray-300 mb-4 max-w-md px-2">
            Your {plan} plan allows {formatWatchLimit(plan).toLowerCase()} on this video.
            Upgrade to keep watching.
          </p>
          <Link href="/premium">
            <Button className="bg-red-600 hover:bg-red-700">Upgrade plan</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Videoplayer;
