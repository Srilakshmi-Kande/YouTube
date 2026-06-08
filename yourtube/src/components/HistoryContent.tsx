import { formatDistanceToNow } from "date-fns";
import { Clock } from "lucide-react";
import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import VideoListRow from "./VideoListRow";

const HistoryContent = () => {
  const { user } = useUser();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHistory();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    try {
      const historyData = await axiosInstance.get(`/history/${user._id}`);
      setHistory(historyData.data || []);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromHistory = (historyId: string) => {
    setHistory((prev) => prev.filter((item) => item._id !== historyId));
  };

  if (loading) {
    return <div className="text-gray-600 py-8">Loading history...</div>;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Keep track of what you watch</h2>
        <p className="text-gray-600">Watch history isn&apos;t viewable when signed out.</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No watch history yet</h2>
        <p className="text-gray-600">Videos you watch will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">{history.length} videos</p>
      <div className="space-y-4">
        {history.map((item) => (
          <VideoListRow
            key={item._id}
            video={item.videoid}
            meta={`Watched ${formatDistanceToNow(new Date(item.watchedon))} ago`}
            onRemove={() => handleRemoveFromHistory(item._id)}
            removeLabel="Remove from watch history"
          />
        ))}
      </div>
    </div>
  );
};

export default HistoryContent;
