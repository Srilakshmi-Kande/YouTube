import Comments from '@/components/Comments';
import Relatedvideos from '@/components/Relatedvideos';
import Videoinfo from '@/components/Videoinfo';
import Videoplayer from '@/components/Videoplayer';
import axiosInstance from '@/lib/axiosinstance';
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import React from 'react'

const index = () => {
    const router = useRouter();
    const {id} = router.query;
    const [videos, setvideo] = useState<any>(null);
    const [video, setvide] = useState<any>(null);
    const [loading, setloading] = useState(true);

    useEffect(() => {
      const fetchvideo = async () => {
        if (!id || typeof id !== "string") return;
        try {
          const res = await axiosInstance.get("/video/getall");
          const video = res.data?.filter((vid: any) => vid._id === id);
          setvideo(video[0]);
          setvide(res.data);
        } catch (error) {
          console.log(error);
        } finally {
          setloading(false);
        }
      };
      fetchvideo();
    }, [id]);

  //   const relatedVideos = [
  //   {
  //     _id: "1",
  //     videotitle: "Amazing Nature Documentary",
  //     filename: "nature-doc.mp4",
  //     filetype: "video/mp4",
  //     filepath: "/videos/nature-doc.mp4",
  //     filesize: "500MB",
  //     videochanel: "Nature Channel",
  //     Like: 1250,
  //     Dislike: 50,
  //     views: 45000,
  //     uploader: "nature_lover",
  //     createdAt: new Date().toISOString(),
  //   },
  //   {
  //     _id: "2",
  //     videotitle: "Cooking Tutorial: Perfect Pasta",
  //     filename: "pasta-tutorial.mp4",
  //     filetype: "video/mp4",
  //     filepath: "/videos/pasta-tutorial.mp4",
  //     filesize: "300MB",
  //     videochanel: "Chef's Kitchen",
  //     Like: 890,
  //     Dislike: 20,
  //     views: 23000,
  //     uploader: "chef_master",
  //     createdAt: new Date(Date.now() - 86400000).toISOString(),
  //   },
  // ];

  if(loading){
    return <div>loading...</div>
  }
  
  if(!videos){
    return <div>Video not Found</div>;
  }
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
                <Videoplayer video={videos} />
                <Videoinfo video={videos} />
                <Comments videoId={id} />
            </div>
            <div className='space-y-4'>
              <h1>Related videos</h1>
              <Relatedvideos videos={video} />
            </div>
        </div>
      </div>
    </div>
  )
}

export default index
