import { formatVideoDuration, getVideoUrl } from "@/lib/video";
import React, { useRef, useState } from "react";

interface VideoThumbnailProps {
  filepath?: string;
  className?: string;
  previewOnHover?: boolean;
}

const VideoThumbnail = ({
  filepath,
  className = "",
  previewOnHover = true,
}: VideoThumbnailProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<string | null>(null);

  const handleMouseEnter = () => {
    if (!previewOnHover) return;
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = 0;
    el.play().catch(() => {});
  };

  const handleMouseLeave = () => {
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  };

  if (!filepath) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-xs text-gray-500">No preview</span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-gray-900 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={getVideoUrl(filepath)}
        className="w-full h-full object-cover"
        muted
        playsInline
        preload="metadata"
        onLoadedMetadata={(e) =>
          setDuration(formatVideoDuration(e.currentTarget.duration))
        }
      />
      {duration && (
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
          {duration}
        </div>
      )}
    </div>
  );
};

export default VideoThumbnail;
