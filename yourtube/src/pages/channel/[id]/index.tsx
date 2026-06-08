import ChannelHeader from '@/components/ChannelHeader';
import ChannelTabs from '@/components/ChannelTabs';
import ChannelVideos from '@/components/ChannelVideos';
import VideoUploader from '@/components/VideoUploader';
import axiosInstance from '@/lib/axiosinstance';
import { useUser } from '@/lib/AuthContext';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useState } from 'react';

const index = () => {
    const router = useRouter();
    const { id } = router.query;
    const channelId = Array.isArray(id) ? id[0] : id;
    const { user } = useUser();
    const [channel, setChannel] = useState<any>(null);
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchChannelData = useCallback(async (isRefresh = false) => {
        if (!channelId || typeof channelId !== 'string') return;

        if (!isRefresh) setLoading(true);
        try {
            const [userRes, videosRes] = await Promise.all([
                axiosInstance.get(`/user/${channelId}`),
                axiosInstance.get(`/video/channel/${channelId}`),
            ]);
            setChannel(userRes.data.result);
            setVideos(videosRes.data || []);
        } catch (error) {
            console.error('Error fetching channel data:', error);
        } finally {
            setLoading(false);
        }
    }, [channelId]);

    useEffect(() => {
        fetchChannelData();
    }, [fetchChannelData]);

    const isOwnChannel =
        !!user?._id && !!channelId && String(user._id) === String(channelId);

    if (loading) {
        return (
            <div className="flex-1 min-h-screen bg-white flex items-center justify-center p-4">
                <p className="text-gray-600">Loading channel...</p>
            </div>
        );
    }

    if (!channel) {
        return (
            <div className="flex-1 min-h-screen bg-white flex items-center justify-center p-4">
                <p className="text-gray-600">Channel not found.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-screen bg-white min-w-0">
            <div className="max-w-full mx-auto">
                <ChannelHeader channel={channel} user={user} />
                <ChannelTabs />
                {isOwnChannel && (
                    <div className="px-3 sm:px-4 pb-6 sm:pb-8">
                        <VideoUploader
                            channelId={channelId}
                            channelName={channel?.channelname}
                            onUploadSuccess={() => fetchChannelData(true)}
                        />
                    </div>
                )}
                <div className="px-4 pb-8">
                    <ChannelVideos videos={videos} />
                </div>
            </div>
        </div>
    );
};

export default index;
