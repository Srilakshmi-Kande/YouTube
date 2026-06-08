import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import React from "react";
import VideoThumbnail from "./VideoThumbnail";
import { formatViewCount } from "@/lib/video";

const Relatedvideos = ({ videos, currentVideoId }: any) => {
  const related =
    videos?.filter((video: any) => video._id !== currentVideoId) ?? [];

  if (!related.length) {
    return <p className="text-sm text-gray-600">No related videos yet.</p>;
  }

  return (
    <div className="space-y-3">
      {related.map((video: any) => {
        const createdAt = video.createdAt ? new Date(video.createdAt) : null;
        const timeAgo =
          createdAt && !Number.isNaN(createdAt.getTime())
            ? `${formatDistanceToNow(createdAt)} ago`
            : "Recently";

        return (
          <Link
            key={video._id}
            href={`/watch/${video._id}`}
            className="flex gap-3 group"
          >
            <VideoThumbnail
              filepath={video.filepath}
              className="w-36 sm:w-40 aspect-video rounded-lg shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm line-clamp-2 group-hover:text-red-600">
                {video.videotitle}
              </h3>
              <p className="text-xs text-gray-600 mt-1">{video.videochanel}</p>
              <p className="text-xs text-gray-600">
                {formatViewCount(video.views)} • {timeAgo}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default Relatedvideos;
