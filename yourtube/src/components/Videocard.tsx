import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Clock, Download, MoreVertical, Share } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import React from "react";
import VideoThumbnail from "./VideoThumbnail";
import { formatViewCount } from "@/lib/video";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "sonner";

const Videocard = ({ video }: any) => {
  const { user, handlegooglesignin } = useUser();

  const createdAt = video.createdAt ? new Date(video.createdAt) : null;
  const timeAgo =
    createdAt && !Number.isNaN(createdAt.getTime())
      ? `${formatDistanceToNow(createdAt)} ago`
      : "Recently";

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/watch/${video._id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleWatchLater = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Sign in to save videos");
      handlegooglesignin();
      return;
    }
    try {
      const res = await axiosInstance.post(`/watch/${video._id}`, {
        userId: user._id,
      });
      toast.success(
        res.data.watchlater ? "Saved to Watch later" : "Removed from Watch later"
      );
    } catch {
      toast.error("Could not update Watch later");
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user?._id) {
      toast.error("Please sign in to download videos");
      return;
    }

    try {
      const response = await axiosInstance.post(
        `/video/${video._id}/download`,
        { userId: user._id },
        { responseType: "blob" }
      );

      const contentType =
        typeof response.headers?.["content-type"] === "string"
          ? response.headers["content-type"]
          : "video/mp4";
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${video.videotitle || "video"}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (error: any) {
      const data = error?.response?.data;
      let message = "Download failed";

      if (data instanceof Blob) {
        try {
          const parsed = JSON.parse(await data.text());
          message = parsed.message || message;
        } catch {
          message = "Download failed";
        }
      } else if (typeof data === "object" && data?.message) {
        message = data.message;
      }

      toast.error(message);
    }
  };

  return (
    <div className="space-y-3 group/card">
      <Link href={`/watch/${video._id}`} className="block">
        <VideoThumbnail
          filepath={video.filepath}
          className="aspect-video rounded-lg group-hover/card:scale-[1.02] transition-transform duration-200"
        />
      </Link>
      <div className="flex gap-2">
        {video.uploader ? (
          <Link href={`/channel/${video.uploader}`} className="shrink-0">
            <Avatar className="w-9 h-9">
              <AvatarFallback>{video.videochanel?.[0] || "U"}</AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Avatar className="w-9 h-9 shrink-0">
            <AvatarFallback>{video.videochanel?.[0] || "U"}</AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1 min-w-0 flex gap-1">
          <div className="flex-1 min-w-0">
            <Link href={`/watch/${video._id}`} className="block">
              <h3 className="text-sm font-medium line-clamp-2 hover:text-red-600">
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
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-gray-500 opacity-100 lg:opacity-0 lg:group-hover/card:opacity-100 focus:opacity-100 data-[state=open]:opacity-100 transition-opacity"
                aria-label="Video options"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={handleShare}>
                <Share className="w-4 h-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleWatchLater}>
                <Clock className="w-4 h-4 mr-2" />
                Watch later
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default Videocard;
