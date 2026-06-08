import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import axiosInstance from '@/lib/axiosinstance';
import { useUser } from '@/lib/AuthContext';
import { formatWatchLimit } from '@/lib/plans';
import { getVideoUrl } from '@/lib/video';

interface VideoPlayerProps {
  video: {
    _id: string,
    videotitle: string,
    filepath: string
  }
}

const SYNC_INTERVAL_MS = 5000;

const Videoplayer = ({video}: VideoPlayerProps) => {
    const { user } = useUser();
    const videoRef = useRef<HTMLVideoElement>(null);
    const lastSyncedRef = useRef(0);
    const sessionStartRef = useRef(0);
    const [limitReached, setLimitReached] = useState(false);
    const [watchInfo, setWatchInfo] = useState<{
      watchedSeconds: number;
      limitSeconds: number | null;
      remainingSeconds: number | null;
      plan: string;
    } | null>(null);

    const userId = user?._id;
    const plan = user?.plan || 'free';

    const fetchWatchTime = useCallback(async () => {
      if (!userId || !video._id) return;
      try {
        const res = await axiosInstance.get(`/watchtime/${userId}/${video._id}`);
        setWatchInfo(res.data);
        if (res.data.limitSeconds !== null && res.data.remainingSeconds <= 0) {
          setLimitReached(true);
          videoRef.current?.pause();
        }
      } catch (error) {
        console.error(error);
      }
    }, [userId, video._id]);

    const syncWatchTime = useCallback(async (currentTime: number) => {
      if (!userId || !video._id || watchInfo?.limitSeconds === null) return;
      const totalWatched = (watchInfo?.watchedSeconds || 0) + Math.max(0, currentTime - sessionStartRef.current);
      try {
        const res = await axiosInstance.post('/watchtime/update', {
          userId,
          videoId: video._id,
          watchedSeconds: totalWatched,
        });
        setWatchInfo(res.data);
        sessionStartRef.current = currentTime;
        if (res.data.limitReached) {
          setLimitReached(true);
          videoRef.current?.pause();
        }
      } catch (error) {
        console.error(error);
      }
    }, [userId, video._id, watchInfo?.watchedSeconds, watchInfo?.limitSeconds]);

    useEffect(() => {
      fetchWatchTime();
    }, [fetchWatchTime]);

    useEffect(() => {
      sessionStartRef.current = 0;
      setLimitReached(false);
      setWatchInfo(null);
    }, [video._id]);

    const handleTimeUpdate = () => {
      const el = videoRef.current;
      if (!el || !userId || !watchInfo || limitReached || watchInfo.limitSeconds === null) return;

      const sessionElapsed = el.currentTime - sessionStartRef.current;
      const totalWatched = watchInfo.watchedSeconds + sessionElapsed;

      if (totalWatched >= watchInfo.limitSeconds) {
        el.pause();
        setLimitReached(true);
        syncWatchTime(el.currentTime);
        return;
      }

      const now = Date.now();
      if (now - lastSyncedRef.current >= SYNC_INTERVAL_MS) {
        lastSyncedRef.current = now;
        syncWatchTime(el.currentTime);
      }
    };

    const handlePlay = () => {
      if (limitReached) {
        videoRef.current?.pause();
        return;
      }
      sessionStartRef.current = videoRef.current?.currentTime || 0;
    };

    const progressPercent =
      watchInfo?.limitSeconds && watchInfo.limitSeconds > 0
        ? Math.min(100, ((watchInfo.watchedSeconds || 0) / watchInfo.limitSeconds) * 100)
        : 0;

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className='w-full h-full'
        controls
        poster={`/placeholder.svg?height=480&width=854`}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
      >
        <source src={getVideoUrl(video.filepath)} type='video/mp4' />
        Your browser does not support the video tag.
      </video>

      {userId && watchInfo && watchInfo.limitSeconds !== null && (
        <div className="absolute bottom-12 sm:bottom-14 left-0 right-0 px-2 sm:px-4">
          <div className="bg-black/70 text-white text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 sm:py-2 rounded-md">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2 mb-1">
              <span className="truncate">{plan.charAt(0).toUpperCase() + plan.slice(1)} — {formatWatchLimit(plan)}</span>
              <span className="shrink-0">
                {Math.floor((watchInfo.watchedSeconds || 0) / 60)}:
                {String(Math.floor((watchInfo.watchedSeconds || 0) % 60)).padStart(2, '0')}
                {' / '}
                {Math.floor((watchInfo.limitSeconds || 0) / 60)}:
                {String(Math.floor((watchInfo.limitSeconds || 0) % 60)).padStart(2, '0')}
              </span>
            </div>
            <Progress value={progressPercent} className="h-1" />
          </div>
        </div>
      )}

      {limitReached && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-4 sm:p-6 text-center">
          <h3 className="text-lg sm:text-xl font-semibold mb-2">Watch limit reached</h3>
          <p className="text-sm sm:text-base text-gray-300 mb-4 max-w-md px-2">
            Your {plan} plan allows {formatWatchLimit(plan).toLowerCase()} on this video.
            Upgrade to keep watching.
          </p>
          <Link href="/premium">
            <Button className="bg-red-600 hover:bg-red-700">Upgrade plan</Button>
          </Link>
        </div>
      )}
    </div>
  )
}

export default Videoplayer
