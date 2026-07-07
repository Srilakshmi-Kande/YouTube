import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from './ui/avatar';
import React, { useEffect, useState } from 'react'
import { Button } from './ui/button';
import { Clock, Download, Share, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useUser } from '@/lib/AuthContext';
import axiosInstance from '@/lib/axiosinstance';
import Link from 'next/link';
import { formatViewCount } from '@/lib/video';
import { toast } from 'sonner';

const Videoinfo = ({video}:any) => {
    const [likes,setLikes] = useState(video.Like || 0);
    const [dislikes,setDislikes] = useState(video.Dislike || 0);
    const [isLiked,setIsLiked] = useState(false);
    const [isDisliked,setIsDisliked] = useState(false);
    const [isWatchLater,setIsWatchLater] = useState(false);

    const { user } = useUser()

    // const user:any = {
    //     id: 1,
    //     name: "John Doe",
    //     email: "john@example.com",
    //     image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTETU6oOlq2-7Sm_KLEf-N__TGnd7sIyKuz1w&s"
    // }

    useEffect(()=>{
      setLikes(video.Like || 0);
      setDislikes(video.Dislike || 0);    
      setIsLiked(false);
      setIsDisliked(false);
    },[video]);

    
  useEffect(()=>{
    const handleviews = async ()=>{
      if(user){
        try {
          return await axiosInstance.post(`/history/${video._id}`,{userId:user?._id})
        } catch (error) {
          return console.log(error)
        }
      }else{
        return await axiosInstance.post(`/history/views/${video._id}`)
      }
    };
    handleviews();
  },[user])

    const handleLike = async () => {
      if(!user) return;
      try {
        const res = await axiosInstance.post(`/like/${video._id}`,{userId:user?._id})
        if(res.data.liked){
          if(isLiked){
            setLikes((prev : any) => prev - 1);
            setIsLiked(false);
          }else{
            setLikes((prev : any) => prev + 1);
            setIsLiked(true);
            if(isDisliked){
              setDislikes((prev : any) => prev - 1);
              setIsDisliked(false);
            }
          }
        }
      } catch (error) {
        console.log(error)
      }
    };

    const handleWatchLater = async () => {
      try {
        const res = await axiosInstance.post(`/watch/${video._id}`,{userId:user?._id})
        if(res.data.watchlater){
          setIsWatchLater(!isWatchLater);
        }else{
          setIsWatchLater(false);
        }
      } catch (error) {
        console.log(error)
      }
    }

    const handleDislike = async () => {
      if(!user) return;
      try {
        const res = await axiosInstance.post(`/like/${video._id}`,{userId:user?._id})
        if(!res.data.liked){
          if(isDisliked){
            setDislikes((prev : any) => prev - 1);
            setIsDisliked(false);
          }else{
            setDislikes((prev : any) => prev + 1);
            setIsDisliked(true);
            if(isLiked){
              setLikes((prev : any) => prev - 1);
              setIsLiked(false);
            }
          }
        }
      } catch (error) {
        console.log(error)
      }
    };

    const handleDownload = async () => {
      if (!user?._id) {
        toast.error("Please sign in to download videos");
        return;
      }

      try {
        const response = await axiosInstance.post(
          `/video/${video._id}/download`,
          { userId: user._id },
          { responseType: "blob" }
        );

        const contentType =
          typeof response.headers?.["content-type"] === "string"
            ? response.headers["content-type"]
            : "video/mp4";
        const blob = new Blob([response.data], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${video.videotitle || "video"}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Download started");
      } catch (error: any) {
        const data = error?.response?.data;
        let message = "Download failed";

        if (data instanceof Blob) {
          try {
            const parsed = JSON.parse(await data.text());
            message = parsed.message || message;
          } catch {
            message = "Download failed";
          }
        } else if (typeof data === "object" && data?.message) {
          message = data.message;
        }

        toast.error(message);
      }
    };

    //console.log(video)

  return (
    <div className='space-y-3 sm:space-y-4 min-w-0'>
      <h1 className='text-lg sm:text-xl font-semibold leading-snug'>{video.videotitle}</h1>
      <div className='flex flex-col gap-3 sm:gap-4'>
        <div className='flex items-center justify-between gap-3 min-w-0'>
          <div className='flex items-center gap-3 min-w-0'>
            <Avatar className='w-9 h-9 sm:w-10 sm:h-10 shrink-0'>
              <AvatarFallback>{video.videochanel?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              {video.uploader ? (
                <Link href={`/channel/${video.uploader}`} className='font-medium hover:text-red-600 truncate block'>
                  {video.videochanel}
                </Link>
              ) : (
                <h3 className='font-medium truncate'>{video.videochanel}</h3>
              )}
            </div>
          </div>
          <Button size="sm" className='shrink-0 bg-red-600 hover:bg-red-700'>Subscribe</Button>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
          <div className="flex items-center bg-gray-100 rounded-full shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-l-full px-2 sm:px-3"
              onClick={handleLike}
            >
              <ThumbsUp
                className={`w-4 h-4 sm:w-5 sm:h-5 sm:mr-1 ${
                  isLiked ? "fill-black text-black" : ""
                }`}
              />
              <span className="text-xs sm:text-sm">{likes.toLocaleString()}</span>
            </Button>
            <div className="w-px h-6 bg-gray-300" />
            <Button
              variant="ghost"
              size="sm"
              className="rounded-r-full px-2 sm:px-3"
              onClick={handleDislike}
            >
              <ThumbsDown
                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                  isDisliked ? "fill-black text-black" : ""
                }`}
              />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`bg-gray-100 rounded-full shrink-0 ${isWatchLater ? "text-red-600" : ""}`}
            onClick={handleWatchLater}
          >
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-1" />
            <span className="text-xs sm:text-sm whitespace-nowrap">{isWatchLater ? "Saved" : "Save"}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-gray-100 rounded-full shrink-0"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-1" />
            <span className="text-xs sm:text-sm">Download</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-gray-100 rounded-full shrink-0"
            onClick={() => navigator.clipboard?.writeText(window.location.href)}
          >
            <Share className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-1" />
            <span className="text-xs sm:text-sm">Share</span>
          </Button>
        </div>
      </div>
      <div className='bg-gray-100 rounded-lg p-3 sm:p-4'>
        <div className='flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium'>
          <span>{formatViewCount(video.views)}</span>
          {video.createdAt && (
            <span>{formatDistanceToNow(new Date(video.createdAt))} ago</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default Videoinfo
