import { formatDistanceToNow } from "date-fns";
import { ThumbsUp } from "lucide-react";
import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import VideoListRow from "./VideoListRow";

const LikedContent = () => {
  const { user } = useUser();
  const [likedVideos, setLikedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLikedVideos();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadLikedVideos = async () => {
    if (!user) return;
    try {
      const likeData = await axiosInstance.get(`/like/${user._id}`);
      setLikedVideos(likeData.data || []);
    } catch (error) {
      console.error("Error loading liked videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlikeVideo = (likeId: string) => {
    setLikedVideos((prev) => prev.filter((item) => item._id !== likeId));
  };

  if (loading) {
    return <div className="text-gray-600 py-8">Loading liked videos...</div>;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <ThumbsUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Keep track of videos you like</h2>
        <p className="text-gray-600">Sign in to see your liked videos.</p>
      </div>
    );
  }

  if (likedVideos.length === 0) {
    return (
      <div className="text-center py-12">
        <ThumbsUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No liked videos yet</h2>
        <p className="text-gray-600">Videos you like will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">{likedVideos.length} videos</p>
      <div className="space-y-4">
        {likedVideos.map((item) => (
          <VideoListRow
            key={item._id}
            video={item.videoid}
            meta={`Liked ${formatDistanceToNow(new Date(item.likedon))} ago`}
            onRemove={() => handleUnlikeVideo(item._id)}
            removeLabel="Remove from liked videos"
          />
        ))}
      </div>
    </div>
  );
};

export default LikedContent;
