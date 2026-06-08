import React, { useEffect, useState } from "react";
import Videocard from "./Videocard";
import VideoGridSkeleton from "./VideoGridSkeleton";
import axiosInstance from "@/lib/axiosinstance";
import { VideoIcon } from "lucide-react";

const Videogrid = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await axiosInstance.get("/video/getall");
        setVideos(res.data || []);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <VideoGridSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-gray-600">
        <p>Could not load videos. Please try again later.</p>
      </div>
    );
  }

  if (!videos.length) {
    return (
      <div className="text-center py-16 text-gray-600">
        <VideoIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="font-medium text-gray-900">No videos yet</p>
        <p className="text-sm mt-1">Upload a video from your channel to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videos.map((video: any) => (
        <Videocard key={video._id} video={video} />
      ))}
    </div>
  );
};

export default Videogrid;
