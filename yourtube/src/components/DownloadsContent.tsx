import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import { Download, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";

const DownloadsContent = () => {
  const { user } = useUser();
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDownloads();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadDownloads = async () => {
    if (!user) return;
    try {
      const response = await axiosInstance.get(`/video/downloads/${user._id}`);
      setDownloads(response.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDownload = async (downloadId: string) => {
    if (!user) return;
    try {
      await axiosInstance.delete(`/video/downloads/${downloadId}`, {
        params: { userId: user._id },
      });
      setDownloads((prev) => prev.filter((item) => item._id !== downloadId));
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="text-gray-600 py-8">Loading downloads...</div>;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <Download className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Sign in to see your downloads</h2>
        <p className="text-gray-600">Your downloaded videos will appear here.</p>
      </div>
    );
  }

  if (downloads.length === 0) {
    return (
      <div className="text-center py-12">
        <Download className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No downloads yet</h2>
        <p className="text-gray-600">Download a video to keep it handy here.</p>
        <Button asChild className="mt-4 bg-red-600 hover:bg-red-700">
          <Link href="/premium">Go premium for unlimited downloads</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 flex items-start gap-2 text-sm text-yellow-800">
        <Sparkles className="w-4 h-4 mt-0.5" />
        <span>
          {user?.plan && user.plan !== "free"
            ? "Premium download access is active."
            : "Free users can download one video per day. Upgrade to premium for unlimited downloads."}
        </span>
      </div>
      <div className="space-y-3">
        {downloads.map((item) => (
          <div key={item._id} className="rounded-lg border p-3 sm:p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-medium">{item.videotitle}</h3>
              <p className="text-sm text-gray-600">{item.videochanel}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="default" size="sm">
                <Link href={`/watch/${item.videoId}`}>Open video</Link>
              </Button>
              <Button variant="default" size="sm" onClick={() => handleDeleteDownload(item._id)}>
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DownloadsContent;
