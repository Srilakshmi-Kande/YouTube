import React from "react";

const VideoGridSkeleton = ({ count = 8 }: { count?: number }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-3 animate-pulse">
          <div className="aspect-video rounded-lg bg-gray-200" />
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default VideoGridSkeleton;
