import Comments from "@/components/Comments";
import Relatedvideos from "@/components/Relatedvideos";
import Videoinfo from "@/components/Videoinfo";
import Videoplayer from "@/components/Videoplayer";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import React from "react";

const WatchPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const videoId = Array.isArray(id) ? id[0] : id;
  const [currentVideo, setCurrentVideo] = useState<any>(null);
  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const handleNextVideo = () => {
    if (!allVideos.length || !videoId) return;

    const related = allVideos.filter((video: any) => video._id !== videoId);
    if (!related.length) return;

    router.push(`/watch/${related[0]._id}`);
  };

  useEffect(() => {
    const fetchVideo = async () => {
      if (!videoId || typeof videoId !== "string") return;

      setLoading(true);
      setNotFound(false);

      try {
        const res = await axiosInstance.get("/video/getall");
        const list = res.data || [];
        const match = list.find((vid: any) => vid._id === videoId);

        if (!match) {
          setNotFound(true);
          setCurrentVideo(null);
        } else {
          setCurrentVideo(match);
        }
        setAllVideos(list);
      } catch (error) {
        console.error(error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId]);

  if (loading) {
    return (
      <main className="flex-1 p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto animate-pulse space-y-4">
          <div className="aspect-video bg-gray-200 rounded-lg" />
          <div className="h-8 bg-gray-200 rounded w-2/3" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </main>
    );
  }

  if (notFound || !currentVideo) {
    return (
      <main className="flex-1 p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto text-center py-20 text-gray-600">
          <p className="text-lg font-medium text-gray-900">Video not found</p>
          <p className="text-sm mt-2">This video may have been removed or the link is incorrect.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2 space-y-3 sm:space-y-4 min-w-0">
            <Videoplayer video={currentVideo} onNextVideo={handleNextVideo} />
            <Videoinfo video={currentVideo} />
            <Comments videoId={videoId as string} />
          </div>
          <aside className="space-y-3 sm:space-y-4 min-w-0 border-t lg:border-t-0 pt-4 lg:pt-0">
            <h2 className="text-base font-semibold">Up next</h2>
            <Relatedvideos videos={allVideos} currentVideoId={videoId} />
          </aside>
        </div>
      </div>
    </main>
  );
};

export default WatchPage;
