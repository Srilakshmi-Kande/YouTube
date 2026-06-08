import { formatDistanceToNow } from "date-fns";
import { MoreVertical, X } from "lucide-react";
import Link from "next/link";
import React from "react";
import VideoThumbnail from "./VideoThumbnail";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { formatViewCount } from "@/lib/video";

interface VideoListRowProps {
  video: {
    _id: string;
    videotitle: string;
    videochanel?: string;
    filepath?: string;
    views?: number;
    createdAt?: string;
    uploader?: string;
  };
  meta?: React.ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
}

const VideoListRow = ({
  video,
  meta,
  onRemove,
  removeLabel = "Remove",
}: VideoListRowProps) => {
  const createdAt = video.createdAt ? new Date(video.createdAt) : null;
  const timeAgo =
    createdAt && !Number.isNaN(createdAt.getTime())
      ? `${formatDistanceToNow(createdAt)} ago`
      : "Recently";

  return (
    <div className="flex gap-3 sm:gap-4 items-start group">
      <Link href={`/watch/${video._id}`} className="shrink-0 w-[38%] max-w-[168px] sm:w-44 sm:max-w-none">
        <VideoThumbnail
          filepath={video.filepath}
          className="w-full aspect-video rounded-lg"
        />
      </Link>

      <div className="flex-1 min-w-0 py-0.5">
        <Link href={`/watch/${video._id}`}>
          <h3 className="font-medium text-sm line-clamp-2 hover:text-red-600">
            {video.videotitle}
          </h3>
        </Link>
        {video.uploader ? (
          <Link
            href={`/channel/${video.uploader}`}
            className="text-sm text-gray-600 mt-1 block hover:text-gray-900"
          >
            {video.videochanel}
          </Link>
        ) : (
          <p className="text-sm text-gray-600 mt-1">{video.videochanel}</p>
        )}
        <p className="text-sm text-gray-600">
          {formatViewCount(video.views)} • {timeAgo}
        </p>
        {meta && <div className="text-xs text-gray-500 mt-1">{meta}</div>}
      </div>

      {onRemove && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 self-center h-8 w-8 text-gray-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100 transition-opacity"
              aria-label="Video options"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={onRemove}>
              <X className="w-4 h-4 mr-2" />
              {removeLabel}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default VideoListRow;
