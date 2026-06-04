import ChannelHeader from '@/components/ChannelHeader';
import ChannelTabs from '@/components/ChannelTabs';
import ChannelVideos from '@/components/ChannelVideos';
import VideoUploader from '@/components/VideoUploader';
import { useUser } from '@/lib/AuthContext';
import { useRouter } from 'next/router';
import React from 'react'

const index = () => {
    const router = useRouter();
    const {id} = router.query;
    const { user } = useUser();
    // const user:any = {
    //     id: 1,
    //     name: "John Doe",
    //     email: "john@example.com",
    //     image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTETU6oOlq2-7Sm_KLEf-N__TGnd7sIyKuz1w&s"
    // };
    try{
        let channel = user
   
        const videos = [
            {
                _id: "1",
                videotitle: "Amazing Nature Documentary",
                filename: "nature-doc.mp4",
                filetype: "video/mp4",
                filepath: "/videos/nature-doc.mp4",
                filesize: "500MB",
                videochanel: "Nature Channel",
                Like: 1250,
                views: 45000,
                uploader: "nature_lover",
                createdAt: new Date().toISOString(),
            },
            {
                _id: "2",
                videotitle: "Cooking Tutorial: Perfect Pasta",
                filename: "pasta-tutorial.mp4",
                filetype: "video/mp4",
                filepath: "/videos/pasta-tutorial.mp4",
                filesize: "300MB",
                videochanel: "Chef's Kitchen",
                Like: 890,
                views: 23000,
                uploader: "chef_master",
                createdAt: new Date(Date.now() - 86400000).toISOString(),
            },
        ];

        return (
            <div className="flex-1 min-h-screen bg-white">
                <div className="max-w-full mx-auto">
                    <ChannelHeader channel={channel} user={user} />
                    <ChannelTabs />
                    <div className='px-4 pb-8'>
                        <VideoUploader channelId={id} channelName={channel?.channelname} />
                    </div>
                    <div className="px-4 pb-8">
                        <ChannelVideos videos={videos} />
                    </div>
                </div>
            </div>
        )
    }catch(error){
        console.error("Error fetching channel date:",error);
    }
};

export default index
