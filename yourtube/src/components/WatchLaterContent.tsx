import { formatDistanceToNow } from "date-fns";
import { Clock } from "lucide-react";
import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import VideoListRow from "./VideoListRow";

const WatchLaterContent = () => {
  const { user } = useUser();
  const [watchLater, setWatchLater] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWatchLater();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadWatchLater = async () => {
    if (!user) return;
    try {
      const watchlaterData = await axiosInstance.get(`/watch/${user._id}`);
      setWatchLater(watchlaterData.data || []);
    } catch (error) {
      console.error("Error loading watch later:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWatchLater = (watchLaterId: string) => {
    setWatchLater((prev) => prev.filter((item) => item._id !== watchLaterId));
  };

  if (loading) {
    return <div className="text-gray-600 py-8">Loading watch later...</div>;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Save videos for later</h2>
        <p className="text-gray-600">Sign in to access your Watch later playlist.</p>
      </div>
    );
  }

  if (watchLater.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No videos saved</h2>
        <p className="text-gray-600">Videos you save for later will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">{watchLater.length} videos</p>
      <div className="space-y-4">
        {watchLater.map((item) => (
          <VideoListRow
            key={item._id}
            video={item.videoid}
            meta={`Added ${formatDistanceToNow(new Date(item.watchedon))} ago`}
            onRemove={() => handleRemoveFromWatchLater(item._id)}
            removeLabel="Remove from watch later"
          />
        ))}
      </div>
    </div>
  );
};

export default WatchLaterContent;
